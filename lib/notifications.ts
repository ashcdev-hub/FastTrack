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

  // Listen for notification taps (foreground & background)
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.screen) {
      // Deep-link handling can be added here if expo-router linking is configured
      console.log("Notification tapped:", data.screen);
    }
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("fasting", {
      name: "Fasting Reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync("water", {
      name: "Water Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync("streaks", {
      name: "Streak Milestones",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

// --- Existing ---

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

// --- New: Daily fast reminder ---

export async function scheduleDailyFastReminder(hour: number, minute: number) {
  if (Platform.OS === "web" || !Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to fast",
      body: "Ready to start your fasting window? Tap to begin.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// --- New: Check-in reminder (halfway through fast) ---

export async function scheduleCheckInReminder(hoursUntilMidpoint: number) {
  if (Platform.OS === "web" || !Notifications) return;
  if (hoursUntilMidpoint <= 0) return;

  const seconds = Math.round(hoursUntilMidpoint * 3600);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Halfway there",
      body: "How are you feeling? Check in to track your fast.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

// --- New: Water reminders (repeating during the day) ---

export async function scheduleWaterReminders(intervalHours: number) {
  if (Platform.OS === "web" || !Notifications) return;
  if (intervalHours <= 0 || intervalHours > 6) return;

  const seconds = intervalHours * 3600;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Stay hydrated",
      body: "Time for a glass of water. Your body will thank you.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: true,
    },
  });
}

// --- New: Streak milestone check ---

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

export async function checkAndNotifyStreakMilestone(completedFasts: number) {
  if (Platform.OS === "web" || !Notifications) return;
  if (!STREAK_MILESTONES.includes(completedFasts)) return;

  const messages: Record<number, string> = {
    3: "3 fasts completed! You're building momentum.",
    7: "7 fasts done! One full week of consistency.",
    14: "14 fasts! Two weeks strong.",
    30: "30 fasts! A full month of dedication.",
    50: "50 fasts! Halfway to the century club.",
    100: "100 fasts! You've reached the Century Club.",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Milestone reached",
      body: messages[completedFasts] ?? `${completedFasts} fasts completed!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}
