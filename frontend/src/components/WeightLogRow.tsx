import { useState, type KeyboardEvent } from "react";
import { useDeleteWeight, useUpdateWeight } from "../data/queries";
import { dayKey, formatShortDate, parsePbDate } from "../helpers/dates";
import { errorMessage } from "../helpers/pocketbase";
import { parseWeightKg } from "../helpers/weight";
import type { WeightLog } from "../types";
import "./WeightLogRow.css";

/** One row of the weight table; can switch to inline editing of date and weight. */
export default function WeightLogRow({ log }: { log: WeightLog }) {
  const loggedAt = parsePbDate(log.logged_at);
  const updateWeight = useUpdateWeight();
  const deleteWeight = useDeleteWeight();

  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  function startEditing() {
    setDate(dayKey(loggedAt));
    setWeight(String(log.weight_kg));
    setError("");
    setEditing(true);
  }

  async function save() {
    const value = parseWeightKg(weight);
    if (value === null) {
      setError("Enter your weight in kg.");
      return;
    }
    if (!date) {
      setError("Pick a date.");
      return;
    }
    // Keep the original time of day so ordering within a day stays stable
    const [y, m, d] = date.split("-").map(Number);
    const newLoggedAt = new Date(loggedAt);
    newLoggedAt.setFullYear(y, m - 1, d);

    try {
      await updateWeight.mutateAsync({ id: log.id, weightKg: value, loggedAt: newLoggedAt });
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <tr>
        <td>{formatShortDate(loggedAt)}</td>
        <td>{log.weight_kg} kg</td>
        <td>
          <div className="weight-log-actions">
            <button type="button" className="icon" aria-label="Edit weight entry" onClick={startEditing}>
              ✎
            </button>
            <button
              type="button"
              className="icon"
              aria-label="Delete weight entry"
              onClick={() => deleteWeight.mutate(log.id)}
            >
              ✕
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="weight-log-editing" onKeyDown={handleKeyDown}>
      <td>
        <input
          type="date"
          aria-label="Date"
          value={date}
          max={dayKey(new Date())}
          onChange={(e) => setDate(e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          inputMode="decimal"
          aria-label="Weight in kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
      </td>
      <td>
        <div className="weight-log-actions">
          <button type="button" className="icon" aria-label="Save" onClick={save} disabled={updateWeight.isPending}>
            ✓
          </button>
          <button type="button" className="icon" aria-label="Cancel editing" onClick={() => setEditing(false)}>
            ↺
          </button>
        </div>
      </td>
    </tr>
  );
}
