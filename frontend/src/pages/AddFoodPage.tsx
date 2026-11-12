import { useState } from "react";
import { useNavigate } from "react-router";
import PhotoCapture from "../components/PhotoCapture";
import PhotoPreview from "../components/PhotoPreview";
import FoodDraftEditor from "../components/FoodDraftEditor";
import NutrientBar from "../components/NutrientBar";
import ReferenceChips from "../components/ReferenceChips";
import ReferencePicker from "../components/ReferencePicker";
import { useAddEntries, useAnalyzeFood, useEntriesForDay } from "../data/queries";
import { MACROS } from "../data/nutrients";
import type { PreparedImage } from "../helpers/image";
import { usePreparedImage } from "../helpers/usePreparedImage";
import { errorMessage, goalsFor } from "../helpers/pocketbase";
import { useAuth } from "../helpers/useAuth";
import { sumNutrition } from "../helpers/nutrition";
import { toLocalInputValue } from "../helpers/dates";
import { referenceToFoodDraft } from "../helpers/references";
import type { AnalyzedItem, FoodDraft, FoodReference } from "../types";
import "./AddFoodPage.css";

let draftCounter = 0;
const newKey = () => `draft-${++draftCounter}`;

function toDraft(item: AnalyzedItem): FoodDraft {
  return { ...item, key: newKey() };
}

function emptyDraft(): FoodDraft {
  return { key: newKey(), name: "", portion: "", grams: 100, calories: 0, carbs: 0, fat: 0, protein: 0, micros: {} };
}

/** capture → preview (confirm photo, optional note) → review (edit + save) */
type Step = "capture" | "preview" | "review";

