import multer from "multer";
import { createRequire } from 'module';
import { PDFParse } from 'pdf-parse';
import axios from "axios";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import UserInteraction from "../models/UserInteraction.js";
import CatalogUpload from "../models/CatalogUpload.js";

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

// Helper function to parse products from extracted PDF text using multiple strategies
const parseProductsFromText = async (text) => {
  console.log('Starting product extraction from text...');
  let products = [];
  
  // Strategy 1: Try regex-based parsing for structured formats
  products = parseProductsWithRegex(text);
  
  if (products.length > 0) {
    console.log(`Regex parsing found ${products.length} products`);
    return products;
  }
  
  // Strategy 2: Try LLM-based extraction for unstructured text
  try {
    console.log('Regex parsing found no products, trying LLM extraction...');
    products = await parseProductsWithLLM(text);
    if (products.length > 0) {
      console.log(`LLM extraction found ${products.length} products`);
      return products;
    }
  } catch (err) {
    console.warn('LLM extraction failed:', err.message);
  }
  
  // Strategy 3: Try line-by-line heuristic parsing
  products = parseProductsHeuristic(text);
  console.log(`Heuristic parsing found ${products.length} products`);
  
  return products;
};

// Strategy 1: Regex-based parsing for structured formats
const parseProductsWithRegex = (text) => {
  const products = [];
  let idCounter = 1;
  
  // Pattern 1: Product Name - Category - $Price - Description
  const pattern1 = /^(.+?)\s*[-–]\s*(.+?)\s*[-–]\s*\$(\d+(?:\.\d{2})?)\s*[-–]\s*(.+?)$/gm;
  
  // Pattern 2: Product: Name | Category | Price: $XX.XX | Description
  const pattern2 = /Product:\s*(.+?)\s*\|\s*(.+?)\s*\|\s*Price:\s*\$(\d+(?:\.\d{2})?)\s*\|\s*(.+?)$/gim;
  
  // Pattern 3: Name, Category, $Price, Description (CSV-like)
  const pattern3 = /^["']?([^,\n]+?)["']?,\s*["']?([^,\n]+?)["']?,\s*\$?(\d+(?:\.\d{2})?),\s*["']?(.+?)["']?$/gm;
  
  // Pattern 4: JSON-like format
  const pattern4 = /"name":\s*"([^"]+)"[^}]*"category":\s*"([^"]+)"[^}]*"price":\s*(\d+(?:\.\d{2})?)[^}]*"description":\s*"([^"]+)"/gi;
  
  const patterns = [pattern1, pattern2, pattern3, pattern4];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [, title, category, price, description] = match;
      
      if (title && category && price && description) {
        products.push({
          title: title.trim(),
          category: category.trim(),
          price: parseFloat(price),
          description: description.trim(),
          tags: extractTags(description.trim() + ' ' + category.trim()),
          sku: `SKU-${Date.now()}-${idCounter++}`,
          stock: Math.floor(Math.random() * 100) + 1
        });
      }
    }
    
    if (products.length > 0) break; // Stop if we found products with this pattern
  }
  
  return products;
};

// Strategy 2: LLM-based extraction for unstructured text
const parseProductsWithLLM = async (text) => {
  const prompt = `Extract all products from the following catalog text. Return ONLY a valid JSON array of products with this exact structure:
[
  {
    "title": "Product Name",
    "category": "Category Name", 
    "price": 99.99,
    "description": "Product description"
  }
]

Rules:
- Extract ALL products mentioned in the text
- Price must be a number (no $ symbol)
- Keep descriptions concise (under 200 chars)
- If category is unclear, infer from context
- Return ONLY the JSON array, no other text

Catalog text:
${text.substring(0, 8000)}`;

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a product catalog parser. Return only valid JSON arrays." },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.1
      },
      {
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
        timeout: 30000
      }
    );
    
    const content = response.data.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const parsedProducts = JSON.parse(jsonStr);
    
    // Validate and add additional fields
    return parsedProducts.map((p, i) => ({
      title: p.title || 'Unknown Product',
      category: p.category || 'General',
      price: parseFloat(p.price) || 0,
      description: p.description || '',
      tags: extractTags((p.description || '') + ' ' + (p.category || '')),
      sku: `SKU-${Date.now()}-${i + 1}`,
      stock: Math.floor(Math.random() * 100) + 1
    })).filter(p => p.title && p.price > 0);
    
  } catch (err) {
    console.error('LLM extraction error:', err.message);
    return [];
  }
};

