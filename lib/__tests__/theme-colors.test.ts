import { getThemeColors, ACCENT, MEAL_COLORS } from "../theme-colors";

const EXPECTED_KEYS = [
  "bg",
  "surface",
  "elevated",
  "text",
  "textSecondary",
  "textMuted",
  "textFaint",
  "textOnAccent",
  "textOnDark",
  "cardBg",
  "cardBgAlt",
  "cardBorder",
  "inputBg",
  "inputBorder",
  "buttonBg",
  "divider",
  "tabBarBg",
  "tabBarBorder",
  "tabBarInactive",
  "placeholder",
  "overlay",
];

describe("getThemeColors", () => {
  test("dark theme returns an object with all expected keys", () => {
    const colors = getThemeColors("dark");
    for (const key of EXPECTED_KEYS) {
      expect(colors).toHaveProperty(key);
      expect(colors[key as keyof typeof colors]).toBeTruthy();
    }
  });

  test("light theme returns an object with all expected keys", () => {
    const colors = getThemeColors("light");
    for (const key of EXPECTED_KEYS) {
      expect(colors).toHaveProperty(key);
      expect(colors[key as keyof typeof colors]).toBeTruthy();
    }
  });

  test("dark and light themes return different backgrounds", () => {
    const dark = getThemeColors("dark");
    const light = getThemeColors("light");
    expect(dark.bg).not.toBe(light.bg);
  });

  test("dark and light themes return different text colors", () => {
    const dark = getThemeColors("dark");
    const light = getThemeColors("light");
    expect(dark.text).not.toBe(light.text);
  });

  test("dark background is dark (low hex value)", () => {
    const dark = getThemeColors("dark");
    // #0C0C0E — R=12, G=12, B=14 — all low
    expect(dark.bg.toLowerCase()).toBe("#0c0c0e");
  });

  test("light background is light (high hex value)", () => {
    const light = getThemeColors("light");
    // #F6F4EF — all high
    expect(light.bg.toLowerCase()).toBe("#f6f4ef");
  });

  test("textOnAccent and textOnDark are the same in both themes (constants)", () => {
    const dark = getThemeColors("dark");
    const light = getThemeColors("light");
    expect(dark.textOnAccent).toBe(light.textOnAccent);
    expect(dark.textOnDark).toBe(light.textOnDark);
  });

  test("overlay is a semi-transparent black regardless of theme", () => {
    const dark = getThemeColors("dark");
    const light = getThemeColors("light");
    expect(dark.overlay).toBe("rgba(0,0,0,0.5)");
    expect(light.overlay).toBe("rgba(0,0,0,0.5)");
  });
});

describe("ACCENT palette", () => {
  test("contains all expected accent colors", () => {
    expect(ACCENT).toHaveProperty("mint");
    expect(ACCENT).toHaveProperty("mintLight");
    expect(ACCENT).toHaveProperty("coral");
    expect(ACCENT).toHaveProperty("coralLight");
    expect(ACCENT).toHaveProperty("rose");
    expect(ACCENT).toHaveProperty("sky");
    expect(ACCENT).toHaveProperty("skyLight");
    expect(ACCENT).toHaveProperty("amber");
  });

  test("all accent values are non-empty strings", () => {
    for (const [key, value] of Object.entries(ACCENT)) {
      expect(typeof value).toBe("string");
      expect(value).toBeTruthy();
    }
  });

  test("lime is the signature green (#c3f400)", () => {
    expect(ACCENT.lime.toLowerCase()).toBe("#c3f400");
  });

  test("coral is the signature warm tone (#FF6B52)", () => {
    expect(ACCENT.coral.toLowerCase()).toBe("#ff6b52");
  });
});

describe("MEAL_COLORS", () => {
  test("contains all 5 meal types", () => {
    expect(MEAL_COLORS).toHaveProperty("breakfast");
    expect(MEAL_COLORS).toHaveProperty("lunch");
    expect(MEAL_COLORS).toHaveProperty("dinner");
    expect(MEAL_COLORS).toHaveProperty("snack");
    expect(MEAL_COLORS).toHaveProperty("other");
  });

  test("breakfast, lunch, and dinner reuse accent colors", () => {
    expect(MEAL_COLORS.breakfast).toBe(ACCENT.coral);
    expect(MEAL_COLORS.lunch).toBe(ACCENT.lime);
    expect(MEAL_COLORS.dinner).toBe(ACCENT.sky);
  });
});
