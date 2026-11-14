/// <reference path="../pb_data/types.d.ts" />

// recipes: a user's frequently eaten meals, so they can be logged in one go.
// recipe_food_items: the food items of a recipe (same shape as a food entry),
// ordered by `sort`. Access to items follows the owner of their recipe.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const ownerOnly = "user = @request.auth.id";

    const recipes = new Collection({
      type: "base",
      name: "recipes",
      listRule: ownerOnly,
      viewRule: ownerOnly,
      createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
      updateRule: ownerOnly + " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)",
      deleteRule: ownerOnly,
      fields: [
        {
          type: "relation",
          name: "user",
          required: true,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { type: "text", name: "name", required: true, max: 200 },
        {
          type: "file",
          name: "photo",
          maxSelect: 1,
          maxSize: 10 * 1024 * 1024,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
          thumbs: ["300x300"],
        },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE INDEX idx_recipes_user_name ON recipes (user, name)"],
    });
    app.save(recipes);

    const recipeOwner = "recipe.user = @request.auth.id";

    const items = new Collection({
      type: "base",
      name: "recipe_food_items",
      listRule: recipeOwner,
      viewRule: recipeOwner,
      // Create rules are checked against the submitted record, so this
      // ensures items can only be added to one of your own recipes.
      createRule: "@request.auth.id != '' && " + recipeOwner,
      // Items can't be moved to another recipe
      updateRule: recipeOwner + " && @request.body.recipe:isset = false",
      deleteRule: recipeOwner,
      fields: [
        {
          type: "relation",
          name: "recipe",
          required: true,
          collectionId: recipes.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        // Position within the recipe, starting at 0
        { type: "number", name: "sort", min: 0, onlyInt: true },
        { type: "text", name: "name", required: true, max: 200 },
        { type: "text", name: "portion", max: 200 },
        { type: "number", name: "grams", min: 0 },
        { type: "number", name: "calories", min: 0 },
        { type: "number", name: "carbs", min: 0 },
        { type: "number", name: "fat", min: 0 },
        { type: "number", name: "protein", min: 0 },
        // { vitamin_a_ug, vitamin_c_mg, ... } — see frontend/src/data/nutrients.ts
        { type: "json", name: "micros", maxSize: 20000 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE INDEX idx_recipe_food_items_recipe ON recipe_food_items (recipe, sort)"],
    });
    app.save(items);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("recipe_food_items"));
    app.delete(app.findCollectionByNameOrId("recipes"));
  },
);
