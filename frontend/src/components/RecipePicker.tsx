import { Link } from "react-router";
import SearchPicker from "./SearchPicker";
import { useRecipes } from "../data/queries";
import { matchesRecipeQuery } from "../helpers/recipes";
import { sumNutrition } from "../helpers/nutrition";
import type { RecipeWithItems } from "../types";

interface RecipePickerProps {
  label: string;
  onSelect: (recipe: RecipeWithItems) => void;
  disabled?: boolean;
}

/** Search box that suggests the user's saved recipes. */
export default function RecipePicker({ label, onSelect, disabled }: RecipePickerProps) {
  const { data: recipes = [], isPending } = useRecipes();

  return (
    <SearchPicker
      label={label}
      placeholder="Search your recipes…"
      items={recipes}
      matches={matchesRecipeQuery}
      loading={isPending}
      disabled={disabled}
      onSelect={onSelect}
      renderOption={(recipe) => (
        <>
          <span>
            {recipe.name}
            <span className="muted">
              {" "}
              · {recipe.items.length} {recipe.items.length === 1 ? "item" : "items"}
            </span>
          </span>
          <span className="search-picker-meta muted">{Math.round(sumNutrition(recipe.items).calories)} kcal</span>
        </>
      )}
      renderEmpty={({ loading, hasItems }) => (
        <>
          {loading ? "Loading…" : hasItems ? "No recipes match." : "You have no recipes yet."}{" "}
          <Link to="/recipes/new" onMouseDown={(e) => e.preventDefault()}>
            Create a recipe
          </Link>
        </>
      )}
    />
  );
}