export default function AddFoodPage() {
  const navigate = useNavigate();
  const user = useAuth();
  const goals = goalsFor(user);

  const [step, setStep] = useState<Step>("capture");
  const [image, setImage] = usePreparedImage();
  const [drafts, setDrafts] = useState<FoodDraft[]>([]);
  const [hint, setHint] = useState("");
  const [references, setReferences] = useState<FoodReference[]>([]);
  const [notes, setNotes] = useState("");
  const [eatenAt, setEatenAt] = useState(() => toLocalInputValue(new Date()));
  const [error, setError] = useState("");

  const analyze = useAnalyzeFood();
  const addEntries = useAddEntries();
  const { data: todayEntries = [] } = useEntriesForDay(new Date());

  function handlePhoto(photo: PreparedImage) {
    setError("");
    setImage(photo);
    setDrafts([]);
    setNotes("");
    setStep("preview");
  }

  async function runAnalysis() {
    if (!image) return;
    setError("");
    setNotes("");
    try {
      const result = await analyze.mutateAsync({
        base64: image.base64,
        mediaType: image.mediaType,
        hint: hint || undefined,
        references: references.map((r) => r.id),
      });
      if (!result.recognized || result.items.length === 0) {
        setError("No food recognised in this photo. Try another photo, add a note, or add it manually.");
        return;
      }
      setDrafts(result.items.map(toDraft));
      setNotes(result.notes);
      setStep("review");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function retake() {
    setImage(null);
    setDrafts([]);
    setNotes("");
    setError("");
    setStep("capture");
  }

  function startManual() {
    setImage(null);
    setDrafts([emptyDraft()]);
    setError("");
    setStep("review");
  }

  async function handleSave() {
    setError("");
    const valid = drafts.filter((d) => d.name.trim());
    if (valid.length === 0) {
      setError("Add at least one food item with a name.");
      return;
    }
    try {
      await addEntries.mutateAsync({ drafts: valid, eatenAt: new Date(eatenAt), photo: image?.blob });
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const today = sumNutrition(todayEntries);
  const adding = sumNutrition(drafts);

  return (
    <div className="add-food-page">
      <header className="page-header">
        <h1>Add food</h1>
        {step !== "capture" && (
          <button type="button" className="secondary" onClick={retake}>
            {image ? "Retake photo" : "Use camera"}
          </button>
        )}
      </header>

      {/* ---------- 1. Camera ---------- */}
      {step === "capture" && (
        <PhotoCapture
          onCapture={handlePhoto}
          tip="Fit the whole plate in the frame. We'll recognise the food and fill in the nutrition facts."
        >
          <button type="button" className="secondary" onClick={startManual}>
            Add manually without a photo
          </button>
        </PhotoCapture>
      )}

      {/* ---------- 2. Photo preview ---------- */}
      {step === "preview" && image && (
        <div className="add-food-preview">
          <PhotoPreview
            className="add-food-preview-photo"
            src={image.previewUrl}
            alt="Your meal"
            scanningLabel={analyze.isPending ? "Recognising food…" : undefined}
          />

          <div className="add-food-preview-side card">
            <ReferencePicker
              label="Packaged products in this meal? (optional)"
              excludeIds={references.map((r) => r.id)}
              disabled={analyze.isPending}
              onSelect={(reference) => setReferences((all) => [...all, reference])}
            />
            <ReferenceChips
              references={references}
              disabled={analyze.isPending}
              onRemove={(reference) => setReferences((all) => all.filter((r) => r.id !== reference.id))}
            />
            <label>
              Something we should know? (optional)
              <textarea
                rows={2}
                value={hint}
                placeholder="e.g. half portion, cooked in olive oil, oat milk"
                maxLength={300}
                disabled={analyze.isPending}
                onChange={(e) => setHint(e.target.value)}
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <div className="add-food-preview-actions">
              <button type="button" className="secondary" disabled={analyze.isPending} onClick={retake}>
                Retake
              </button>
              <button type="button" disabled={analyze.isPending} onClick={runAnalysis}>
                {analyze.isPending ? "Analysing…" : "Analyse photo"}
              </button>
            </div>
            <button type="button" className="icon add-food-manual-link" onClick={startManual}>
              or enter it manually
            </button>
          </div>
        </div>
      )}

      {/* ---------- 3. Review & save ---------- */}
      {step === "review" && (
        <div className="page-grid add-food-review">
          <aside className="add-food-summary">
            {image && <PhotoPreview small src={image.previewUrl} alt="Your meal" />}
            {notes && <p className="muted add-food-notes">{notes}</p>}

            <div className="card add-food-impact">
              <h2>
                This meal adds <strong>{Math.round(adding.calories)} kcal</strong>
              </h2>
              <NutrientBar
                label="Calories"
                unit="kcal"
                value={today.calories}
                adding={adding.calories}
                goal={goals.calories}
              />
              {MACROS.map((macro) => (
                <NutrientBar
                  key={macro.key}
                  compact
                  label={macro.label}
                  unit={macro.unit}
                  value={today[macro.key]}
                  adding={adding[macro.key]}
                  goal={goals[macro.key]}
                />
              ))}
              <p className="add-food-legend muted">
                <span className="add-food-legend-swatch" /> eaten today
                <span className="add-food-legend-swatch is-adding" /> this meal
              </p>
            </div>
          </aside>

          <section className="add-food-items">
            <h2>{image ? "Recognised food" : "Food"}</h2>
            {drafts.map((draft) => (
              <FoodDraftEditor
                key={draft.key}
                draft={draft}
                onChange={(updated) => setDrafts((all) => all.map((d) => (d.key === draft.key ? updated : d)))}
                onRemove={() => setDrafts((all) => all.filter((d) => d.key !== draft.key))}
              />
            ))}
            <div className="add-food-add-row">
              <ReferencePicker
                label="Add a packaged product"
                onSelect={(reference) => setDrafts((all) => [...all, referenceToFoodDraft(reference, newKey())])}
              />
              <button type="button" className="secondary" onClick={() => setDrafts((all) => [...all, emptyDraft()])}>
                + Add item
              </button>
            </div>

            <label>
              Eaten at
              <input type="datetime-local" value={eatenAt} onChange={(e) => setEatenAt(e.target.value)} />
            </label>

            {error && <p className="error-text">{error}</p>}
            <button
              type="button"
              className="add-food-save"
              onClick={handleSave}
              disabled={addEntries.isPending || drafts.length === 0}
            >
              {addEntries.isPending ? "Saving…" : "Save meal"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
