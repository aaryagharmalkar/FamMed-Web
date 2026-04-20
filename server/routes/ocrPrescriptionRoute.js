import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { extractMedicineInsightsWithGemini, extractMedicinesWithGemini } from '../services/geminiOcrService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const aiRateLimiter =
  process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        max: Number(process.env.OCR_RATE_LIMIT_MAX || 60),
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests. Please try again later.' },
      })
    : (req, res, next) => next();

router.post('/ocr-prescription', aiRateLimiter, upload.single('image'), async (req, res) => {
  try {
    console.log('[OCR] Received request. File present:', !!req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a prescription image.' });
    }

    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are supported.' });
    }

    console.log('[OCR] File validated. Size:', req.file.size, 'Type:', req.file.mimetype);
    
    const base64Image = req.file.buffer.toString('base64');
    console.log('[OCR] Calling Gemini API...');
    
    const result = await extractMedicinesWithGemini({
      base64Image,
      mimeType: req.file.mimetype,
    });

    console.log('[OCR] Gemini returned:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[OCR] Error:', {
      message: error?.message,
      status: error?.response?.status,
      statusCode: error?.statusCode,
      data: error?.response?.data,
      fullError: error,
    });
    
    const status = Number(error?.response?.status || error?.statusCode || 500);
    const message =
      error?.response?.data?.error?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to process prescription OCR.';

    if (String(message).toLowerCase().includes('invalid json')) {
      return res.status(422).json({ error: 'OCR result was not valid JSON. Please try another image.' });
    }

    if (status === 400) {
      return res.status(400).json({ error: message });
    }

    if (status === 401 || status === 403) {
      return res.status(status).json({ error: 'Gemini API key is missing or invalid.' });
    }

    if (status === 429) {
      return res.status(429).json({ error: 'Gemini is rate limited right now. Please try again shortly.' });
    }

    if (status === 503) {
      return res.status(503).json({ error: 'Gemini is temporarily unavailable. Please try again later.' });
    }

    return res.status(502).json({ error: message });
  }
});

router.post('/medicine-info', aiRateLimiter, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const dosage = String(req.body?.dosage || '').trim();
    const frequency = String(req.body?.frequency || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Medicine name is required.' });
    }

    const result = await extractMedicineInsightsWithGemini({ name, dosage, frequency });
    return res.status(200).json(result);
  } catch (error) {
    const status = Number(error?.response?.status || error?.statusCode || 500);
    const message =
      error?.response?.data?.error?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to fetch medicine insights.';

    if (status === 429) {
      return res.status(429).json({ error: 'Gemini is rate limited right now. Please try again shortly.' });
    }

    if (status === 503) {
      return res.status(503).json({ error: 'Gemini is temporarily unavailable. Please try again later.' });
    }

    return res.status(status >= 400 ? status : 502).json({ error: message });
  }
});

export default router;
