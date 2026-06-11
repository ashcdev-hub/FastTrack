export type UnitPreferences = {
  weight: "kg" | "lbs";
  height: "cm" | "ft";
  water: "ml" | "floz";
};

export const DEFAULT_UNITS: UnitPreferences = {
  weight: "kg",
  height: "cm",
  water: "ml",
};

// --- Weight: kg ↔ lbs ---

export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

// --- Height: cm ↔ ft/in ---

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

// --- Water: ml ↔ fl oz ---

export function mlToFlOz(ml: number): number {
  return ml * 0.033814;
}

export function flozToMl(floz: number): number {
  return floz / 0.033814;
}

// --- Display helpers ---

export function displayWeight(kg: number | null, prefs: UnitPreferences): string {
  if (kg === null) return "—";
  if (prefs.weight === "lbs") return kgToLbs(kg).toFixed(1);
  return kg.toFixed(1);
}

export function displayWeightChange(kg: number, prefs: UnitPreferences): string {
  if (prefs.weight === "lbs") return kgToLbs(Math.abs(kg)).toFixed(1);
  return Math.abs(kg).toFixed(1);
}

export function displayHeight(cm: number | null, prefs: UnitPreferences): string {
  if (cm === null) return "—";
  if (prefs.height === "ft") {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return cm.toFixed(0);
}

export function displayWater(ml: number, prefs: UnitPreferences): string {
  if (prefs.water === "floz") return mlToFlOz(ml).toFixed(0);
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
}

export function displayWaterBottle(ml: number, prefs: UnitPreferences): string {
  if (prefs.water === "floz") return `${mlToFlOz(ml).toFixed(0)}oz`;
  if (ml >= 1000) return `${ml / 1000}L`;
  return `${ml}ml`;
}

// --- Unit labels ---

export function weightUnitLabel(prefs: UnitPreferences): string {
  return prefs.weight === "lbs" ? "lbs" : "kg";
}

export function heightUnitLabel(prefs: UnitPreferences): string {
  return prefs.height === "ft" ? "ft/in" : "cm";
}

export function waterUnitLabel(prefs: UnitPreferences): string {
  return prefs.water === "floz" ? "fl oz" : "ml";
}

// --- Parse user input back to stored unit (kg/cm/ml) ---

export function parseWeightInput(input: string, prefs: UnitPreferences): number | null {
  const val = parseFloat(input);
  if (isNaN(val) || val <= 0) return null;
  return prefs.weight === "lbs" ? lbsToKg(val) : val;
}

export function parseHeightInput(input: string, prefs: UnitPreferences): number | null {
  if (prefs.height === "ft") {
    const match = input.match(/^(\d+)[''](\d+)?$/);
    if (!match) {
      const val = parseFloat(input);
      if (isNaN(val) || val <= 0) return null;
      return feetInchesToCm(val, 0);
    }
    const feet = parseInt(match[1]);
    const inches = match[2] ? parseInt(match[2]) : 0;
    return feetInchesToCm(feet, inches);
  }
  const val = parseFloat(input);
  if (isNaN(val) || val <= 0) return null;
  return val;
}

export function parseWaterInput(input: string, prefs: UnitPreferences): number | null {
  const val = parseFloat(input);
  if (isNaN(val) || val <= 0) return null;
  return prefs.water === "floz" ? flozToMl(val) : val;
}