// Strategy 3: Heuristic line-by-line parsing
const parseProductsHeuristic = (text) => {
  const products = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  
  let currentProduct = null;
  let idCounter = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for price indicators
    const priceMatch = line.match(/\$\s*(\d+(?:\.\d{2})?)/);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      
      // Try to find product name (usually before or on same line as price)
      const titleMatch = line.replace(/\$\s*\d+(?:\.\d{2})?/, '').trim();
      
      if (titleMatch.length > 3) {
        // Look ahead for description
        const description = lines[i + 1] || titleMatch;
        
        // Try to infer category from keywords
        const category = inferCategory(titleMatch + ' ' + description);
        
        currentProduct = {
          title: titleMatch.substring(0, 100),
          category: category,
          price: price,
          description: description.substring(0, 200),
          tags: extractTags(titleMatch + ' ' + description),
          sku: `SKU-${Date.now()}-${idCounter++}`,
          stock: Math.floor(Math.random() * 100) + 1
        };
        
        products.push(currentProduct);
      }
    }
  }
  
  return products;
};

// Infer category from text
const inferCategory = (text) => {
  const lower = text.toLowerCase();
  
  const categories = {
    'footwear': ['shoe', 'boot', 'sneaker', 'sandal', 'slipper', 'footwear'],
    'clothing': ['shirt', 'pant', 'jacket', 'dress', 'skirt', 'clothing', 'apparel', 'wear'],
    'electronics': ['phone', 'laptop', 'computer', 'tablet', 'camera', 'electronic'],
    'sports': ['sport', 'fitness', 'running', 'gym', 'exercise', 'athletic'],
    'accessories': ['bag', 'watch', 'jewelry', 'accessory', 'belt', 'hat'],
    'home': ['furniture', 'decor', 'kitchen', 'bedding', 'home'],
    'beauty': ['cosmetic', 'makeup', 'skincare', 'beauty', 'perfume'],
    'books': ['book', 'novel', 'textbook', 'magazine', 'publication']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  
  return 'general';
};

// Deduplicate products based on title similarity
const deduplicateProducts = (products) => {
  const uniqueProducts = [];
  const seenTitles = new Set();
  
  for (const product of products) {
    const normalizedTitle = product.title.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check for exact match
    if (!seenTitles.has(normalizedTitle)) {
      // Check for very similar titles (fuzzy match)
      const isSimilar = Array.from(seenTitles).some(existingTitle => {
        return calculateSimilarity(normalizedTitle, existingTitle) > 0.85;
      });
      
      if (!isSimilar) {
        seenTitles.add(normalizedTitle);
        uniqueProducts.push(product);
      }
    }
  }
  
  return uniqueProducts;
};

// Calculate string similarity (Levenshtein distance based)
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance implementation
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Extract tags from description text
const extractTags = (text) => {
  if (!text) return [];
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'from', 'have', 'has', 'will', 'been']);
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const tags = words
    .filter(w => w.length > 3 && !commonWords.has(w))
    .slice(0, 8);
  return [...new Set(tags)];
};

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

      // Save catalog upload to database
      const catalogUpload = new CatalogUpload({
        fileName: req.file.originalname,
        fileSize: req.file.size,
        extractedText: extractedText,
        textLength: extractedText.length,
        sessionId: req.headers['x-session-id'] || 'default-session',
        userId: req.headers['x-user-id'] || 'anonymous',
        status: 'uploaded'
      });
      
      await catalogUpload.save();

      // Try to parse and extract products from the text
      let extractedProducts = [];
      let insertedCount = 0;
      let duplicateCount = 0;
      
      try {
        console.log('Starting product extraction...');
        extractedProducts = await parseProductsFromText(extractedText);
        console.log(`Extracted ${extractedProducts.length} products from text`);
        
        if (extractedProducts.length > 0) {
          // Remove duplicates based on title similarity
          const uniqueProducts = deduplicateProducts(extractedProducts);
          console.log(`After deduplication: ${uniqueProducts.length} unique products`);
          
          // Insert products one by one to handle duplicates gracefully
          for (const product of uniqueProducts) {
            try {
              const newProduct = new Product(product);
              await newProduct.save();
              insertedCount++;
              
              // Add to in-memory catalog
              productCatalog.push({
                id: newProduct._id.toString(),
                title: newProduct.title,
                category: newProduct.category,
                price: newProduct.price,
                description: newProduct.description,
                tags: newProduct.tags || []
              });
            } catch (insertErr) {
              if (insertErr.code === 11000) {
                // Duplicate SKU
                duplicateCount++;
                console.log(`Duplicate product skipped: ${product.title}`);
              } else {
                console.warn(`Failed to insert product "${product.title}":`, insertErr.message);
              }
            }
          }
          
          catalogUpload.productsExtracted = insertedCount;
          catalogUpload.status = insertedCount > 0 ? 'processed' : 'uploaded';
          catalogUpload.metadata = {
            totalExtracted: extractedProducts.length,
            uniqueProducts: uniqueProducts.length,
            insertedCount: insertedCount,
            duplicateCount: duplicateCount
          };
          await catalogUpload.save();
          
          console.log(`Successfully inserted ${insertedCount} products to database`);
        } else {
          console.log('No products found in PDF text');
          catalogUpload.status = 'uploaded';
          catalogUpload.metadata = { note: 'No products could be extracted from the text' };
          await catalogUpload.save();
        }
      } catch (parseErr) {
        console.error('Product parsing/insertion error:', parseErr);
        catalogUpload.status = 'failed';
        catalogUpload.metadata = { error: parseErr.message };
        await catalogUpload.save();
      }

      res.json({ 
        message: "PDF uploaded and text extracted successfully.", 
        textLength: extractedText.length, 
        preview: extractedText.substring(0, 200) + (extractedText.length > 200 ? "..." : ""),
        catalogId: catalogUpload._id,
        productsExtracted: insertedCount,
        totalFound: extractedProducts.length,
        duplicatesSkipped: duplicateCount,
        status: catalogUpload.status
      });
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

    // Save user interaction to database
    const interaction = new UserInteraction({
      sessionId: req.headers['x-session-id'] || 'default-session',
      userId: req.headers['x-user-id'] || 'anonymous',
      interactionType: 'query',
      query: query,
      aiResponse: answer,
      metadata: {
        contextLength: context.length,
        queryLength: query.length,
        model: response.data.model
      }
    });
    
    await interaction.save();

    res.json({ 
      answer, 
      contextLength: context.length, 
      queryLength: query.length,
      interactionId: interaction._id
    });
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

  // Fetch products from database if catalog is empty
  if (!productCatalog || productCatalog.length === 0) {
    try {
      const dbProducts = await Product.find().limit(100).lean();
      if (dbProducts.length > 0) {
        productCatalog = dbProducts.map(p => ({
          id: p._id.toString(),
          title: p.title,
          description: p.description,
          category: p.category,
          price: p.price,
          tags: p.tags || []
        }));
      }
    } catch (dbErr) {
      console.error('Database product fetch error:', dbErr);
    }
  }

  if (!productCatalog || productCatalog.length === 0) {
    return res.status(400).json({ error: "No product catalog available. Upload via /catalog or add products to database" });
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

    // Save recommendation interaction to database
    const interaction = new UserInteraction({
      sessionId: req.headers['x-session-id'] || 'default-session',
      userId: req.headers['x-user-id'] || 'anonymous',
      interactionType: 'recommendation_shown',
      products: top.map(p => ({
        productId: p.id,
        productTitle: p.title,
        relevanceScore: p.score
      })),
      aiResponse: explanation,
      metadata: { behavior }
    });
    
    await interaction.save();

    res.json({ 
      recommendations: top, 
      explanation,
      interactionId: interaction._id
    });
  } catch (err) {
    console.error("Recommendation error", err);
    res.status(500).json({ error: "Failed to generate recommendations", details: err.message });
  }
};

