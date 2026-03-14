import express from "express";
import multer from "multer";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const NUTRITION_PROMPT = `You are a nutrition analysis AI. Analyze the food in this image.
Identify food items, estimate portion sizes, and calculate approximate nutrition values.
Return ONLY a valid JSON object, no markdown, no explanation:
{"foodItems":["item1","item2"],"calories":number,"protein":number,"carbs":number,"fat":number}`;

// --- Groq (primary) ---
async function analyzeWithGroq(imageBase64, mimeType) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const groq = new Groq({ apiKey });
  console.log("📡 Calling Groq (meta-llama/llama-4-scout-17b-16e-instruct)...");

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: NUTRITION_PROMPT },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 512,
  });

  return response.choices[0]?.message?.content?.trim();
}

// --- Gemini (fallback) ---
async function analyzeWithGemini(imageBase64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  console.log("📡 Calling Gemini (gemini-2.0-flash) as fallback...");

  const result = await model.generateContent([
    NUTRITION_PROMPT,
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  return result.response.text().trim();
}

router.post("/analyze-meal", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("📷 Image received:", req.file.originalname, "size:", req.file.size, "mime:", req.file.mimetype);

    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    const startTime = Date.now();
    let text;

    // Try Groq first, fall back to Gemini
    try {
      text = await analyzeWithGroq(imageBase64, mimeType);
      console.log(`✅ Groq responded in ${Date.now() - startTime}ms`);
    } catch (groqErr) {
      console.warn("⚠️ Groq failed:", groqErr.message);
      console.log("🔄 Falling back to Gemini...");
      text = await analyzeWithGemini(imageBase64, mimeType);
      console.log(`✅ Gemini responded in ${Date.now() - startTime}ms`);
    }

    console.log("📄 Raw response:", text.substring(0, 300));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "AI response parsing failed", raw: text });
    }

    const nutrition = JSON.parse(jsonMatch[0]);
    console.log("✅ Parsed nutrition:", JSON.stringify(nutrition));

    res.json(nutrition);
  } catch (error) {
    console.error("❌ Meal analysis error:", error.message);
    res.status(500).json({ error: "Meal analysis failed", message: error.message });
  }
});

export default router;