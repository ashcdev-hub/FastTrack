import React, { useEffect, useState, useRef } from "react";
import { Pressable, View, Text, ScrollView, TextInput, Modal, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useFastingSession } from "@/hooks/useFastingSession";
import { useFastingStore } from "@/store/useFastingStore";
import { useFastCheckIns } from "@/hooks/useFastCheckIns";
import { useProfile } from "@/hooks/useProfile";
import { FastingTimer } from "@/components/FastingTimer";
import { PreviousFasts } from "@/components/PreviousFasts";
import { CheckInPanel } from "@/components/CheckInPanel";
import { CheckInTimeline } from "@/components/CheckInTimeline";
import { MoodChart } from "@/components/MoodChart";
import { CustomScheduleModal } from "@/components/CustomScheduleModal";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { scheduleFastingReminder, cancelAllNotifications, scheduleDailyFastReminder, scheduleCheckInReminder, scheduleWaterReminders, scheduleEatingWindowReminder, checkAndNotifyStreakMilestone } from "@/lib/notifications";
import { getFastingPhase, getEatingPhase } from "@/lib/fasting-phases";
import { format, addHours } from "date-fns";
import { useScrollToTop } from "@react-navigation/native";

const PRESETS = [
  { label: "14:10", fasting: 14, eating: 10 },
  { label: "16:8", fasting: 16, eating: 8 },
  { label: "18:6", fasting: 18, eating: 6 },
  { label: "20:4", fasting: 20, eating: 4 },
  { label: "OMAD", fasting: 23, eating: 1 },
];

const MOODS = [
  { value: 4, label: "HAPPY", icon: "emoticon-happy", color: ACCENT.lime },
  { value: 3, label: "NEUTRAL", icon: "emoticon-neutral", color: ACCENT.cyan },
  { value: 1, label: "LOW ENERGY", icon: "emoticon-sad", color: ACCENT.coral },
];

function useCountdown(endTime: string | null) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0, isOver: false });
  useEffect(() => {
    if (!endTime) { setRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0, isOver: false }); return; }
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      const isOver = diff < 0;
      const totalSeconds = Math.floor(Math.abs(diff) / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const totalMinutes = Math.floor(totalSeconds / 60);
      setRemaining({ hours, minutes, seconds, totalSeconds, totalMinutes, isOver });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  return remaining;
}

