import type { PeriodLogEntry, PeriodSettings, CyclePhase, CycleInfo } from "./types";
import { getAccentColors } from "./theme-colors";

type PhaseDef = {
  phase: CyclePhase;
  label: string;
  description: string;
  fastingSuggestion: string;
  suggestedFastingHours: number;
};

const PHASE_DEFS: Record<CyclePhase, PhaseDef> = {
  menstrual: {
    phase: "menstrual",
    label: "MENSTRUAL",
    description: "Your body is under physical stress from blood loss and hormone lows.",
    fastingSuggestion: "Try a gentler 12-hour fast. Prioritize iron-rich, nutrient-dense foods.",
    suggestedFastingHours: 12,
  },
  follicular: {
    phase: "follicular",
    label: "FOLLICULAR",
    description: "Rising estrogen boosts your metabolism and energy. This is your best window for longer fasts.",
    fastingSuggestion: "Ideal for 16:8 or longer fasts. Your body responds well to caloric restriction now.",
    suggestedFastingHours: 16,
  },
  ovulatory: {
    phase: "ovulatory",
    label: "OVULATORY",
    description: "Peak estrogen and energy levels. Your body is at its metabolic best.",
    fastingSuggestion: "Stick with 16:8. This is a great time for fasted exercise too.",
    suggestedFastingHours: 16,
  },
  luteal: {
    phase: "luteal",
    label: "LUTEAL",
    description: "Progesterone raises your core temperature and increases hunger. Your body needs more energy.",
    fastingSuggestion: "Shorten to a 12-hour fast. Your metabolism is working harder — honor the hunger cues.",
    suggestedFastingHours: 12,
  },
};

export function getPhaseDef(phase: CyclePhase): PhaseDef {
  return PHASE_DEFS[phase];
}

export function getPhaseColor(phase: CyclePhase, theme: "dark" | "light"): string {
  const accent = getAccentColors(theme);
  switch (phase) {
    case "menstrual": return accent.rose;
    case "follicular": return accent.sky;
    case "ovulatory": return accent.cyan;
    case "luteal": return accent.amber;
  }
}

export function getPhaseIcon(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual": return "water";
    case "follicular": return "flower";
    case "ovulatory": return "star";
    case "luteal": return "weather-sunset";
  }
}

