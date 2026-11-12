import { useState } from "react";
import { MICROS } from "../data/nutrients";
import { scaleNutrition } from "../helpers/nutrition";
import type { FoodDraft } from "../types";
import "./FoodDraftEditor.css";

interface FoodDraftEditorProps {
  draft: FoodDraft;
  onChange: (draft: FoodDraft) => void;
  onRemove: () => void;
}

/** Lets the user correct a recognised (or manual) food item before saving. */
export default function FoodDraftEditor({ draft, onChange, onRemove }: FoodDraftEditorProps) {
  const [showMicros, setShowMicros] = useState(false);

  const num = (value: string) => Math.max(0, Number(value) || 0);

  // Changing the weight rescales every nutrient proportionally.
  function changeGrams(value: string) {
    const grams = num(value);
    if (draft.grams > 0 && grams > 0) {
      onChange({ ...scaleNutrition(draft, grams / draft.grams), grams });
    } else {
      onChange({ ...draft, grams });
    }
  }

  return (
    <fieldset className="food-draft">
      <legend className="visually-hidden">{draft.name || "Food item"}</legend>
      <div className="food-draft-header">
        <input
          className="food-draft-name"
          value={draft.name}
          placeholder="Food name"
          aria-label="Food name"
          required
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
        <button type="button" className="icon" aria-label={`Remove ${draft.name}`} onClick={onRemove}>
          ✕
        </button>
      </div>

      {draft.confidence === "low" && (
        <p className="food-draft-warning">Not sure about this one — please check the values.</p>
      )}

      <div className="food-draft-grid">
        <label>
          Portion
          <input value={draft.portion} onChange={(e) => onChange({ ...draft, portion: e.target.value })} />
        </label>
        <label>
          Weight (g)
          <input type="number" inputMode="decimal" min={0} value={draft.grams} onChange={(e) => changeGrams(e.target.value)} />
        </label>
        <label>
          Calories
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={draft.calories}
            onChange={(e) => onChange({ ...draft, calories: num(e.target.value) })}
          />
        </label>
        <label>
          Carbs (g)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={draft.carbs}
            onChange={(e) => onChange({ ...draft, carbs: num(e.target.value) })}
          />
        </label>
        <label>
          Fat (g)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={draft.fat}
            onChange={(e) => onChange({ ...draft, fat: num(e.target.value) })}
          />
        </label>
        <label>
          Protein (g)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={draft.protein}
            onChange={(e) => onChange({ ...draft, protein: num(e.target.value) })}
          />
        </label>
      </div>

      <button type="button" className="food-draft-toggle secondary" onClick={() => setShowMicros((v) => !v)}>
        {showMicros ? "Hide micronutrients" : "Micronutrients"}
      </button>

      {showMicros && (
        <div className="food-draft-grid">
          {MICROS.map((micro) => (
            <label key={micro.key}>
              {micro.label} ({micro.unit})
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.micros[micro.key] ?? 0}
                onChange={(e) =>
                  onChange({ ...draft, micros: { ...draft.micros, [micro.key]: num(e.target.value) } })
                }
              />
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
