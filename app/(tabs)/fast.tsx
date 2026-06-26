import React, { useEffect, useState } from "react";
import { Pressable, View, Text, ScrollView, TextInput } from "react-native";
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
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { scheduleFastingReminder, cancelAllNotifications, scheduleDailyFastReminder, scheduleCheckInReminder, scheduleWaterReminders, checkAndNotifyStreakMilestone } from "@/lib/notifications";
import { format, addHours } from "date-fns";

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
  const { session, startFast, endFast, breakFast, deleteFast, pastSessions, streak, completedFasts } = useFastingSession(user?.id);
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
  const [checkInMood, setCheckInMood] = useState<number | null>(null);
  const [checkInNote, setCheckInNote] = useState("");

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
      if (notifPrefs?.checkin_reminders) await scheduleCheckInReminder(fastingHours / 2);
      if (notifPrefs?.water_reminders && notifPrefs?.water_interval_hours) await scheduleWaterReminders(notifPrefs.water_interval_hours);
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
    const { error } = await endFast(session.id);
    if (!error) {
      await cancelAllNotifications();
      if (notifPrefs?.streak_reminders) await checkAndNotifyStreakMilestone(completedFasts + 1);
    }
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

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center">
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Protocol Header */}
        <View className="items-center mb-8">
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
            Current Protocol
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28 }}>{scheduleLabel} Fast</Text>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={ACCENT.lime} />
          </View>
        </View>

        {/* Timer Ring */}
        {phase === "idle" ? (
          <View className="items-center mb-8">
            <View style={{ width: 280, height: 280, alignItems: "center", justifyContent: "center" }}>
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
              className="w-full py-4 rounded-lg flex-row items-center justify-center mb-6"
              style={{ backgroundColor: ACCENT.lime }}
            >
              <MaterialCommunityIcons name="timer-outline" size={22} color="#161e00" />
              <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold", fontSize: 18, marginLeft: 8 }}>
                Start {scheduleLabel} Fast
              </Text>
            </Pressable>

            {/* Schedule Presets */}
            <View className="w-full rounded-xl p-5 mb-6 glass-panel">
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
                        setSelectedSchedule(p.label);
                        setFastingHours(p.fasting);
                        setEatingHours(p.eating);
                        if (p.fasting > 0 && p.eating > 0) updateFastingSchedule(p.fasting, p.eating);
                      }}
                      className="flex-1 py-4 items-center rounded-lg"
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
            </View>

            {/* Schedule Info */}
            <View className="w-full rounded-xl p-5 mb-6 glass-panel">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
                IF YOU START NOW
              </Text>
              <View className="flex-row justify-between">
                {[
                  { label: "Fast starts", value: format(new Date(), "h:mm a"), color: ACCENT.lime },
                  { label: "Eat window", value: format(addHours(new Date(), fastingHours), "h:mm a"), color: ACCENT.cyan },
                  { label: "Window closes", value: format(addHours(addHours(new Date(), fastingHours), eatingHours), "h:mm a"), color: ACCENT.coral },
                ].map((item) => (
                  <View key={item.label} className="flex-1 items-center">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 4, textAlign: "center" }}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Active Fast Timer */}
            <View className="items-center mb-8">
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
              onPress={phase === "eating" ? () => setShowEndConfirm(true) : handleBreakFast}
              className="w-full py-4 rounded-lg flex-row items-center justify-center mb-8"
              style={{
                backgroundColor: ACCENT.lime,
                shadowColor: ACCENT.lime,
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

            {/* End Session Confirmation */}
            {showEndConfirm && (
              <View className="w-full rounded-xl p-5 mb-6 glass-panel">
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 }}>
                  End Eating Window?
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>
                  You've been eating for {eatingHours * 60 - fastCountdown.totalMinutes} min.
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 20, opacity: 0.7 }}>
                  This will complete your fasting session and your results will be saved.
                </Text>
                <View className="flex-row gap-3">
                  <Pressable onPress={() => setShowEndConfirm(false)} className="flex-1 py-3 rounded-lg items-center" style={{ backgroundColor: c.buttonBg }}>
                    <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Keep Eating</Text>
                  </Pressable>
                  <Pressable onPress={confirmEndSession} className="flex-1 py-3 rounded-lg items-center" style={{ backgroundColor: ACCENT.lime }}>
                    <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>End Eating Window</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Mood Check-in */}
            <View className="w-full rounded-xl p-5 mb-8 glass-panel">
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
                <View className="flex-1 glass-panel rounded-lg px-4 py-3">
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
              <View className="w-full glass-panel p-4 mb-8">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
                  CHECK-IN HISTORY
                </Text>
                <MoodChart checkIns={checkIns} />
                <CheckInTimeline checkIns={checkIns} />
              </View>
            )}

            {/* Insights Mini-Card */}
            <View className="w-full glass-panel p-5 mb-8">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>Peak Fat Burning</Text>
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>Your body is currently utilizing stored fat for energy.</Text>
                </View>
                <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={ACCENT.lime} style={{ opacity: 0.4 }} />
              </View>
              <View className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
                <View className="h-full rounded-full" style={{ width: "78%", backgroundColor: ACCENT.lime }} />
              </View>
            </View>
          </>
        )}

        {/* Previous Fasts + Calendar */}
        <PreviousFasts sessions={pastSessions} fastingHours={fastingHours} onDelete={deleteFast} />
      </ScrollView>
    </SafeAreaView>
  );
}
