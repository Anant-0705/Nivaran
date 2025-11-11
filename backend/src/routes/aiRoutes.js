// src/routes/aiRoutes.js
const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const router = express.Router();
const upload = multer(); // memory storage

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/verify";
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
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fd = new FormData();
    fd.append("file", req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

    const response = await axios.post(AI_URL, fd, {
      headers: { ...fd.getHeaders() },
      timeout: 20000, // 20s
    });

    return res.json(response.data);
  } catch (err) {
    console.error("AI verify error:", err.message || err);
    return res.status(500).json({ error: "AI service error" });
  }
});

module.exports = router;
