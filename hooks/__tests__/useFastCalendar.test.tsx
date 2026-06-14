import { render, act, waitFor } from "@testing-library/react-native";
import React, { useEffect } from "react";
import { useFastCalendar } from "../useFastCalendar";
import { supabase } from "@/lib/supabase";
import type { FastingSession } from "@/lib/types";

type Hook = ReturnType<typeof useFastCalendar>;

function Harness({
  userId,
  year,
  month,
  captureRef,
}: {
  userId: string | null;
  year: number;
  month: number;
  captureRef: { current: Hook | null };
}) {
  const result = useFastCalendar(userId, year, month);
  useEffect(() => {
    captureRef.current = result;
  });
  return null;
}

function mockQueryResult(data: any[] | null, error: any = null) {
  const query: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };
  query.then = jest.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data, error }).then(resolve)
  );
  (supabase.from as jest.Mock).mockReturnValue(query);
  return query;
}

function makeSession(endTime: string, status: "completed" | "broken" | "eating" = "completed"): FastingSession {
  return {
    id: `s-${endTime}`,
    user_id: "user-1",
    start_time: new Date(new Date(endTime).getTime() - 16 * 60 * 60 * 1000).toISOString(),
    end_time: endTime,
    status,
    fasting_duration_minutes: 960,
    fasting_schedule: "16:8",
    created_at: endTime,
  };
}

describe("useFastCalendar", () => {
  let captureRef: { current: Hook | null };

  beforeEach(() => {
    jest.clearAllMocks();
    captureRef = { current: null };
  });

  async function setup(
    userId: string | null,
    year: number,
    month: number
  ) {
    await render(
      <Harness userId={userId} year={year} month={month} captureRef={captureRef} />
    );
  }

  function getResult(): Hook {
    if (!captureRef.current) throw new Error("Hook not initialised");
    return captureRef.current;
  }

  test("returns empty sessions and finishes loading when no userId", async () => {
    await setup(null, 2025, 5);
    await waitFor(() => expect(getResult().loading).toBe(false));
    expect(getResult().sessions).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("returns sessions from supabase", async () => {
    const data = [
      makeSession("2025-06-15T20:00:00.000Z"),
      makeSession("2025-06-10T20:00:00.000Z"),
    ];
    mockQueryResult(data);
    await setup("user-1", 2025, 5); // June 2025
    await waitFor(() => expect(getResult().loading).toBe(false));
    expect(getResult().sessions).toHaveLength(2);
    expect(getResult().sessions[0].end_time).toBe("2025-06-15T20:00:00.000Z");
  });

  test("queries the fasting_sessions table with month boundaries and excludes broken sessions", async () => {
    const query = mockQueryResult([]);
    await setup("user-1", 2025, 5); // June 2025 (month is 0-indexed in Date constructor, but our hook passes it directly)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(supabase.from).toHaveBeenCalledWith("fasting_sessions");
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.neq).toHaveBeenCalledWith("status", "broken");
    // gte called with start of June 2025
    const gteCall = query.gte.mock.calls[0];
    expect(gteCall[0]).toBe("end_time");
    expect(new Date(gteCall[1]).getMonth()).toBe(5); // June
    expect(new Date(gteCall[1]).getDate()).toBe(1);
    // lte called with end of June 2025
    const lteCall = query.lte.mock.calls[0];
    expect(lteCall[0]).toBe("end_time");
    expect(new Date(lteCall[1]).getMonth()).toBe(5);
    // Last day of June
    expect(new Date(lteCall[1]).getDate()).toBe(30);
  });

  test("refetch() triggers another query", async () => {
    const query = mockQueryResult([]);
    await setup("user-1", 2025, 5);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(supabase.from).toHaveBeenCalledTimes(1);
    await act(async () => {
      await getResult().refetch();
    });
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  test("handles supabase error gracefully (logs and sets empty sessions)", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQueryResult(null, { message: "Network error" });
    await setup("user-1", 2025, 5);
    await waitFor(() => expect(getResult().loading).toBe(false));
    expect(getResult().sessions).toEqual([]);
    expect(errSpy).toHaveBeenCalledWith(
      "Error fetching calendar sessions:",
      expect.objectContaining({ message: "Network error" })
    );
    errSpy.mockRestore();
  });
});
