import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

const KEEP_AWAKE_TASK = "supabase-keep-awake";

TaskManager.defineTask(KEEP_AWAKE_TASK, async () => {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn("[KeepAwake] missing env vars");
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    const res = await fetch(
      `${url}/rest/v1/profiles?limit=1&select=id`,
      { headers: { apikey: key } },
    );
    if (!res.ok) {
      console.warn("[KeepAwake] ping failed:", res.status);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.warn("[KeepAwake] ping error:", e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerKeepAwake() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.warn("[KeepAwake] background fetch denied on this device");
      return;
    }
    await BackgroundFetch.registerTaskAsync(KEEP_AWAKE_TASK, {
      minimumInterval: 4 * 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.warn("[KeepAwake] registration error:", e);
  }
}
