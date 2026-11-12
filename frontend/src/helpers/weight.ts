/** Parses a user-typed weight ("72,5" or "72.5"); returns null when it isn't a positive number. */
export function parseWeightKg(input: string): number | null {
  const value = Number(input.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}
