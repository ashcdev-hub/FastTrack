import React, { useEffect, useState, useRef } from "react";
import { Pressable, View, Text, ScrollView, TextInput, Modal, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useFastingSession } from "@/hooks/useFastingSession";
import { useFastingTimer } from "@/hooks/useFastingTimer";
import { useFastingStore } from "@/store/useFastingStore";
import { useFastCheckIns } from "@/hooks/useFastCheckIns";
import { useProfile } from "@/hooks/useProfile";
import { useWeightLog } from "@/hooks/useWeightLog";
import { parseWeightInput, displayWeight } from "@/lib/units";
import * as Haptics from "expo-haptics";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { GlassPanel } from "@/components/GlassPanel";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FastTrackHeader } from "@/components/FastTrackHeader";
import { FastingTimer } from "@/components/FastingTimer";
import { PreviousFasts } from "@/components/PreviousFasts";
import { CheckInPanel } from "@/components/CheckInPanel";
import { CheckInTimeline } from "@/components/CheckInTimeline";
import { MoodChart } from "@/components/MoodChart";
import { CustomScheduleModal } from "@/components/CustomScheduleModal";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { scheduleFastingReminder, cancelAllNotifications, scheduleDailyFastReminder, scheduleCheckInReminder, scheduleWaterReminders, scheduleEatingWindowReminder, checkAndNotifyStreakMilestone } from "@/lib/notifications";
import { getFastingPhase, getEatingPhase } from "@/lib/fasting-phases";
import { format, addHours, isSameDay, addDays } from "date-fns";
import { useScrollToTop } from "@react-navigation/native";
import { ConfettiCanvas, useConfetti } from "react-native-confetti-reanimated";

const PRESETS = [
  { label: "14:10", fasting: 14, eating: 10 },
  { label: "16:8", fasting: 16, eating: 8 },
  { label: "18:6", fasting: 18, eating: 6 },
  { label: "20:4", fasting: 20, eating: 4 },
  { label: "OMAD", fasting: 23, eating: 1 },
];

const EXTENDED_PRESETS = [
  { label: "36:2", fasting: 36, eating: 2 },
  { label: "48:2", fasting: 48, eating: 2 },
  { label: "72:2", fasting: 72, eating: 2 },
];

const MOODS = [
  { value: 4, label: "HAPPY", icon: "emoticon-happy", color: "#c3f400" },
  { value: 3, label: "NEUTRAL", icon: "emoticon-neutral", color: "#00daf3" },
  { value: 1, label: "LOW ENERGY", icon: "emoticon-sad", color: "#FF6B52" },
];

type Phase = "idle" | "fasting" | "eating";

