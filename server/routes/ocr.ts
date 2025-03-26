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
  console.log('OCR /analyze endpoint hit. Headers:', req.headers);
  console.log('OCR request body:', req.body);
  console.log('OCR request file:', req.file ? 'File received' : 'No file received');
  
  try {
    if (!req.file) {
      console.error('OCR Analysis Error: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);
    
    // Extract inspection type from form data if available
    const inspectionType = req.body.inspectionType as string | undefined;
    if (inspectionType) {
      console.log(`Inspection type specified: ${inspectionType}`);
    }

    // For debugging: Log some info about the file buffer
    console.log(`File buffer received: ${req.file.buffer.length} bytes`);
    
    // Process the document with Azure OCR service
    let result;
    try {
      // Call the OCR service to analyze the document
      result = await ocrService.analyzeDocument(req.file.buffer, inspectionType);
      
      // Validate the results
      if (!result || !result.results || !Array.isArray(result.results)) {
        throw new Error('OCR service returned invalid results structure');
      }
      
      console.log('OCR Analysis completed successfully', {
        issueCount: result.results.length,
        averageConfidence: result.analytics.confidence,
        categories: Object.keys(result.analytics.issueTypes)
      });
      
      // Log detailed results for debugging if needed
      if (result.results.length > 0) {
        console.log('Sample OCR result:', {
          firstItem: {
            text: result.results[0].text,
            category: result.results[0].category,
            confidence: result.results[0].confidence
          },
          totalItems: result.results.length
        });
      } else {
        console.log('No OCR results detected in the document');
      }
    } catch (ocrError) {
      // If OCR service fails, propagate the error to the client
      console.error('OCR service error:', ocrError);
      throw new Error(`OCR analysis failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`);
    }

    // Send back the result
    console.log('Sending OCR response back to client');
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OCR Analysis Error:', {
      error: errorMessage,
      fileInfo: req.file ? {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      } : 'No file data'
    });
    res.status(500).json({ 
      error: 'Failed to process document',
      details: errorMessage
    });
  }
});

export default router;