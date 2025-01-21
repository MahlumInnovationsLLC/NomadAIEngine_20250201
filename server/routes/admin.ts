import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@db';
import { supportTickets, ticketComments, ticketHistory } from '@db/schema';
import { MailService } from '@sendgrid/mail';

const router = Router();

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

// Get all support tickets
router.get('/tickets', async (_req, res) => {
  try {
    console.log('Fetching all support tickets from database...');
    const tickets = await db.select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));

    console.log(`Found ${tickets.length} tickets:`, tickets);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      message: 'Failed to fetch tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get single ticket with comments and history
router.get('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, parseInt(id)),
      with: {
        comments: {
          orderBy: [desc(ticketComments.createdAt)],
        },
        history: {
          orderBy: [desc(ticketHistory.createdAt)],
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      message: 'Failed to fetch ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send response to ticket
router.post('/tickets/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Response message is required' });
    }

    // Get ticket details
    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, parseInt(id)),
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Save response as a comment
    const [comment] = await db.insert(ticketComments)
      .values({
        ticketId: parseInt(id),
        content: message,
        authorId: 'system', // Will be updated when auth is implemented
        isInternal: false,
      })
      .returning();

    // Send email response if SendGrid is configured
    if (mailService) {
      console.log('Sending response email via SendGrid...');
      try {
        await mailService.send({
          to: ticket.submitterEmail,
          from: 'colter@mahluminnovations.com',
          subject: `Re: ${ticket.title}`,
          text: message,
          html: `
            <h2>Response to your support ticket</h2>
            <p><strong>Original Request:</strong> ${ticket.title}</p>
            <p><strong>Response:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        });
        console.log('Response email sent successfully');
      } catch (error) {
        console.error('SendGrid Error:', error);
        return res.status(500).json({
          message: 'Failed to send email response',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      message: 'Response sent successfully',
      comment
    });
  } catch (error) {
    console.error('Error sending response:', error);
    res.status(500).json({
      message: 'Failed to send response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update ticket status
router.put('/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get current ticket state
    const [currentTicket] = await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.id, parseInt(id)));

    if (!currentTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Update ticket
    const [updatedTicket] = await db.update(supportTickets)
      .set({
        status,
        updatedAt: new Date(),
        resolvedAt: status === 'resolved' ? new Date() : null,
      })
      .where(eq(supportTickets.id, parseInt(id)))
      .returning();

    // Record status change in history
    await db.insert(ticketHistory)
      .values({
        ticketId: parseInt(id),
        field: 'status',
        oldValue: currentTicket.status,
        newValue: status,
        changedBy: 'system', // Will be updated when auth is implemented
      });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      message: 'Failed to update ticket status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;