// Get all products from database
export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, limit = 50, skip = 0 } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }
    
    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 })
      .lean();
    
    const total = await Product.countDocuments(query);
    
    res.json({ products, total, count: products.length });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
};

// Get user interactions from database
export const getUserInteractions = async (req, res) => {
  try {
    const { sessionId, userId, type, limit = 50, skip = 0 } = req.query;
    
    const query = {};
    if (sessionId) query.sessionId = sessionId;
    if (userId) query.userId = userId;
    if (type) query.interactionType = type;
    
    const interactions = await UserInteraction.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ timestamp: -1 })
      .populate('products.productId')
      .lean();
    
    const total = await UserInteraction.countDocuments(query);
    
    res.json({ interactions, total, count: interactions.length });
  } catch (err) {
    console.error('Get interactions error:', err);
    res.status(500).json({ error: 'Failed to fetch interactions', details: err.message });
  }
};

// Create or update a product manually
export const createProduct = async (req, res) => {
  try {
    const { title, description, category, price, tags, stock, sku } = req.body;
    
    if (!title || !description || !category || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: title, description, category, price' });
    }
    
    const product = new Product({
      title,
      description,
      category,
      price,
      tags: tags || [],
      stock: stock || 0,
      sku: sku || `SKU-${Date.now()}`
    });
    
    await product.save();
    
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    console.error('Create product error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Product with this SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
};