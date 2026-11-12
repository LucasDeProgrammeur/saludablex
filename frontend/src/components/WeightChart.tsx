import { useState } from "react";
import { formatShortDate, parsePbDate } from "../helpers/dates";
import type { WeightLog } from "../types";
import "./WeightChart.css";

const WIDTH = 300;
const HEIGHT = 120;
const PAD = 9;

/** Weight over time as a line; hover or focus a point for its value. */
export default function WeightChart({ logs }: { logs: WeightLog[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (logs.length < 2) {
    return <p className="muted">Log your weight on at least two days to see a trend.</p>;
  }

  const times = logs.map((l) => parsePbDate(l.logged_at).getTime());
  const weights = logs.map((l) => l.weight_kg);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  const x = (t: number) => PAD + ((t - minT) / (maxT - minT || 1)) * (WIDTH - PAD * 2);
  const y = (w: number) => PAD + (1 - (w - minW) / (maxW - minW)) * (HEIGHT - PAD * 2);
  const points = logs.map((l, i) => ({ x: x(times[i]), y: y(l.weight_kg), log: l }));

  const activePoint = active !== null ? points[active] : null;
  const first = weights[0];
  const last = weights[weights.length - 1];
  const change = Math.round((last - first) * 10) / 10;

  return (
    <figure className="weight-chart">
      <figcaption className="weight-chart-caption">
        <span>Weight (kg)</span>
        <span className="weight-chart-readout" aria-live="polite">
          {activePoint
            ? `${formatShortDate(parsePbDate(activePoint.log.logged_at))}: ${activePoint.log.weight_kg} kg`
            : `${change > 0 ? "+" : ""}${change} kg since ${formatShortDate(new Date(minT))}`}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="weight-chart-svg" onMouseLeave={() => setActive(null)}>
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          style={{ stroke: "var(--main-color)" }}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <g key={p.log.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={active === i ? 5 : 3.5}
              style={{
                fill: active === i ? "var(--secondary-color)" : "var(--main-color)",
                stroke: "var(--surface)",
              }}
              strokeWidth="2"
            />
            {/* larger invisible hit target */}
            <circle
              cx={p.x}
              cy={p.y}
              r="12"
              fill="transparent"
              tabIndex={0}
              aria-label={`${formatShortDate(parsePbDate(p.log.logged_at))}: ${p.log.weight_kg} kg`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          </g>
        ))}
      </svg>
    </figure>
  );
}
