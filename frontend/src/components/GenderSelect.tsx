import { GENDER_OPTIONS } from "../data/nutrients";
import type { Gender } from "../types";

interface GenderSelectProps {
  value: Gender;
  onChange: (gender: Gender) => void;
}

/** Optional gender; "female" switches the micronutrient goals to the values for women. */
export default function GenderSelect({ value, onChange }: GenderSelectProps) {
  return (
    <label>
      Gender (optional, uses male (highest values) by default)
      <select value={value} onChange={(e) => onChange(e.target.value as Gender)}>
        {GENDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
