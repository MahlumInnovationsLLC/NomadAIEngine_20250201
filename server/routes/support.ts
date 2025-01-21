import { Router } from 'express';
import multer from 'multer';
import { MailService } from '@sendgrid/mail';
import { db } from '@db';
import { supportTickets, insertSupportTicketSchema } from '@db/schema';
import { z } from 'zod';

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
    console.log('Saving ticket to database with data:', {
      title,
      description: notes,
      submitterName: name,
      submitterEmail: email,
      submitterCompany: company
    });

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

    console.log('Ticket saved successfully:', ticket);

    // Prepare email content
    const emailContent = `
      <h2>New Support Ticket</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Notes:</strong></p>
      <p>${notes}</p>
    `;

    // Send email notification if SendGrid is configured
    if (mailService) {
      console.log('Attempting to send email via SendGrid...');
      try {
        await mailService.send({
          to: 'colter@mahluminnovations.com',
          from: 'colter@mahluminnovations.com',
          subject: `Support Ticket: ${company} - ${name}`,
          text: `Support ticket from ${name} (${company})\nEmail: ${email}\nNotes: ${notes}`,
          html: emailContent,
          replyTo: email,
          attachments: attachment ? [{
            content: attachment.buffer.toString('base64'),
            filename: attachment.originalname,
            type: attachment.mimetype,
            disposition: 'attachment'
          }] : undefined
        });
        console.log('Email sent successfully');
      } catch (error: any) {
        console.error('SendGrid Error:', error);
        // Continue with the response even if email fails
      }
    }

    res.json({
      success: true,
      message: 'Support ticket submitted successfully',
      ticket
    });
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