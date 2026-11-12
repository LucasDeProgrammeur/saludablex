import type { FoodReference } from "../types";
import "./ReferenceChips.css";

interface ReferenceChipsProps {
  references: FoodReference[];
  onRemove: (reference: FoodReference) => void;
  disabled?: boolean;
}

/** The references picked for a meal, each removable. */
export default function ReferenceChips({ references, onRemove, disabled }: ReferenceChipsProps) {
  if (references.length === 0) return null;

  return (
    <ul className="reference-chips" aria-label="Selected references">
      {references.map((reference) => (
        <li key={reference.id} className="reference-chip">
          <span>{reference.name}</span>
          <button
            type="button"
            className="icon"
            aria-label={`Remove ${reference.name}`}
            disabled={disabled}
            onClick={() => onRemove(reference)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
