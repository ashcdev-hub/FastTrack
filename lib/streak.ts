import type { FastingSession } from "../types";

/**
 * Calculate the current fasting streak from completed sessions.
 * Streak = consecutive days (from today backwards) with at least one completed fast.
 * Deduplicates by day, preferring "completed" status.
 */
export function calculateStreak(sessions: FastingSession[]): number {
  if (sessions.length === 0) return 0;

  // Deduplicate: keep only one session per day, preferring "completed" status
  const byDay = new Map<string, FastingSession>();
  for (const s of sessions) {
    if (!s.end_time) continue;
    const d = new Date(s.end_time);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = byDay.get(key);
    if (!existing || (s.status === "completed" && existing.status !== "completed")) {
      byDay.set(key, s);
    }
  }

  const uniqueDays = [...byDay.values()].sort(
    (a, b) => new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime()
  );

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const sessionDate = new Date(uniqueDays[i].end_time!);
    sessionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else if (sessionDate.getTime() < expectedDate.getTime()) {
      break;
    }
  }

  return currentStreak;
}
