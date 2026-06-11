import React, { useEffect, useState } from "react";
import { Pressable,
  View,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Clock01Icon from "@hugeicons/core-free-icons/dist/esm/Clock01Icon";
import SunriseIcon from "@hugeicons/core-free-icons/dist/esm/SunriseIcon";
import Moon01Icon from "@hugeicons/core-free-icons/dist/esm/Moon01Icon";
import AlarmClockIcon from "@hugeicons/core-free-icons/dist/esm/AlarmClockIcon";
import Timer01Icon from "@hugeicons/core-free-icons/dist/esm/Timer01Icon";
import StopIcon from "@hugeicons/core-free-icons/dist/esm/StopIcon";
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
import { ScheduleSelector } from "@/components/ScheduleSelector";
import { AppHeader } from "@/components/AppHeader";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import { scheduleFastingReminder, cancelAllNotifications } from "@/lib/notifications";
import { format, addHours } from "date-fns";

function useCountdown(endTime: string | null) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0 });

  useEffect(() => {
    if (!endTime) {
      setRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0 });
      return;
    }

    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const totalMinutes = Math.floor(totalSeconds / 60);
      setRemaining({ hours, minutes, seconds, totalSeconds, totalMinutes });
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
    if (!startTime) {
      setTotalMinutes(0);
      return;
    }

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

function useCountdownSeconds(endTime: Date | null, totalDurationSec: number) {
  const [remaining, setRemaining] = useState(totalDurationSec);

  useEffect(() => {
    if (!endTime) {
      setRemaining(totalDurationSec);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - endTime.getTime()) / 1000);
      setRemaining(Math.max(0, totalDurationSec - elapsed));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime, totalDurationSec]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const totalMinutes = Math.floor(remaining / 60);

  return { hours, minutes, seconds, totalMinutes, totalSeconds: remaining };
}

type Phase = "idle" | "fasting" | "eating";

