import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@fasttrack_offline_queue";

export type QueuedMutation = {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  payload: unknown;
  timestamp: number;
};

let queueIdCounter = 0;

export async function enqueueMutation(
  table: string,
  operation: QueuedMutation["operation"],
  payload: unknown
): Promise<QueuedMutation> {
  const item: QueuedMutation = {
    id: `offline_${Date.now()}_${++queueIdCounter}`,
    table,
    operation,
    payload,
    timestamp: Date.now(),
  };

  const existing = await getQueue();
  existing.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
  return item;
}

export async function getQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function removeById(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}
