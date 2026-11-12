import { useState } from "react";
import "./DailyBarChart.css";

export interface DailyBar {
  key: string;
  label: string;
  value: number;
}

interface DailyBarChartProps {
  bars: DailyBar[];
  goal: number;
  unit: string;
  title: string;
}

/** One bar per day with the goal as a reference line. Hover/focus a bar for its value. */
export default function DailyBarChart({ bars, goal, unit, title }: DailyBarChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(goal * 1.15, ...bars.map((b) => b.value), 1);
  const activeBar = active !== null ? bars[active] : null;

  return (
    <figure className="daily-bar-chart">
      <figcaption className="daily-bar-chart-caption">
        <span>{title}</span>
        <span className="daily-bar-chart-readout" aria-live="polite">
          {activeBar ? `${activeBar.label}: ${Math.round(activeBar.value)} ${unit}` : `Goal ${goal} ${unit}`}
        </span>
      </figcaption>

      <div className="daily-bar-chart-plot" onMouseLeave={() => setActive(null)}>
        <div className="daily-bar-chart-goal" style={{ bottom: `${(goal / max) * 100}%` }}>
          <span>goal</span>
        </div>
        {bars.map((bar, i) => (
          <button
            type="button"
            key={bar.key}
            className={`daily-bar-chart-slot${active === i ? " is-active" : ""}`}
            aria-label={`${bar.label}: ${Math.round(bar.value)} ${unit}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(i)}
          >
            <span className="daily-bar-chart-bar" style={{ height: `${(bar.value / max) * 100}%` }} />
          </button>
        ))}
      </div>

      <div className="daily-bar-chart-axis" aria-hidden="true">
        <span>{bars[0]?.label}</span>
        <span>{bars[bars.length - 1]?.label}</span>
      </div>
    </figure>
  );
}
