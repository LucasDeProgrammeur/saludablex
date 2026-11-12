import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import GenderSelect from "../components/GenderSelect";
import { errorMessage, goalsFor, pb } from "../helpers/pocketbase";
import type { Gender } from "../types";
import { useAuth } from "../helpers/useAuth";
import "./SettingsPage.css";

export default function SettingsPage() {
  const user = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const goals = goalsFor(user);

  const [name, setName] = useState(user?.name ?? "");
  const [gender, setGender] = useState<Gender>(user?.gender ?? "");
  const [calories, setCalories] = useState(String(goals.calories));
  const [carbs, setCarbs] = useState(String(goals.carbs));
  const [fat, setFat] = useState(String(goals.fat));
  const [protein, setProtein] = useState(String(goals.protein));
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // kcal implied by the macro goals (4 / 9 / 4 kcal per gram)
  const macroKcal = Math.round(Number(carbs) * 4 + Number(fat) * 9 + Number(protein) * 4);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setStatus(null);
    try {
      // update() refreshes pb.authStore.record, which re-renders every useAuth() consumer
      await pb.collection("users").update(user.id, {
        name,
        gender,
        calorie_goal: Number(calories),
        carbs_goal: Number(carbs),
        fat_goal: Number(fat),
        protein_goal: Number(protein),
      });
      setStatus({ type: "ok", text: "Saved." });
    } catch (err) {
      setStatus({ type: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    pb.authStore.clear();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-layout">
        <form className="form card" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <GenderSelect value={gender} onChange={setGender} />
          <p className="settings-check">Used for your vitamin and mineral goals. The default is male as those are the highest values.</p>

          <h2 className="settings-heading">Daily goals</h2>
          <label>
            Calories (kcal)
            <input
              type="number"
              inputMode="numeric"
              min={800}
              max={10000}
              required
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </label>
          <div className="settings-macros">
            <label>
              Carbs (g)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                required
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </label>
            <label>
              Fat (g)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                required
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </label>
            <label>
              Protein (g)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                required
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </label>
          </div>
          <p className={`settings-check${Math.abs(macroKcal - Number(calories)) > 150 ? " is-off" : ""}`}>
            Your macro goals add up to {macroKcal} kcal.
          </p>

          {status && <p className={status.type === "error" ? "error-text" : "muted"}>{status.text}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </form>

        <section className="card settings-account">
          <p className="muted">Signed in as {user?.email}</p>
          <button type="button" className="danger" onClick={logout}>
            Log out
          </button>
        </section>
      </div>
    </div>
  );
}
