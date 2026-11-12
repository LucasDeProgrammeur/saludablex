import PocketBase from "pocketbase";
import type { Goals, User } from "../types";
import { DEFAULT_GOALS } from "../data/nutrients";

export const pb = new PocketBase(import.meta.env.VITE_PB_URL ?? "http://127.0.0.1:8092");

export function currentUser(): User | null {
  return (pb.authStore.record as User | null) ?? null;
}

export function goalsFor(user: User | null): Goals {
  return {
    calories: user?.calorie_goal || DEFAULT_GOALS.calories,
    carbs: user?.carbs_goal || DEFAULT_GOALS.carbs,
    fat: user?.fat_goal || DEFAULT_GOALS.fat,
    protein: user?.protein_goal || DEFAULT_GOALS.protein,
  };
}

/** Turns a PocketBase ClientResponseError into a readable message. */
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { message?: string; data?: Record<string, { message?: string }> } })
      .response;
    const fieldError = response?.data && Object.values(response.data)[0]?.message;
    if (fieldError) return fieldError;
    if (response?.message) return response.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
