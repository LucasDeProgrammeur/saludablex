import { useState, type FormEvent } from "react";
import DailyBarChart, { type DailyBar } from "../components/DailyBarChart";
import WeightChart from "../components/WeightChart";
import WeightLogRow from "../components/WeightLogRow";
import { useAddWeight, useEntriesRange, useWeightLogs } from "../data/queries";
import { errorMessage, goalsFor } from "../helpers/pocketbase";
import { parseWeightKg } from "../helpers/weight";
import { useAuth } from "../helpers/useAuth";
import { addDays, dayKey, formatShortDate, parsePbDate, startOfDay } from "../helpers/dates";
import "./ProgressPage.css";

const RANGES = [7, 14, 30] as const;

export default function ProgressPage() {
  const user = useAuth();
  const goals = goalsFor(user);
  const [days, setDays] = useState<(typeof RANGES)[number]>(14);

  const { data: entries = [], isPending } = useEntriesRange(days);
  const { data: weightLogs = [] } = useWeightLogs();
  const addWeight = useAddWeight();
  const [weight, setWeight] = useState("");
  const [weightError, setWeightError] = useState("");

  // Sum calories per local day, including empty days
  const perDay = new Map<string, number>();
  for (const entry of entries) {
    const key = dayKey(parsePbDate(entry.eaten_at));
    perDay.set(key, (perDay.get(key) ?? 0) + entry.calories);
  }
  const today = startOfDay(new Date());
  const bars: DailyBar[] = Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    const key = dayKey(date);
    return { key, label: formatShortDate(date), value: perDay.get(key) ?? 0 };
  });

  const loggedDays = bars.filter((b) => b.value > 0);
  const average = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, b) => sum + b.value, 0) / loggedDays.length)
    : 0;
  const daysOnTarget = loggedDays.filter((b) => b.value <= goals.calories * 1.05).length;

  async function handleAddWeight(e: FormEvent) {
    e.preventDefault();
    setWeightError("");
    const value = parseWeightKg(weight);
    if (value === null) {
      setWeightError("Enter your weight in kg.");
      return;
    }
    try {
      await addWeight.mutateAsync({ weightKg: value, loggedAt: new Date() });
      setWeight("");
    } catch (err) {
      setWeightError(errorMessage(err));
    }
  }

  return (
    <div className="progress-page">
      <header className="page-header">
        <h1>Progress</h1>
        <div className="progress-range" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={r === days ? "" : "secondary"}
              aria-pressed={r === days}
              onClick={() => setDays(r)}
            >
              {r} days
            </button>
          ))}
        </div>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="progress-stats">
            <div className="progress-stat">
              <span className="progress-stat-value">{average}</span>
              <span className="progress-stat-label">avg kcal / logged day</span>
            </div>
            <div className="progress-stat">
              <span className="progress-stat-value">
                {daysOnTarget}/{loggedDays.length}
              </span>
              <span className="progress-stat-label">days within goal</span>
            </div>
          </div>

          {!isPending && <DailyBarChart title="Calories per day" bars={bars} goal={goals.calories} unit="kcal" />}
        </section>

        <section className="card">
          <h2>Weight</h2>
          <form className="progress-weight-form" onSubmit={handleAddWeight}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Today's weight (kg)"
              aria-label="Today's weight in kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <button type="submit" disabled={addWeight.isPending}>
              Log
            </button>
          </form>
          {weightError && <p className="error-text">{weightError}</p>}

          <div className="progress-weight-chart">
            <WeightChart logs={weightLogs} />
          </div>

          {weightLogs.length > 0 && (
            <table className="progress-weight-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Weight</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...weightLogs].reverse().map((log) => (
                  <WeightLogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
