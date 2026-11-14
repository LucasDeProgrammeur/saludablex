import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import "./SearchPicker.css";

interface SearchPickerProps<T extends { id: string }> {
  label: string;
  placeholder: string;
  items: T[];
  matches: (item: T, query: string) => boolean;
  renderOption: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  /** Shown instead of options when nothing matches (also when there are no items at all) */
  renderEmpty: (state: { loading: boolean; hasItems: boolean }) => ReactNode;
  loading?: boolean;
  /** Items that are already picked and should not be offered again */
  excludeIds?: string[];
  disabled?: boolean;
}

const MAX_RESULTS = 8;

/** Search box with a keyboard-navigable suggestion list (combobox). */
export default function SearchPicker<T extends { id: string }>({
  label,
  placeholder,
  items,
  matches,
  renderOption,
  onSelect,
  renderEmpty,
  loading = false,
  excludeIds = [],
  disabled,
}: SearchPickerProps<T>) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(
    () => items.filter((item) => !excludeIds.includes(item.id) && matches(item, query)).slice(0, MAX_RESULTS),
    [items, excludeIds, matches, query],
  );
  const showList = open && !disabled;

  function pick(item: T) {
    onSelect(item);
    setQuery("");
    setActive(0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
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
    <div className="search-picker">
      <label>
        {label}
        <input
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${results[active].id}` : undefined}
          placeholder={placeholder}
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
        <ul className="search-picker-list" id={listId} role="listbox">
          {results.map((item, index) => (
            <li
              key={item.id}
              id={`${listId}-${item.id}`}
              role="option"
              aria-selected={index === active}
              className={`search-picker-option${index === active ? " is-active" : ""}`}
              // mousedown instead of click so the input doesn't blur (and close the list) first
              onMouseDown={(e) => {
                e.preventDefault();
                pick(item);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {renderOption(item)}
            </li>
          ))}
          {results.length === 0 && (
            <li className="search-picker-empty muted">{renderEmpty({ loading, hasItems: items.length > 0 })}</li>
          )}
        </ul>
      )}
    </div>
  );
}
