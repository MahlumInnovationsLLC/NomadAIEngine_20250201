import express from 'express';
import { fieldServiceManager } from '../services/azure/field_service';
import type { ServiceTicket } from '@/types/field-service';

const router = express.Router();

// Initialize the field service manager
fieldServiceManager.initialize().catch(console.error);

// Get all tickets
router.get('/tickets', async (req, res) => {
  try {
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
    const ticketData = req.body;
    const newTicket = await fieldServiceManager.createTicket(ticketData);
    
    // Perform AI analysis on the new ticket
    const analyzedTicket = await fieldServiceManager.analyzePriority(newTicket);
    
    res.json(analyzedTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Bulk import tickets
router.post('/tickets/bulk', async (req, res) => {
  try {
    const { tickets } = req.body;
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

export default router;