export default function HomeScreen() {
  const { user } = useAuth();
  const {
    session,
    startFast,
    endFast,
    breakFast,
    deleteFast,
    pastSessions,
    streak,
    completedFasts,
  } = useFastingSession(user?.id);
  const { fastingHours, eatingHours, setSessionId, setStartTime, setFastingHours, setEatingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const { checkIns, addCheckIn } = useFastCheckIns(user?.id, session?.id ?? null);
  const { updateFastingSchedule } = useProfile(user?.id ?? null);

  const phase: Phase = !session ? "idle" : (session.status as Phase);

  // Fasting countdown: counts DOWN until eat window opens
  const fastStartStr = phase === "fasting" ? session!.start_time : null;
  const eatWindowEndStr = fastStartStr ? addHours(new Date(fastStartStr), fastingHours).toISOString() : null;
  const fastCountdown = useCountdown(eatWindowEndStr);
  const fastElapsedMinutes = useElapsedMinutes(fastStartStr);

  // Eating timer: counts DOWN from break time
  const breakTimeStr = phase === "eating" ? (session!.end_time ?? session!.start_time) : null;
  const eatingWindowEndStr = breakTimeStr ? addHours(new Date(breakTimeStr), eatingHours).toISOString() : null;
  const eatingCountdown = useCountdown(eatingWindowEndStr);

  // Schedule
  const fastStartDate = session?.start_time ? new Date(session.start_time) : null;
  const eatWindowOpens = fastStartDate ? addHours(fastStartDate, fastingHours) : null;
  const eatWindowCloses = eatWindowOpens ? addHours(eatWindowOpens, eatingHours) : null;

  useEffect(() => {
    if (session) {
      setSessionId(session.id);
      setStartTime(session.start_time);
    } else {
      setSessionId(null);
      setStartTime(null);
    }
  }, [session?.id]);

  const handleStartFast = async () => {
    if (!user) return;
    const schedule = selectedSchedule ?? `${fastingHours}:${eatingHours}`;
    const { data, error } = await startFast(new Date(), schedule);
    if (data && !error) {
      setSessionId(data.id);
      setStartTime(data.start_time);
      await scheduleFastingReminder(
        "Fast Complete!",
        `Your fast is done. Time to eat!`,
        fastingHours * 3600
      );
    }
  };

  const handleBreakFast = async () => {
    if (!session) return;
    const { error } = await breakFast(session.id);
    if (!error) await cancelAllNotifications();
  };

  const confirmEndSession = async () => {
    setShowEndConfirm(false);
    if (!session) return;
    const { error } = await endFast(session.id);
    if (!error) await cancelAllNotifications();
  };

  const fmt = (d: Date) => format(d, "h:mm a · MMM d");

  const headerTitle = phase === "fasting"
    ? "Keep Going!"
    : phase === "eating"
    ? "Eat Window"
    : "FastTrack";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme === "dark" ? "#0F172A" : "#F9FAFB" }}>
      <ScrollView contentContainerClassName="px-6 py-8">
        <AppHeader title={headerTitle} />

        {/* ---- TIMER ---- */}
        <View className="items-center mb-6">
          <FastingTimer
            status={phase}
            totalMinutes={phase === "eating" ? eatingHours * 60 : fastingHours * 60}
            elapsedMinutes={
              phase === "eating"
                ? eatingHours * 60 - eatingCountdown.totalMinutes
                : phase === "fasting"
                ? fastElapsedMinutes
                : 0
            }
            hours={phase === "eating" ? eatingCountdown.hours : phase === "fasting" ? fastCountdown.hours : 0}
            minutes={phase === "eating" ? eatingCountdown.minutes : phase === "fasting" ? fastCountdown.minutes : 0}
            seconds={phase === "eating" ? eatingCountdown.seconds : phase === "fasting" ? fastCountdown.seconds : 0}
            schedule={session?.fasting_schedule}
          />
        </View>

        {/* ---- SCHEDULE + BUTTON (or Confirmation) ---- */}
        {showEndConfirm ? (
          <View className="rounded-2xl p-5 w-full mb-6" style={{ backgroundColor: theme === "dark" ? "#1E293B" : "#FFFFFF", borderWidth: 1, borderColor: c.cardBorder }}>
            <Text style={{ color: c.text }} className="text-xl font-bold mb-2">
              End Eating Window?
            </Text>
            <Text style={{ color: c.textSecondary }} className="text-sm mb-2">
              You&apos;ve been eating for{" "}
              {eatingHours * 60 - eatingCountdown.totalMinutes} min.
            </Text>
            <Text style={{ color: c.textMuted }} className="text-xs mb-5">
              This will complete your fasting session and your results will be
              saved.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowEndConfirm(false)}
                className="flex-1 rounded-xl py-3"
                style={{ backgroundColor: c.buttonBg }}
              >
                <Text style={{ color: c.text }} className="text-center font-semibold">
                  Keep Eating
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmEndSession}
                className="flex-1 bg-emerald-500 rounded-xl py-3"
              >
                <Text className="text-white text-center font-semibold">
                  End Session
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* Start button — only in idle, above schedule selector */}
            {phase === "idle" && (
              <Pressable
                onPress={handleStartFast}
                className="bg-emerald-500 rounded-2xl py-4 w-full flex-row items-center justify-center mb-6"
              >
                <HugeiconsIcon icon={Timer01Icon} size={22} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white text-center font-bold text-lg ml-2">
                  Start {selectedSchedule ?? `${fastingHours}:${eatingHours}`} Fast
                </Text>
              </Pressable>
            )}

            {/* Schedule selector — only in idle */}
            {phase === "idle" && (
              <ScheduleSelector
                selected={selectedSchedule}
                onSelect={(schedule, fasting, eating) => {
                  setSelectedSchedule(schedule);
                  setFastingHours(fasting);
                  setEatingHours(eating);
                  if (fasting > 0 && eating > 0) {
                    updateFastingSchedule(fasting, eating);
                  }
                }}
              />
            )}

            {/* Schedule card */}
            <View className="rounded-2xl p-5 w-full mb-6" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "#FFFFFF", borderWidth: 1, borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
              {phase === "idle" && (
                <>
                  <Text style={{ color: c.textMuted }} className="text-xs font-bold mb-3 tracking-wider">
                    IF YOU START NOW
                  </Text>
                  <ScheduleRow
                    icon={Clock01Icon}
                    dotColor="#10B981"
                    label="Fast will start"
                    value={fmt(new Date())}
                  />
                  <ScheduleRow
                    icon={SunriseIcon}
                    dotColor="#60A5FA"
                    label="Eat window will open"
                    value={fmt(addHours(new Date(), fastingHours))}
                  />
                  <ScheduleRow
                    icon={Moon01Icon}
                    dotColor="#FBBF24"
                    label="Eat window will close"
                    value={fmt(addHours(addHours(new Date(), fastingHours), eatingHours))}
                  />
                </>
              )}

              {phase === "fasting" && fastStartDate && eatWindowOpens && (
                <>
                  <Text style={{ color: "#34D399" }} className="text-xs font-bold mb-3 tracking-wider">
                    YOUR FAST{session?.fasting_schedule ? ` — ${session.fasting_schedule}` : ""}
                  </Text>
                  <ScheduleRow
                    icon={Clock01Icon}
                    dotColor="#10B981"
                    label="Fast started"
                    value={fmt(fastStartDate)}
                  />
                  <ScheduleRow
                    icon={SunriseIcon}
                    dotColor="#60A5FA"
                    label="Eat window will open"
                    value={fmt(eatWindowOpens)}
                  />
                  <ScheduleRow
                    icon={Moon01Icon}
                    dotColor="#FBBF24"
                    label="Eat window will close"
                    value={eatWindowCloses ? fmt(eatWindowCloses) : ""}
                  />
                </>
              )}

              {phase === "eating" && (
                <>
                  <Text style={{ color: "#FBBF24" }} className="text-xs font-bold mb-3 tracking-wider">
                    EATING WINDOW{session?.fasting_schedule ? ` — ${session.fasting_schedule}` : ""}
                  </Text>
                  <ScheduleRow
                    icon={Clock01Icon}
                    dotColor="#10B981"
                    label="Fast started"
                    value={fastStartDate ? fmt(fastStartDate) : ""}
                  />
                  {session?.end_time && (
                    <ScheduleRow
                      icon={AlarmClockIcon}
                      dotColor="#FBBF24"
                      label="You broke your fast at"
                      value={fmt(new Date(session.end_time))}
                    />
                  )}
                  {eatWindowCloses && (
                    <ScheduleRow
                      icon={Moon01Icon}
                      dotColor="#EF4444"
                      label="Eat window closes"
                      value={fmt(eatWindowCloses)}
                    />
                  )}
                </>
              )}
            </View>

            {phase === "fasting" && (
              <Pressable
                onPress={handleBreakFast}
                className="bg-amber-500 rounded-2xl py-4 w-full"
              >
                <Text className="text-white text-center font-bold text-lg">
                  Break Fast
                </Text>
              </Pressable>
            )}

            {phase === "eating" && (
              <Pressable
                onPress={() => setShowEndConfirm(true)}
                className="rounded-2xl py-4 w-full flex-row items-center justify-center"
                style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.inputBorder }}
              >
                <HugeiconsIcon icon={StopIcon} size={20} color={c.text} strokeWidth={1.5} />
                <Text style={{ color: c.text }} className="text-center font-bold text-lg ml-2">
                  End Session
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* ---- CHECK-INS ---- */}
        {(phase === "fasting" || phase === "eating") && (
          <View className="mt-6">
            <CheckInPanel
              phase={phase}
              onSubmit={(mood, note) => addCheckIn(mood, note, phase)}
            />
            {checkIns.length > 0 && (
              <View className="mt-6 mb-6">
                <MoodChart checkIns={checkIns} />
                <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-3 tracking-wider">
                  CHECK-INS
                </Text>
                <CheckInTimeline checkIns={checkIns} />
              </View>
            )}
          </View>
        )}

        {/* ---- PREVIOUS FASTS ---- */}
        <PreviousFasts sessions={pastSessions} fastingHours={fastingHours} onDelete={deleteFast} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ScheduleRow({
  dotColor,
  label,
  value,
  icon,
}: {
  dotColor: string;
  label: string;
  value: string;
  icon?: any;
}) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  return (
    <View className="flex-row items-center mb-3 last:mb-0">
      {icon ? (
        <View style={{ marginRight: 10 }}>
          <HugeiconsIcon icon={icon} size={18} color={dotColor} strokeWidth={1.5} />
        </View>
      ) : (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor,
            marginRight: 12,
          }}
        />
      )}
      <View className="flex-1">
        <Text style={{ color: c.textSecondary }} className="text-xs">{label}</Text>
        <Text style={{ color: c.text }} className="text-sm font-medium">{value}</Text>
      </View>
    </View>
  );
}
