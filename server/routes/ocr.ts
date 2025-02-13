import express from 'express';
import multer from 'multer';
import { ocrService } from '../services/ocrService';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, TIFF and PDF files are allowed.'));
    }
  }
});

router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('OCR Analysis Error: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);

    const result = await ocrService.analyzeDocument(req.file.buffer);
    console.log('OCR Analysis completed successfully', {
      issueCount: result.results.length,
      averageConfidence: result.analytics.confidence,
      categories: Object.keys(result.analytics.issueTypes)
    });

    res.json(result);
  } catch (error) {
    console.error('OCR Analysis Error:', error);
    res.status(500).json({ 
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;