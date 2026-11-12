import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import AuthCard from "../components/AuthCard";
import GenderSelect from "../components/GenderSelect";
import { errorMessage, pb } from "../helpers/pocketbase";
import { useAuth } from "../helpers/useAuth";
import { DEFAULT_GOALS } from "../data/nutrients";
import type { Gender } from "../types";

export default function RegisterPage() {
  const user = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [calorieGoal, setCalorieGoal] = useState(String(DEFAULT_GOALS.calories));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await pb.collection("users").create({
        name,
        email,
        password,
        passwordConfirm: password,
        gender,
        calorie_goal: Number(calorieGoal) || DEFAULT_GOALS.calories,
        carbs_goal: DEFAULT_GOALS.carbs,
        fat_goal: DEFAULT_GOALS.fat,
        protein_goal: DEFAULT_GOALS.protein,
      });
      await pb.collection("users").authWithPassword(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your account">
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password (min. 8 characters)
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <GenderSelect value={gender} onChange={setGender} />
        <label>
          Daily calorie goal (kcal)
          <input
            type="number"
            inputMode="numeric"
            min={800}
            max={10000}
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(e.target.value)}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="muted">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </AuthCard>
  );
}
