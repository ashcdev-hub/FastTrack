import React, { useEffect, useState } from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
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
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { scheduleFastingReminder, cancelAllNotifications } from "@/lib/notifications";
import { format, addHours } from "date-fns";

function useCountdown(endTime: string | null) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0 });

  useEffect(() => {
    if (!endTime) { setRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0 }); return; }
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

function useCountdownSeconds(endTime: Date | null, totalDurationSec: number) {
  const [remaining, setRemaining] = useState(totalDurationSec);
  useEffect(() => {
    if (!endTime) { setRemaining(totalDurationSec); return; }
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
  const { session, startFast, endFast, breakFast, deleteFast, pastSessions, streak, completedFasts } = useFastingSession(user?.id);
  const { fastingHours, eatingHours, setSessionId, setStartTime, setFastingHours, setEatingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const { checkIns, addCheckIn } = useFastCheckIns(user?.id, session?.id ?? null);
  const { updateFastingSchedule } = useProfile(user?.id ?? null);

  const phase: Phase = !session ? "idle" : (session.status as Phase);

  const fastStartStr = phase === "fasting" ? session!.start_time : null;
  const eatWindowEndStr = fastStartStr ? addHours(new Date(fastStartStr), fastingHours).toISOString() : null;
  const fastCountdown = useCountdown(eatWindowEndStr);
  const fastElapsedMinutes = useElapsedMinutes(fastStartStr);

  const breakTimeStr = phase === "eating" ? (session!.end_time ?? session!.start_time) : null;
  const eatingWindowEndStr = breakTimeStr ? addHours(new Date(breakTimeStr), eatingHours).toISOString() : null;
  const eatingCountdown = useCountdown(eatingWindowEndStr);

  const fastElapsed = useElapsed(fastStartStr);
  const eatingElapsed = useElapsed(breakTimeStr);

  const fastStartDate = session?.start_time ? new Date(session.start_time) : null;
  const eatWindowOpens = fastStartDate ? addHours(fastStartDate, fastingHours) : null;
  const eatWindowCloses = eatWindowOpens ? addHours(eatWindowOpens, eatingHours) : null;

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

  const headerTitle = phase === "fasting" ? "Keep Going!" : phase === "eating" ? "Eat Window" : "FastTrack";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <ScrollView contentContainerClassName="px-6" style={{ paddingTop: 32, paddingBottom: 120 }}>
        <AppHeader title={headerTitle} />

        {/* TIMER */}
        <View className="items-center mb-6">
          <FastingTimer
            status={phase}
            totalMinutes={phase === "eating" ? eatingHours * 60 : fastingHours * 60}
            elapsedMinutes={
              phase === "eating" ? eatingHours * 60 - eatingCountdown.totalMinutes
              : phase === "fasting" ? fastElapsedMinutes : 0
            }
            hours={phase === "eating" ? eatingCountdown.hours : phase === "fasting" ? fastCountdown.hours : 0}
            minutes={phase === "eating" ? eatingCountdown.minutes : phase === "fasting" ? fastCountdown.minutes : 0}
            seconds={phase === "eating" ? eatingCountdown.seconds : phase === "fasting" ? fastCountdown.seconds : 0}
            elapsedHours={phase === "fasting" ? fastElapsed.hours : phase === "eating" ? eatingElapsed.hours : 0}
            elapsedMinutesPart={phase === "fasting" ? fastElapsed.minutes : phase === "eating" ? eatingElapsed.minutes : 0}
            elapsedSeconds={phase === "fasting" ? fastElapsed.seconds : phase === "eating" ? eatingElapsed.seconds : 0}
            schedule={session?.fasting_schedule}
          />
        </View>

        {/* SCHEDULE + BUTTON */}
        {showEndConfirm ? (
          <View className="rounded-2xl p-5 w-full mb-6" style={{ backgroundColor: c.elevated, borderWidth: 1, borderColor: c.cardBorder }}>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mb-2">
              End Eating Window?
            </Text>
            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm mb-2">
              You&apos;ve been eating for {eatingHours * 60 - eatingCountdown.totalMinutes} min.
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-5">
              This will complete your fasting session and your results will be saved.
            </Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowEndConfirm(false)} className="flex-1 rounded-xl py-3" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Keep Eating</Text>
              </Pressable>
              <Pressable onPress={confirmEndSession} className="flex-1 rounded-xl py-3" style={{ backgroundColor: ACCENT.mint }}>
                <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">End Session</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {phase === "idle" && (
              <Pressable
                onPress={handleStartFast}
                className="rounded-2xl py-4 w-full flex-row items-center justify-center mb-6"
                style={{ backgroundColor: ACCENT.mint }}
              >
                <HugeiconsIcon icon={Timer01Icon} size={22} color={c.textOnAccent} strokeWidth={2} />
                <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg ml-2">
                  Start {selectedSchedule ?? `${fastingHours}:${eatingHours}`} Fast
                </Text>
              </Pressable>
            )}

            {phase === "idle" && (
              <ScheduleSelector
                selected={selectedSchedule}
                onSelect={(schedule, fasting, eating) => {
                  setSelectedSchedule(schedule);
                  setFastingHours(fasting);
                  setEatingHours(eating);
                  if (fasting > 0 && eating > 0) updateFastingSchedule(fasting, eating);
                }}
              />
            )}

            {/* Schedule card */}
            <View className="rounded-2xl p-5 w-full mb-6" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
              {phase === "idle" && (
                <>
                  <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-4 tracking-widest">
                    IF YOU START NOW
                  </Text>
                  <View className="flex-row">
                    <ScheduleColumn icon={Clock01Icon} dotColor={ACCENT.mint} label="Fast starts" value={format(new Date(), "h:mm a")} />
                    <ScheduleColumn icon={SunriseIcon} dotColor={ACCENT.sky} label="Eat window" value={format(addHours(new Date(), fastingHours), "h:mm a")} />
                    <ScheduleColumn icon={Moon01Icon} dotColor={ACCENT.coral} label="Window closes" value={format(addHours(addHours(new Date(), fastingHours), eatingHours), "h:mm a")} />
                  </View>
                </>
              )}

              {phase === "fasting" && fastStartDate && eatWindowOpens && (
                <>
                  <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-4 tracking-widest">
                    YOUR FAST{session?.fasting_schedule ? `  ·  ${session.fasting_schedule}` : ""}
                  </Text>
                  <View className="flex-row">
                    <ScheduleColumn icon={Clock01Icon} dotColor={ACCENT.mint} label="Fast started" value={format(fastStartDate, "h:mm a")} />
                    <ScheduleColumn icon={SunriseIcon} dotColor={ACCENT.sky} label="Eat window" value={format(eatWindowOpens, "h:mm a")} />
                    <ScheduleColumn icon={Moon01Icon} dotColor={ACCENT.coral} label="Window closes" value={eatWindowCloses ? format(eatWindowCloses, "h:mm a") : ""} />
                  </View>
                </>
              )}

              {phase === "eating" && (
                <>
                  <Text style={{ color: ACCENT.coral, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-4 tracking-widest">
                    EATING WINDOW{session?.fasting_schedule ? `  ·  ${session.fasting_schedule}` : ""}
                  </Text>
                  <View className="flex-row">
                    <ScheduleColumn icon={Clock01Icon} dotColor={ACCENT.mint} label="Fast started" value={fastStartDate ? format(fastStartDate, "h:mm a") : ""} />
                    {session?.end_time && (
                      <ScheduleColumn icon={AlarmClockIcon} dotColor={ACCENT.coral} label="Broke fast" value={format(new Date(session.end_time), "h:mm a")} />
                    )}
                    {eatWindowCloses && (
                      <ScheduleColumn icon={Moon01Icon} dotColor={ACCENT.rose} label="Window closes" value={format(eatWindowCloses, "h:mm a")} />
                    )}
                  </View>
                </>
              )}
            </View>

            {phase === "fasting" && (
              <Pressable onPress={handleBreakFast} className="rounded-2xl py-4 w-full" style={{ backgroundColor: ACCENT.coral }}>
                <Text style={{ color: c.textOnDark, fontFamily: "PlusJakartaSans_700Bold" }} className="text-center text-lg">
                  Break Fast
                </Text>
              </Pressable>
            )}

            {phase === "eating" && (
              <Pressable
                onPress={() => setShowEndConfirm(true)}
                className="rounded-2xl py-4 w-full flex-row items-center justify-center"
                style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder }}
              >
                <HugeiconsIcon icon={StopIcon} size={20} color={c.textSecondary} strokeWidth={1.5} />
                <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-center text-lg ml-2">
                  End Session
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* CHECK-INS */}
        {(phase === "fasting" || phase === "eating") && (
          <View className="mt-6">
            <CheckInPanel phase={phase} onSubmit={(mood, note) => addCheckIn(mood, note, phase)} />
            {checkIns.length > 0 && (
              <View className="mt-6 mb-6">
                <MoodChart checkIns={checkIns} />
                <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-3 tracking-widest">
                  CHECK-INS
                </Text>
                <CheckInTimeline checkIns={checkIns} />
              </View>
            )}
          </View>
        )}

        {/* PREVIOUS FASTS */}
        <PreviousFasts sessions={pastSessions} fastingHours={fastingHours} onDelete={deleteFast} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ScheduleColumn({ dotColor, label, value, icon }: { dotColor: string; label: string; value: string; icon?: any }) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  return (
    <View className="flex-1 items-center">
      {icon ? (
        <HugeiconsIcon icon={icon} size={18} color={dotColor} strokeWidth={1.5} />
      ) : (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
      )}
      <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs text-center mt-1.5" numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm text-center mt-0.5" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
