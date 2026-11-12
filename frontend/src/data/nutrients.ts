import type { Gender, Goals, MacroKey, MicroKey } from "../types";

/** Used when the user has not set their own goals yet (Settings page). */
export const DEFAULT_GOALS: Goals = {
  calories: 2500,
  carbs: 310,
  fat: 85,
  protein: 125,
};

export const MACROS: { key: MacroKey; label: string; unit: string }[] = [
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fats", unit: "g" },
  { key: "protein", label: "Protein", unit: "g" },
];

/**
 * Micronutrients tracked per entry. `daily` is an adult reference intake
 * (EU NRV / US DV), used when no gender is set (or male); `dailyFemale` is the
 * US RDA / AI for women aged 19–50. For sodium both are an upper limit, not a target.
 * Keys must match the schema in pocketbase/pb_hooks/claude.js.
 */
export const MICROS: {
  key: MicroKey;
  label: string;
  unit: string;
  daily: number;
  dailyFemale: number;
  isLimit?: boolean;
}[] = [
  { key: "vitamin_a_ug", label: "Vitamin A", unit: "µg", daily: 800, dailyFemale: 700 },
  { key: "vitamin_c_mg", label: "Vitamin C", unit: "mg", daily: 80, dailyFemale: 75 },
  { key: "vitamin_d_ug", label: "Vitamin D", unit: "µg", daily: 15, dailyFemale: 15 },
  { key: "vitamin_b6_mg", label: "Vitamin B6", unit: "mg", daily: 1.4, dailyFemale: 1.3 },
  { key: "vitamin_b9_ug", label: "Folate (B9)", unit: "µg", daily: 400, dailyFemale: 400 },
  { key: "vitamin_b12_ug", label: "Vitamin B12", unit: "µg", daily: 2.5, dailyFemale: 2.4 },
  { key: "calcium_mg", label: "Calcium", unit: "mg", daily: 1000, dailyFemale: 1000 },
  { key: "iron_mg", label: "Iron", unit: "mg", daily: 11, dailyFemale: 16 },
  { key: "potassium_mg", label: "Potassium", unit: "mg", daily: 3500, dailyFemale: 2600 },
  { key: "sodium_mg", label: "Sodium", unit: "mg", daily: 2300, dailyFemale: 2300, isLimit: true },
  { key: "fiber_g", label: "Fiber", unit: "g", daily: 30, dailyFemale: 25 },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "", label: "Prefer not to say" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

/** Daily micronutrient goal for the user's gender (default values when not set). */
export function microGoal(micro: (typeof MICROS)[number], gender: Gender | undefined): number {
  return gender === "female" ? micro.dailyFemale : micro.daily;
}
