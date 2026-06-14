import { render, act, waitFor } from "@testing-library/react-native";
import React, { useEffect } from "react";
import { useWeeklyFastingStats, WeeklyFastingStats } from "../useWeeklyFastingStats";
import { supabase } from "@/lib/supabase";

type Hook = ReturnType<typeof useWeeklyFastingStats>;

function Harness({
  userId,
  captureRef,
}: {
  userId: string | undefined;
  captureRef: { current: Hook | null };
}) {
  const stats = useWeeklyFastingStats(userId);
  useEffect(() => {
    captureRef.current = stats;
  });
  return null;
}

function mockQueryResult(data: any[] | null, error: any = null) {
  const query: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };
  query.then = jest.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data, error }).then(resolve)
  );
  (supabase.from as jest.Mock).mockReturnValue(query);
  return query;
}

describe("useWeeklyFastingStats", () => {
  let captureRef: { current: Hook | null };

  beforeEach(() => {
    jest.clearAllMocks();
    captureRef = { current: null };
  });

  async function setup(userId: string | undefined) {
    await render(<Harness userId={userId} captureRef={captureRef} />);
  }

  function getStats(): WeeklyFastingStats {
    if (!captureRef.current) throw new Error("Hook not initialised");
    return captureRef.current;
  }

  test("returns zeros when no userId is provided", async () => {
    await setup(undefined);
    // The hook's effect short-circuits when userId is undefined
    // and never calls supabase, so the default zero state should remain
    expect(getStats()).toEqual({
      avgDurationMin: 0,
      longestFastMin: 0,
      totalFasts: 0,
      totalFastingHours: 0,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("returns zeros when supabase returns empty data", async () => {
    mockQueryResult([]);
    await setup("user-1");
    await waitFor(() => {
      // After fetch resolves, stats should still be zeros
      expect(getStats().totalFasts).toBe(0);
    });
    expect(getStats()).toEqual({
      avgDurationMin: 0,
      longestFastMin: 0,
      totalFasts: 0,
      totalFastingHours: 0,
    });
  });

  test("computes stats for a single completed fast", async () => {
    mockQueryResult([{ fasting_duration_minutes: 960 }]); // 16h fast
    await setup("user-1");
    await waitFor(() => expect(getStats().totalFasts).toBe(1));
    expect(getStats()).toEqual({
      avgDurationMin: 960,
      longestFastMin: 960,
      totalFasts: 1,
      totalFastingHours: 16,
    });
  });

  test("computes average, longest, and totals for multiple fasts", async () => {
    mockQueryResult([
      { fasting_duration_minutes: 960 },  // 16h
      { fasting_duration_minutes: 1080 }, // 18h
      { fasting_duration_minutes: 720 },  // 12h
    ]);
    await setup("user-1");
    await waitFor(() => expect(getStats().totalFasts).toBe(3));
    // avg = (960+1080+720)/3 = 920
    // longest = 1080
    // totalHours = (960+1080+720)/60 = 46
    expect(getStats().avgDurationMin).toBe(920);
    expect(getStats().longestFastMin).toBe(1080);
    expect(getStats().totalFasts).toBe(3);
    expect(getStats().totalFastingHours).toBe(46);
  });

  test("filters out null durations", async () => {
    mockQueryResult([
      { fasting_duration_minutes: 960 },
      { fasting_duration_minutes: null }, // ignored
      { fasting_duration_minutes: 480 },
    ]);
    await setup("user-1");
    await waitFor(() => expect(getStats().totalFasts).toBe(2));
    // avg = (960+480)/2 = 720
    // longest = 960
    // totalHours = (960+480)/60 = 24
    expect(getStats().avgDurationMin).toBe(720);
    expect(getStats().longestFastMin).toBe(960);
    expect(getStats().totalFasts).toBe(2);
    expect(getStats().totalFastingHours).toBe(24);
  });

  test("returns zeros when supabase returns an error", async () => {
    mockQueryResult(null, { message: "Network error" });
    await setup("user-1");
    // The hook short-circuits on error and leaves the state as the initial
    // zero values from useState. Wait a tick to let the effect run.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(getStats()).toEqual({
      avgDurationMin: 0,
      longestFastMin: 0,
      totalFasts: 0,
      totalFastingHours: 0,
    });
  });

  test("queries the fasting_sessions table filtered to the user", async () => {
    const query = mockQueryResult([]);
    await setup("user-42");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(supabase.from).toHaveBeenCalledWith("fasting_sessions");
    expect(query.select).toHaveBeenCalledWith("fasting_duration_minutes, status");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-42");
    expect(query.eq).toHaveBeenCalledWith("status", "completed");
  });
});
