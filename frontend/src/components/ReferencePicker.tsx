import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { useReferences } from "../data/queries";
import { matchesQuery } from "../helpers/references";
import { formatAmount } from "../helpers/nutrition";
import type { FoodReference } from "../types";
import "./ReferencePicker.css";

interface ReferencePickerProps {
  label: string;
  onSelect: (reference: FoodReference) => void;
  /** References that are already picked and should not be offered again */
  excludeIds?: string[];
  disabled?: boolean;
}

const MAX_RESULTS = 8;

/** Search box that suggests the user's saved references (package labels). */
export default function ReferencePicker({ label, onSelect, excludeIds = [], disabled }: ReferencePickerProps) {
  const listId = useId();
  const { data: references = [], isPending } = useReferences();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(
    () => references.filter((r) => !excludeIds.includes(r.id) && matchesQuery(r, query)).slice(0, MAX_RESULTS),
    [references, excludeIds, query],
  );
  const showList = open && !disabled;

  function pick(reference: FoodReference) {
    onSelect(reference);
    setQuery("");
    setActive(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && showList && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="reference-picker">
      <label>
        {label}
        <input
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${results[active].id}` : undefined}
          placeholder="Search your references…"
          autoComplete="off"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
      </label>

      {showList && (
        <ul className="reference-picker-list" id={listId} role="listbox">
          {results.map((reference, index) => (
            <li
              key={reference.id}
              id={`${listId}-${reference.id}`}
              role="option"
              aria-selected={index === active}
              className={`reference-picker-option${index === active ? " is-active" : ""}`}
              // mousedown instead of click so the input doesn't blur (and close the list) first
              onMouseDown={(e) => {
                e.preventDefault();
                pick(reference);
              }}
              onMouseEnter={() => setActive(index)}
            >
              <span className="reference-picker-name">
                {reference.name}
                {reference.brand && <span className="muted"> · {reference.brand}</span>}
              </span>
              <span className="reference-picker-kcal muted">{formatAmount(reference.calories)} kcal/100 g</span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="reference-picker-empty muted">
              {isPending
                ? "Loading…"
                : references.length === 0
                  ? "You have no references yet."
                  : "No references match."}{" "}
              <Link to="/references/add" onMouseDown={(e) => e.preventDefault()}>
                Add a reference
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
