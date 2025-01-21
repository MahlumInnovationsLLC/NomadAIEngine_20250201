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
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is required');
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/ticket', upload.single('attachment'), async (req, res) => {
  try {
    const { name, company, email, notes } = req.body;
    const attachment = req.file;

    console.log('Received support ticket request:', { name, company, email, hasAttachment: !!attachment });

    let emailContent = `
      <h2>New Support Ticket</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Notes:</strong></p>
      <p>${notes}</p>
    `;

    const msg: any = {
      to: 'colter@mahluminnovations.com',
      from: {
        email: 'support@gymaiengine.com',
        name: 'GYM AI Engine Support'
      },
      subject: `New Support Ticket from ${name} - ${company}`,
      text: `New support ticket from ${name} (${company})\nEmail: ${email}\nNotes: ${notes}`,
      html: emailContent,
    };

    // Add attachment if present
    if (attachment) {
      console.log('Adding attachment:', attachment.originalname);
      msg.attachments = [
        {
          content: attachment.buffer.toString('base64'),
          filename: attachment.originalname,
          type: attachment.mimetype,
          disposition: 'attachment',
        },
      ];
    }

    console.log('Sending email via SendGrid...');
    await mailService.send(msg);
    console.log('Email sent successfully');

    res.json({ success: true, message: 'Support ticket submitted successfully' });
  } catch (error) {
    console.error('Error sending support ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket',
      error: errorMessage
    });
  }
});

export default router;