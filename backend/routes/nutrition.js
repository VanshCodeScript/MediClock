import express from "express";
import multer from "multer";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const NUTRITION_PROMPT = `You are a nutrition analysis AI. Analyze the food in this image.
Identify food items, estimate portion sizes, and calculate approximate nutrition values.
Return ONLY a valid JSON object, no markdown, no explanation:
{"foodItems":["item1","item2"],"calories":number,"protein":number,"carbs":number,"fat":number}`;

const PRESCRIPTION_PROMPT = `You are a medical prescription OCR extraction AI.
Read this prescription image and extract medications for form autofill.

Rules:
- Return ONLY valid JSON, no markdown, no explanation.
- If data is unclear, keep empty string.
- Normalize frequency to one of: "once daily", "twice daily", "three times daily", "as needed".
- Normalize foodRule to one of: "before food", "after food", "with food", "empty stomach", "none".

Return exactly this shape:
{
  "medications": [
    {
      "name": "",
      "dosage": "",
      "frequency": "once daily",
      "foodRule": "none",
      "reason": ""
    }
  ],
  "notes": ""
}`;

// Convert image to JPEG if needed (Groq supports JPEG/PNG better)
async function convertImageToJpeg(imageBuffer, mimeType) {
  if (mimeType === "image/jpeg" || mimeType === "image/png") {
    return { buffer: imageBuffer, mimeType };
  }

  try {
    console.log(`🔄 Converting ${mimeType} to JPEG...`);
    const jpegBuffer = await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer();
    return { buffer: jpegBuffer, mimeType: "image/jpeg" };
  } catch (error) {
    console.warn(`⚠️ Conversion failed: ${error.message}, using original`);
    return { buffer: imageBuffer, mimeType };
  }
}

// --- Groq (primary) ---
async function analyzeWithGroq(imageBase64, mimeType, prompt = NUTRITION_PROMPT) {
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
          { type: "text", text: prompt },
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
async function analyzeWithGemini(imageBase64, mimeType, prompt = NUTRITION_PROMPT) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  console.log("📡 Calling Gemini (gemini-2.0-flash) as fallback...");

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  return result.response.text().trim();
}

const toAllowedFrequency = (value) => {
  const v = String(value || '').toLowerCase();
  if (v.includes('three') || v.includes('thrice') || v.includes('3')) return 'three times daily';
  if (v.includes('twice') || v.includes('2')) return 'twice daily';
  if (v.includes('need') || v.includes('prn')) return 'as needed';
  return 'once daily';
};

const toAllowedFoodRule = (value) => {
  const v = String(value || '').toLowerCase();
  if (v.includes('before')) return 'before food';
  if (v.includes('after')) return 'after food';
  if (v.includes('with')) return 'with food';
  if (v.includes('empty')) return 'empty stomach';
  return 'none';
};

const parseJsonObjectFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
};

router.post('/analyze-prescription', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { buffer: convertedBuffer, mimeType: convertedMimeType } = await convertImageToJpeg(
      req.file.buffer,
      req.file.mimetype
    );
    const imageBase64 = convertedBuffer.toString('base64');

    let text;
    try {
      text = await analyzeWithGroq(imageBase64, convertedMimeType, PRESCRIPTION_PROMPT);
    } catch (groqErr) {
      console.warn('⚠️ Groq prescription OCR failed:', groqErr.message);
      text = await analyzeWithGemini(imageBase64, convertedMimeType, PRESCRIPTION_PROMPT);
    }

    const parsed = parseJsonObjectFromText(text);
    if (!parsed || !Array.isArray(parsed.medications)) {
      return res.status(500).json({ error: 'Prescription OCR parsing failed', raw: text });
    }

    const medications = parsed.medications
      .map((m) => ({
        name: String(m?.name || '').trim(),
        dosage: String(m?.dosage || '').trim(),
        frequency: toAllowedFrequency(m?.frequency),
        foodRule: toAllowedFoodRule(m?.foodRule),
        reason: String(m?.reason || '').trim(),
      }))
      .filter((m) => m.name || m.dosage || m.reason);

    res.json({
      medications,
      notes: String(parsed.notes || '').trim(),
      source: 'llm-ocr',
    });
  } catch (error) {
    console.error('❌ Prescription OCR error:', error.message);
    res.status(500).json({ error: 'Prescription OCR failed', message: error.message });
  }
});

router.post("/analyze-meal", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("📷 Image received:", req.file.originalname, "size:", req.file.size, "mime:", req.file.mimetype);

    // Convert image to JPEG for better compatibility with Groq
    const { buffer: convertedBuffer, mimeType: convertedMimeType } = await convertImageToJpeg(
      req.file.buffer,
      req.file.mimetype
    );

    const imageBase64 = convertedBuffer.toString("base64");
    const startTime = Date.now();
    let text;

    // Try Groq first, fall back to Gemini
    try {
      text = await analyzeWithGroq(imageBase64, convertedMimeType);
      console.log(`✅ Groq responded in ${Date.now() - startTime}ms`);
    } catch (groqErr) {
      console.warn("⚠️ Groq failed:", groqErr.message);
      console.log("🔄 Falling back to Gemini...");
      text = await analyzeWithGemini(imageBase64, convertedMimeType);
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