import { pb } from "../helpers/pocketbase";
import { formatTime, parsePbDate } from "../helpers/dates";
import { formatAmount } from "../helpers/nutrition";
import { useDeleteEntry } from "../data/queries";
import type { FoodEntry } from "../types";
import "./FoodEntryList.css";

export default function FoodEntryList({ entries }: { entries: FoodEntry[] }) {
  const deleteEntry = useDeleteEntry();

  if (entries.length === 0) {
    return <p className="muted">Nothing logged yet. Tap the camera to add a meal.</p>;
  }

  return (
    <ul className="food-entry-list">
      {entries.map((entry) => (
        <li key={entry.id} className="food-entry">
          {entry.photo ? (
            <img
              className="food-entry-photo"
              src={pb.files.getURL(entry, entry.photo, { thumb: "300x300" })}
              alt=""
              loading="lazy"
            />
          ) : (
            <span className="food-entry-photo is-empty" aria-hidden="true" />
          )}
          <div className="food-entry-text">
            <span className="food-entry-name">{entry.name}</span>
            <span className="food-entry-meta">
              {formatTime(parsePbDate(entry.eaten_at))}
              {entry.portion && ` · ${entry.portion}`}
            </span>
            <span className="food-entry-macros">
              C {formatAmount(entry.carbs)}g · F {formatAmount(entry.fat)}g · P {formatAmount(entry.protein)}g
            </span>
          </div>
          <span className="food-entry-calories">{Math.round(entry.calories)}</span>
          <button
            type="button"
            className="icon"
            aria-label={`Delete ${entry.name}`}
            disabled={deleteEntry.isPending}
            onClick={() => {
              if (confirm(`Delete "${entry.name}"?`)) deleteEntry.mutate(entry.id);
            }}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
