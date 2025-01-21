import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@db';
import { supportTickets, ticketHistory } from '@db/schema';

const router = Router();

// Get all support tickets
router.get('/tickets', async (_req, res) => {
  try {
    const tickets = await db.query.supportTickets.findMany({
      orderBy: desc(supportTickets.createdAt),
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      message: 'Failed to fetch tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update ticket status
router.put('/tickets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Get the current ticket to track changes
    const [currentTicket] = await db.query.supportTickets.findMany({
      where: eq(supportTickets.id, parseInt(id))
    });

    if (!currentTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Update the ticket
    await db
      .update(supportTickets)
      .set({
        status,
        updatedAt: new Date(),
        resolvedAt: status === 'resolved' ? new Date() : null,
      })
      .where(eq(supportTickets.id, parseInt(id)));

    // Record the status change in ticket history
    await db.insert(ticketHistory).values({
      ticketId: parseInt(id),
      field: 'status',
      oldValue: currentTicket.status,
      newValue: status,
      changedBy: req.user?.id || 'system', // Assuming we have user info from auth
      createdAt: new Date(),
    });

    // Get the updated ticket
    const [updatedTicket] = await db.query.supportTickets.findMany({
      where: eq(supportTickets.id, parseInt(id))
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

// Get ticket details with history and comments
router.get('/tickets/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [ticket] = await db.query.supportTickets.findMany({
      where: eq(supportTickets.id, parseInt(id)),
      with: {
        comments: true,
        history: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({
      message: 'Failed to fetch ticket details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
