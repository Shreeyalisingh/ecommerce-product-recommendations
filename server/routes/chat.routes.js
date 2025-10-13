import express from "express";
import dotenv from "dotenv";
import { pdfUpload, ask, recommend } from "../controllers/chat.controllers.js";

dotenv.config();

const router = express.Router();

// PDF upload and ask endpoints are implemented in controllers
router.post("/pdf-upload", pdfUpload);
router.post("/ask", ask);




export default router;
