import { render, act, waitFor } from "@testing-library/react-native";
import React, { useEffect } from "react";
import { useWeeklyWaterStats, WeeklyWaterStats } from "../useWeeklyWaterStats";
import { supabase } from "@/lib/supabase";

type Hook = ReturnType<typeof useWeeklyWaterStats>;

function Harness({
  userId,
  goalMl,
  captureRef,
}: {
  userId: string | undefined;
  goalMl: number;
  captureRef: { current: Hook | null };
}) {
  const stats = useWeeklyWaterStats(userId, goalMl);
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

function isoDaysAgo(days: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

describe("useWeeklyWaterStats", () => {
  let captureRef: { current: Hook | null };

  beforeEach(() => {
    jest.clearAllMocks();
    captureRef = { current: null };
  });

  async function setup(userId: string | undefined, goalMl = 2000) {
    await render(
      <Harness userId={userId} goalMl={goalMl} captureRef={captureRef} />
    );
  }

  function getStats(): WeeklyWaterStats {
    if (!captureRef.current) throw new Error("Hook not initialised");
    return captureRef.current;
  }

  test("returns zeros when no userId is provided", async () => {
    await setup(undefined);
    expect(getStats()).toEqual({
      dailyAverageMl: 0,
      goalHitDays: 0,
      totalDays: 0,
      goalHitRate: 0,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("returns zeros when supabase returns empty data", async () => {
    mockQueryResult([]);
    await setup("user-1");
    await waitFor(() => {
      // After fetch resolves, totalDays should be 0
      expect(getStats().totalDays).toBe(0);
    });
    expect(getStats()).toEqual({
      dailyAverageMl: 0,
      goalHitDays: 0,
      totalDays: 0,
      goalHitRate: 0,
    });
  });

  test("groups multiple entries on the same day", async () => {
    mockQueryResult([
      { amount_ml: 500, logged_at: isoDaysAgo(0, 9) },
      { amount_ml: 750, logged_at: isoDaysAgo(0, 14) },
      { amount_ml: 250, logged_at: isoDaysAgo(0, 20) },
    ]);
    await setup("user-1", 2000);
    await waitFor(() => expect(getStats().totalDays).toBe(1));
    // All three entries on the same day sum to 1500ml (under 2000ml goal)
    expect(getStats().dailyAverageMl).toBe(1500);
    expect(getStats().totalDays).toBe(1);
    expect(getStats().goalHitDays).toBe(0);
    expect(getStats().goalHitRate).toBe(0);
  });

  test("counts distinct days and computes goal-hit rate", async () => {
    mockQueryResult([
      { amount_ml: 2000, logged_at: isoDaysAgo(0, 9) },  // hit
      { amount_ml: 1500, logged_at: isoDaysAgo(1, 9) },  // miss
      { amount_ml: 2500, logged_at: isoDaysAgo(2, 9) },  // hit
      { amount_ml: 1000, logged_at: isoDaysAgo(3, 9) },  // miss
    ]);
    await setup("user-1", 2000);
    await waitFor(() => expect(getStats().totalDays).toBe(4));
    // 4 days, 2 hit goal => 50% rate
    expect(getStats().totalDays).toBe(4);
    expect(getStats().goalHitDays).toBe(2);
    expect(getStats().goalHitRate).toBe(50);
    // avg = (2000+1500+2500+1000)/4 = 1750
    expect(getStats().dailyAverageMl).toBe(1750);
  });

  test("returns zeros when supabase returns an error", async () => {
    mockQueryResult(null, { message: "Network error" });
    await setup("user-1");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(getStats()).toEqual({
      dailyAverageMl: 0,
      goalHitDays: 0,
      totalDays: 0,
      goalHitRate: 0,
    });
  });

  test("queries the water_log table filtered to the user", async () => {
    const query = mockQueryResult([]);
    await setup("user-42");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(supabase.from).toHaveBeenCalledWith("water_log");
    expect(query.select).toHaveBeenCalledWith("amount_ml, logged_at");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-42");
  });

  test("recomputes when goal changes", async () => {
    mockQueryResult([
      { amount_ml: 1500, logged_at: isoDaysAgo(0, 9) },
      { amount_ml: 1500, logged_at: isoDaysAgo(1, 9) },
    ]);
    await setup("user-1", 2000);
    await waitFor(() => expect(getStats().totalDays).toBe(2));
    expect(getStats().goalHitDays).toBe(0); // neither day hit 2000

    // Lower the goal to 1000ml — both days should now hit it
    await act(async () => {
      captureRef.current = null;
      await render(
        <Harness userId="user-1" goalMl={1000} captureRef={captureRef} />
      );
    });
    await waitFor(() => expect(getStats().goalHitDays).toBe(2));
    expect(getStats().goalHitRate).toBe(100);
  });
});
