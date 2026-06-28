import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@fasttrack_offline_queue";
const DEAD_LETTER_KEY = "@fasttrack_offline_dead_letter";
const MAX_RETRIES = 5;

export type QueuedMutation = {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  payload: unknown;
  timestamp: number;
  retry_count?: number;
};

export function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let queueIdCounter = 0;

export async function enqueueMutation(
  table: string,
  operation: QueuedMutation["operation"],
  payload: unknown,
): Promise<QueuedMutation> {
  let finalPayload = payload;
  if (operation === "insert" && typeof payload === "object" && payload !== null) {
    const record = { ...(payload as Record<string, unknown>) };
    if (!record.id) {
      record.id = generateUuid();
    }
    finalPayload = record;
  }

  const item: QueuedMutation = {
    id: `offline_${Date.now()}_${++queueIdCounter}`,
    table,
    operation,
    payload: finalPayload,
    timestamp: Date.now(),
    retry_count: 0,
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

export async function replaceQueue(items: QueuedMutation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function removeById(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function getDeadLetterQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function clearDeadLetterQueue(): Promise<void> {
  await AsyncStorage.removeItem(DEAD_LETTER_KEY);
}

export async function saveDeadLetterQueue(items: QueuedMutation[]): Promise<void> {
  await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(items));
}
