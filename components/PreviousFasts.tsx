import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useSessionCheckIns } from "@/hooks/useFastCheckIns";
import { CheckInTimeline } from "@/components/CheckInTimeline";
import { GlassPanel } from "@/components/GlassPanel";
import { MoodChart } from "@/components/MoodChart";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { FastCalendar } from "@/components/FastCalendar";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useAuth } from "@/hooks/useAuth";
import type { FastingSession } from "@/lib/types";

type PreviousFastsProps = {
  sessions: FastingSession[];
  fastingHours: number;
  onDelete: (sessionId: string) => void;
};

const DEFAULT_LIMIT = 5;

export function PreviousFasts({ sessions, fastingHours, onDelete }: PreviousFastsProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FastingSession | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  if (sessions.length === 0) return null;

  const visibleSessions = showAll ? sessions : sessions.slice(0, DEFAULT_LIMIT);
  const hasMore = sessions.length > DEFAULT_LIMIT;

  return (
    <View className="mb-section-gap">
      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg mb-4">
        Previous Fasts
      </Text>

      <WeeklyCalendar
        pastSessions={sessions}
        fastingHours={fastingHours}
        onViewCalendar={() => setShowCalendar(true)}
      />

      {visibleSessions.map((s) => {
        const start = new Date(s.start_time);
        const end = s.end_time ? new Date(s.end_time) : null;
        const durationMin =
          s.fasting_duration_minutes ??
          (end ? Math.floor((end.getTime() - start.getTime()) / 60000) : 0);
        const hrs = Math.floor(durationMin / 60);
        const mins = durationMin % 60;
        const goalMet = durationMin >= fastingHours * 60;
        const isExpanded = expandedId === s.id;

        return (
          <View key={s.id} className="mb-3">
            <GlassPanel as="pressable" onPress={() => setExpandedId(isExpanded ? null : s.id)} className="p-5 flex-row items-center">
              <View
                style={{
                  width: 4,
                  height: 48,
                  borderRadius: 4,
                  marginRight: 12,
                  backgroundColor: goalMet ? accent.lime : accent.coral,
                }}
              />
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">
                    {format(start, "EEE, MMM d")}
                  </Text>
                  {s.fasting_schedule && (
                    <View className="ml-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: accent.cyanBg }}>
                      <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold" }} className="text-[10px]">
                        {s.fasting_schedule}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">
                  {format(start, "h:mm a")} — {end ? format(end, "h:mm a") : "..."}
                </Text>
              </View>
              <View className="items-end mr-3">
                <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
                  {hrs}h {mins}m
                </Text>
                <Text
                  style={{ color: goalMet ? accent.lime : accent.coral, fontFamily: "Inter_400Regular" }}
                  className="text-xs"
                >
                  {goalMet
                    ? "Goal met"
                    : `${Math.round((durationMin / (fastingHours * 60)) * 100)}%`}
                </Text>
              </View>
              <Pressable
                onPress={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Delete fast"
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color={c.textMuted} />
              </Pressable>
            </GlassPanel>

            {isExpanded && <SessionDetail sessionId={s.id} schedule={s.fasting_schedule} />}

            {}
          </View>
        );
      })}

      {hasMore && (
        <Pressable onPress={() => setShowAll(!showAll)} className="mt-2 items-center py-2">
          <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
            {showAll ? "← Show Less" : `Show All ${sessions.length} Fasts →`}
          </Text>
        </Pressable>
      )}

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteTarget !== null} transparent animationType="slide" onRequestClose={() => setDeleteTarget(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setDeleteTarget(null)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 }}>
              Delete this fast?
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 20 }}>
              This record will be permanently removed.
            </Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setDeleteTarget(null)} className="flex-1 py-3.5 items-center" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { if (deleteTarget) { onDelete(deleteTarget.id); setDeleteTarget(null); } }} className="flex-1 py-3.5 items-center" style={{ backgroundColor: ACCENT.rose }}>
                <Text style={{ color: c.textOnDark, fontFamily: "Inter_700Bold" }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <FastCalendar
        visible={showCalendar}
        userId={user?.id ?? null}
        fastingHours={fastingHours}
        onClose={() => setShowCalendar(false)}
      />
    </View>
  );
}

function SessionDetail({ sessionId, schedule }: { sessionId: string; schedule?: string | null }) {
  const { checkIns } = useSessionCheckIns(undefined, sessionId);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  return (
    <GlassPanel className=" p-4 mt-2">
      {schedule && (
        <View className="flex-row items-center mb-3">
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">Schedule:</Text>
          <View className="ml-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: accent.cyanBg }}>
            <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold" }} className="text-xs">{schedule}</Text>
          </View>
        </View>
      )}
      {checkIns.length === 0 ? (
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm text-center py-2">
          No check-ins recorded
        </Text>
      ) : (
        <>
          <MoodChart checkIns={checkIns} />
          <CheckInTimeline checkIns={checkIns} />
        </>
      )}
    </GlassPanel>
  );
}
