import { Platform } from "react-native";

let Notifications: typeof import("expo-notifications") | null = null;

if (Platform.OS !== "web") {
  const N = require("expo-notifications");
  Notifications = N;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupNotifications() {
  if (Platform.OS === "web" || !Notifications) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permissions not granted");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("fasting", {
      name: "Fasting Reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function scheduleFastingReminder(
  title: string,
  body: string,
  seconds: number
) {
  if (Platform.OS === "web" || !Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

export async function cancelAllNotifications() {
  if (Platform.OS === "web" || !Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
