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
mailService.setApiKey(process.env.SENDGRID_API_KEY!);

router.post('/ticket', upload.single('attachment'), async (req, res) => {
  try {
    const { name, company, email, notes } = req.body;
    const attachment = req.file;

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
      from: 'support@gymaiengine.com', // You should update this to your verified sender
      subject: `New Support Ticket from ${name} - ${company}`,
      text: `New support ticket from ${name} (${company})\nEmail: ${email}\nNotes: ${notes}`,
      html: emailContent,
    };

    // Add attachment if present
    if (attachment) {
      msg.attachments = [
        {
          content: attachment.buffer.toString('base64'),
          filename: attachment.originalname,
          type: attachment.mimetype,
          disposition: 'attachment',
        },
      ];
    }

    await mailService.send(msg);

    res.json({ success: true, message: 'Support ticket submitted successfully' });
  } catch (error) {
    console.error('Error sending support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