export function getPhaseColorBg(phase: CyclePhase, theme: "dark" | "light"): string {
  const accent = getAccentColors(theme);
  switch (phase) {
    case "menstrual": return accent.roseBg;
    case "follicular": return accent.skyBg;
    case "ovulatory": return accent.cyanBg;
    case "luteal": return accent.amberBg;
  }
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDaysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function findPeriodStarts(entries: PeriodLogEntry[]): Date[] {
  const flowDays = entries
    .filter((e) => e.flow_intensity !== null && e.flow_intensity !== "spotting")
    .map((e) => parseDate(e.log_date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (flowDays.length === 0) return [];

  const starts: Date[] = [flowDays[0]];
  for (let i = 1; i < flowDays.length; i++) {
    const gap = getDaysBetween(flowDays[i - 1], flowDays[i]);
    if (gap > 2) {
      starts.push(flowDays[i]);
    }
  }
  return starts;
}

function calculateMedianCycleLength(periodStarts: Date[]): number | null {
  if (periodStarts.length < 2) return null;
  const lengths: number[] = [];
  for (let i = 1; i < periodStarts.length; i++) {
    lengths.push(getDaysBetween(periodStarts[i - 1], periodStarts[i]));
  }
  if (lengths.length === 0) return null;
  const sorted = [...lengths].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateConfidence(periodStarts: Date[]): number {
  if (periodStarts.length < 2) return 0;
  const lengths: number[] = [];
  for (let i = 1; i < periodStarts.length; i++) {
    lengths.push(getDaysBetween(periodStarts[i - 1], periodStarts[i]));
  }
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.abs(l - avg), 0) / lengths.length;
  if (avg === 0) return 0;
  return Math.max(0, Math.min(1, 1 - variance / avg));
}

export function calculateCycleInfo(
  entries: PeriodLogEntry[],
  settings: PeriodSettings,
  today: Date,
  theme: "dark" | "light",
): CycleInfo {
  const periodStarts = findPeriodStarts(entries);
  const autoCycleLength = calculateMedianCycleLength(periodStarts);
  const cycleLength = autoCycleLength ?? settings.cycle_length;
  const lutealLength = settings.luteal_phase_length;
  const periodDuration = settings.period_duration;

  const lastStart = periodStarts.length > 0 ? periodStarts[periodStarts.length - 1] : null;
  const dayOfCycle = lastStart ? Math.max(1, getDaysBetween(lastStart, today) + 1) : 1;

  const nextPeriodDate = lastStart
    ? new Date(lastStart.getTime() + cycleLength * 86400000)
    : new Date(today.getTime() + cycleLength * 86400000);
  const ovulationDate = new Date(nextPeriodDate.getTime() - lutealLength * 86400000);
  const fertileStart = new Date(ovulationDate.getTime() - 5 * 86400000);
  const fertileEnd = new Date(ovulationDate.getTime() + 1 * 86400000);
  const isFertile = today >= fertileStart && today <= fertileEnd;

  let phase: CyclePhase;
  let phaseDay: number;
  let phaseTotalDays: number;

  if (dayOfCycle <= periodDuration) {
    phase = "menstrual";
    phaseDay = dayOfCycle;
    phaseTotalDays = periodDuration;
  } else if (dayOfCycle <= cycleLength - lutealLength - 2) {
    phase = "follicular";
    phaseDay = dayOfCycle - periodDuration;
    phaseTotalDays = (cycleLength - lutealLength - 2) - periodDuration;
  } else if (dayOfCycle <= cycleLength - lutealLength + 2) {
    phase = "ovulatory";
    phaseDay = dayOfCycle - (cycleLength - lutealLength - 2);
    phaseTotalDays = 4;
  } else {
    phase = "luteal";
    phaseDay = dayOfCycle - (cycleLength - lutealLength + 2);
    phaseTotalDays = lutealLength - 2;
  }

  const confidence = calculateConfidence(periodStarts);

  return {
    phase,
    dayOfCycle,
    totalCycleDays: cycleLength,
    phaseDay: Math.max(1, phaseDay),
    phaseTotalDays: Math.max(1, phaseTotalDays),
    nextPeriodDate: toDateStr(nextPeriodDate),
    ovulationDate: toDateStr(ovulationDate),
    fertileStart: toDateStr(fertileStart),
    fertileEnd: toDateStr(fertileEnd),
    isFertile,
    confidence,
  };
}

export function predictNextPeriods(
  entries: PeriodLogEntry[],
  settings: PeriodSettings,
  count: number,
): string[] {
  const periodStarts = findPeriodStarts(entries);
  const autoCycleLength = calculateMedianCycleLength(periodStarts);
  const cycleLength = autoCycleLength ?? settings.cycle_length;

  let base: Date;
  if (periodStarts.length > 0) {
    base = periodStarts[periodStarts.length - 1];
  } else {
    base = new Date();
  }

  const results: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(base.getTime() + i * cycleLength * 86400000);
    results.push(toDateStr(d));
  }
  return results;
}

export function getCycleDayColor(dayOfCycle: number, settings: PeriodSettings): CyclePhase {
  const { period_duration, luteal_phase_length, cycle_length } = settings;
  if (dayOfCycle <= period_duration) return "menstrual";
  if (dayOfCycle <= cycle_length - luteal_phase_length - 2) return "follicular";
  if (dayOfCycle <= cycle_length - luteal_phase_length + 2) return "ovulatory";
  return "luteal";
}

export function getFastingRecommendation(phase: CyclePhase): { suggestedHours: number; label: string; description: string } {
  const def = PHASE_DEFS[phase];
  return {
    suggestedHours: def.suggestedFastingHours,
    label: def.label,
    description: def.fastingSuggestion,
  };
}
