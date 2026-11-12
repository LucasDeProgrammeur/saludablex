// Food recognition via the Claude API (vision + structured outputs).
// Loaded with require() from food.pb.js. PocketBase's JS runtime has no npm
// packages, so this talks to the Messages API over plain HTTP ($http.send).

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-5-5";

const MICROS = {
  vitamin_a_ug: { type: "number", description: "Vitamin A, micrograms RAE" },
  vitamin_c_mg: { type: "number", description: "Vitamin C, milligrams" },
  vitamin_d_ug: { type: "number", description: "Vitamin D, micrograms" },
  vitamin_b6_mg: { type: "number", description: "Vitamin B6, milligrams" },
  vitamin_b9_ug: { type: "number", description: "Vitamin B9 (folate), micrograms DFE" },
  vitamin_b12_ug: { type: "number", description: "Vitamin B12, micrograms" },
  calcium_mg: { type: "number", description: "Calcium, milligrams" },
  iron_mg: { type: "number", description: "Iron, milligrams" },
  potassium_mg: { type: "number", description: "Potassium, milligrams" },
  sodium_mg: { type: "number", description: "Sodium, milligrams" },
  fiber_g: { type: "number", description: "Dietary fiber, grams" },
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recognized", "items", "notes"],
  properties: {
    recognized: {
      type: "boolean",
      description: "false when the photo does not show food or drink",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "portion", "grams", "calories", "carbs", "fat", "protein", "confidence", "micros"],
        properties: {
          name: { type: "string", description: "Short food name, e.g. 'Grilled chicken breast'" },
          portion: { type: "string", description: "Human-readable portion, e.g. '1 medium (180 g)'" },
          grams: { type: "number", description: "Estimated weight of the visible portion in grams" },
          calories: { type: "number", description: "kcal for the estimated portion" },
          carbs: { type: "number", description: "Carbohydrates in grams for the portion" },
          fat: { type: "number", description: "Fat in grams for the portion" },
          protein: { type: "number", description: "Protein in grams for the portion" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          micros: {
            type: "object",
            additionalProperties: false,
            required: Object.keys(MICROS),
            properties: MICROS,
          },
        },
      },
    },
    notes: {
      type: "string",
      description: "One short sentence on assumptions (hidden ingredients, portion uncertainty). Empty if none.",
    },
  },
};

const PROMPT = [
  "You are a nutrition assistant inside a calorie-tracking app.",
  "Identify each distinct food or drink visible in the photo and estimate the portion that is actually shown.",
  "Give nutrition values for that estimated portion (not per 100 g), based on standard food composition data",
  "(e.g. USDA FoodData Central). Account for visible cooking methods, oils and sauces.",
  "If a packaged product with a readable label is shown, prefer the label values.",
  "Split a plate into its components when they are clearly separate (e.g. rice, chicken, salad).",
  "If the photo shows no food or drink, set recognized to false and return an empty items list.",
].join(" ");

// Label micros may be missing from a package; null means "not on the label".
const LABEL_MICROS = {};
Object.keys(MICROS).forEach((key) => {
  LABEL_MICROS[key] = { type: ["number", "null"], description: MICROS[key].description + " per 100 g, null if not on the label" };
});

const LABEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recognized", "brand", "serving_grams", "calories", "carbs", "fat", "protein", "micros"],
  properties: {
    recognized: {
      type: "boolean",
      description: "false when no readable nutrition facts label is visible",
    },
    brand: { type: "string", description: "Brand name. Empty if unknown." },
    serving_grams: { type: "number", description: "Serving size in grams (or ml) per the label, 0 if none" },
    calories: { type: "number", description: "kcal per 100 g" },
    carbs: { type: "number", description: "Carbohydrates in grams per 100 g" },
    fat: { type: "number", description: "Fat in grams per 100 g" },
    protein: { type: "number", description: "Protein in grams per 100 g" },
    micros: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(LABEL_MICROS),
      properties: LABEL_MICROS,
    },
  },
};

