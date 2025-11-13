// src/routes/aiRoutes.js
const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const router = express.Router();
const upload = multer(); // memory storage

const AI_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000") + "/verify";
const API_KEY = process.env.INTERNAL_API_KEY || ""; // optional: require key from app

// Middleware to check API key (optional)
router.use((req, res, next) => {
  // If you want to protect this endpoint with an API key from the mobile app:
  const clientKey = req.headers["x-api-key"];
  if (API_KEY && clientKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

router.post("/verify", upload.single("photo"), async (req, res) => {
  console.log('🔴 [BACKEND] AI verify endpoint hit');
  console.log('🔴 [BACKEND] Method:', req.method);
  console.log('🔴 [BACKEND] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔴 [BACKEND] File received:', req.file ? 'YES' : 'NO');
  if (req.file) {
    console.log('🔴 [BACKEND] File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  }
  console.log('🔴 [BACKEND] AI_URL:', AI_URL);
  
  try {
    if (!req.file) {
      console.log('❌ [BACKEND] No file uploaded');
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('🔄 [BACKEND] Creating form data for AI service...');
    const fd = new FormData();
    fd.append("file", req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

    console.log('🔄 [BACKEND] Sending request to AI service:', AI_URL);
    const response = await axios.post(AI_URL, fd, {
      headers: { ...fd.getHeaders() },
      timeout: 20000, // 20s
    });

    console.log('✅ [BACKEND] AI service response status:', response.status);
    console.log('✅ [BACKEND] AI service response data:', response.data);
    return res.json(response.data);
  } catch (err) {
    console.error("❌ [BACKEND] AI verify error:", err.message || err);
    console.error("❌ [BACKEND] Error details:", {
      code: err.code,
      response: err.response?.data,
      status: err.response?.status
    });
    return res.status(500).json({ error: "AI service error", details: err.message });
  }
});

module.exports = router;
