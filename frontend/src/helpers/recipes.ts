import { newDraftKey } from "./drafts";
import { normalize } from "./references";
import type { FoodDraft, RecipeWithItems } from "../types";

/** True when every word of the query appears in the recipe's name or one of its items. */
export function matchesRecipeQuery(recipe: RecipeWithItems, query: string): boolean {
  const haystack = normalize([recipe.name, ...recipe.items.map((i) => i.name)].join(" "));
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Copies the recipe's items into fresh drafts, ready to be edited and logged. */
export function recipeToFoodDrafts(recipe: RecipeWithItems): FoodDraft[] {
  return recipe.items.map((item) => ({
    key: newDraftKey(),
    name: item.name,
    portion: item.portion,
    grams: item.grams,
    calories: item.calories,
    carbs: item.carbs,
    fat: item.fat,
    protein: item.protein,
    micros: item.micros ?? {},
  }));
}
