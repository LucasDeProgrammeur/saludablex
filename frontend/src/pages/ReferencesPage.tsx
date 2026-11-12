import { useState } from "react";
import { Link } from "react-router";
import { useDeleteReference, useReferences } from "../data/queries";
import { errorMessage, pb } from "../helpers/pocketbase";
import { formatAmount } from "../helpers/nutrition";
import { matchesQuery } from "../helpers/references";
import "./ReferencesPage.css";

export default function ReferencesPage() {
  const { data: references = [], isPending, error } = useReferences();
  const deleteReference = useDeleteReference();
  const [query, setQuery] = useState("");

  const shown = references.filter((r) => matchesQuery(r, query));

  return (
    <div className="references-page">
      <header className="page-header">
        <h1>References</h1>
        <Link to="/references/add" className="button">
          + Add reference
        </Link>
      </header>

      <div className="references-layout">
        <p className="muted references-intro">
          Nutrition facts from package labels. Pick them when adding food so the analyzer uses the real label values.
        </p>

        {references.length > 0 && (
          <input
            type="search"
            placeholder="Search references…"
            aria-label="Search references"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}

        {isPending && <p className="muted">Loading…</p>}
        {error && <p className="error-text">{errorMessage(error)}</p>}
        {deleteReference.error && <p className="error-text">{errorMessage(deleteReference.error)}</p>}

        {!isPending && references.length === 0 && (
          <p className="card muted">No references yet. Take a photo of a nutrition label to add one.</p>
        )}
        {references.length > 0 && shown.length === 0 && <p className="muted">No references match.</p>}

        {shown.length > 0 && (
          <ul className="card references-list">
            {shown.map((reference) => (
              <li key={reference.id} className="references-item">
                {reference.photo ? (
                  <img
                    className="references-photo"
                    src={pb.files.getURL(reference, reference.photo, { thumb: "300x300" })}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span className="references-photo is-empty" />
                )}
                <div className="references-text">
                  <span className="references-name">{reference.name}</span>
                  <span className="references-meta">
                    {[reference.brand, reference.serving_grams ? `serving ${formatAmount(reference.serving_grams)} g` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="references-meta">
                    per 100 g: {formatAmount(reference.calories)} kcal · C {formatAmount(reference.carbs)} · F{" "}
                    {formatAmount(reference.fat)} · P {formatAmount(reference.protein)}
                  </span>
                </div>
                <button
                  type="button"
                  className="icon"
                  aria-label={`Delete ${reference.name}`}
                  disabled={deleteReference.isPending}
                  onClick={() => {
                    if (confirm(`Delete "${reference.name}"?`)) deleteReference.mutate(reference.id);
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
