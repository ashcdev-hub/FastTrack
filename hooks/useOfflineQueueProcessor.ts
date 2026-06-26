import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useConnectivity } from "@/hooks/useConnectivity";
import { getQueue, clearQueue, removeById, type QueuedMutation } from "@/lib/offline-queue";

async function processItem(item: QueuedMutation) {
  const { table, operation, payload } = item;

  switch (operation) {
    case "insert": {
      const { error } = await supabase.from(table).insert(payload as Record<string, unknown>);
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

        let hasProgress = false;

        for (const item of queue) {
          try {
            await processItem(item);
            await removeById(item.id);
            hasProgress = true;
          } catch (err) {
            console.error(`Failed to replay queued mutation [${item.table}/${item.operation}]:`, err);
            // Small delay before next attempt to avoid thundering herd
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (hasProgress) {
          // Invalidate all queries to refresh from server
          queryClient.invalidateQueries();
        }
      } finally {
        processingRef.current = false;
      }
    };

    process();
  }, [isInternetReachable, queryClient]);
}
