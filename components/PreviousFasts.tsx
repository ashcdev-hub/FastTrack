import React, { useState } from "react";
import { Pressable, View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Delete02Icon from "@hugeicons/core-free-icons/dist/esm/Delete02Icon";
import { format } from "date-fns";
import { useSessionCheckIns } from "@/hooks/useFastCheckIns";
import { CheckInTimeline } from "@/components/CheckInTimeline";
import { MoodChart } from "@/components/MoodChart";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { FastingSession } from "@/lib/types";

type PreviousFastsProps = {
  sessions: FastingSession[];
  fastingHours: number;
  onDelete: (sessionId: string) => void;
};

export function PreviousFasts({ sessions, fastingHours, onDelete }: PreviousFastsProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FastingSession | null>(null);

  if (sessions.length === 0) return null;

  return (
    <View className="mb-6">
      <Text style={{ color: c.text }} className="text-lg font-bold mb-4">
        Previous Fasts
      </Text>
      {sessions.slice(0, 10).map((s) => {
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
            <Pressable
              onPress={() => setExpandedId(isExpanded ? null : s.id)}
              className="rounded-xl p-4 flex-row items-center"
              style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}
            >
              <View
                style={{
                  width: 4,
                  height: 48,
                  borderRadius: 4,
                  marginRight: 12,
                  backgroundColor: goalMet ? "#10B981" : "#F59E0B",
                }}
              />
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text style={{ color: c.text }} className="font-medium text-sm">
                    {format(start, "EEE, MMM d")}
                  </Text>
                  {s.fasting_schedule && (
                    <View className="ml-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: "rgba(59,130,246,0.2)" }}>
                      <Text style={{ color: "#60A5FA" }} className="text-[10px] font-bold">
                        {s.fasting_schedule}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: c.textMuted }} className="text-xs">
                  {format(start, "h:mm a")} — {end ? format(end, "h:mm a") : "..."}
                </Text>
              </View>
              <View className="items-end mr-3">
                <Text style={{ color: c.text }} className="font-semibold text-sm">
                  {hrs}h {mins}m
                </Text>
                <Text
                  style={{ color: goalMet ? "#34D399" : "#FBBF24" }}
                  className="text-xs"
                >
                  {goalMet
                    ? "Goal met"
                    : `${Math.round((durationMin / (fastingHours * 60)) * 100)}%`}
                </Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(s);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 8 }}
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={20}
                  color={c.textMuted}
                  strokeWidth={1.5}
                />
              </Pressable>
            </Pressable>

            {isExpanded && <SessionDetail sessionId={s.id} schedule={s.fasting_schedule} />}

            {deleteTarget?.id === s.id && (
              <View className="rounded-xl p-4 mt-2" style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }}>
                <Text style={{ color: c.text }} className="font-bold mb-1">
                  Delete this fast?
                </Text>
                <Text style={{ color: c.textSecondary }} className="text-sm mb-3">
                  This record will be permanently removed.
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setDeleteTarget(null)}
                    className="flex-1 rounded-xl py-3"
                    style={{ backgroundColor: c.buttonBg }}
                  >
                    <Text style={{ color: c.text }} className="text-center font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      onDelete(deleteTarget.id);
                      setDeleteTarget(null);
                    }}
                    className="flex-1 rounded-xl py-3"
                    style={{ backgroundColor: "#EF4444" }}
                  >
                    <Text style={{ color: "#FFFFFF" }} className="text-center font-semibold">Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function SessionDetail({ sessionId, schedule }: { sessionId: string; schedule?: string | null }) {
  const { checkIns } = useSessionCheckIns(undefined, sessionId);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <View
      className="rounded-xl p-4 mt-2"
      style={{ backgroundColor: c.cardBgAlt, borderWidth: 1, borderColor: c.cardBorder }}
    >
      {schedule && (
        <View className="flex-row items-center mb-3">
          <Text style={{ color: c.textMuted }} className="text-xs">Schedule:</Text>
          <View className="ml-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: "rgba(59,130,246,0.2)" }}>
            <Text style={{ color: "#60A5FA" }} className="text-xs font-bold">{schedule}</Text>
          </View>
        </View>
      )}
      {checkIns.length === 0 ? (
        <Text style={{ color: c.textMuted }} className="text-sm text-center py-2">
          No check-ins recorded
        </Text>
      ) : (
        <>
          <MoodChart checkIns={checkIns} />
          <CheckInTimeline checkIns={checkIns} />
        </>
      )}
    </View>
  );
}
