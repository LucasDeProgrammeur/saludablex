import type { RecordModel } from "pocketbase";

export type MacroKey = "carbs" | "fat" | "protein";

export type MicroKey =
  | "vitamin_a_ug"
  | "vitamin_c_mg"
  | "vitamin_d_ug"
  | "vitamin_b6_mg"
  | "vitamin_b9_ug"
  | "vitamin_b12_ug"
  | "calcium_mg"
  | "iron_mg"
  | "potassium_mg"
  | "sodium_mg"
  | "fiber_g";

export type Micros = Partial<Record<MicroKey, number>>;

export interface Nutrition {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  micros: Micros;
}

/** Empty string when the user didn't fill it in */
export type Gender = "" | "male" | "female";

export interface User extends RecordModel {
  email: string;
  name: string;
  calorie_goal: number;
  carbs_goal: number;
  fat_goal: number;
  protein_goal: number;
  gender: Gender;
}

export interface FoodEntry extends RecordModel, Nutrition {
  user: string;
  name: string;
  portion: string;
  grams: number;
  eaten_at: string;
  photo: string;
}

export interface WeightLog extends RecordModel {
  user: string;
  weight_kg: number;
  logged_at: string;
}

/** One food item as returned by /api/saludablex/analyze */
export interface AnalyzedItem extends Nutrition {
  name: string;
  portion: string;
  grams: number;
  confidence: "low" | "medium" | "high";
}

export interface AnalyzeResult {
  recognized: boolean;
  items: AnalyzedItem[];
  notes: string;
}

/** Editable draft of an item before it is saved as a FoodEntry */
export interface FoodDraft extends Nutrition {
  key: string;
  name: string;
  portion: string;
  grams: number;
  confidence?: AnalyzedItem["confidence"];
}

export interface Goals {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
}

/** Nutrition facts from a package label, all values per 100 g (or 100 ml) */
export interface FoodReference extends RecordModel, Nutrition {
  user: string;
  name: string;
  brand: string;
  /** Serving size on the package in grams, 0 when unknown */
  serving_grams: number;
  photo: string;
}

/** Editable reference before it is saved */
export interface ReferenceDraft extends Nutrition {
  name: string;
  brand: string;
  serving_grams: number;
}

/** As returned by /api/saludablex/read-label; micros are null when not on the label. The name is typed by the user. */
export interface LabelResult extends Omit<ReferenceDraft, "micros" | "name"> {
  recognized: boolean;
  micros: Partial<Record<MicroKey, number | null>>;
}

/** A frequently eaten meal that can be logged in one go */
export interface Recipe extends RecordModel {
  user: string;
  name: string;
  photo: string;
}

/** One food item of a recipe, stored in recipe_food_items */
export interface RecipeFoodItem extends RecordModel, Nutrition {
  recipe: string;
  sort: number;
  name: string;
  portion: string;
  grams: number;
}

/** A recipe with its food items (ordered by `sort`) */
export interface RecipeWithItems extends Recipe {
  items: RecipeFoodItem[];
}
