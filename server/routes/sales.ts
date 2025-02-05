import { Router } from 'express';
import { salesService } from '../services/azure/sales_service';
import cors from 'cors';

const router = Router();

// Configure CORS
router.use(cors({
  origin: true,
  credentials: true
}));

// Initialize the sales service
salesService.initialize().catch(console.error);

// Deals Routes
router.post('/api/deals', async (req, res) => {
  try {
    const deal = await salesService.createDeal(req.body);
    res.json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

router.put('/api/deals/:id', async (req, res) => {
  try {
    const deal = await salesService.updateDeal(req.params.id, req.body);
    res.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

router.get('/api/deals/:id', async (req, res) => {
  try {
    const deal = await salesService.getDeal(req.params.id, req.query.company as string);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    console.error('Error getting deal:', error);
    res.status(500).json({ error: 'Failed to get deal' });
  }
});

router.get('/api/deals', async (req, res) => {
  try {
    const deals = await salesService.listDeals();
    res.json(deals);
  } catch (error) {
    console.error('Error listing deals:', error);
    res.status(500).json({ error: 'Failed to list deals' });
  }
});

// Contacts Routes
router.post('/api/contacts', async (req, res) => {
  try {
    const contact = await salesService.createContact(req.body);
    res.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.put('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await salesService.updateContact(req.params.id, req.body);
    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await salesService.getContact(req.params.id, req.query.company as string);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

router.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await salesService.listContacts();
    res.json(contacts);
  } catch (error) {
    console.error('Error listing contacts:', error);
    res.status(500).json({ error: 'Failed to list contacts' });
  }
});

// Pipeline Routes
router.get('/api/pipeline', async (req, res) => {
  try {
    const stages = await salesService.getPipelineStages();
    res.json(stages);
  } catch (error) {
    console.error('Error getting pipeline stages:', error);
    res.status(500).json({ error: 'Failed to get pipeline stages' });
  }
});

router.put('/api/pipeline/:id', async (req, res) => {
  try {
    const stage = await salesService.updatePipelineStage(req.body);
    res.json(stage);
  } catch (error) {
    console.error('Error updating pipeline stage:', error);
    res.status(500).json({ error: 'Failed to update pipeline stage' });
  }
});

// Analytics Routes
router.get('/api/analytics/deals-by-stage', async (req, res) => {
  try {
    const dealsByStage = await salesService.getDealsByStage();
    res.json(dealsByStage);
  } catch (error) {
    console.error('Error getting deals by stage:', error);
    res.status(500).json({ error: 'Failed to get deals by stage' });
  }
});

router.get('/api/analytics/deals-trend', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const trend = await salesService.getDealsTrend(days);
    res.json(trend);
  } catch (error) {
    console.error('Error getting deals trend:', error);
    res.status(500).json({ error: 'Failed to get deals trend' });
  }
});

export default router;