import { useMemo } from "react";
import type { PeriodLogEntry, PeriodSettings, CycleInfo } from "@/lib/types";
import { calculateCycleInfo, predictNextPeriods } from "@/lib/cycle-phases";
import { useThemeStore } from "@/lib/theme-store";

export function useCycleTracker(
  entries: PeriodLogEntry[],
  settings: PeriodSettings,
) {
  const { theme } = useThemeStore();

  const cycleInfo = useMemo<CycleInfo>(() => {
    return calculateCycleInfo(entries, settings, new Date(), theme);
  }, [entries, settings, theme]);

  const predictedPeriods = useMemo<string[]>(() => {
    return predictNextPeriods(entries, settings, 2);
  }, [entries, settings]);

  const periodHistory = useMemo(() => {
    const flowDays = entries
      .filter((e) => e.flow_intensity !== null && e.flow_intensity !== "spotting")
      .sort((a, b) => a.log_date.localeCompare(b.log_date));

    const starts: { start: string; end: string; days: PeriodLogEntry[] }[] = [];
    let current: PeriodLogEntry[] = [];
    for (const day of flowDays) {
      if (current.length === 0) {
        current.push(day);
      } else {
        const last = new Date(current[current.length - 1].log_date);
        const next = new Date(day.log_date);
        const gap = Math.round((next.getTime() - last.getTime()) / 86400000);
        if (gap <= 2) {
          current.push(day);
        } else {
          starts.push({
            start: current[0].log_date,
            end: current[current.length - 1].log_date,
            days: current,
          });
          current = [day];
        }
      }
    }
    if (current.length > 0) {
      starts.push({
        start: current[0].log_date,
        end: current[current.length - 1].log_date,
        days: current,
      });
    }
    return starts;
  }, [entries]);

  return { cycleInfo, predictedPeriods, periodHistory };
}
