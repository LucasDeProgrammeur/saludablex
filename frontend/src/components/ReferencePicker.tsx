import { Link } from "react-router";
import SearchPicker from "./SearchPicker";
import { useReferences } from "../data/queries";
import { matchesQuery } from "../helpers/references";
import { formatAmount } from "../helpers/nutrition";
import type { FoodReference } from "../types";

interface ReferencePickerProps {
  label: string;
  onSelect: (reference: FoodReference) => void;
  /** References that are already picked and should not be offered again */
  excludeIds?: string[];
  disabled?: boolean;
}

/** Search box that suggests the user's saved references (package labels). */
export default function ReferencePicker({ label, onSelect, excludeIds, disabled }: ReferencePickerProps) {
  const { data: references = [], isPending } = useReferences();

  return (
    <SearchPicker
      label={label}
      placeholder="Search your references…"
      items={references}
      matches={matchesQuery}
      loading={isPending}
      excludeIds={excludeIds}
      disabled={disabled}
      onSelect={onSelect}
      renderOption={(reference) => (
        <>
          <span>
            {reference.name}
            {reference.brand && <span className="muted"> · {reference.brand}</span>}
          </span>
          <span className="search-picker-meta muted">{formatAmount(reference.calories)} kcal/100 g</span>
        </>
      )}
      renderEmpty={({ loading, hasItems }) => (
        <>
          {loading ? "Loading…" : hasItems ? "No references match." : "You have no references yet."}{" "}
          <Link to="/references/add" onMouseDown={(e) => e.preventDefault()}>
            Add a reference
          </Link>
        </>
      )}
    />
  );
}
