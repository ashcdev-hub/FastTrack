import { enqueueMutation } from "@/lib/offline-queue";
import type { QueuedMutation } from "@/lib/offline-queue";

export function generateClientId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const msg =
    (error as any)?.message?.toLowerCase() ??
    (error as any)?.error_description?.toLowerCase() ??
    "";
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection") ||
    msg.includes("timeout") ||
    msg.includes("abort") ||
    msg.includes("could not connect") ||
    msg.includes("failed to fetch") ||
    msg.includes("interrupted") ||
    (error as any)?.code === "NETWORK_ERROR" ||
    (error as any)?.code === "ERR_NETWORK" ||
    (error as any)?.code === "ECONNABORTED"
  );
}

export async function withOfflineFallback<T>(
  supabaseCall: () => Promise<T>,
  table: string,
  operation: QueuedMutation["operation"],
  payload: unknown,
  isOffline: boolean,
): Promise<T | null> {
  if (isOffline) {
    await enqueueMutation(table, operation, payload);
    return null;
  }

  try {
    return await supabaseCall();
  } catch (error: unknown) {
    if (isNetworkError(error)) {
      await enqueueMutation(table, operation, payload);
      return null;
    }
    throw error;
  }
}
