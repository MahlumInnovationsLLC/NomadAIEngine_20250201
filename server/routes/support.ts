import { Router } from 'express';
import multer from 'multer';
import { MailService } from '@sendgrid/mail';
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

// Initialize SendGrid with better error handling
let mailService: MailService | null = null;
try {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY environment variable is missing');
  } else {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid API key configured successfully');
  }
} catch (error) {
  console.error('Error initializing SendGrid:', error);
}

router.post('/ticket', upload.single('attachment'), async (req, res) => {
  console.log('Support ticket endpoint hit');
  try {
    // Check if SendGrid is properly initialized
    if (!mailService) {
      throw new Error('Email service not properly initialized');
    }

    const { name, company, email, notes } = req.body;
    const attachment = req.file;

    console.log('Received support ticket request:', {
      name,
      company,
      email,
      hasAttachment: !!attachment,
      body: req.body
    });

    // Validate required fields
    if (!name || !company || !email || !notes) {
      console.log('Missing required fields:', { name, company, email, hasNotes: !!notes });
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    let emailContent = `
      <h2>New Support Ticket</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Notes:</strong></p>
      <p>${notes}</p>
    `;

    // Use a verified sender email address
    const msg = {
      to: 'colter@mahluminnovations.com',
      from: {
        email: 'support@gymai.app',
        name: 'GYM AI Support'
      },
      replyTo: email,
      subject: `New Support Ticket from ${name} - ${company}`,
      text: `New support ticket from ${name} (${company})\nEmail: ${email}\nNotes: ${notes}`,
      html: emailContent,
      attachments: [] as any[]
    };

    // Add attachment if present
    if (attachment) {
      console.log('Processing attachment:', {
        filename: attachment.originalname,
        size: attachment.size,
        mimetype: attachment.mimetype
      });

      msg.attachments = [{
        content: attachment.buffer.toString('base64'),
        filename: attachment.originalname,
        type: attachment.mimetype,
        disposition: 'attachment'
      }];
    }

    console.log('Preparing to send email via SendGrid...', {
      to: msg.to,
      from: msg.from.email,
      subject: msg.subject,
      hasAttachments: msg.attachments.length > 0
    });

    try {
      const response = await mailService.send(msg);
      console.log('SendGrid API Response:', response);
      console.log('Email sent successfully');

      res.json({ 
        success: true, 
        message: 'Support ticket submitted successfully' 
      });
    } catch (sendError: any) {
      console.error('SendGrid send error details:', {
        code: sendError.code,
        message: sendError.message,
        response: sendError.response?.body
      });

      // Return a more informative error message
      const errorResponse = {
        success: false,
        message: 'Unable to send support ticket. Please try again later.',
        error: sendError.message,
        details: sendError.response?.body
      };

      res.status(sendError.code || 500).json(errorResponse);
    }
  } catch (error) {
    console.error('Error processing support ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket',
      error: errorMessage
    });
  }
});

export default router;