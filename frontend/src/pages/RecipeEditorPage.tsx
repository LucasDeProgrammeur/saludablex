import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import FoodDraftEditor from "../components/FoodDraftEditor";
import ReferencePicker from "../components/ReferencePicker";
import { useRecipes, useSaveRecipe } from "../data/queries";
import { emptyDraft, newDraftKey } from "../helpers/drafts";
import { formatAmount, sumNutrition } from "../helpers/nutrition";
import { errorMessage } from "../helpers/pocketbase";
import { recipeToFoodDrafts } from "../helpers/recipes";
import { referenceToFoodDraft } from "../helpers/references";
import type { FoodDraft, RecipeWithItems } from "../types";
import "./RecipeEditorPage.css";

/** /recipes/new and /recipes/:id */
export default function RecipeEditorPage() {
  const { id } = useParams();
  const { data: recipes, isPending, error } = useRecipes();

  if (!id) return <RecipeForm />;
  if (isPending) return <p className="muted">Loading…</p>;
  if (error) return <p className="error-text">{errorMessage(error)}</p>;

  const recipe = recipes?.find((r) => r.id === id);
  if (!recipe) {
    return (
      <p className="muted">
        This recipe doesn't exist (anymore). <Link to="/recipes">Back to recipes</Link>
      </p>
    );
  }
  // Keyed so the form starts fresh if the route switches to another recipe
  return <RecipeForm key={recipe.id} recipe={recipe} />;
}

function RecipeForm({ recipe }: { recipe?: RecipeWithItems }) {
  const navigate = useNavigate();
  const saveRecipe = useSaveRecipe();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(recipe?.name ?? "");
  const [drafts, setDrafts] = useState<FoodDraft[]>(() => (recipe ? recipeToFoodDrafts(recipe) : [emptyDraft()]));
  const [error, setError] = useState("");

  const total = sumNutrition(drafts);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Give the recipe a name.");
      nameRef.current?.focus();
      return;
    }
    const valid = drafts.filter((d) => d.name.trim());
    if (valid.length === 0) {
      setError("Add at least one food item with a name.");
      return;
    }
    try {
      await saveRecipe.mutateAsync({ id: recipe?.id, name: name.trim(), drafts: valid });
      navigate("/recipes");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form className="recipe-editor" onSubmit={handleSave} noValidate>
      <header className="page-header">
        <h1>{recipe ? "Edit recipe" : "New recipe"}</h1>
        <Link to="/recipes" className="button secondary">
          Cancel
        </Link>
      </header>

      <div className="recipe-editor-layout">
        <label>
          Name
          <input
            ref={nameRef}
            value={name}
            placeholder="e.g. Weekday breakfast"
            maxLength={200}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <p className="recipe-editor-total muted">
          Total: <strong>{Math.round(total.calories)} kcal</strong> · C {formatAmount(total.carbs)} g · F{" "}
          {formatAmount(total.fat)} g · P {formatAmount(total.protein)} g
        </p>

        {drafts.map((draft) => (
          <FoodDraftEditor
            key={draft.key}
            draft={draft}
            onChange={(updated) => setDrafts((all) => all.map((d) => (d.key === draft.key ? updated : d)))}
            onRemove={() => setDrafts((all) => all.filter((d) => d.key !== draft.key))}
          />
        ))}

        <div className="recipe-editor-add-row">
          <ReferencePicker
            label="Add a packaged product"
            onSelect={(reference) => setDrafts((all) => [...all, referenceToFoodDraft(reference, newDraftKey())])}
          />
          <button type="button" className="secondary" onClick={() => setDrafts((all) => [...all, emptyDraft()])}>
            + Add item
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="recipe-editor-save" disabled={saveRecipe.isPending}>
          {saveRecipe.isPending ? "Saving…" : "Save recipe"}
        </button>
      </div>
    </form>
  );
}
