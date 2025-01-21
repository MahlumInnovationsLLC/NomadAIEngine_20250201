import { Router } from 'express';
import multer from 'multer';
import { MailService } from '@sendgrid/mail';
import { db } from '@db';
import { supportTickets } from '@db/schema';
import path from 'path';

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF images are allowed.'));
    }
  },
});

// Initialize SendGrid
let mailService: MailService | null = null;
try {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY environment variable is missing');
  } else {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid initialized with new API key');
  }
} catch (error) {
  console.error('Error initializing SendGrid:', error);
}

router.post('/ticket', upload.single('attachment'), async (req, res) => {
  console.log('Support ticket endpoint hit');
  try {
    // Log request details
    console.log('Request body:', {
      ...req.body,
      attachment: req.file ? 'Present' : 'Not present'
    });

    // Check if SendGrid is properly initialized
    if (!mailService) {
      console.error('Email service not initialized');
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const { name, company, email, notes, title = `Support Request from ${company}` } = req.body;
    const attachment = req.file;

    // Validate required fields
    if (!name || !company || !email || !notes) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!company) missingFields.push('company');
      if (!email) missingFields.push('email');
      if (!notes) missingFields.push('notes');

      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Save ticket to database
    const [ticket] = await db.insert(supportTickets)
      .values({
        title,
        description: notes,
        status: 'open',
        priority: 'medium',
        category: 'general',
        submitterName: name,
        submitterEmail: email,
        submitterCompany: company,
        attachmentUrl: attachment?.originalname,
        metadata: attachment ? {
          originalName: attachment.originalname,
          mimeType: attachment.mimetype,
          size: attachment.size
        } : undefined
      })
      .returning();

    console.log('Ticket saved to database:', ticket);

    // Prepare email content
    const emailContent = `
      <h2>New Support Ticket</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Notes:</strong></p>
      <p>${notes}</p>
    `;

    // Prepare email message
    const msg = {
      to: 'colter@mahluminnovations.com',
      from: 'colter@mahluminnovations.com', // Updated to use a verified sender email
      subject: `Support Ticket: ${company} - ${name}`,
      text: `Support ticket from ${name} (${company})\nEmail: ${email}\nNotes: ${notes}`,
      html: emailContent,
      replyTo: email,
      attachments: [] as any[]
    };

    // Add attachment if present
    if (attachment) {
      console.log('Processing attachment:', {
        filename: attachment.originalname,
        size: attachment.size,
        type: attachment.mimetype
      });

      msg.attachments = [{
        content: attachment.buffer.toString('base64'),
        filename: attachment.originalname,
        type: attachment.mimetype,
        disposition: 'attachment'
      }];
    }

    try {
      console.log('Attempting to send email via SendGrid...');
      const [response] = await mailService.send(msg);

      console.log('SendGrid API Response:', {
        statusCode: response?.statusCode,
        headers: response?.headers,
        body: response?.body
      });

      res.json({
        success: true,
        message: 'Support ticket submitted successfully',
        ticket
      });
    } catch (error: any) {
      console.error('SendGrid Error:', {
        message: error.message,
        response: error.response?.body,
        code: error.code
      });

      // Handle domain verification errors
      if (error.code === 403) {
        return res.status(503).json({
          success: false,
          message: 'Email configuration error. Please try again later.',
          error: 'Sender domain not verified'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Support ticket error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;