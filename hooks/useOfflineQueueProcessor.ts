import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useConnectivity } from "@/hooks/useConnectivity";
import { getQueue, replaceQueue, getDeadLetterQueue, clearDeadLetterQueue, saveDeadLetterQueue, type QueuedMutation } from "@/lib/offline-queue";

const MAX_RETRIES = 5;
const STALE_THRESHOLD_MS = 72 * 60 * 60 * 1000; // 72 hours
const MAX_BACKOFF_MS = 30_000; // 30s cap

async function processItem(item: QueuedMutation) {
  const { table, operation, payload } = item;

  switch (operation) {
    case "insert": {
      const record = payload as Record<string, unknown>;
      if (Array.isArray(record)) {
        for (const entry of record) {
          const { error } = await supabase.from(table).upsert(entry, { onConflict: "id" });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from(table).upsert(record, { onConflict: "id" });
        if (error) throw error;
      }
      break;
    }
    case "update": {
      const { id, ...updates } = payload as { id: string; [key: string]: unknown };
      const { error } = await supabase.from(table).update(updates).eq("id", id);
      if (error) throw error;
      break;
    }
    case "delete": {
      const { id } = payload as { id: string };
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      break;
    }
  }
}

export function useOfflineQueueProcessor() {
  const { isInternetReachable } = useConnectivity();
  const queryClient = useQueryClient();
  const processingRef = useRef(false);
  const backoffRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [backoffTick, setBackoffTick] = useState(0);

  // Clear timer when going offline
  useEffect(() => {
    if (!isInternetReachable && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      backoffRef.current = 0;
    }
  }, [isInternetReachable]);

  // Schedule retry with exponential backoff when items remain
  useEffect(() => {
    if (backoffTick <= 0) return;
    if (!isInternetReachable) return;

    timerRef.current = setTimeout(() => {
      processQueue();
    }, Math.min(backoffTick, MAX_BACKOFF_MS));

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [backoffTick, isInternetReachable]);

  useEffect(() => {
    if (!isInternetReachable || processingRef.current) return;
    processQueue();
  }, [isInternetReachable, queryClient]);

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const queue = await getQueue();
      if (queue.length === 0) {
        backoffRef.current = 0;
        setBackoffTick(0);
        return;
      }

      const completedIds: string[] = [];
      const deadLetterIds: string[] = [];
      let hasProgress = false;

      for (const item of queue) {
        // Skip items older than 72 hours
        if (Date.now() - item.timestamp > STALE_THRESHOLD_MS) {
          completedIds.push(item.id);
          continue;
        }

        try {
          await processItem(item);
          completedIds.push(item.id);
          hasProgress = true;
        } catch (err) {
          console.error(`Failed to replay queued mutation [${item.table}/${item.operation}]:`, err);

          const retryCount = (item.retry_count ?? 0) + 1;
          if (retryCount >= MAX_RETRIES) {
            deadLetterIds.push(item.id);
            console.warn(`[offline-queue] Dead-lettering mutation after ${MAX_RETRIES} failures:`, item);
          }

          await new Promise((r) => setTimeout(r, 500));
        }
      }

      // Atomic: keep only items that failed (not completed, not dead-lettered)
      // and increment their retry_count
      const remaining = queue
        .filter((item) => !completedIds.includes(item.id) && !deadLetterIds.includes(item.id))
        .map((item) => ({ ...item, retry_count: (item.retry_count ?? 0) + 1 }));

      await replaceQueue(remaining);

      // Persist dead-lettered items for debugging
      if (deadLetterIds.length > 0) {
        const deadLettered = queue.filter((item) => deadLetterIds.includes(item.id));
        const existingDead = await getDeadLetterQueue();
        const merged = [...deadLettered, ...existingDead];
        await clearDeadLetterQueue();
        await saveDeadLetterQueue(merged);
      }

      if (hasProgress) {
        queryClient.invalidateQueries();
      }

      // Schedule retry with exponential backoff if items remain
      if (remaining.length > 0) {
        backoffRef.current = backoffRef.current === 0
          ? 1000
          : Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
        setBackoffTick(backoffRef.current);
      } else {
        backoffRef.current = 0;
        setBackoffTick(0);
      }
    } finally {
      processingRef.current = false;
    }
  };
}
