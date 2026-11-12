import { useId, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import PhotoCapture from "../components/PhotoCapture";
import PhotoPreview from "../components/PhotoPreview";
import { useAddReference, useReadLabel } from "../data/queries";
import { MACROS, MICROS } from "../data/nutrients";
import type { PreparedImage } from "../helpers/image";
import { errorMessage } from "../helpers/pocketbase";
import { emptyReferenceDraft, labelToDraft } from "../helpers/references";
import { usePreparedImage } from "../helpers/usePreparedImage";
import type { MacroKey, ReferenceDraft } from "../types";
import "./AddReferencePage.css";

/** capture (photo of the label, or skip) → review (label is read, user corrects + saves) */
type Step = "capture" | "review";

const num = (value: string) => Math.max(0, Number(value) || 0);

export default function AddReferencePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("capture");
  const [image, setImage] = usePreparedImage();
  // Typed by the user; the label reading never fills this in
  const [name, setName] = useState("");
  const [draft, setDraft] = useState<ReferenceDraft>(emptyReferenceDraft);
  const [showMicros, setShowMicros] = useState(false);
  const [error, setError] = useState("");

  const readLabel = useReadLabel();
  const addReference = useAddReference();
  // Ignore a label result that arrives after the user already retook the photo
  const readId = useRef(0);
  const nameRef = useRef<HTMLInputElement>(null);
  const nameId = useId();

  async function handleCapture(photo: PreparedImage) {
    const id = ++readId.current;
    setImage(photo);
    setDraft(emptyReferenceDraft());
    setError("");
    setStep("review");
    try {
      const result = await readLabel.mutateAsync({ base64: photo.base64, mediaType: photo.mediaType });
      if (id !== readId.current) return;
      if (!result.recognized) {
        setError("No nutrition label found in this photo. Retake it, or fill in the values yourself.");
        return;
      }
      const read = labelToDraft(result);
      setDraft(read);
      if (Object.keys(read.micros).length > 0) setShowMicros(true);
    } catch (err) {
      if (id === readId.current) setError(errorMessage(err));
    }
  }

  function retake() {
    readId.current++;
    setImage(null);
    setError("");
    setStep("capture");
  }

  function startManual() {
    readId.current++;
    setImage(null);
    setDraft(emptyReferenceDraft());
    setError("");
    setStep("review");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Give the reference a name.");
      nameRef.current?.focus();
      return;
    }
    try {
      await addReference.mutateAsync({ draft: { ...draft, name: name.trim() }, photo: image?.blob });
      navigate("/references");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const reading = readLabel.isPending && image !== null;
  const setMacro = (key: MacroKey, value: string) => setDraft((d) => ({ ...d, [key]: num(value) }));

  return (
    <div className="add-reference-page">
      <header className="page-header">
        <div className="add-reference-intro">
          <h1>Add reference</h1>
          <p className="muted">
            References are the food facts on the side of a package. Pick them when adding food so the analyzer
            uses the real label values.
          </p>
        </div>
        {step !== "capture" && (
          <button type="button" className="secondary" onClick={retake}>
            {image ? "Retake photo" : "Use camera"}
          </button>
        )}
      </header>

      <label className="add-reference-name" htmlFor={nameId}>
        Reference name
        <input
          id={nameId}
          ref={nameRef}
          value={name}
          placeholder="e.g. Greek yoghurt 2%"
          maxLength={200}
          required
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      {/* ---------- 1. Camera ---------- */}
      {step === "capture" && (
        <PhotoCapture
          onCapture={handleCapture}
          tip="Photograph the nutrition facts table. Make sure the numbers are sharp and readable."
        >
          <button type="button" className="secondary" onClick={startManual}>
            Enter manually without a photo
          </button>
        </PhotoCapture>
      )}

      {/* ---------- 2. Review & save ---------- */}
      {step === "review" && (
        <div className="add-reference-review">
          {image && (
            <PhotoPreview
              className="add-reference-photo"
              src={image.previewUrl}
              alt="Nutrition label"
              scanningLabel={reading ? "Reading label…" : undefined}
            />
          )}

          <form className="form card add-reference-form" onSubmit={handleSave}>
            <fieldset className="add-reference-fields" disabled={reading}>
              <div className="add-reference-grid">
                <label>
                  Brand
                  <input
                    value={draft.brand}
                    maxLength={200}
                    onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
                  />
                </label>
                <label>
                  Serving size (g)
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={draft.serving_grams || ""}
                    placeholder="none"
                    onChange={(e) => setDraft((d) => ({ ...d, serving_grams: num(e.target.value) }))}
                  />
                </label>
              </div>

              <h2 className="add-reference-heading">Per 100 g / 100 ml</h2>
              <div className="add-reference-grid">
                <label>
                  Calories (kcal)
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={draft.calories}
                    onChange={(e) => setDraft((d) => ({ ...d, calories: num(e.target.value) }))}
                  />
                </label>
                {MACROS.map((macro) => (
                  <label key={macro.key}>
                    {macro.label} ({macro.unit})
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={draft[macro.key]}
                      onChange={(e) => setMacro(macro.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <button type="button" className="secondary" onClick={() => setShowMicros((v) => !v)}>
                {showMicros ? "Hide micronutrients" : "Micronutrients"}
              </button>
              {showMicros && (
                <div className="add-reference-grid">
                  {MICROS.map((micro) => (
                    <label key={micro.key}>
                      {micro.label} ({micro.unit})
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={draft.micros[micro.key] ?? ""}
                        placeholder="not listed"
                        onChange={(e) =>
                          setDraft((d) => {
                            const micros = { ...d.micros };
                            if (e.target.value === "") delete micros[micro.key];
                            else micros[micro.key] = num(e.target.value);
                            return { ...d, micros };
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={reading || addReference.isPending}>
              {reading ? "Reading label…" : addReference.isPending ? "Saving…" : "Save reference"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
