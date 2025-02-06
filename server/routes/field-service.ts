import express from 'express';
import { fieldServiceManager } from '../services/azure/field_service';
import type { ServiceTicket } from '@/types/field-service';

const router = express.Router();

// Initialize the field service manager
fieldServiceManager.initialize().catch(console.error);

// Get all tickets
router.get('/tickets', async (req, res) => {
  try {
    console.log("GET /tickets - Fetching all tickets");
    const tickets = await fieldServiceManager.listTickets();
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create new ticket
router.post('/tickets', async (req, res) => {
  try {
    console.log("POST /tickets - Creating new ticket:", req.body);
    const ticketData = req.body;

    // Validate required fields
    if (!ticketData.customer?.company) {
      return res.status(400).json({ error: 'Customer company is required' });
    }

    const newTicket = await fieldServiceManager.createTicket(ticketData);
    res.json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ 
      error: 'Failed to create ticket',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk import tickets
router.post('/tickets/bulk', async (req, res) => {
  try {
    console.log("POST /tickets/bulk - Bulk importing tickets");
    const { tickets } = req.body;

    if (!Array.isArray(tickets)) {
      return res.status(400).json({ error: 'Tickets must be an array' });
    }

    const createdTickets = await fieldServiceManager.bulkCreateTickets(tickets);
    res.json(createdTickets);
  } catch (error) {
    console.error('Error importing tickets:', error);
    res.status(500).json({ error: 'Failed to import tickets' });
  }
});

// Get ticket by ID
router.get('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company } = req.query;

    if (!company) {
      return res.status(400).json({ error: 'Company parameter is required' });
    }

    const ticket = await fieldServiceManager.getTicket(id, company as string);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Update ticket
router.patch('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const company = updates.customer?.company;

    if (!company) {
      return res.status(400).json({ error: 'Customer company is required' });
    }

    const updatedTicket = await fieldServiceManager.updateTicket(id, company, updates);
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Add stats endpoint
router.get('/stats', async (_req, res) => {
  try {
    const tickets = await fieldServiceManager.listTickets();

    const stats = {
      openTickets: tickets.filter(t => t.status === 'open').length,
      activeTechnicians: 0, // To be implemented
      pendingClaims: 0, // To be implemented
      satisfactionScore: 0, // To be implemented
      feedbackMetrics: {
        totalFeedback: 0,
        averageRating: 0,
        responseRate: 0,
        trendsLastMonth: {
          positive: 0,
          neutral: 0,
          negative: 0
        }
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch service statistics' });
  }
});

export default router;