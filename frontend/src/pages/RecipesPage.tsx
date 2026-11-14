import { useState } from "react";
import { Link } from "react-router";
import { useDeleteRecipe, useRecipes } from "../data/queries";
import { errorMessage, pb } from "../helpers/pocketbase";
import { formatAmount, sumNutrition } from "../helpers/nutrition";
import { matchesRecipeQuery } from "../helpers/recipes";
import "./RecipesPage.css";

export default function RecipesPage() {
  const { data: recipes = [], isPending, error } = useRecipes();
  const deleteRecipe = useDeleteRecipe();
  const [query, setQuery] = useState("");

  const shown = recipes.filter((r) => matchesRecipeQuery(r, query));

  return (
    <div className="recipes-page">
      <header className="page-header">
        <h1>Recipes</h1>
        <Link to="/recipes/new" className="button">
          + New recipe
        </Link>
      </header>

      <div className="recipes-layout">
        <p className="muted recipes-intro">
          Meals you eat often. Pick one when adding food to log all of its items at once, or save a photographed meal
          as a recipe before logging it.
        </p>

        {recipes.length > 0 && (
          <input
            type="search"
            placeholder="Search recipes…"
            aria-label="Search recipes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}

        {isPending && <p className="muted">Loading…</p>}
        {error && <p className="error-text">{errorMessage(error)}</p>}
        {deleteRecipe.error && <p className="error-text">{errorMessage(deleteRecipe.error)}</p>}

        {!isPending && !error && recipes.length === 0 && (
          <p className="card muted">No recipes yet. Create one here, or save a meal as a recipe when adding food.</p>
        )}
        {recipes.length > 0 && shown.length === 0 && <p className="muted">No recipes match.</p>}

        {shown.length > 0 && (
          <ul className="card recipes-list">
            {shown.map((recipe) => {
              const total = sumNutrition(recipe.items);
              return (
                <li key={recipe.id} className="recipes-item">
                  {recipe.photo ? (
                    <img
                      className="recipes-photo"
                      src={pb.files.getURL(recipe, recipe.photo, { thumb: "300x300" })}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="recipes-photo is-empty" />
                  )}
                  <Link to={`/recipes/${recipe.id}`} className="recipes-text">
                    <span className="recipes-name">{recipe.name}</span>
                    <span className="recipes-meta">{recipe.items.map((i) => i.name).join(", ")}</span>
                    <span className="recipes-meta">
                      {Math.round(total.calories)} kcal · C {formatAmount(total.carbs)} · F {formatAmount(total.fat)} ·
                      P {formatAmount(total.protein)}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="icon"
                    aria-label={`Delete ${recipe.name}`}
                    disabled={deleteRecipe.isPending}
                    onClick={() => {
                      if (confirm(`Delete "${recipe.name}"?`)) deleteRecipe.mutate(recipe.id);
                    }}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
