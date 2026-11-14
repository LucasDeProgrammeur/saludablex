import type { AnalyzedItem, FoodDraft } from "../types";

let draftCounter = 0;

/** Unique React key for a draft that isn't saved yet */
export const newDraftKey = () => `draft-${++draftCounter}`;

export function emptyDraft(): FoodDraft {
  return {
    key: newDraftKey(),
    name: "",
    portion: "",
    grams: 100,
    calories: 0,
    carbs: 0,
    fat: 0,
    protein: 0,
    micros: {},
  };
}

export function analyzedToDraft(item: AnalyzedItem): FoodDraft {
  return { ...item, key: newDraftKey() };
}
