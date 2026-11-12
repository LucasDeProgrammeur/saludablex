/// <reference path="../pb_data/types.d.ts" />

// Initial Saludablex schema:
//  - extra goal fields on the built-in `users` auth collection
//  - food_entries: one row per eaten food item (optionally with the photo it came from)
//  - weight_logs: body weight over time, for progress tracking

migrate(
  (app) => {
    // ---- users: personal goals ----
    const users = app.findCollectionByNameOrId("users");
    users.fields.add(new NumberField({ name: "calorie_goal", min: 0, onlyInt: true }));
    users.fields.add(new NumberField({ name: "carbs_goal", min: 0 }));
    users.fields.add(new NumberField({ name: "fat_goal", min: 0 }));
    users.fields.add(new NumberField({ name: "protein_goal", min: 0 }));
    app.save(users);

    const ownerOnly = "user = @request.auth.id";

    // ---- food_entries ----
    const foodEntries = new Collection({
      type: "base",
      name: "food_entries",
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
        { type: "text", name: "portion", max: 200 },
        { type: "number", name: "grams", min: 0 },
        { type: "number", name: "calories", min: 0 },
        { type: "number", name: "carbs", min: 0 },
        { type: "number", name: "fat", min: 0 },
        { type: "number", name: "protein", min: 0 },
        // { vitamin_a_ug, vitamin_c_mg, ... } — see frontend/src/data/nutrients.ts
        { type: "json", name: "micros", maxSize: 20000 },
        { type: "date", name: "eaten_at", required: true },
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
      indexes: ["CREATE INDEX idx_food_entries_user_eaten ON food_entries (user, eaten_at)"],
    });
    app.save(foodEntries);

    // ---- weight_logs ----
    const weightLogs = new Collection({
      type: "base",
      name: "weight_logs",
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
        { type: "number", name: "weight_kg", required: true, min: 1 },
        { type: "date", name: "logged_at", required: true },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE INDEX idx_weight_logs_user_logged ON weight_logs (user, logged_at)"],
    });
    app.save(weightLogs);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("weight_logs"));
    app.delete(app.findCollectionByNameOrId("food_entries"));

    const users = app.findCollectionByNameOrId("users");
    ["calorie_goal", "carbs_goal", "fat_goal", "protein_goal"].forEach((name) => {
      users.fields.removeByName(name);
    });
    app.save(users);
  },
);
