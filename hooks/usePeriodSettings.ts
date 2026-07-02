import { useProfile } from "@/hooks/useProfile";
import type { PeriodSettings } from "@/lib/types";

const DEFAULT_PERIOD_SETTINGS: PeriodSettings = {
  cycle_length: 28,
  period_duration: 5,
  luteal_phase_length: 14,
};

export function usePeriodSettings(userId: string | undefined) {
  const { profile, updateProfile } = useProfile(userId ?? null);

  const periodSettingsRaw = (profile as any)?.period_settings;
  const settings: PeriodSettings = periodSettingsRaw
    ? {
        cycle_length: periodSettingsRaw.cycle_length ?? DEFAULT_PERIOD_SETTINGS.cycle_length,
        period_duration: periodSettingsRaw.period_duration ?? DEFAULT_PERIOD_SETTINGS.period_duration,
        luteal_phase_length: periodSettingsRaw.luteal_phase_length ?? DEFAULT_PERIOD_SETTINGS.luteal_phase_length,
      }
    : DEFAULT_PERIOD_SETTINGS;

  const updateSettings = async (partial: Partial<PeriodSettings>) => {
    const merged = { ...settings, ...partial };
    await updateProfile({ period_settings: merged } as any);
  };

  return { settings, updateSettings };
}
