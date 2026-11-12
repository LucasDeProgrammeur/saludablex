/// <reference path="../pb_data/types.d.ts" />

// Optional gender on users. Empty → default micronutrient goals,
// "female" → reference intakes for women (see frontend/src/data/nutrients.ts).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.add(new SelectField({ name: "gender", maxSelect: 1, values: ["male", "female"] }));
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.removeByName("gender");
    app.save(users);
  },
);