const LABEL_PROMPT = [
  "You read nutrition facts labels for a calorie-tracking app.",
  "Read the nutrition facts from the package in the photo and return them per 100 g (or per 100 ml for drinks).",
  "If the label only lists values per serving, convert them to per 100 g using the serving size.",
  "If it lists kJ only, convert to kcal (divide by 4.184).",
  "Use the brand name from the package when visible.",
  "Only report micronutrients that are on the label; use null for the rest.",
  "If no readable nutrition label is visible, set recognized to false and use 0 / empty values.",
].join(" ");

/** Sends one message to the Messages API and returns the parsed JSON answer. */
function callClaude(content, schema, what) {
  const apiKey = $os.getenv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new InternalServerError(what + " is not configured (ANTHROPIC_API_KEY missing).");
  }

  const res = $http.send({
    url: API_URL,
    method: "POST",
    timeout: 120,
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
      // If Claude declines on a safety classifier, retry server-side on a fallback model
      "anthropic-beta": "server-side-fallback-2026-07-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      fallbacks: "default",
      output_config: {
        format: { type: "json_schema", schema: schema },
      },
      messages: [{ role: "user", content: content }],
    }),
  });

  const data = res.json || {};

  if (res.statusCode !== 200) {
    const message = (data.error && data.error.message) || "Unknown error";
    console.error("Claude API error", res.statusCode, message);
    if (res.statusCode === 429 || res.statusCode === 529) {
      throw new BadRequestError(what + " is busy right now, please try again in a moment.");
    }
    throw new InternalServerError(what + " failed.");
  }

  if (data.stop_reason === "refusal") {
    throw new BadRequestError("This photo could not be analysed. Try another photo or enter it manually.");
  }
  if (data.stop_reason === "max_tokens") {
    throw new InternalServerError(what + " response was cut off, please try again.");
  }

  // With thinking on, content also holds thinking blocks; the JSON answer is the text block.
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) {
    throw new InternalServerError(what + " returned no result.");
  }

  return JSON.parse(textBlock.text);
}

function imageBlock(imageBase64, mediaType) {
  return { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } };
}

/** Describes saved label references so Claude can use them instead of estimates. */
function describeReferences(references) {
  const lines = references.map((r) => {
    const micros = Object.keys(r.micros || {})
      .filter((key) => typeof r.micros[key] === "number")
      .map((key) => key + " " + r.micros[key])
      .join(", ");
    return (
      "- " + r.name + (r.brand ? " (" + r.brand + ")" : "") +
      ": " + r.calories + " kcal, carbs " + r.carbs + " g, fat " + r.fat + " g, protein " + r.protein + " g" +
      (micros ? ", " + micros : "") +
      (r.serving_grams ? "; one serving is " + r.serving_grams + " g" : "")
    );
  });
  return [
    "The user says the meal contains these packaged products. Their nutrition labels, per 100 g (or 100 ml):",
    lines.join("\n"),
    "For the items that match these products, use the label values scaled to the estimated portion",
    "instead of generic estimates, use the product name as the item name, and set confidence to high",
    "unless the portion itself is uncertain. Still estimate any other food in the photo as usual.",
  ].join("\n");
}

/**
 * @param {string} imageBase64 base64 image data without a data: prefix
 * @param {string} mediaType image/jpeg | image/png | image/webp
 * @param {string} hint optional user description ("half portion", "with oat milk")
 * @param {Array} references label references (per 100 g) the user picked for this meal
 */
function analyzeFood(imageBase64, mediaType, hint, references) {
  let text = PROMPT;
  if (references && references.length) text += "\n\n" + describeReferences(references);
  if (hint) text += "\n\nThe user added this note: " + hint;

  return callClaude([imageBlock(imageBase64, mediaType), { type: "text", text: text }], SCHEMA, "Food recognition");
}

/**
 * Reads a nutrition facts label, values per 100 g.
 * @param {string} imageBase64 base64 image data without a data: prefix
 * @param {string} mediaType image/jpeg | image/png | image/webp
 */
function readLabel(imageBase64, mediaType) {
  return callClaude(
    [imageBlock(imageBase64, mediaType), { type: "text", text: LABEL_PROMPT }],
    LABEL_SCHEMA,
    "Label reading",
  );
}

module.exports = { analyzeFood, readLabel };