function useElapsedMinutes(startTime: string | null) {
  const [totalMinutes, setTotalMinutes] = useState(0);
  useEffect(() => {
    if (!startTime) { setTotalMinutes(0); return; }
    const tick = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      setTotalMinutes(Math.max(0, Math.floor(diff / 60000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return totalMinutes;
}

function useElapsed(startTime: string | null) {
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!startTime) { setElapsed({ hours: 0, minutes: 0, seconds: 0 }); return; }
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setElapsed({ hours, minutes, seconds });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return elapsed;
}

type Phase = "idle" | "fasting" | "eating";

export default function FastScreen() {
  const { user } = useAuth();
  const { session, startFast, endFast, breakFast, discardFast, deleteFast, pastSessions, streak, completedFasts } = useFastingSession(user?.id);
  const { fastingHours, eatingHours, setSessionId, setStartTime, setFastingHours, setEatingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const { checkIns, addCheckIn } = useFastCheckIns(user?.id, session?.id ?? null);
  const { profile, updateFastingSchedule } = useProfile(user?.id ?? null);
  const notifPrefs = profile?.notification_preferences;

  const phase: Phase = !session ? "idle" : (session.status as Phase);
  const fastStartStr = session?.start_time ?? null;
  const eatWindowEndStr = phase === "fasting" && session?.start_time
    ? addHours(new Date(session.start_time), fastingHours).toISOString()
    : phase === "eating" && session?.end_time
      ? addHours(new Date(session.end_time), eatingHours).toISOString()
      : null;
  const fastCountdown = useCountdown(eatWindowEndStr);
  const fastElapsedMinutes = useElapsedMinutes(fastStartStr);
  const fastElapsed = useElapsed(fastStartStr);

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
  const fastCompletePromptedRef = useRef(false);
  const eatCompletePromptedRef = useRef(false);

  useEffect(() => {
    if (phase === "fasting" && fastCountdown.isOver && !fastCompletePromptedRef.current) {
      fastCompletePromptedRef.current = true;
      setShowFastComplete(true);
    }
    if (phase === "eating" && fastCountdown.isOver && !eatCompletePromptedRef.current) {
      eatCompletePromptedRef.current = true;
      setShowEatComplete(true);
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
    const schedule = selectedSchedule ?? `${fastingHours}:${eatingHours}`;
    const { data, error } = await startFast(new Date(), schedule);
    if (data && !error) {
      setSessionId(data.id);
      setStartTime(data.start_time);
      await scheduleFastingReminder("Fast Complete!", `Your fast is done. Time to eat!`, fastingHours * 3600);
      if (notifPrefs?.checkin_reminders && notifPrefs?.checkin_mode !== "custom") await scheduleCheckInReminder(fastingHours / 2);
      if (notifPrefs?.water_reminders && notifPrefs?.water_interval_hours) await scheduleWaterReminders(notifPrefs.water_interval_hours);
      if (notifPrefs?.eat_window_reminder && notifPrefs?.eat_window_reminder_minutes) {
        await scheduleEatingWindowReminder(fastingHours * 3600, notifPrefs.eat_window_reminder_minutes);
      }
    }
  };

  const handleBreakFast = async () => {
    if (!session) return;
    const { error } = await breakFast(session.id);
    if (!error) {
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

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center gap-2">
            <Image source={require("../../assets/icon.png")} style={{ width: 22, height: 22, borderRadius: 5 }} />
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

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
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={ACCENT.lime} />
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
            <Pressable
              onPress={handleStartFast}
              disabled={!selectedSchedule}
              className="w-full py-4 rounded-xl flex-row items-center justify-center mb-section-gap"
              style={{ backgroundColor: selectedSchedule ? ACCENT.lime : c.buttonBg }}
            >
              <MaterialCommunityIcons name="timer-outline" size={22} color={selectedSchedule ? "#161e00" : c.textMuted} />
              <Text style={{ color: selectedSchedule ? "#161e00" : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 18, marginLeft: 8 }}>
                {selectedSchedule ? `Start ${selectedSchedule} Fast` : "Select a Schedule"}
              </Text>
            </Pressable>

            {/* Schedule Presets */}
            <View className="w-full rounded-xl p-5 mb-section-gap glass-panel">
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
                      style={{ backgroundColor: isActive ? ACCENT.lime : c.cardBgAlt, borderWidth: 1, borderColor: isActive ? ACCENT.lime : c.cardBorder }}
                    >
                      <Text style={{ color: isActive ? "#161e00" : c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                        {p.label}
                      </Text>
                      <Text style={{ color: isActive ? "rgba(22,30,0,0.6)" : c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4 }}>
                        {p.fasting}h · {p.eating}h
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => { setSelectedSchedule(null); setShowCustomModal(true); }}
                className="w-full py-3.5 rounded-xl items-center mb-4"
                style={{ backgroundColor: selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? ACCENT.lime : c.buttonBg, borderWidth: 1, borderColor: selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? ACCENT.lime : c.cardBorder }}
              >
                <Text style={{ color: selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? "#161e00" : c.textSecondary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {selectedSchedule && !PRESETS.find((p) => p.label === selectedSchedule) ? `Custom: ${selectedSchedule}` : "Custom Schedule"}
                </Text>
              </Pressable>
            </View>

            {/* Schedule Info */}
            {selectedSchedule && (
            <View className="w-full rounded-xl p-5 mb-section-gap glass-panel">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
                IF YOU START NOW
              </Text>
              <View className="flex-row justify-between">
                {[
                  { label: "Fast starts", date: new Date(), color: ACCENT.lime },
                  { label: "Eat window", date: addHours(new Date(), fastingHours), color: ACCENT.cyan },
                  { label: "Window closes", date: addHours(addHours(new Date(), fastingHours), eatingHours), color: ACCENT.coral },
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
                ))}
              </View>
            </View>
            )}
          </View>
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
                />
                {/* FastingTimer now renders its own Stitch content */}
              </View>
            </View>

            {/* End Fast Button */}
            <Pressable
              onPress={phase === "eating" ? () => setShowEndConfirm(true) : () => setShowBreakConfirm(true)}
              className="w-full py-4 rounded-xl flex-row items-center justify-center mb-section-gap"
              style={{
                backgroundColor: phase === "eating" ? ACCENT.cyan : ACCENT.lime,
                shadowColor: phase === "eating" ? ACCENT.cyan : ACCENT.lime,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 5,
              }}
            >
              <MaterialCommunityIcons name="stop-circle-outline" size={22} color="#161e00" />
              <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold", fontSize: 18, marginLeft: 8 }}>
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
                      <View className="h-full rounded-full" style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: ACCENT.lime }} />
                    </View>
                    <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11 }}>
                      {Math.round(pct * 100)}%
                    </Text>
                  </View>
                  <View className="glass-panel p-5 mb-4" style={{ borderColor: "rgba(244,63,94,0.3)" }}>
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
                  <View className="flex-row gap-3 mb-3">
                    <Pressable onPress={() => setShowBreakConfirm(false)} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: ACCENT.lime }}>
                      <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>Continue Fasting</Text>
                    </Pressable>
                    <Pressable onPress={() => { setShowBreakConfirm(false); handleBreakFast(); }} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold" }}>Break Fast</Text>
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
                    <Pressable onPress={() => setShowEndConfirm(false)} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Keep Eating</Text>
                    </Pressable>
                    <Pressable onPress={confirmEndSession} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: ACCENT.lime }}>
                      <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>End Eating Window</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={confirmDiscardSession} className="w-full py-3 rounded-xl items-center" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
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
                <View className="w-full glass-panel p-5 mb-section-gap">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>{info.label}</Text>
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>{info.description}</Text>
                    </View>
                    <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={ACCENT.lime} style={{ opacity: 0.4 }} />
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
                      <View className="h-full rounded-full" style={{ width: `${info.progressPct}%`, backgroundColor: ACCENT.lime }} />
                    </View>
                    {info.phaseCount > 1 && (
                      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11 }}>
                        Phase {info.phaseIndex + 1}/{info.phaseCount}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* Mood Check-in */}
            <View className="w-full rounded-xl p-5 mb-section-gap glass-panel">
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
                <View className="flex-1 glass-panel rounded-xl px-4 py-3">
                  <TextInput
                    value={checkInNote}
                    onChangeText={setCheckInNote}
                    placeholder={phase === "fasting" ? "How's the fast going?" : "How's the meal?"}
                    placeholderTextColor={c.placeholder}
                    style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                    multiline
                    maxLength={280}
                  />
                </View>
                <Pressable
                  onPress={handleCheckIn}
                  disabled={checkInMood === null}
                  style={{ padding: 14, borderRadius: 12, backgroundColor: checkInMood !== null ? ACCENT.lime : c.buttonBg }}
                >
                  <MaterialCommunityIcons name="arrow-right" size={20} color={checkInMood !== null ? "#161e00" : c.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Check-in History */}
            {checkIns.length > 0 && (
              <View className="w-full glass-panel p-5 mb-section-gap">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
                  CHECK-IN HISTORY
                </Text>
                <MoodChart checkIns={checkIns} />
                <CheckInTimeline checkIns={checkIns} />
              </View>
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
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT.limeBg, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialCommunityIcons name="trophy" size={28} color={ACCENT.lime} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Fast Complete!</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                You've completed your {scheduleLabel} fast. Great work!
              </Text>
            </View>

            <View className="flex-row justify-center gap-6 mb-5">
              <View className="items-center">
                <Text style={{ color: ACCENT.lime, fontFamily: "SpaceGrotesk_700Bold", fontSize: 28 }}>{fastElapsed.hours}</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>hours</Text>
              </View>
              <View className="items-center">
                <Text style={{ color: ACCENT.lime, fontFamily: "SpaceGrotesk_700Bold", fontSize: 28 }}>{fastElapsed.minutes}</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>minutes</Text>
              </View>
            </View>

            <View className="flex-row gap-3 mb-2">
              <Pressable
                onPress={() => { setShowFastComplete(false); handleBreakFast(); }}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: ACCENT.lime }}
              >
                <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold", fontSize: 15 }}>Break Fast</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowFastComplete(false)}
                className="flex-1 py-3.5 rounded-xl items-center"
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
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowSessionComplete(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="items-center mb-5">
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(195,244,0,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialCommunityIcons name="trophy" size={28} color={ACCENT.lime} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Session Complete!</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                You completed a {sessionCompleteData?.scheduleLabel ?? `${fastingHours}:${eatingHours}`} fast.
              </Text>
            </View>

            <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: c.cardBg }}>
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
                <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {sessionCompleteData?.totalHours ?? 0}h {sessionCompleteData?.totalMinutes ?? 0}m
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 mb-5">
              <View className="flex-1 items-center rounded-xl py-3" style={{ backgroundColor: c.cardBg }}>
                <Text style={{ color: ACCENT.coral, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                  {sessionCompleteData?.streak ?? 0}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>day streak</Text>
              </View>
              <View className="flex-1 items-center rounded-xl py-3" style={{ backgroundColor: c.cardBg }}>
                <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                  {sessionCompleteData?.completedFastsCount ?? 0}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>completed</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowSessionComplete(false)}
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: ACCENT.lime }}
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
                <MaterialCommunityIcons name="check-circle" size={28} color={ACCENT.cyan} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Eating Window Complete!</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                You've completed your {eatingHours}-hour eating window. Your next fast has begun.
              </Text>
            </View>

            <View className="flex-row gap-3 mb-2">
              <Pressable
                onPress={() => { setShowEatComplete(false); confirmEndSession(); }}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: ACCENT.cyan }}
              >
                <Text style={{ color: "#001e24", fontFamily: "Inter_700Bold", fontSize: 15 }}>End Session</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowEatComplete(false)}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: c.buttonBg }}
              >
                <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 15 }}>Keep Eating</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
