import { calculateStreak } from "../streak";
import type { FastingSession } from "../types";

function makeSession(endTime: string, status: "completed" | "eating" = "completed"): FastingSession {
  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36),
    user_id: "test-user",
    start_time: new Date(new Date(endTime).getTime() - 16 * 60 * 60 * 1000).toISOString(),
    end_time: endTime,
    status,
    fasting_duration_minutes: 960,
    fasting_schedule: "16:8",
    created_at: endTime,
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

describe("calculateStreak", () => {
  test("returns 0 for empty sessions", () => {
    expect(calculateStreak([])).toBe(0);
  });

  test("returns 1 for a single fast today", () => {
    const sessions = [makeSession(daysAgo(0))];
    expect(calculateStreak(sessions)).toBe(1);
  });

  test("returns 0 when last fast was yesterday but not today (streak broken)", () => {
    const sessions = [makeSession(daysAgo(1))];
    expect(calculateStreak(sessions)).toBe(0);
  });

  test("returns 3 for 3 consecutive days", () => {
    const sessions = [
      makeSession(daysAgo(0)),
      makeSession(daysAgo(1)),
      makeSession(daysAgo(2)),
    ];
    expect(calculateStreak(sessions)).toBe(3);
  });

  test("returns 5 for 5 consecutive days", () => {
    const sessions = [
      makeSession(daysAgo(0)),
      makeSession(daysAgo(1)),
      makeSession(daysAgo(2)),
      makeSession(daysAgo(3)),
      makeSession(daysAgo(4)),
    ];
    expect(calculateStreak(sessions)).toBe(5);
  });

  test("breaks streak when there is a gap", () => {
    const sessions = [
      makeSession(daysAgo(0)),
      makeSession(daysAgo(1)),
      // gap: no fast on day 2
      makeSession(daysAgo(3)),
      makeSession(daysAgo(4)),
    ];
    expect(calculateStreak(sessions)).toBe(2);
  });

  test("deduplicates sessions on the same day", () => {
    const sessions = [
      makeSession(daysAgo(0)),
      makeSession(daysAgo(0)), // duplicate day
      makeSession(daysAgo(1)),
      makeSession(daysAgo(1)), // duplicate day
    ];
    expect(calculateStreak(sessions)).toBe(2);
  });

  test("prefers completed status when deduplicating", () => {
    const completed = makeSession(daysAgo(0), "completed");
    const eating = makeSession(daysAgo(0), "eating");
    const sessions = [eating, completed];
    expect(calculateStreak(sessions)).toBe(1);
  });

  test("ignores sessions without end_time", () => {
    const sessions: FastingSession[] = [
      { ...makeSession(daysAgo(0)), end_time: null },
    ];
    expect(calculateStreak(sessions)).toBe(0);
  });

  test("ignores future sessions", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    futureDate.setHours(20, 0, 0, 0);
    const sessions = [makeSession(futureDate.toISOString())];
    expect(calculateStreak(sessions)).toBe(0);
  });

  test("handles out-of-order sessions", () => {
    const sessions = [
      makeSession(daysAgo(3)),
      makeSession(daysAgo(1)),
      makeSession(daysAgo(0)),
      makeSession(daysAgo(2)),
    ];
    expect(calculateStreak(sessions)).toBe(4);
  });
});
