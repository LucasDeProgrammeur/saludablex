import { MICROS } from "../data/nutrients";
import { scaleNutrition } from "./nutrition";
import type { FoodDraft, FoodReference, LabelResult, Micros, ReferenceDraft } from "../types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** True when every word of the query appears in the reference's name or brand. */
export function matchesQuery(reference: FoodReference, query: string): boolean {
  const haystack = normalize(`${reference.name} ${reference.brand}`);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function emptyReferenceDraft(): ReferenceDraft {
  return { name: "", brand: "", serving_grams: 0, calories: 0, carbs: 0, fat: 0, protein: 0, micros: {} };
}

/** Label-reading result → editable draft (drops micros that aren't on the label). The name stays empty. */
export function labelToDraft(label: LabelResult): ReferenceDraft {
  const micros: Micros = {};
  for (const { key } of MICROS) {
    const value = label.micros[key];
    if (typeof value === "number") micros[key] = value;
  }
  return {
    name: "",
    brand: label.brand,
    serving_grams: label.serving_grams,
    calories: label.calories,
    carbs: label.carbs,
    fat: label.fat,
    protein: label.protein,
    micros,
  };
}

/** One serving (or 100 g when the label has no serving size) as a food item draft. */
export function referenceToFoodDraft(reference: FoodReference, key: string): FoodDraft {
  const grams = reference.serving_grams || 100;
  const scaled = scaleNutrition(
    {
      calories: reference.calories,
      carbs: reference.carbs,
      fat: reference.fat,
      protein: reference.protein,
      micros: reference.micros ?? {},
    },
    grams / 100,
  );
  return {
    ...scaled,
    key,
    name: reference.brand ? `${reference.name} (${reference.brand})` : reference.name,
    portion: reference.serving_grams ? "1 serving" : "100 g",
    grams,
  };
}
