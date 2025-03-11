import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../../../auth-middleware';
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../../services/azure/cosmos_service';

const CONTAINER_ID = 'inspection-templates';

// Ensure that the container exists
async function getTemplatesContainer(): Promise<Container | null> {
  return getContainer(CONTAINER_ID);
}

export function registerTemplateRoutes(app: express.Application) {
  // Get all templates
  app.get('/api/manufacturing/quality/templates', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      // Define the query to retrieve all templates
      const querySpec: SqlQuerySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type',
        parameters: [
          {
            name: '@type',
            value: 'inspection-template'
          }
        ]
      };

      // Execute the query
      const { resources: templates } = await container.items.query(querySpec).fetchAll();

      // Sort templates by name
      templates.sort((a, b) => a.name.localeCompare(b.name));

      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get a specific template by ID
  app.get('/api/manufacturing/quality/templates/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;
      const { resource: template } = await container.item(id, id).read();

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error(`Error fetching template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create a new template
  app.post('/api/manufacturing/quality/templates', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const newTemplate = {
        ...req.body,
        id: uuidv4(),
        type: 'inspection-template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user?.id || 'unknown',
      };

      // Validate the template
      if (!newTemplate.name || !newTemplate.category) {
        return res.status(400).json({ message: 'Name and category are required' });
      }

      // Create the template in the database
      const { resource: createdTemplate } = await container.items.create(newTemplate);

      res.status(201).json(createdTemplate);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Failed to create template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update an existing template
  app.put('/api/manufacturing/quality/templates/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user?.id || 'unknown',
      };

      // Ensure ID remains the same
      if (updateData.id && updateData.id !== id) {
        return res.status(400).json({ message: 'Cannot change template ID' });
      }
      updateData.id = id;
      
      // Make sure type remains inspection-template
      updateData.type = 'inspection-template';

      // Preserve creation data
      try {
        const { resource: existingTemplate } = await container.item(id, id).read();
        if (existingTemplate) {
          updateData.createdAt = existingTemplate.createdAt;
          updateData.createdBy = existingTemplate.createdBy;
        }
      } catch (error) {
        console.warn(`Template with ID ${id} not found for update, will create new`);
      }

      // Update the template
      const { resource: updatedTemplate } = await container.items.upsert(updateData);

      res.json(updatedTemplate);
    } catch (error) {
      console.error(`Error updating template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to update template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete a template
  app.delete('/api/manufacturing/quality/templates/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;

      // Check if the template exists
      try {
        const { resource: template } = await container.item(id, id).read();
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
      } catch (error) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Delete the template
      await container.item(id, id).delete();

      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to delete template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get templates by category
  app.get('/api/manufacturing/quality/templates/category/:category', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { category } = req.params;

      // Define the query to retrieve templates by category
      const querySpec: SqlQuerySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type AND c.category = @category',
        parameters: [
          {
            name: '@type',
            value: 'inspection-template'
          },
          {
            name: '@category',
            value: category
          }
        ]
      };

      // Execute the query
      const { resources: templates } = await container.items.query(querySpec).fetchAll();

      // Sort templates by name
      templates.sort((a, b) => a.name.localeCompare(b.name));

      res.json(templates);
    } catch (error) {
      console.error(`Error fetching templates for category ${req.params.category}:`, error);
      res.status(500).json({ message: 'Failed to fetch templates', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Duplicate a template
  app.post('/api/manufacturing/quality/templates/:id/duplicate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;

      // Get the original template
      let originalTemplate;
      try {
        const { resource: template } = await container.item(id, id).read();
        originalTemplate = template;
      } catch (error) {
        return res.status(404).json({ message: 'Template not found' });
      }

      if (!originalTemplate) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Create a duplicate with a new ID
      const duplicateTemplate = {
        ...originalTemplate,
        id: uuidv4(),
        name: `${originalTemplate.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user?.id || 'unknown',
        // Reset version if it exists
        version: originalTemplate.version ? 1 : undefined,
      };

      // Create the duplicate in the database
      const { resource: createdTemplate } = await container.items.create(duplicateTemplate);

      res.status(201).json(createdTemplate);
    } catch (error) {
      console.error(`Error duplicating template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to duplicate template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}