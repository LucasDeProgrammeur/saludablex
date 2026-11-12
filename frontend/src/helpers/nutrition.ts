import type { Micros, Nutrition } from "../types";
import { MICROS } from "../data/nutrients";

export function emptyNutrition(): Nutrition {
  return { calories: 0, carbs: 0, fat: 0, protein: 0, micros: {} };
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  return items.reduce<Nutrition>((total, item) => {
    const micros: Micros = { ...total.micros };
    for (const { key } of MICROS) {
      micros[key] = (micros[key] ?? 0) + (item.micros?.[key] ?? 0);
    }
    return {
      calories: total.calories + (item.calories || 0),
      carbs: total.carbs + (item.carbs || 0),
      fat: total.fat + (item.fat || 0),
      protein: total.protein + (item.protein || 0),
      micros,
    };
  }, emptyNutrition());
}

/** Scales all nutrient values, used when the user corrects the portion weight. */
export function scaleNutrition<T extends Nutrition>(item: T, factor: number): T {
  const micros: Micros = {};
  for (const { key } of MICROS) {
    if (item.micros?.[key] !== undefined) micros[key] = round(item.micros[key]! * factor, 2);
  }
  return {
    ...item,
    calories: Math.round(item.calories * factor),
    carbs: round(item.carbs * factor, 1),
    fat: round(item.fat * factor, 1),
    protein: round(item.protein * factor, 1),
    micros,
  };
}

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Compact display: 1234 → "1234", 12.34 → "12.3", 0.456 → "0.46" */
export function formatAmount(value: number): string {
  if (value >= 100) return String(Math.round(value));
  if (value >= 10) return String(round(value, 1));
  return String(round(value, 2));
}
