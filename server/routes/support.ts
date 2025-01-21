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

// Initialize SendGrid
const mailService = new MailService();
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is missing');
} else {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured successfully');
}

router.post('/ticket', upload.single('attachment'), async (req, res) => {
  console.log('Support ticket endpoint hit');
  try {
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

    const msg = {
      to: 'colter@mahluminnovations.com',
      // Use the submitter's email as the from address to avoid domain verification issues
      from: {
        email: email,
        name: `${name} via GYM AI Engine Support`
      },
      replyTo: email, // Ensure replies go back to the submitter
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
      // Handle specific SendGrid errors
      if (sendError.code === 403) {
        console.error('SendGrid authentication error:', sendError);
        res.status(503).json({
          success: false,
          message: 'Unable to send support ticket. Please try again later.',
          error: 'Email service temporarily unavailable'
        });
      } else {
        throw sendError; // Let the outer catch block handle other errors
      }
    }
  } catch (error) {
    console.error('Error sending support ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? {
      name: error.name,
      stack: error.stack,
      cause: error.cause
    } : {};

    console.error('Error details:', errorDetails);

    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket',
      error: errorMessage,
      details: errorDetails
    });
  }
});

export default router;