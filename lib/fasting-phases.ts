export type FastingPhaseInfo = {
  label: string;
  description: string;
  progressPct: number;
  phaseIndex: number;
  phaseCount: number;
};

const PHASES = [
  { maxHours: 4, label: "GLUCOSE BURNING", description: "Your body is using readily available glucose for energy." },
  { maxHours: 8, label: "GLYCOGEN DEPLETION", description: "Stored glycogen is being broken down to maintain blood sugar." },
  { maxHours: 12, label: "KETOSIS STARTING", description: "Your body is transitioning to fat-burning mode." },
  { maxHours: 16, label: "KETOSIS ACTIVE", description: "Ketone levels are rising. Fat is now the primary fuel source." },
  { maxHours: 24, label: "AUTOPHAGY ACTIVE", description: "Cellular repair and recycling is underway." },
  { maxHours: 36, label: "DEEP AUTOPHAGY", description: "Enhanced cellular cleanup. Maximum metabolic flexibility." },
  { maxHours: 48, label: "KETONES PEAK", description: "Ketone levels at their peak. Mental clarity and focus are elevated." },
  { maxHours: 72, label: "IMMUNE REGENERATION", description: "Stem cell activation and immune cell regeneration in progress." },
];

const PHASE_COUNT = PHASES.length + 1;

export function getFastingPhase(elapsedMinutes: number): FastingPhaseInfo {
  const hours = elapsedMinutes / 60;

  for (let i = 0; i < PHASES.length; i++) {
    const phase = PHASES[i];
    if (hours < phase.maxHours) {
      const prevMax = i === 0 ? 0 : PHASES[i - 1].maxHours;
      const windowHours = phase.maxHours - prevMax;
      const progressPct = ((hours - prevMax) / windowHours) * 100;
      return {
        label: phase.label,
        description: phase.description,
        progressPct: Math.min(progressPct, 100),
        phaseIndex: i,
        phaseCount: PHASE_COUNT,
      };
    }
  }

  return {
    label: "MAXIMUM REPAIR",
    description: "Peak autophagic activity. Deep cellular renewal and regeneration.",
    progressPct: Math.min(((hours - 72) / 48) * 100, 100),
    phaseIndex: PHASES.length,
    phaseCount: PHASE_COUNT,
  };
}

export function getEatingPhase(elapsedEatingMinutes: number, totalEatingMinutes: number): FastingPhaseInfo {
  const pct = totalEatingMinutes > 0 ? (elapsedEatingMinutes / totalEatingMinutes) * 100 : 0;
  return {
    label: "NUTRIENT ABSORPTION",
    description: "Your body is processing nutrients and distributing them for repair and energy.",
    progressPct: Math.min(pct, 100),
    phaseIndex: 0,
    phaseCount: 1,
  };
}
