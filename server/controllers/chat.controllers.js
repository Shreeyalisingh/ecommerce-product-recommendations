import multer from "multer";
import { createRequire } from 'module';
import { PDFParse } from 'pdf-parse';
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"));
  },
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

let pdf = "";
let productCatalog = [];

// Same multi-strategy PDF parsing helper used in routes
const tryMultiplePdfParsers = async (pdfBuffer) => {
  const strategies = [
    // Strategy 1: standard pdf-parse
    async () => {
      const buffer = new PDFParse({ data: pdfBuffer });
      const data = await buffer.getText();
      return data?.text ?? "";
    },

    // Strategy 2: pdf-parse with options
    async () => {
      const buffer = await PDFParse(pdfBuffer, { max: 0, version: "v1.10.100" });
      const data = await buffer.getText();
      return data?.text ?? "";
    },

    // Strategy 3: custom pagerender
    async () => {
      const buffer = await PDFParse(pdfBuffer, {
        max: 0,
        pagerender: async (pageData) => {
          try {
            const textContent = await pageData.getTextContent();
            let lastY;
            let text = "";
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) text += item.str;
              else text += "\n" + item.str;
              lastY = item.transform[5];
            }
            return text;
          } catch (error) {
            return pageData.getTextContent().then((content) => content.items.map((i) => i.str).join(" "));
          }
        },
      });
        const data = await buffer.getText();
      return data?.text ?? "";
    },

    // Strategy 4: fallback with normalization options
    async () => {
      const buffer = await PDFParse(pdfBuffer, { max: 0, normalizeWhitespace: true, disableCombineTextItems: false });
      const data = await buffer.getText();
      return data?.text ?? "";
    },
  ];

  let lastError = null;
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`Trying PDF parsing strategy ${i + 1}`);
      const result = await strategies[i]();
      if (result && result.trim().length > 0) {
        console.log(`Strategy ${i + 1} succeeded, extracted ${result.length} chars`);
        return result;
      }
      console.log(`Strategy ${i + 1} returned empty text`);
    } catch (error) {
      console.warn(`Strategy ${i + 1} failed: ${error?.message ?? error}`);
      lastError = error;
    }
  }

  throw lastError || new Error("All PDF parsing strategies failed to extract text");
};

export const pdfUpload = (req, res) => {
  const uploadSingle = upload.single("pdf");

  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      if (err.code === "UNEXPECTED_FIELD") {
        return res.status(400).json({
          error: 'Unexpected field error. Expected field name: "pdf"',
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size allowed is 10MB" });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    if (req.file.size === 0) return res.status(400).json({ error: "Uploaded file is empty" });

    if (req.file.size > 10 * 1024 * 1024) return res.status(400).json({ error: "File size exceeds 10MB limit" });

    try {
      const pdfBuffer = req.file.buffer;
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (!pdfHeader.startsWith("%PDF")) {
        return res.status(400).json({ error: "Invalid PDF file. The file does not appear to be a valid PDF document." });
      }

      const extractedText = await tryMultiplePdfParsers(pdfBuffer);
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: "No text content could be extracted from the PDF. The file might be image-based or corrupted." });
      }

      pdf = extractedText;
      res.json({ message: "PDF uploaded and text extracted successfully.", textLength: extractedText.length, preview: extractedText.substring(0, 200) + (extractedText.length > 200 ? "..." : "") });
    } catch (parseErr) {
      console.error("PDF parsing error:", parseErr);
      let errorMessage = "Failed to parse PDF: ";
      if (parseErr.message.includes("bad XRef entry")) {
        errorMessage += "The PDF file appears to be corrupted or has invalid cross-reference entries. Please try with a different PDF file.";
      } else if (parseErr.message.includes("Invalid PDF structure")) {
        errorMessage += "The PDF file structure is invalid. Please ensure the file is not corrupted.";
      } else if (parseErr.message.includes("Encrypted PDF")) {
        errorMessage += "The PDF file is password-protected or encrypted. Please upload an unprotected PDF.";
      } else {
        errorMessage += `${parseErr.message}. This might be due to a corrupted file, unsupported PDF version, or password protection.`;
      }

      res.status(500).json({ error: errorMessage, details: process.env.NODE_ENV === "development" ? parseErr.stack : undefined });
    }
  });
};

