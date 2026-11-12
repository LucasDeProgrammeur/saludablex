import { formatAmount } from "../helpers/nutrition";
import "./NutrientBar.css";

interface NutrientBarProps {
  label: string;
  unit: string;
  /** Amount already eaten */
  value: number;
  goal: number;
  /** Amount that would be added (e.g. the meal being reviewed) — shown as a lighter, striped segment */
  adding?: number;
  /** For limits like sodium: going over is a warning, not a success */
  isLimit?: boolean;
  compact?: boolean;
}

export default function NutrientBar({ label, unit, value, goal, adding = 0, isLimit, compact }: NutrientBarProps) {
  const total = value + adding;
  const scale = Math.max(goal, total) || 1;
  const valuePct = (value / scale) * 100;
  const addingPct = (adding / scale) * 100;
  const percentOfGoal = goal > 0 ? Math.round((total / goal) * 100) : 0;
  const over = total > goal;

  const className = ["nutrient-bar", compact && "is-compact", over && (isLimit ? "is-over-limit" : "is-over")]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className="nutrient-bar-header">
        <span className="nutrient-bar-label">{label}</span>
        <span className="nutrient-bar-amount">
          <strong>{formatAmount(value)}</strong>
          {adding > 0 && <span className="nutrient-bar-adding"> +{formatAmount(adding)}</span>}
          <span className="nutrient-bar-goal-text">
            {" "}
            / {formatAmount(goal)} {unit}
          </span>
        </span>
        <span className="nutrient-bar-percent">{percentOfGoal}%</span>
      </div>
      <div
        className="nutrient-bar-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.round(total)}
        aria-valuetext={`${formatAmount(total)} of ${formatAmount(goal)} ${unit}`}
      >
        {valuePct > 0 && <span className="nutrient-bar-fill" style={{ width: `${valuePct}%` }} />}
        {addingPct > 0 && <span className="nutrient-bar-fill is-adding" style={{ width: `${addingPct}%` }} />}
        {over && goal > 0 && <span className="nutrient-bar-goal" style={{ left: `${(goal / scale) * 100}%` }} />}
      </div>
    </div>
  );
}
