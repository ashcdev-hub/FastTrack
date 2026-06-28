import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useConnectivity } from "@/hooks/useConnectivity";
import { getQueue, replaceQueue, getDeadLetterQueue, clearDeadLetterQueue, saveDeadLetterQueue, type QueuedMutation } from "@/lib/offline-queue";

const MAX_RETRIES = 5;

async function processItem(item: QueuedMutation) {
  const { table, operation, payload } = item;

  switch (operation) {
    case "insert": {
      const record = payload as Record<string, unknown>;
      const { error } = await supabase.from(table).upsert(record, { onConflict: "id" });
      if (error) throw error;
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

  useEffect(() => {
    if (!isInternetReachable || processingRef.current) return;

    const process = async () => {
      processingRef.current = true;
      try {
        const queue = await getQueue();
        if (queue.length === 0) return;

        const completedIds: string[] = [];
        const deadLetterIds: string[] = [];
        let hasProgress = false;

        for (const item of queue) {
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
      } finally {
        processingRef.current = false;
      }
    };

    process();
  }, [isInternetReachable, queryClient]);
}
