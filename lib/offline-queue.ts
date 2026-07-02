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

// Mutex: serializes all read-modify-write operations on the queue
// to prevent lost mutations from concurrent enqueue/replace interleaving
let queueMutex: Promise<void> = Promise.resolve();

function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  const execution = queueMutex.then(() => fn());
  queueMutex = execution.then(() => {}, () => {});
  return execution;
}

export async function enqueueMutation(
  table: string,
  operation: QueuedMutation["operation"],
  payload: unknown,
): Promise<QueuedMutation> {
  return withMutex(async () => {
    let finalPayload = payload;
    if (operation === "insert") {
      if (Array.isArray(payload)) {
        // Batch insert: store each item with its own client UUID
        finalPayload = payload.map((record: any) => ({
          ...record,
          id: record.id || generateUuid(),
        }));
      } else if (typeof payload === "object" && payload !== null) {
        // Single insert: add client UUID if missing
        const record = { ...(payload as Record<string, unknown>) };
        if (!record.id) {
          record.id = generateUuid();
        }
        finalPayload = record;
      }
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
  });
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
  return withMutex(async () => {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  });
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function removeById(id: string): Promise<void> {
  return withMutex(async () => {
    const queue = await getQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  });
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
