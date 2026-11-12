/// <reference path="../pb_data/types.d.ts" />

// POST /api/saludablex/analyze
// Body: { image: "<base64 without data: prefix>", mediaType: "image/jpeg", hint?: "...", references?: ["<food_references id>"] }
// Returns: { recognized, items: [...], notes } — see claude.js for the shape.
routerAdd(
  "POST",
  "/api/saludablex/analyze",
  (e) => {
    const claude = require(`${__hooks}/claude.js`);
    const { readImage } = require(`${__hooks}/request.js`);

    const body = e.requestInfo().body || {};
    const { image, mediaType } = readImage(body);
    const hint = typeof body.hint === "string" ? body.hint.slice(0, 300) : "";

    // Load the picked references server-side, only the user's own ones
    const ids = Array.isArray(body.references) ? body.references.filter((id) => typeof id === "string").slice(0, 10) : [];
    const references = [];
    ids.forEach((id) => {
      let record;
      try {
        record = $app.findRecordById("food_references", id);
      } catch (_) {
        throw new BadRequestError("A selected reference no longer exists.");
      }
      if (record.get("user") !== e.auth.id) {
        throw new ForbiddenError("Not your reference.");
      }
      references.push({
        name: record.get("name"),
        brand: record.get("brand"),
        serving_grams: record.get("serving_grams"),
        calories: record.get("calories"),
        carbs: record.get("carbs"),
        fat: record.get("fat"),
        protein: record.get("protein"),
        micros: JSON.parse(record.getString("micros") || "{}"),
      });
    });

    const result = claude.analyzeFood(image, mediaType, hint, references);
    return e.json(200, result);
  },
  $apis.requireAuth("users"),
);

// POST /api/saludablex/read-label
// Body: { image: "<base64 without data: prefix>", mediaType: "image/jpeg" }
// Returns: { recognized, brand, serving_grams, calories, carbs, fat, protein, micros } per 100 g.
routerAdd(
  "POST",
  "/api/saludablex/read-label",
  (e) => {
    const claude = require(`${__hooks}/claude.js`);
    const { readImage } = require(`${__hooks}/request.js`);

    const { image, mediaType } = readImage(e.requestInfo().body || {});
    return e.json(200, claude.readLabel(image, mediaType));
  },
  $apis.requireAuth("users"),
);
