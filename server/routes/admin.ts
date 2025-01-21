import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@db';
import { supportTickets, ticketComments, ticketHistory } from '@db/schema';

const router = Router();

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