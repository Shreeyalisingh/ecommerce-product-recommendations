import express from "express";
import dotenv from "dotenv";
import { 
  pdfUpload, 
  ask, 
  recommend, 
  getProducts, 
  getUserInteractions, 
  createProduct 
} from "../controllers/chat.controllers.js";

dotenv.config();

const router = express.Router();

// PDF upload and ask endpoints
router.post("/pdf-upload", pdfUpload);
router.post("/ask", ask);

// Recommendation endpoint
router.post("/recommend", recommend);

// Product management endpoints
router.get("/products", getProducts);
router.post("/products", createProduct);

// User interaction tracking endpoints
router.get("/interactions", getUserInteractions);

export default router;
