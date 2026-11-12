import "./CalorieSummary.css";

interface CalorieSummaryProps {
  eaten: number;
  goal: number;
  label?: string;
}

const SIZE = 216;
const STROKE = 15;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Calorie ring with the "700 / 2500 calories today" headline in the middle. */
export default function CalorieSummary({ eaten, goal, label = "calories today" }: CalorieSummaryProps) {
  const eatenRounded = Math.round(eaten);
  const remaining = goal - eatenRounded;
  const progress = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const over = remaining < 0;

  return (
    <div className={`calorie-summary${over ? " is-over" : ""}`}>
      <div className="calorie-summary-ring">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${eatenRounded} of ${goal} kcal`}>
          <defs>
            <linearGradient id="calorie-ring-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--secondary-color)" }} />
              <stop offset="100%" style={{ stopColor: "var(--main-color)" }} />
            </linearGradient>
          </defs>
          <circle className="calorie-summary-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
          <circle
            className="calorie-summary-progress"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="calorie-summary-center">
          <span className="calorie-summary-eaten">{eatenRounded}</span>
          <span className="calorie-summary-goal">/ {goal}</span>
          <span className="calorie-summary-label">{label}</span>
        </div>
      </div>

      <p className="calorie-summary-remaining">
        {over ? (
          <>
            <strong>{-remaining}</strong> kcal over your goal
          </>
        ) : (
          <>
            <strong>{remaining}</strong> kcal left
          </>
        )}
      </p>
    </div>
  );
}
