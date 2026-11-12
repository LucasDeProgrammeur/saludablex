/// <reference path="../pb_data/types.d.ts" />

// food_references: nutrition facts read from a package label, stored per 100 g
// (or 100 ml). Picked when logging a meal so recognition uses the label values.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const ownerOnly = "user = @request.auth.id";

    const references = new Collection({
      type: "base",
      name: "food_references",
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
        { type: "text", name: "brand", max: 200 },
        // Package serving size in grams, 0 when the label has none
        { type: "number", name: "serving_grams", min: 0 },
        // All nutrition values below are per 100 g / 100 ml
        { type: "number", name: "calories", min: 0 },
        { type: "number", name: "carbs", min: 0 },
        { type: "number", name: "fat", min: 0 },
        { type: "number", name: "protein", min: 0 },
        { type: "json", name: "micros", maxSize: 20000 },
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
      indexes: ["CREATE INDEX idx_food_references_user_name ON food_references (user, name)"],
    });
    app.save(references);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("food_references"));
  },
);
