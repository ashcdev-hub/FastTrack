import {
  kgToLbs,
  lbsToKg,
  cmToFeetInches,
  feetInchesToCm,
  mlToFlOz,
  flozToMl,
  displayWeight,
  displayWeightChange,
  displayHeight,
  displayWater,
  displayWaterBottle,
  weightUnitLabel,
  heightUnitLabel,
  waterUnitLabel,
  parseWeightInput,
  parseHeightInput,
  parseWaterInput,
  DEFAULT_UNITS,
} from "../units";

describe("Weight conversions", () => {
  test("kgToLbs converts correctly", () => {
    expect(kgToLbs(10)).toBeCloseTo(22.0462, 2);
    expect(kgToLbs(70)).toBeCloseTo(154.324, 0);
    expect(kgToLbs(0)).toBe(0);
  });

  test("lbsToKg converts correctly", () => {
    expect(lbsToKg(154)).toBeCloseTo(69.85, 0);
    expect(lbsToKg(22.0462)).toBeCloseTo(10, 1);
    expect(lbsToKg(0)).toBe(0);
  });

  test("kgToLbs and lbsToKg are inverses", () => {
    const values = [1, 10, 50, 100, 200];
    for (const kg of values) {
      expect(lbsToKg(kgToLbs(kg))).toBeCloseTo(kg, 2);
    }
  });
});

describe("Height conversions", () => {
  test("cmToFeetInches converts correctly", () => {
    expect(cmToFeetInches(180)).toEqual({ feet: 5, inches: 11 });
    expect(cmToFeetInches(170)).toEqual({ feet: 5, inches: 7 });
    expect(cmToFeetInches(150)).toEqual({ feet: 4, inches: 11 });
  });

  test("feetInchesToCm converts correctly", () => {
    expect(feetInchesToCm(5, 11)).toBeCloseTo(180, 0);
    expect(feetInchesToCm(5, 7)).toBeCloseTo(170, 0);
    expect(feetInchesToCm(6, 0)).toBeCloseTo(182.88, 0);
  });

  test("round-trip conversion is accurate", () => {
    const { feet, inches } = cmToFeetInches(175);
    expect(feetInchesToCm(feet, inches)).toBeCloseTo(175, 0);
  });
});

describe("Water conversions", () => {
  test("mlToFlOz converts correctly", () => {
    expect(mlToFlOz(1000)).toBeCloseTo(33.81, 0);
    expect(mlToFlOz(500)).toBeCloseTo(16.91, 0);
  });

  test("flozToMl converts correctly", () => {
    expect(flozToMl(33.81)).toBeCloseTo(1000, 0);
    expect(flozToMl(16.91)).toBeCloseTo(500, 0);
  });
});

describe("displayWeight", () => {
  test("shows kg by default", () => {
    expect(displayWeight(70.5, DEFAULT_UNITS)).toBe("70.5");
  });

  test("converts to lbs", () => {
    expect(Number(displayWeight(70, { ...DEFAULT_UNITS, weight: "lbs" }))).toBeCloseTo(154.3, 0);
  });

  test("returns dash for null", () => {
    expect(displayWeight(null, DEFAULT_UNITS)).toBe("—");
  });
});

describe("displayHeight", () => {
  test("shows cm by default", () => {
    expect(displayHeight(175, DEFAULT_UNITS)).toBe("175");
  });

  test("converts to ft/in", () => {
    expect(displayHeight(180, { ...DEFAULT_UNITS, height: "ft" })).toBe("5'11\"");
  });

  test("returns dash for null", () => {
    expect(displayHeight(null, DEFAULT_UNITS)).toBe("—");
  });
});

describe("displayWater", () => {
  test("shows ml", () => {
    expect(displayWater(500, DEFAULT_UNITS)).toBe("500ml");
  });

  test("converts to L when >= 1000ml", () => {
    expect(displayWater(1500, DEFAULT_UNITS)).toBe("1.5L");
  });

  test("converts to fl oz", () => {
    expect(displayWater(500, { ...DEFAULT_UNITS, water: "floz" })).toBe("17");
  });
});

describe("displayWaterBottle", () => {
  test("shows ml", () => {
    expect(displayWaterBottle(500, DEFAULT_UNITS)).toBe("500ml");
  });

  test("shows L for 1000ml", () => {
    expect(displayWaterBottle(1000, DEFAULT_UNITS)).toBe("1L");
  });

  test("converts to fl oz", () => {
    expect(displayWaterBottle(500, { ...DEFAULT_UNITS, water: "floz" })).toBe("17oz");
  });
});

describe("unit labels", () => {
  test("weightUnitLabel", () => {
    expect(weightUnitLabel(DEFAULT_UNITS)).toBe("kg");
    expect(weightUnitLabel({ ...DEFAULT_UNITS, weight: "lbs" })).toBe("lbs");
  });

  test("heightUnitLabel", () => {
    expect(heightUnitLabel(DEFAULT_UNITS)).toBe("cm");
    expect(heightUnitLabel({ ...DEFAULT_UNITS, height: "ft" })).toBe("ft/in");
  });

  test("waterUnitLabel", () => {
    expect(waterUnitLabel(DEFAULT_UNITS)).toBe("ml");
    expect(waterUnitLabel({ ...DEFAULT_UNITS, water: "floz" })).toBe("fl oz");
  });
});

describe("parseWeightInput", () => {
  test("parses kg input", () => {
    expect(parseWeightInput("70.5", DEFAULT_UNITS)).toBe(70.5);
  });

  test("converts lbs input to kg", () => {
    expect(parseWeightInput("154", { ...DEFAULT_UNITS, weight: "lbs" })).toBeCloseTo(69.85, 0);
  });

  test("returns null for invalid input", () => {
    expect(parseWeightInput("", DEFAULT_UNITS)).toBeNull();
    expect(parseWeightInput("abc", DEFAULT_UNITS)).toBeNull();
    expect(parseWeightInput("-5", DEFAULT_UNITS)).toBeNull();
    expect(parseWeightInput("0", DEFAULT_UNITS)).toBeNull();
  });
});

describe("parseHeightInput", () => {
  test("parses cm input", () => {
    expect(parseHeightInput("175", DEFAULT_UNITS)).toBe(175);
  });

  test("parses ft/in input", () => {
    expect(parseHeightInput("5'11", { ...DEFAULT_UNITS, height: "ft" })).toBeCloseTo(180, 0);
  });

  test("parses feet only input", () => {
    expect(parseHeightInput("5", { ...DEFAULT_UNITS, height: "ft" })).toBeCloseTo(152.4, 0);
  });
});

describe("parseWaterInput", () => {
  test("parses ml input", () => {
    expect(parseWaterInput("500", DEFAULT_UNITS)).toBe(500);
  });

  test("converts fl oz to ml", () => {
    expect(parseWaterInput("16.91", { ...DEFAULT_UNITS, water: "floz" })).toBeCloseTo(500, 0);
  });

  test("returns null for invalid input", () => {
    expect(parseWaterInput("", DEFAULT_UNITS)).toBeNull();
    expect(parseWaterInput("abc", DEFAULT_UNITS)).toBeNull();
  });
});