export default function FastScreen() {
  const { user } = useAuth();
  const { session, startFast, endFast, breakFast, discardFast, deleteFast, pastSessions, streak, completedFasts, updateStartTime } = useFastingSession(user?.id);
  const { fastingHours, eatingHours, setSessionId, setStartTime, setFastingHours, setEatingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const { checkIns, addCheckIn } = useFastCheckIns(user?.id, session?.id ?? null);
  const { profile, updateFastingSchedule } = useProfile(user?.id ?? null);
  const { addWeight } = useWeightLog(user?.id);
  const notifPrefs = profile?.notification_preferences;

  const phase: Phase = !session ? "idle" : (session.status as Phase);
  const fastStartStr = session?.start_time ?? null;
  const eatWindowEndStr = phase === "fasting" && session?.start_time
    ? addHours(new Date(session.start_time), fastingHours).toISOString()
    : phase === "eating" && session?.end_time
      ? addHours(new Date(session.end_time), eatingHours).toISOString()
      : null;
  const { countdown: fastCountdown, elapsed: fastElapsed, elapsedMinutes: fastElapsedMinutes } = useFastingTimer(fastStartStr, eatWindowEndStr);

  const startedAtDate = session?.start_time ? new Date(session.start_time) : null;
  const eatWindowOpensDate = phase === "fasting" && session?.start_time
    ? addHours(new Date(session.start_time), fastingHours)
    : phase === "eating" && session?.end_time
      ? new Date(session.end_time)
      : null;
  const windowClosesDate = phase === "fasting" && session?.start_time
    ? addHours(addHours(new Date(session.start_time), fastingHours), eatingHours)
    : phase === "eating" && session?.end_time
      ? addHours(new Date(session.end_time), eatingHours)
      : null;

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showBreakConfirm, setShowBreakConfirm] = useState(false);
  const [showFastComplete, setShowFastComplete] = useState(false);
  const [showEatComplete, setShowEatComplete] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionCompleteData, setSessionCompleteData] = useState<{
    scheduleLabel: string;
    fastedHours: number;
    fastedMinutes: number;
    eatingHours: number;
    eatingMinutes: number;
    totalHours: number;
    totalMinutes: number;
    streak: number;
    completedFastsCount: number;
  } | null>(null);
  const [checkInMood, setCheckInMood] = useState<number | null>(null);
  const [checkInNote, setCheckInNote] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const fastCompletePromptedRef = useRef(false);
  const eatCompletePromptedRef = useRef(false);
  const weightPromptedRef = useRef(false);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [startPickerDate, setStartPickerDate] = useState(new Date());
  const [startPickerHour, setStartPickerHour] = useState(new Date().getHours());
  const [startPickerMinute, setStartPickerMinute] = useState(new Date().getMinutes());

  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editPickerDate, setEditPickerDate] = useState(new Date());
  const [editPickerHour, setEditPickerHour] = useState(new Date().getHours());
  const [editPickerMinute, setEditPickerMinute] = useState(new Date().getMinutes());

  const previewStartTime = showStartTimePicker
    ? (() => { const d = new Date(startPickerDate); d.setHours(startPickerHour, startPickerMinute, 0, 0); return d; })()
    : null;

  const getRemainingFastingSeconds = (startTime: Date): number => {
    const fastEndTime = startTime.getTime() + fastingHours * 3600000;
    const remaining = (fastEndTime - Date.now()) / 1000;
    return remaining > 0 ? remaining : 0;
  };

  const isFutureTime = (date: Date, hour: number, minute: number): boolean => {
    const now = new Date();
    if (date.getFullYear() > now.getFullYear()) return true;
    if (date.getFullYear() < now.getFullYear()) return false;
    if (date.getMonth() > now.getMonth()) return true;
    if (date.getMonth() < now.getMonth()) return false;
    if (date.getDate() > now.getDate()) return true;
    if (date.getDate() < now.getDate()) return false;
    return hour > now.getHours() || (hour === now.getHours() && minute > now.getMinutes());
  };

  const triggerHaptic = (type: "success" | "warning" | "medium") => {
    if (Platform.OS === "web") return;
    try {
      if (type === "success") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === "warning") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  useEffect(() => {
    if (phase === "fasting" && fastCountdown.isOver && !fastCompletePromptedRef.current) {
      fastCompletePromptedRef.current = true;
      setShowFastComplete(true);
      triggerHaptic("success");
    }
    if (phase === "eating" && fastCountdown.isOver && !eatCompletePromptedRef.current) {
      eatCompletePromptedRef.current = true;
      setShowEatComplete(true);
      triggerHaptic("warning");
    }
    if (phase !== "fasting") {
      fastCompletePromptedRef.current = false;
    }
    if (phase !== "eating") {
      eatCompletePromptedRef.current = false;
    }
  }, [phase, fastCountdown.isOver]);

  useEffect(() => {
    if (session) { setSessionId(session.id); setStartTime(session.start_time); }
    else { setSessionId(null); setStartTime(null); }
  }, [session?.id]);

  const handleStartFast = async () => {
    if (!user) return;
    const now = new Date();
    setStartPickerDate(now);
    setStartPickerHour(now.getHours());
    setStartPickerMinute(now.getMinutes());
    setShowStartTimePicker(true);
  };

  const formatStartLabel = (date: Date): string => {
    const time = format(date, "h:mm a");
    if (isSameDay(date, new Date())) return `Start Fast from Today at ${time}`;
    if (isSameDay(date, addDays(new Date(), -1))) return `Start Fast from Yesterday at ${time}`;
    if (isSameDay(date, addDays(new Date(), 1))) return `Start Fast from Tomorrow at ${time}`;
    return `Start Fast from ${format(date, "MMM d")} at ${time}`;
  };

  const confirmStartFast = async () => {
    if (!user) return;
    const schedule = selectedSchedule ?? `${fastingHours}:${eatingHours}`;
    const adjustedDate = new Date(startPickerDate);
    adjustedDate.setHours(startPickerHour, startPickerMinute, 0, 0);
    setShowStartTimePicker(false);
    const { data, error } = await startFast(adjustedDate, schedule);
    if (data && !error) {
      setSessionId(data.id);
      setStartTime(data.start_time);
      const remainingSec = getRemainingFastingSeconds(adjustedDate);
      if (remainingSec > 0) {
        await scheduleFastingReminder("Fast Complete!", `Your fast is done. Time to eat!`, remainingSec);
        if (notifPrefs?.checkin_reminders && notifPrefs?.checkin_mode !== "custom") {
          const hoursUntilMidpoint = Math.round(remainingSec / 7200);
          if (hoursUntilMidpoint > 0) await scheduleCheckInReminder(hoursUntilMidpoint);
        }
        if (notifPrefs?.eat_window_reminder && notifPrefs?.eat_window_reminder_minutes) {
          await scheduleEatingWindowReminder(remainingSec, notifPrefs.eat_window_reminder_minutes);
        }
      }
      if (notifPrefs?.water_reminders && notifPrefs?.water_interval_hours) await scheduleWaterReminders(notifPrefs.water_interval_hours);
    }
  };

  const handleUpdateStartTime = async () => {
    if (!session) return;
    const adjustedDate = new Date(editPickerDate);
    adjustedDate.setHours(editPickerHour, editPickerMinute, 0, 0);
    setShowEditTimePicker(false);
    const { error } = await updateStartTime(session.id, adjustedDate);
    if (!error) {
      await cancelAllNotifications();
      const remainingSec = getRemainingFastingSeconds(adjustedDate);
      if (remainingSec > 0) {
        await scheduleFastingReminder("Fast Complete!", `Your fast is done. Time to eat!`, remainingSec);
        if (notifPrefs?.checkin_reminders && notifPrefs?.checkin_mode !== "custom") {
          const hoursUntilMidpoint = Math.round(remainingSec / 7200);
          if (hoursUntilMidpoint > 0) await scheduleCheckInReminder(hoursUntilMidpoint);
        }
        if (notifPrefs?.eat_window_reminder && notifPrefs?.eat_window_reminder_minutes) {
          await scheduleEatingWindowReminder(remainingSec, notifPrefs.eat_window_reminder_minutes);
        }
      }
      if (notifPrefs?.water_reminders && notifPrefs?.water_interval_hours) await scheduleWaterReminders(notifPrefs.water_interval_hours);
    }
  };

  const handleBreakFast = async () => {
    if (!session) return;
    const { error } = await breakFast(session.id);
    if (!error) {
      triggerHaptic("medium");
      await cancelAllNotifications();
      if (notifPrefs?.streak_reminders) await checkAndNotifyStreakMilestone(completedFasts + 1);
    }
  };

  const handleBreakFastWithWeight = async () => {
    if (!session) return;
    setShowWeightPrompt(false);
    if (weightInput.trim()) {
      const kg = parseWeightInput(weightInput.trim(), profile?.unit_preferences as any);
      if (kg !== null) await addWeight(kg);
    }
    const { error } = await breakFast(session.id);
    if (!error) {
      triggerHaptic("medium");
      await cancelAllNotifications();
      if (notifPrefs?.streak_reminders) await checkAndNotifyStreakMilestone(completedFasts + 1);
    }
  };

  const confirmEndSession = async () => {
    setShowEndConfirm(false);
    if (!session) return;
    const capturedSession = session;
    const capturedScheduleLabel = scheduleLabel;
    const capturedFastedHours = fastElapsed.hours;
    const capturedFastedMinutes = fastElapsed.minutes;
    const captureTime = Date.now();
    let eatingHoursVal = 0;
    let eatingMinutesVal = 0;
    if (capturedSession.end_time) {
      const eatingMs = captureTime - new Date(capturedSession.end_time).getTime();
      if (eatingMs > 0) {
        eatingHoursVal = Math.floor(eatingMs / 3600000);
        eatingMinutesVal = Math.floor((eatingMs % 3600000) / 60000);
      }
    }
    const extraHours = Math.floor((capturedFastedMinutes + eatingMinutesVal) / 60);
    const totalHours = capturedFastedHours + eatingHoursVal + extraHours;
    const totalMinutes = (capturedFastedMinutes + eatingMinutesVal) % 60;
    const { error } = await endFast(capturedSession.id);
    if (!error) {
      await cancelAllNotifications();
      if (notifPrefs?.streak_reminders) await checkAndNotifyStreakMilestone(completedFasts + 1);
      setSessionCompleteData({
        scheduleLabel: capturedScheduleLabel,
        fastedHours: capturedFastedHours,
        fastedMinutes: capturedFastedMinutes,
        eatingHours: eatingHoursVal,
        eatingMinutes: eatingMinutesVal,
        totalHours,
        totalMinutes,
        streak,
        completedFastsCount: completedFasts + 1,
      });
      setShowSessionComplete(true);
      setTimeout(() => fireConfetti(), 300);
    }
  };

  const confirmDiscardSession = async () => {
    setShowEndConfirm(false);
    if (!session) return;
    await discardFast(session.id);
    await cancelAllNotifications();
  };

  const handleCheckIn = async () => {
    if (checkInMood === null) return;
    if (phase === "idle") return;
    await addCheckIn({ mood: checkInMood, note: checkInNote, phase });
    setCheckInMood(null);
    setCheckInNote("");
  };

  const scheduleLabel = session?.fasting_schedule ?? `${fastingHours}:${eatingHours}`;
  const pct = fastCountdown.totalSeconds > 0
    ? Math.min((fastElapsedMinutes * 60) / (fastCountdown.totalSeconds + fastElapsedMinutes * 60), 1)
    : 0;
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef as any);
  const { confettiRef, fire: fireConfetti } = useConfetti();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <AmbientBackground />
      <FastTrackHeader />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Protocol Header */}
        {(phase !== "idle" || selectedSchedule) && (
          <View className="items-center mb-section-gap">
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
              Current Protocol
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28 }}>{scheduleLabel} Fast</Text>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={accent.lime} />
            </View>
          </View>
        )}

        {/* Timer Ring */}
        {phase === "idle" ? (
          <View className="items-center mb-section-gap">
            <View className="relative items-center justify-center mb-8" style={{ width: 320, height: 320 }}>
              <FastingTimer
                status="idle"
                totalMinutes={fastingHours * 60}
                elapsedMinutes={0}
                hours={0}
                minutes={0}
                seconds={0}
                elapsedHours={0}
                elapsedMinutesPart={0}
                elapsedSeconds={0}
              />
            </View>

            {/* Start Fast Button */}
            <AnimatedPressable
              onPress={handleStartFast}
              disabled={!selectedSchedule}
              className="w-full py-4 flex-row items-center justify-center mb-section-gap"
              style={{ backgroundColor: selectedSchedule ? accent.lime : c.buttonBg }}
            >
              <MaterialCommunityIcons name="timer-outline" size={22} color={selectedSchedule ? c.textOnAccent : c.textMuted} />
              <Text style={{ color: selectedSchedule ? c.textOnAccent : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 18, marginLeft: 8 }}>
                {selectedSchedule ? `Start ${selectedSchedule} Fast` : "Select a Schedule"}
              </Text>
            </AnimatedPressable>

            {/* Schedule Presets */}
            <GlassPanel className="w-full p-5 mb-section-gap ">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
                FASTING SCHEDULE
              </Text>
              <View className="flex-row gap-2 mb-4">
                {PRESETS.map((p) => {
                  const isActive = selectedSchedule === p.label;
                  return (
                    <Pressable
                      key={p.label}
                      onPress={() => {
                        if (selectedSchedule === p.label) {
                          setSelectedSchedule(null);
                        } else {
                          setSelectedSchedule(p.label);
                          setFastingHours(p.fasting);
                          setEatingHours(p.eating);
                          if (p.fasting > 0 && p.eating > 0) updateFastingSchedule(p.fasting, p.eating);
                        }
                      }}
                      className="flex-1 py-4 items-center rounded-xl"
                      style={{ backgroundColor: isActive ? accent.lime : c.cardBgAlt, borderWidth: 1, borderColor: isActive ? accent.lime : c.cardBorder }}
                    >
                      <Text numberOfLines={1} style={{ color: isActive ? c.textOnAccent : c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                        {p.label}
                      </Text>
                      <Text style={{ color: isActive ? c.textOnAccent : c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4 }}>
                        {p.fasting}h · {p.eating}h
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Extended Fasting Toggle */}
              <Pressable
                onPress={() => setShowExtended((v) => !v)}
                className="flex-row items-center justify-center py-2 mb-3"
              >
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginRight: 6 }}>
                  Extended Fasting
                </Text>
                <MaterialCommunityIcons name={showExtended ? "chevron-up" : "chevron-down"} size={14} color={c.textMuted} />
              </Pressable>

              {showExtended && (
                <View className="flex-row gap-2 mb-4">
                  {EXTENDED_PRESETS.map((p) => {
                    const isActive = selectedSchedule === p.label;
                    return (
                      <Pressable
                        key={p.label}
                        onPress={() => {
                          setSelectedSchedule(p.label);
                          setFastingHours(p.fasting);
                          setEatingHours(p.eating);
                          updateFastingSchedule(p.fasting, p.eating);
                        }}
                        className="flex-1 py-4 items-center rounded-xl"
                        style={{ backgroundColor: isActive ? accent.coral : c.cardBgAlt, borderWidth: 1, borderColor: isActive ? accent.coral : c.cardBorder }}
                      >
                        <Text numberOfLines={1} style={{ color: isActive ? "#FFFFFF" : c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                          {p.label}
                        </Text>
                        <Text style={{ color: isActive ? "rgba(255,255,255,0.7)" : c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4 }}>
                          {p.fasting}h fast
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

                <Pressable
                  onPress={() => { setSelectedSchedule(null); setShowCustomModal(true); }}
                  className="w-full py-3.5 items-center mb-4"
                  style={{ backgroundColor: selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? accent.lime : c.buttonBg, borderWidth: 1, borderColor: selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? accent.lime : c.cardBorder }}
                >
                  <Text style={{ color: selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? c.textOnAccent : c.textSecondary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                    {selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? selectedSchedule : "Custom Schedule"}
                  </Text>
                </Pressable>
            </GlassPanel>

            {/* Schedule Info */}
            {selectedSchedule && (
            <GlassPanel className="w-full p-5 mb-section-gap ">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
                {showStartTimePicker ? "PREVIEW" : "IF YOU START NOW"}
              </Text>
              <View className="flex-row justify-between">
                {(() => {
                  const baseTime = previewStartTime ?? new Date();
                  return [
                    { label: "Fast starts", date: baseTime, color: accent.lime },
                    { label: "Eat window", date: addHours(baseTime, fastingHours), color: accent.cyan },
                    { label: "Window closes", date: addHours(addHours(baseTime, fastingHours), eatingHours), color: accent.coral },
                  ].map((item) => (
                  <View key={item.label} className="flex-1 items-center">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15, marginTop: 4, textAlign: "center" }}>
                      {format(item.date, "MMM d")}
                    </Text>
                    <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 1, textAlign: "center" }}>
                      {format(item.date, "h:mm a")}
                    </Text>
                  </View>
                  ))
                })()}
              </View>
            </GlassPanel>
            )}
          </View>
        ) : !session ? (
          <>
            {/* Loading / pre-query placeholder: keep idle view until session is populated
                so the active timer never flashes a countdown derived from the current time */}
            <View className="items-center mb-section-gap">
              <View className="relative items-center justify-center" style={{ width: 320, height: 320 }}>
                <FastingTimer
                  status="idle"
                  totalMinutes={fastingHours * 60}
                  elapsedMinutes={0}
                  hours={0}
                  minutes={0}
                  seconds={0}
                  elapsedHours={0}
                  elapsedMinutesPart={0}
                  elapsedSeconds={0}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Active Fast Timer */}
            <View className="items-center mb-section-gap">
              <View className="relative items-center justify-center" style={{ width: 320, height: 320 }}>
                <FastingTimer
                  status={phase as "fasting" | "eating"}
                  totalMinutes={phase === "eating" ? eatingHours * 60 : fastingHours * 60}
                  elapsedMinutes={phase === "eating" ? eatingHours * 60 - fastCountdown.totalMinutes : fastElapsedMinutes}
                  hours={fastCountdown.hours}
                  minutes={fastCountdown.minutes}
                  seconds={fastCountdown.seconds}
                  elapsedHours={fastElapsed.hours}
                  elapsedMinutesPart={fastElapsed.minutes}
                  elapsedSeconds={fastElapsed.seconds}
                  isOver={fastCountdown.isOver}
                  schedule={session?.fasting_schedule}
                  startedAt={startedAtDate}
                  eatWindowOpensAt={eatWindowOpensDate}
                  windowClosesAt={windowClosesDate}
                  onEditStartTime={phase === "fasting" ? () => {
                    const st = new Date(session?.start_time ?? Date.now());
                    setEditPickerDate(st);
                    setEditPickerHour(st.getHours());
                    setEditPickerMinute(st.getMinutes());
                    setShowEditTimePicker(true);
                  } : undefined}
                />
                {/* FastingTimer now renders its own Stitch content */}
              </View>
            </View>

            {/* End Fast Button */}
            <Pressable
              onPress={phase === "eating" ? () => setShowEndConfirm(true) : () => setShowBreakConfirm(true)}
              className="w-full py-4 flex-row items-center justify-center mb-section-gap active:opacity-80"
              style={{
                backgroundColor: phase === "eating" ? accent.cyan : accent.lime,
                shadowColor: phase === "eating" ? accent.cyan : accent.lime,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 5,
              }}
            >
              <MaterialCommunityIcons name="stop-circle-outline" size={22} color={c.textOnAccent} />
              <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 18, marginLeft: 8 }}>
                {phase === "eating" ? "End Eating Window" : "Break Fast"}
              </Text>
            </Pressable>

            {/* Break Fast Confirmation */}
            <Modal visible={showBreakConfirm} transparent animationType="slide" onRequestClose={() => setShowBreakConfirm(false)}>
              <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowBreakConfirm(false)}>
                <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 }}>
                    Break Your Fast?
                  </Text>
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 4 }}>
                    You're {fastElapsed.hours}h {fastElapsed.minutes}m into a {scheduleLabel} fast.
                  </Text>
                  <View className="flex-row items-center gap-2 mb-4">
                    <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
                      <View className="h-full rounded-full" style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: accent.lime }} />
                    </View>
                    <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11 }}>
                      {Math.round(pct * 100)}%
                    </Text>
                  </View>
                  <View className="glass-bg p-5 mb-4" style={{ borderColor: "rgba(244,63,94,0.3)" }}>
                    <View className="flex-row items-start gap-3 mb-3">
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(244,63,94,0.15)", alignItems: "center", justifyContent: "center" }}>
                        <MaterialCommunityIcons name="lightning-bolt" size={18} color={ACCENT.rose} />
                      </View>
                      <View className="flex-1">
                        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 2 }}>
                          Break now and your eating window starts
                        </Text>
                        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                          You'll lose the metabolic benefits built up so far
                        </Text>
                      </View>
                    </View>
                    <View style={{ height: 1, backgroundColor: c.divider, marginBottom: 12 }} />
                    {[
                      "Autophagy slows down significantly",
                      "Ketone production drops off",
                      "Body switches back to glucose metabolism",
                      "Hunger hormones spike as digestion restarts",
                      "Your fasting streak for today is lost",
                    ].map((item, i) => (
                      <View key={i} className="flex-row items-center gap-2 mb-2" style={{ marginLeft: 4 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: ACCENT.rose }} />
                        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {fastElapsedMinutes >= 36 * 60 && (
                    <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: accent.limeBg, borderWidth: 1, borderColor: accent.limeBorder }}>
                      <View className="flex-row items-start gap-3">
                        <MaterialCommunityIcons name="lightning-bolt" size={20} color={accent.lime} style={{ marginTop: 2 }} />
                        <View className="flex-1">
                          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 }}>
                            Breaking a long fast?
                          </Text>
                          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                            Start with small, easy-to-digest meals. Bone broth, avocado, or eggs are gentle on your system after extended fasting.
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <View className="flex-row gap-3 mb-3">
                    <Pressable onPress={() => setShowBreakConfirm(false)} className="flex-1 py-3.5 items-center" style={{ backgroundColor: accent.lime }}>
                      <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }}>Continue Fasting</Text>
                    </Pressable>
                    <Pressable onPress={() => { setShowBreakConfirm(false); setWeightInput(profile?.weight_kg ? displayWeight(profile.weight_kg, profile.unit_preferences as any) : ""); setShowWeightPrompt(true); }} className="flex-1 py-3.5 items-center" style={{ backgroundColor: c.buttonBg }}>
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold" }}>Break Fast</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Weight Prompt Modal */}
            <Modal visible={showWeightPrompt} transparent animationType="slide" onRequestClose={() => setShowWeightPrompt(false)}>
              <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowWeightPrompt(false)}>
                <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
                  <View className="items-center mb-4">
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: accent.limeBg, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <MaterialCommunityIcons name="scale-bathroom" size={24} color={accent.lime} />
                    </View>
                    <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Log your weight?</Text>
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 16 }}>
                      Weighing in before eating is a great way to stay on track
                    </Text>
                  </View>

                  <TextInput
                    value={weightInput}
                    onChangeText={setWeightInput}
                    placeholder={profile?.weight_kg ? "Adjust your weight" : "Enter your weight"}
                    keyboardType="decimal-pad"
                    className="w-full text-center py-3 mb-5 rounded-xl"
                    style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, borderWidth: 1, borderColor: c.inputBorder }}
                    placeholderTextColor={c.placeholder}
                  />

                  <View className="flex-row gap-3 mb-3">
                    <Pressable onPress={handleBreakFastWithWeight} className="flex-1 py-3.5 items-center" style={{ backgroundColor: accent.lime }}>
                      <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }}>Log Weight & Break Fast</Text>
                    </Pressable>
                    <Pressable onPress={() => { setShowWeightPrompt(false); handleBreakFast(); }} className="flex-1 py-3.5 items-center" style={{ backgroundColor: c.buttonBg }}>
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold" }}>Skip</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* End Session Confirmation */}
            <Modal visible={showEndConfirm} transparent animationType="slide" onRequestClose={() => setShowEndConfirm(false)}>
              <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowEndConfirm(false)}>
                <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 }}>
                    End Eating Window?
                  </Text>
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>
                    You've been eating for {eatingHours * 60 - fastCountdown.totalMinutes} min.
                  </Text>
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 20, opacity: 0.7 }}>
                    This will complete your fasting session and your results will be saved.
                  </Text>
                  <View className="flex-row gap-3 mb-3">
                    <Pressable onPress={() => setShowEndConfirm(false)} className="flex-1 py-3.5 items-center" style={{ backgroundColor: c.buttonBg }}>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Keep Eating</Text>
                    </Pressable>
                    <Pressable onPress={confirmEndSession} className="flex-1 py-3.5 items-center" style={{ backgroundColor: accent.lime }}>
                      <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }}>End Eating Window</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={confirmDiscardSession} className="w-full py-3 items-center" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
                    <Text style={{ color: ACCENT.rose, fontFamily: "Inter_700Bold", fontSize: 13 }}>Discard Fast</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Insights Mini-Card */}
            {(() => {
              const elapsedEating = phase === "eating"
                ? fastCountdown.isOver
                  ? eatingHours * 60 + fastCountdown.totalMinutes
                  : eatingHours * 60 - fastCountdown.totalMinutes
                : 0;
              const info = phase === "eating"
                ? getEatingPhase(elapsedEating, eatingHours * 60)
                : getFastingPhase(fastElapsedMinutes);
              return (
                <GlassPanel className="w-full  p-5 mb-section-gap">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>{info.label}</Text>
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>{info.description}</Text>
                    </View>
                    <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={accent.lime} style={{ opacity: 0.4 }} />
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
                      <View className="h-full rounded-full" style={{ width: `${info.progressPct}%`, backgroundColor: accent.lime }} />
                    </View>
                    {info.phaseCount > 1 && (
                      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11 }}>
                        Phase {info.phaseIndex + 1}/{info.phaseCount}
                      </Text>
                    )}
                  </View>
                </GlassPanel>
              );
            })()}

            {/* Mood Check-in */}
            <GlassPanel className="w-full p-5 mb-section-gap ">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textAlign: "center", marginBottom: 16, textTransform: "uppercase" }}>
                HOW ARE YOU FEELING?
              </Text>
              <View className="flex-row gap-3">
                {MOODS.map((m) => {
                  const isSelected = checkInMood === m.value;
                  return (
                    <Pressable
                      key={m.value}
                      onPress={() => setCheckInMood(m.value)}
                      className="flex-1 items-center p-3 rounded-lg"
                      style={{ backgroundColor: isSelected ? c.elevated : c.cardBgAlt }}
                    >
                      <MaterialCommunityIcons
                        name={m.icon as any}
                        size={28}
                        color={isSelected ? m.color : c.textMuted}
                      />
                      <Text
                        style={{ color: isSelected ? m.color : c.textMuted, fontFamily: isSelected ? "SpaceGrotesk_700Bold" : "Inter_400Regular", fontSize: 10, marginTop: 8 }}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-row items-center gap-2 mt-4">
                <GlassPanel className="flex-1  px-4 py-3">
                  <TextInput
                    value={checkInNote}
                    onChangeText={setCheckInNote}
                    placeholder={phase === "fasting" ? "How's the fast going?" : "How's the meal?"}
                    placeholderTextColor={c.placeholder}
                    style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                    multiline
                    maxLength={280}
                  />
                </GlassPanel>
                <Pressable
                  onPress={handleCheckIn}
                  disabled={checkInMood === null}
                  style={{ padding: 14, borderRadius: 12, backgroundColor: checkInMood !== null ? accent.lime : c.buttonBg }}
                >
                  <MaterialCommunityIcons name="arrow-right" size={20} color={checkInMood !== null ? c.textOnAccent : c.textMuted} />
                </Pressable>
              </View>
            </GlassPanel>

            {/* Check-in History */}
            {checkIns.length > 0 && (
              <GlassPanel className="w-full  p-5 mb-section-gap">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
                  CHECK-IN HISTORY
                </Text>
                <MoodChart checkIns={checkIns} />
                <CheckInTimeline checkIns={checkIns} />
              </GlassPanel>
            )}

          </>
        )}

        {/* Previous Fasts + Calendar */}
        <PreviousFasts sessions={pastSessions} fastingHours={fastingHours} onDelete={deleteFast} />
      </ScrollView>

      <CustomScheduleModal
        visible={showCustomModal}
        onSelect={(label, f, e) => {
          setSelectedSchedule(label);
          setFastingHours(f);
          setEatingHours(e);
          updateFastingSchedule(f, e);
          setShowCustomModal(false);
        }}
        onCancel={() => setShowCustomModal(false)}
      />

      {/* Fast Complete Celebration */}
      <Modal visible={showFastComplete} transparent animationType="slide" onRequestClose={() => setShowFastComplete(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowFastComplete(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="items-center mb-4">
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: accent.limeBg, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialCommunityIcons name="trophy" size={28} color={accent.lime} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Fast Complete!</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                You've completed your {scheduleLabel} fast. Great work!
              </Text>
            </View>

            <View className="flex-row justify-center gap-6 mb-5">
              <View className="items-center">
                <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_700Bold", fontSize: 28 }}>{fastElapsed.hours}</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>hours</Text>
              </View>
              <View className="items-center">
                <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_700Bold", fontSize: 28 }}>{fastElapsed.minutes}</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>minutes</Text>
              </View>
            </View>

            <View className="flex-row gap-3 mb-2">
              <Pressable
                onPress={() => { setShowFastComplete(false); handleBreakFast(); }}
                className="flex-1 py-3.5 items-center"
                style={{ backgroundColor: accent.lime }}
              >
                <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 15 }}>Break Fast</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowFastComplete(false)}
                className="flex-1 py-3.5 items-center"
                style={{ backgroundColor: c.buttonBg }}
              >
                <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 15 }}>Keep Fasting</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Session Complete Celebration */}
      <Modal visible={showSessionComplete} transparent animationType="slide" onRequestClose={() => setShowSessionComplete(false)}>
        <ConfettiCanvas ref={confettiRef} />
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowSessionComplete(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="items-center mb-5">
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(195,244,0,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialCommunityIcons name="trophy" size={28} color={accent.lime} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Session Complete!</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                You completed a {sessionCompleteData?.scheduleLabel ?? `${fastingHours}:${eatingHours}`} fast.
              </Text>
            </View>

            <View className="p-4 mb-4" style={{ backgroundColor: c.cardBg }}>
              <View className="flex-row justify-between py-2">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Fasted</Text>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {sessionCompleteData?.fastedHours ?? 0}h {sessionCompleteData?.fastedMinutes ?? 0}m
                </Text>
              </View>
              <View className="h-px" style={{ backgroundColor: c.divider }} />
              <View className="flex-row justify-between py-2">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Ate</Text>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {sessionCompleteData?.eatingHours ?? 0}h {sessionCompleteData?.eatingMinutes ?? 0}m
                </Text>
              </View>
              <View className="h-px" style={{ backgroundColor: c.divider }} />
              <View className="flex-row justify-between py-2">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Total</Text>
                <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {sessionCompleteData?.totalHours ?? 0}h {sessionCompleteData?.totalMinutes ?? 0}m
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 mb-5">
              <View className="flex-1 items-center py-3" style={{ backgroundColor: c.cardBg }}>
                <Text style={{ color: accent.coral, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                  {sessionCompleteData?.streak ?? 0}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>day streak</Text>
              </View>
              <View className="flex-1 items-center py-3" style={{ backgroundColor: c.cardBg }}>
                <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                  {sessionCompleteData?.completedFastsCount ?? 0}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>completed</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowSessionComplete(false)}
              className="py-4 items-center"
              style={{ backgroundColor: accent.lime }}
            >
              <Text style={{ color: "#1a2e00", fontFamily: "Inter_700Bold", fontSize: 16 }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Eat Complete Celebration */}
      <Modal visible={showEatComplete} transparent animationType="slide" onRequestClose={() => setShowEatComplete(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowEatComplete(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="items-center mb-5">
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,218,243,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialCommunityIcons name="check-circle" size={28} color={accent.cyan} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Eating Window Complete!</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                You've completed your {eatingHours}-hour eating window. Your next fast has begun.
              </Text>
            </View>

            <View className="flex-row gap-3 mb-2">
              <Pressable
                onPress={() => { setShowEatComplete(false); confirmEndSession(); }}
                className="flex-1 py-3.5 items-center"
                style={{ backgroundColor: accent.cyan }}
              >
                <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 15 }}>End Session</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowEatComplete(false)}
                className="flex-1 py-3.5 items-center"
                style={{ backgroundColor: c.buttonBg }}
              >
                <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 15 }}>Keep Eating</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Set Start Time Picker (before starting fast) */}
      <Modal visible={showStartTimePicker} transparent animationType="slide" onRequestClose={() => setShowStartTimePicker(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowStartTimePicker(false)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setShowStartTimePicker(false)}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Set Start Time</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Hour and Minute picker */}
            <View className="flex-row justify-center gap-6 mb-6">
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>Hour</Text>
                <ScrollView className="h-32 w-20" showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                    const todayStr = new Date().toDateString();
                    const disabled = startPickerDate.toDateString() === todayStr
                      ? h < new Date().getHours() || (h === new Date().getHours() && startPickerMinute < new Date().getMinutes())
                      : false;
                    const selected = startPickerHour === h;
                    return (
                      <Pressable key={h} onPress={() => !disabled && setStartPickerHour(h)} disabled={disabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: selected ? accent.limeBg : "transparent", opacity: disabled ? 0.3 : 1 }}>
                        <Text className="text-xl"
                          style={{ color: selected ? accent.lime : c.textMuted, fontFamily: selected ? "Inter_700Bold" : "Inter_400Regular" }}>
                          {h.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 24 }}>:</Text>
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>Minute</Text>
                <ScrollView className="h-32 w-20" showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                    const todayStr = new Date().toDateString();
                    const disabled = startPickerDate.toDateString() === todayStr
                      ? startPickerHour < new Date().getHours() || (startPickerHour === new Date().getHours() && m < new Date().getMinutes())
                      : false;
                    const selected = startPickerMinute === m;
                    return (
                      <Pressable key={m} onPress={() => !disabled && setStartPickerMinute(m)} disabled={disabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: selected ? accent.limeBg : "transparent", opacity: disabled ? 0.3 : 1 }}>
                        <Text className="text-xl"
                          style={{ color: selected ? accent.lime : c.textMuted, fontFamily: selected ? "Inter_700Bold" : "Inter_400Regular" }}>
                          {m.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Date shortcuts */}
            <View className="flex-row justify-center gap-2 mb-4">
              {(() => {
                const now = new Date();
                const presets = [
                  { label: "Yesterday", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
                  { label: "Today", date: new Date() },
                  { label: "Tomorrow", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
                  { label: "+2d", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2) },
                ];
                return presets.map((p) => {
                  const active = startPickerDate.toDateString() === p.date.toDateString();
                  return (
                    <Pressable key={p.label} onPress={() => setStartPickerDate(p.date)}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: active ? accent.limeBg : c.buttonBg }}>
                      <Text style={{ color: active ? accent.lime : c.text, fontFamily: "Inter_400Regular", fontSize: 13 }}>{p.label}</Text>
                    </Pressable>
                  );
                });
              })()}
            </View>

            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" }}>
              {startPickerDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>

            <Pressable
              onPress={confirmStartFast}
              className="w-full py-4 items-center mt-5"
              style={{ backgroundColor: accent.lime }}
            >
              <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                {formatStartLabel((() => { const d = new Date(startPickerDate); d.setHours(startPickerHour, startPickerMinute, 0, 0); return d; })())}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Start Time Picker (during active fast) */}
      <Modal visible={showEditTimePicker} transparent animationType="slide" onRequestClose={() => setShowEditTimePicker(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowEditTimePicker(false)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setShowEditTimePicker(false)}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Edit Start Time</Text>
              <Pressable onPress={handleUpdateStartTime}>
                <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 15 }}>Done</Text>
              </Pressable>
            </View>

            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginBottom: 16 }}>
              Adjust when you actually started fasting
            </Text>

            {/* Hour and Minute picker */}
            <View className="flex-row justify-center gap-6 mb-6">
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>Hour</Text>
                <ScrollView className="h-32 w-20" showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                    const disabled = isFutureTime(editPickerDate, h, editPickerMinute);
                    const selected = editPickerHour === h;
                    return (
                      <Pressable key={h} onPress={() => !disabled && setEditPickerHour(h)} disabled={disabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: selected ? accent.limeBg : "transparent", opacity: disabled ? 0.3 : 1 }}>
                        <Text className="text-xl"
                          style={{ color: selected ? accent.lime : c.textMuted, fontFamily: selected ? "Inter_700Bold" : "Inter_400Regular" }}>
                          {h.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 24 }}>:</Text>
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>Minute</Text>
                <ScrollView className="h-32 w-20" showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                    const disabled = isFutureTime(editPickerDate, editPickerHour, m);
                    const selected = editPickerMinute === m;
                    return (
                      <Pressable key={m} onPress={() => !disabled && setEditPickerMinute(m)} disabled={disabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: selected ? accent.limeBg : "transparent", opacity: disabled ? 0.3 : 1 }}>
                        <Text className="text-xl"
                          style={{ color: selected ? accent.lime : c.textMuted, fontFamily: selected ? "Inter_700Bold" : "Inter_400Regular" }}>
                          {m.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Date shortcuts */}
            <View className="flex-row justify-center gap-2 mb-4">
              {(() => {
                const now = new Date();
                const presets = [
                  { label: "3d ago", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) },
                  { label: "2d ago", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) },
                  { label: "Yesterday", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
                  { label: "Today", date: new Date() },
                ];
                return presets.map((p) => {
                  const active = editPickerDate.toDateString() === p.date.toDateString();
                  return (
                    <Pressable key={p.label} onPress={() => setEditPickerDate(p.date)}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: active ? accent.limeBg : c.buttonBg }}>
                      <Text style={{ color: active ? accent.lime : c.text, fontFamily: "Inter_400Regular", fontSize: 13 }}>{p.label}</Text>
                    </Pressable>
                  );
                });
              })()}
            </View>

            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" }}>
              {editPickerDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