export const ask = async (req, res) => {
    console.log("ask hit");
  const { query } = req.body;
  if (!query || query.trim().length === 0) return res.status(400).json({ error: "Query cannot be empty" });
  if (!pdf || pdf.trim().length === 0) return res.status(400).json({ error: "No PDF content available. Please upload a PDF file first." });

  const maxContextLength = 8000;
  const context = pdf.length > maxContextLength ? pdf.substring(0, maxContextLength) + "\n[Content truncated...]" : pdf;

  try {
    const models = ["anthropic/claude-4.5-sonnet", "openai/gpt-4o-mini", "mistralai/mistral-7b-instruct"];
    let response;
    let lastError;

    for (const model of models) {
      try {
        response = await axios.post(
          OPENROUTER_API_URL,
          {
            model,
            messages: [
              {
                role: "system",
                content: `You are a helpful AI assistant specialized in e-commerce product recommendations.\nYour task is to help explain why certain products are being recommended based on the provided product catalog and user behavior data.\nGuidelines for responses:\n1. Use only the provided product catalog and the user's behavior to justify recommendations.\n2. Provide concise, factual explanations for "Why this product?" focusing on matching attributes, past user actions, and inferred preferences.\n3. If the catalog lacks information needed to justify a recommendation, state what data is missing.\n4. Keep explanations user-friendly and actionable (e.g., mention features the user cares about).`,
              },
              { role: "user", content: `Please analyze the following product catalog context and user question. Use only the catalog and user behavior to answer. If the catalog does not contain necessary details to justify a recommendation, explicitly state what's missing.\n\nCatalog / Context:\n${context}\n\nQuestion: ${query}\n\nProvide a concise answer and, if appropriate, suggest minimum 2 recommended products with short justifications.` },
            ],
            max_tokens: 1024,
            temperature: 0.3,
          },
          {
            headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            timeout: 30000,
          }
        );
        if (response?.data?.choices?.[0]) break;
      } catch (modelError) {
        lastError = modelError;
        continue;
      }
    }

    if (!response) throw lastError || new Error("All models failed to respond");
    if (!response.data || !response.data.choices || !response.data.choices[0]) throw new Error("Invalid response format from AI service");

    const answer = response.data.choices[0].message.content;
    console.log(answer)
    if (!answer || answer.trim().length === 0) return res.status(500).json({ error: "AI service returned an empty response. Please try again." });

    res.json({ answer   , contextLength: context.length, queryLength: query.length });
  } catch (error) {
    console.error("Error querying AI service:", error.response?.data || error.message);

    // Detect OpenRouter billing/credit errors (they return a 402 or an error.code === 402)
    const orErrorCode = error.response?.data?.error?.code || error.response?.status;
    if (orErrorCode === 402) {
      // Attempt a simple local fallback: keyword snippet search in the uploaded PDF text
      try {
        const fallback = (() => {
          const q = query.toLowerCase();
          const sentences = pdf.split(/(?<=\.|\?|!)\s+/g);
          const hits = sentences.filter((s) => s.toLowerCase().includes(q));
          if (hits.length > 0) return `LLM unavailable (billing). Found ${hits.length} matching snippet(s) from the uploaded document:\n\n${hits.slice(0,5).join('\n\n')}`;

          // if exact query not found, search by keywords
          const kws = Array.from(new Set(q.split(/\W+/).filter(Boolean))).slice(0,6);
          const kwHits = sentences.filter((s) => kws.some((k) => s.toLowerCase().includes(k)));
          if (kwHits.length > 0) return `LLM unavailable (billing). Showing relevant snippets from the uploaded document based on keywords (${kws.join(', ')}):\n\n${kwHits.slice(0,5).join('\n\n')}`;

          return null;
        })();

        if (fallback) return res.status(402).json({ error: 'LLM service billing/credits error', details: fallback, help: 'Purchase credits at https://openrouter.ai/settings/credits or use a valid API key on a funded account.' });
      } catch (fallbackErr) {
        console.warn('Fallback snippet extraction failed:', fallbackErr?.message || fallbackErr);
      }

      return res.status(402).json({ error: 'LLM service billing/credits error', details: 'Insufficient credits on the OpenRouter/OpenAI account. Purchase credits at https://openrouter.ai/settings/credits or use a different API key.' });
    }

    let errorMessage = "Failed to get response from AI service";
    if (error.code === "ECONNABORTED") errorMessage = "Request timed out. Please try again.";
    else if (error.response?.status === 401) errorMessage = "AI service authentication failed. Please check API configuration.";
    else if (error.response?.status === 429) errorMessage = "Too many requests. Please wait a moment before trying again.";
    else if (error.response?.status === 413) errorMessage = "Request payload too large. Try with a shorter question or smaller document.";
    else if (error.response?.data?.error) errorMessage = `AI service error: ${error.response.data.error}`;

    res.status(500).json({ error: errorMessage, details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};



// Simple scoring function to rank products for a user based on behavior
const scoreProducts = (catalog, behavior) => {
  // behavior: { viewed: [ids or keywords], purchased: [...], preferences: {categories:[], maxPrice, tags:[]}}
  const scores = catalog.map((product) => {
    let score = 0;

    // Match on category
    if (
      behavior.preferences?.categories &&
      behavior.preferences.categories.includes(product.category)
    )
      score += 30;

    // Price preference
    if (
      typeof behavior.preferences?.maxPrice === "number" &&
      product.price <= behavior.preferences.maxPrice
    )
      score += 20;

    // Tag overlap
    if (Array.isArray(behavior.preferences?.tags)) {
      const overlap = product.tags.filter((t) =>
        behavior.preferences.tags.includes(t)
      ).length;
      score += overlap * 10;
    }

    // Viewed or purchased product id matches
    if (Array.isArray(behavior.viewed)) {
      if (behavior.viewed.includes(product.id)) score += 25;
      // keyword match in title/description
      const viewKeywords = behavior.viewed.filter((v) => typeof v === "string");
      for (const kw of viewKeywords) {
        if (
          product.title.toLowerCase().includes(kw.toLowerCase()) ||
          product.description.toLowerCase().includes(kw.toLowerCase())
        )
          score += 5;
      }
    }

    if (Array.isArray(behavior.purchased) && behavior.purchased.includes(product.id))
      score += 40;

    return { product, score };
  });

  return scores.sort((a, b) => b.score - a.score);
};

export const recommend = async (req, res) => {
    console.log("recommend hit");
  const { behavior, topN = 3 } = req.body;

  if (!behavior || typeof behavior !== "object") {
    return res.status(400).json({ error: "Behavior object is required" });
  }

  if (!productCatalog || productCatalog.length === 0) {
    return res.status(400).json({ error: "No product catalog available. Upload via /catalog" });
  }

  try {
    // Score and pick top products
    const scored = scoreProducts(productCatalog, behavior);
    const top = scored.slice(0, topN).map((s) => ({ ...s.product, score: s.score }));

    // Build a short context for the LLM explaining why these were chosen
    const llmContext = `Catalog excerpt:\n${productCatalog
      .slice(0, 50)
      .map((p) => `- ${p.id}: ${p.title} (${p.category}) $${p.price}`)
      .join("\n")}\n\nUser behavior:\n${JSON.stringify(behavior)}`;

    const prompt = `You are an e-commerce recommendation explainability assistant. Given the catalog excerpt and user behavior, produce a short explanation for each recommended product explaining why it was recommended. Use only the information provided.\n\n${llmContext}\n\nRecommended products:\n${top
      .map((p) => `- ${p.id}: ${p.title}`)
      .join("\n")}`;

    // Query LLM for explanations (reuse models array)
    const models = [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
      "mistralai/mistral-7b-instruct",
    ];

    let llmResponse;
    let lastErr;
    for (const model of models) {
      try {
        llmResponse = await axios.post(
          OPENROUTER_API_URL,
          {
            model: model,
            messages: [
              { role: "system", content: "You produce brief explainability statements." },
              { role: "user", content: prompt },
            ],
            max_tokens: 512,
            temperature: 0.2,
          },
          { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` } }
        );

        if (llmResponse?.data?.choices?.[0]) break;
      } catch (err) {
        lastErr = err;
        continue;
      }
    }

    const explanation = llmResponse?.data?.choices?.[0]?.message?.content;

    // If LLM call failed due to billing (402) or similar, provide a deterministic rule-based explanation fallback
    if (!explanation) {
      const orCode = lastErr?.response?.data?.error?.code || lastErr?.response?.status;
      if (orCode === 402) {
        // Build simple explanations from scoring reasons
        const fallbackExplanations = top.map((p) => {
          const reasons = [];
          if (behavior.preferences?.categories && behavior.preferences.categories.includes(p.category)) reasons.push(`category match: ${p.category}`);
          if (typeof behavior.preferences?.maxPrice === 'number' && p.price <= behavior.preferences.maxPrice) reasons.push(`within budget: $${p.price}`);
          const tagOverlap = (p.tags || []).filter(t => behavior.preferences?.tags?.includes(t)).length;
          if (tagOverlap > 0) reasons.push(`shared tags: ${tagOverlap}`);
          if (behavior.viewed?.includes(p.id)) reasons.push('recently viewed');
          if (behavior.purchased?.includes(p.id)) reasons.push('previously purchased');
          return `- ${p.title}: ${reasons.length ? reasons.join('; ') : 'Recommended based on matching attributes.'}`;
        }).join('\n');

        return res.status(200).json({ recommendations: top, explanation: `LLM unavailable (billing). Fallback explanations:\n\n${fallbackExplanations}`, notice: 'Purchase credits at https://openrouter.ai/settings/credits to enable richer explanations.' });
      }

      // generic fallback message
      const generic = `Could not generate explanation from LLM: ${lastErr?.message ?? 'unknown'}`;
      return res.status(200).json({ recommendations: top, explanation: generic });
    }

    res.json({ recommendations: top, explanation });
  } catch (err) {
    console.error("Recommendation error", err);
    res.status(500).json({ error: "Failed to generate recommendations", details: err.message });
  }
};