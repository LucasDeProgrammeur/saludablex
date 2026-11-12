import { useState } from "react";
import { Link } from "react-router";
import CalorieSummary from "../components/CalorieSummary";
import NutrientBar from "../components/NutrientBar";
import FoodEntryList from "../components/FoodEntryList";
import { useEntriesForDay } from "../data/queries";
import { MACROS, MICROS, microGoal } from "../data/nutrients";
import { goalsFor } from "../helpers/pocketbase";
import { useAuth } from "../helpers/useAuth";
import { addDays, dayKey, startOfDay } from "../helpers/dates";
import { sumNutrition } from "../helpers/nutrition";
import "./HomePage.css";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const user = useAuth();
  const goals = goalsFor(user);
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const isToday = dayKey(day) === dayKey(new Date());

  const { data: entries = [], isPending, error } = useEntriesForDay(day);
  const totals = sumNutrition(entries);

  return (
    <div className="home-page">
      <header className="page-header">
        <div>
          <p className="muted home-greeting">
            {greeting()}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </p>
          <h1>{isToday ? "Today" : day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h1>
        </div>
        <div className="home-day-switch">
          <button type="button" className="secondary" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}>
            ‹
          </button>
          {!isToday && (
            <button type="button" className="secondary" onClick={() => setDay(startOfDay(new Date()))}>
              Today
            </button>
          )}
          <button
            type="button"
            className="secondary"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => setDay(addDays(day, 1))}
          >
            ›
          </button>
        </div>
      </header>

      {error && <p className="error-text">Could not load your entries: {error.message}</p>}

      <div className="page-grid">
        <section className="card home-overview" aria-busy={isPending}>
          <CalorieSummary eaten={totals.calories} goal={goals.calories} label={isToday ? "kcal today" : "kcal"} />
          <div className="home-macros">
            <h2 className="visually-hidden">Macronutrients</h2>
            {MACROS.map((macro) => (
              <NutrientBar
                key={macro.key}
                label={macro.label}
                unit={macro.unit}
                value={totals[macro.key]}
                goal={goals[macro.key]}
              />
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Micronutrients</h2>
          <div className="home-micros">
            {MICROS.map((micro) => (
              <NutrientBar
                key={micro.key}
                compact
                label={micro.label}
                unit={micro.unit}
                value={totals.micros[micro.key] ?? 0}
                goal={microGoal(micro, user?.gender)}
                isLimit={micro.isLimit}
              />
            ))}
          </div>
        </section>

        <section className="card span-all">
          <div className="home-meals-header">
            <h2>Meals</h2>
            <Link to="/add" className="button secondary">
              + Add food
            </Link>
          </div>
          {!isPending && <FoodEntryList entries={entries} />}
        </section>
      </div>
    </div>
  );
}
