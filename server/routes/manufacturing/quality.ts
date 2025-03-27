import { Router } from 'express';
import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";
import multer from 'multer';
import { uploadNCRAttachment, uploadInspectionAttachment, deleteNCRAttachment, deleteInspectionAttachment, uploadDefectPhoto, deleteDefectPhoto } from '../../services/azure/ncr_attachment_service';
import { db } from "@db";
import { capas, capaActions, capaCategories } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { parse as csvParse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import { registerTemplateRoutes } from './quality/templates';
import { gagesRouter } from './quality/gages';
import projectsRouter from './projects';

const router = Router();

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) {
    return "";
  }
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    readableStream.on("error", reject);
  });
}

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a CSV or Excel file.'));
    }
  }
});

// Initialize Cosmos DB client
async function initializeContainer() {
  try {
    if (!process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING) {
      throw new Error('Azure Cosmos DB connection string is not configured');
    }

    const client = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING);
    const { database } = await client.databases.createIfNotExists({
      id: "NomadAIEngineDB"
    });

    const { container } = await database.containers.createIfNotExists({
      id: "quality-management",
      partitionKey: { paths: ["/userKey"] },
      throughput: 400
    });

    console.log("Successfully initialized quality-management container");
    return container;
  } catch (error) {
    console.error("Error initializing container:", error);
    throw error;
  }
}

let container: any;
initializeContainer().then(c => {
  container = c;
}).catch(console.error);

// Types
interface Disposition {
  decision: 'use_as_is' | 'rework' | 'scrap' | 'return_to_supplier';
  justification: string;
  conditions: string;
  approvedBy: Array<{
    approver: string;
    date: string;
    comment?: string;
  }>;
  approvalDate?: string;
}

interface NCRData {
  id: string;
  number: string;
  title: string;
  description: string;
  type: 'material' | 'documentation' | 'product' | 'process';
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'closed' | 'under_review' | 'pending_disposition' | 'in_review';
  area: string;
  lotNumber?: string;
  quantityAffected?: number;
  reportedBy?: string;
  disposition: Disposition;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  userKey: string;
  linkedCapaId?: string;
  mrbId?: string;
  mrbNumber?: string;
  dispositionNotes?: string;
  projectNumber?: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  blobUrl: string;
}

// Create CAPA from NCR
async function createCAPAFromNCR(ncr: NCRData) {
  try {
    if (ncr.severity !== 'critical') {
      return null;
    }

    console.log('Creating CAPA from critical NCR:', ncr.id);

    const capaData = {
      title: `CAPA for Critical NCR ${ncr.number}`,
      description: `Auto-generated CAPA for critical NCR. NCR Details: ${ncr.description}`,
      status: 'open',
      priority: 'high',
      type: 'corrective',
      rootCause: 'To be determined during investigation',
      verificationMethod: 'To be determined',
      area: ncr.area,
      scheduledReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      sourceNcrId: ncr.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const [newCapa] = await db.insert(capas).values(capaData).returning();
    console.log('Successfully created CAPA from NCR:', newCapa.id);
    return newCapa;
  } catch (error) {
    console.error('Error creating CAPA from NCR:', error);
    throw error;
  }
}

// Create NCR
// Get projects for NCR dropdown
router.get('/projects', async (req, res) => {
  try {
    // Get projects from production-projects container
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING || ""
    );
    const containerClient = blobServiceClient.getContainerClient("production-projects");
    
    const projects = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlockBlobClient(blob.name);
      const downloadResponse = await blobClient.download();
      const projectData = await streamToString(downloadResponse.readableStreamBody);
      projects.push(JSON.parse(projectData));
    }
    
    // Return simplified list with id and project number for dropdown
    const projectsList = projects.map(project => ({
      id: project.id,
      projectNumber: project.projectNumber
    }));
    
    res.json(projectsList);
  } catch (error) {
    console.error("Error fetching projects for dropdown:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get production lines for inspection dropdown
router.get('/production-lines', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }
    
    // Import the facility service
    const facilityService = await import('../../services/azure/facility_service');
    
    // Get production lines
    const productionLines = await facilityService.getProductionLines();
    
    console.log("Retrieved production lines:", productionLines);
    
    // Format the lines for dropdown selection
    const formattedLines = productionLines.map((line) => ({
      id: line.id,
      name: line.name || line.teamName || 'Unnamed Production Line',
      type: line.type || 'fabrication',
      team: line.teamName || line.team || "",  // Use teamName if available, otherwise use team or empty string
      teamName: line.teamName || line.team || line.name || "" // Ensure we have a team name value
    }));
    
    console.log("Formatted production lines for dropdown:", formattedLines);
    res.json(formattedLines);
  } catch (error) {
    console.error("Error fetching production lines for dropdown:", error);
    res.status(500).json({ error: "Failed to fetch production lines", details: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.post('/ncrs', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    console.log('Creating new NCR:', req.body);
    
    // Generate NCR number based on date, time, and area/department
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Map of area/department codes
    const departmentMap: Record<string, string> = {
      'Receiving': 'RCV',
      'FAB': 'FAB',
      'Paint': 'PNT',
      'Production': 'PRD',
      'In-Process QC': 'IQC',
      'Final QC': 'FQC',
      'Exec Review': 'EXC',
      'PDI': 'PDI',
      // Default to QC if department is not in the list
      'default': 'QC'
    };
    
    // Get department code
    const area = req.body.area || '';
    const departmentCode = departmentMap[area] || departmentMap.default;
    
    // Use hours and minutes for 4-digit time in 24-hour format
    const timeStr = `${hours}${minutes}`;
    
    // Create NCR number in the format DEPT-YYYYMMDD-HHMM
    // Department + date + 4-digit time (24-hour format)
    const ncrNumber = `${departmentCode}-${year}${month}${day}-${timeStr}`;
    
    const ncrData: NCRData = {
      ...req.body,
      id: `NCR-${Date.now()}`,
      number: ncrNumber,
      userKey: 'default',
      attachments: [],
      disposition: {
        decision: "use_as_is",
        justification: "",
        conditions: "",
        approvedBy: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource: createdNcr } = await container.items.create(ncrData);

    // If NCR is critical, auto-generate a CAPA
    if (createdNcr.severity === 'critical') {
      try {
        const capa = await createCAPAFromNCR(createdNcr);
        if (capa) {
          createdNcr.linkedCapaId = capa.id;
          await container.item(createdNcr.id, 'default').replace(createdNcr);
        }
      } catch (error) {
        console.error('Error in CAPA auto-generation:', error);
      }
    }

    console.log('Created NCR:', createdNcr);
    res.status(201).json(createdNcr);
  } catch (error) {
    console.error('Error creating NCR:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to create NCR' 
    });
  }
});

// Import NCRs
router.post('/ncrs/import', fileUpload.single('file'), async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    let records: any[] = [];

    // Parse based on file type
    if (req.file.mimetype === 'text/csv') {
      // Parse CSV
      const parser = csvParse({
        columns: true,
        skip_empty_lines: true
      });

      records = await new Promise((resolve, reject) => {
        const results: any[] = [];
        Readable.from(req.file!.buffer)
          .pipe(parser)
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      // Parse Excel
      const workbook = XLSX.read(req.file.buffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(firstSheet);
    }

    console.log(`Parsed ${records.length} records from imported file`);

    // Transform and validate records
    const ncrPromises = records.map(async (record) => {
      // Generate NCR number with standardized format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      // Map of area/department codes
      const departmentMap: Record<string, string> = {
        'Receiving': 'RCV',
        'FAB': 'FAB',
        'Paint': 'PNT',
        'Production': 'PRD',
        'In-Process QC': 'IQC',
        'Final QC': 'FQC',
        'Exec Review': 'EXC',
        'PDI': 'PDI',
        'default': 'QC'
      };
      
      // Get area/department code
      const area = record.area || '';
      const departmentCode = departmentMap[area] || departmentMap.default;
      
      // Use milliseconds for sequence number in import (ensuring uniqueness)
      const seq = String(Date.now() % 1000).padStart(3, '0');
      
      // Use hours and minutes for 4-digit time in 24-hour format
      const timeStr = `${hours}${minutes}`;
      
      // Create NCR number in the format DEPT-YYYYMMDD-HHMM
      // Department + date + 4-digit time (24-hour format)
      const ncrNumber = `${departmentCode}-${year}${month}${day}-${timeStr}`;
      
      const ncrData: NCRData = {
        id: `NCR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number: ncrNumber,
        title: record.title || 'Untitled NCR',
        description: record.description || '',
        type: record.type || 'material',
        severity: record.severity || 'minor',
        status: 'open',
        area: record.area || 'General',
        lotNumber: record.lotNumber || '',
        quantityAffected: parseInt(record.quantityAffected) || 0,
        reportedBy: record.reportedBy || 'System Import',
        userKey: 'default',
        attachments: [],
        disposition: {
          decision: "use_as_is",
          justification: "",
          conditions: "",
          approvedBy: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return container.items.create(ncrData);
    });

    const results = await Promise.allSettled(ncrPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Successfully imported ${successful} NCRs, ${failed} failed`);

    res.json({
      message: `Import completed`,
      count: successful,
      failed: failed,
      total: records.length
    });
  } catch (error) {
    console.error('Error importing NCRs:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to import NCRs',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Get all MRBs
router.get('/mrb', async (req, res) => {
  try {
    if (!container) {
      console.log('Container not initialized, attempting to initialize...');
      try {
        container = await initializeContainer();
      } catch (error) {
        console.error('Failed to initialize container:', error);
        return res.status(500).json({
          message: 'Failed to initialize database connection',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('Fetching MRBs and pending disposition NCRs from Cosmos DB...');

    // Get all MRB records, excluding deleted ones
    const { resources: mrbs } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "mrb" AND (NOT IS_DEFINED(c.deleted) OR c.deleted = false) ORDER BY c._ts DESC',
        parameters: [],
        partitionKey: 'default'
      })
      .fetchAll();

    // Then, get all relevant NCRs (both pending_disposition and closed)
    const { resources: relevantNcrs } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE (c.status = "pending_disposition" OR c.status = "closed" OR c.status = "in_review") AND STARTSWITH(c.id, "NCR-")',
        parameters: [],
        partitionKey: 'default'
      })
      .fetchAll();

    console.log(`Found ${mrbs.length} MRBs`);
    console.log(`Found ${relevantNcrs.length} NCRs (pending and closed)`);

    // Convert NCRs to MRB format
    const ncrMrbs = relevantNcrs.map(ncr => ({
      id: `mrb-${ncr.id}`,
      type: "mrb",
      number: ncr.mrbNumber || `MRB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      title: `NCR: ${ncr.title || 'Untitled'}`,
      sourceType: "NCR",
      sourceId: ncr.id,
      status: ncr.status,
      severity: ncr.severity || "minor",
      partNumber: ncr.partNumber || "N/A",
      lotNumber: ncr.lotNumber || "N/A",
      quantity: ncr.quantityAffected || 0,
      location: ncr.area || "Unknown",
      disposition: ncr.disposition || {
        decision: "use_as_is",
        justification: "",
        conditions: "",
        approvedBy: []
      },
      createdAt: ncr.createdAt || new Date().toISOString(),
      updatedAt: ncr.updatedAt || new Date().toISOString(),
      userKey: 'default'
    }));

    // Combine and return both sets
    const combinedResults = [...mrbs, ...ncrMrbs];
    console.log(`Sending combined results (${combinedResults.length} total items)`);

    res.json(combinedResults);
  } catch (error) {
    console.error('Error fetching MRBs:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch MRBs',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Update the createMRB endpoint to better handle NCR assignments
router.post('/mrb', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    console.log('Creating new MRB:', req.body);
    const { linkedNCRs, tasks, notes, ...mrbData } = req.body;

    const newMRB = {
      ...mrbData,
      type: "mrb",
      id: `MRB-${Date.now()}`,
      userKey: 'default',
      linkedNCRs: linkedNCRs || [], // Ensure linkedNCRs is always an array
      tasks: tasks || [],
      notes: notes || [],
      collaborators: mrbData.collaborators || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Attempting to create MRB with enhanced data:', newMRB);
    const { resource: createdMrb } = await container.items.create(newMRB);

    // Update status and link NCRs if provided
    if (linkedNCRs && linkedNCRs.length > 0) {
      console.log('Processing linked NCRs:', linkedNCRs);

      const updatePromises = linkedNCRs.map(async (link: { ncrId: string, dispositionNotes: string }) => {
        const { ncrId, dispositionNotes } = link;

        // Query for NCR using id
        const { resources: [ncr] } = await container.items
          .query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: ncrId }],
            partitionKey: 'default'
          })
          .fetchAll();

        if (ncr) {
          // Update NCR with MRB reference and notes
          const updatedNcr = {
            ...ncr,
            status: 'in_review',
            mrbId: createdMrb.id,
            mrbNumber: createdMrb.number,
            dispositionNotes,
            updatedAt: new Date().toISOString()
          };

          return container.items.upsert(updatedNcr);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
    }

    console.log('Created MRB:', createdMrb);
    res.status(201).json(createdMrb);
  } catch (error) {
    console.error('Error creating MRB:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to create MRB',
      details: error instanceof Error ? error.stack : undefined 
    });
  }
});

// Update the disposition approval endpoint to properly close both NCR and MRB
router.post('/mrb/:id/disposition/approve', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { id } = req.params;
    const { comment, approvedBy, approvedAt } = req.body;

    // Extract the NCR ID if this is an MRB created from an NCR
    const ncrId = id.startsWith('mrb-') ? id.substring(4) : id;
    console.log(`Looking for NCR with ID: ${ncrId}`);

    // Query for NCR using the extracted ID
    const { resources: [ncr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: ncrId }],
        partitionKey: 'default'
      })
      .fetchAll();

    if (!ncr) {
      return res.status(404).json({ message: 'NCR not found' });
    }

    console.log('Found NCR:', ncr);
    console.log('Current NCR status:', ncr.status);
    console.log('Current NCR disposition:', ncr.disposition);

    // Create approval entry
    const approvalEntry = {
      name: approvedBy || "Current User",
      role: "MRB Member",
      date: approvedAt || new Date().toISOString(),
      comment: comment || ""
    };

    // Update NCR disposition
    if (!ncr.disposition || typeof ncr.disposition === 'string') {
      ncr.disposition = {
        decision: 'use_as_is',
        justification: '',
        conditions: '',
        approvedBy: []
      };
    }

    // Add new approval to existing approvals
    if (!Array.isArray(ncr.disposition.approvedBy)) {
      ncr.disposition.approvedBy = [];
    }
    ncr.disposition.approvedBy.push(approvalEntry);

    // Initialize history array if it doesn't exist
    if (!Array.isArray(ncr.history)) {
      ncr.history = [];
    }

    // Add history entry
    ncr.history.push({
      type: 'Disposition',
      action: 'disposition_approval',
      description: `Disposition approved by ${approvalEntry.name}`,
      user: approvalEntry.name,
      timestamp: approvalEntry.date,
      notes: approvalEntry.comment
    });

    // Update status if all required approvals are received (requiring 2 approvals)
    if (ncr.disposition.approvedBy.length >= 2) {
      console.log('Required approvals received, updating status to closed');
      ncr.status = 'closed';
      ncr.disposition.approvalDate = new Date().toISOString();

      // Also update the corresponding MRB record
      const mrbId = `mrb-${ncrId}`;
      const { resources: [mrbRecord] } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.type = 'mrb' AND c.sourceId = @sourceId",
          parameters: [{ name: "@sourceId", value: ncrId }],
          partitionKey: 'default'
        })
        .fetchAll();

      if (mrbRecord) {
        console.log('Updating MRB record status to closed');
        mrbRecord.status = 'closed';
        mrbRecord.disposition = ncr.disposition;
        mrbRecord.updatedAt = new Date().toISOString();
        await container.items.upsert(mrbRecord);
        console.log('Successfully updated MRB record status to closed');
      }
    }

    ncr.updatedAt = new Date().toISOString();
    console.log('Final NCR status before update:', ncr.status);

    // Update the NCR document
    const { resource: updatedNcr } = await container.items.upsert(ncr);
    console.log('Successfully updated NCR with disposition approval');
    console.log('Final updated NCR status:', updatedNcr.status);

    res.json(updatedNcr);
  } catch (error) {
    console.error('Error approving disposition:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to approve disposition',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Delete MRB endpoint with improved error handling and consistent deletion
router.delete('/mrb/:id', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { id } = req.params;
    console.log(`Processing deletion request for MRB ${id}`);

    // First check if this is a virtual MRB (created from NCR)
    const isVirtualMrb = id.startsWith('mrb-');
    const ncrId = isVirtualMrb ? id.substring(4) : null;

    if (isVirtualMrb) {
      console.log(`Handling virtual MRB deletion for NCR ${ncrId}`);
      // For virtual MRBs, we need to update the linked NCR
      const { resources: [ncr] } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: ncrId }],
          partitionKey: 'default'
        })
        .fetchAll();

      if (ncr) {
        // Update NCR to remove MRB reference
        ncr.mrbId = null;
        ncr.mrbNumber = null;
        ncr.status = 'open';
        ncr.updatedAt = new Date().toISOString();
        await container.items.upsert(ncr);
        console.log(`Successfully updated NCR ${ncrId}`);
      }

      return res.status(200).json({ message: 'Virtual MRB deleted successfully' });
    } else {
      console.log(`Handling regular MRB deletion for ${id}`);
      try {
        // First check if the MRB exists
        const { resources: mrbs } = await container.items
          .query({
            query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'mrb'",
            parameters: [{ name: "@id", value: id }]
          })
          .fetchAll();

        const mrb = mrbs[0];

        if (!mrb) {
          console.log(`MRB ${id} not found`);
          return res.status(404).json({ message: 'MRB not found' });
        }

        console.log('Found MRB to delete:', mrb);

        // If MRB has linked NCRs, update them first
        if (mrb.linkedNCRs && Array.isArray(mrb.linkedNCRs)) {
          const updatePromises = mrb.linkedNCRs.map(async (link: { ncrId: string }) => {
            const { resources: [ncr] } = await container.items
              .query({
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: "@id", value: link.ncrId }],
                partitionKey: 'default'
              })
              .fetchAll();

            if (ncr) {
              ncr.mrbId = null;
              ncr.mrbNumber = null;
              ncr.status = 'open';
              ncr.updatedAt = new Date().toISOString();
              return container.items.upsert(ncr);
            }
          });

          await Promise.all(updatePromises.filter(Boolean));
        }

        // Delete the MRB using the found document
        try {
          await container.items.upsert({
            ...mrb,
            deleted: true,
            deletedAt: new Date().toISOString()
          });
          console.log(`Successfully marked MRB ${id} as deleted`);
        } catch (deleteError) {
          console.error('Error marking MRB as deleted:', deleteError);
          return res.status(500).json({ 
            message: 'Failed to delete MRB',
            details: deleteError instanceof Error ? deleteError.message : 'Unknown error'
          });
        }

        console.log(`Successfully deleted MRB ${id}`);
        return res.status(200).json({ 
          message: 'MRB deleted successfully',
          deletedItemId: id
        });
      } catch (error) {
        console.error('Error in MRB deletion process:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error deleting MRB:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to delete MRB',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Get all NCRs
router.get('/ncrs', async (req, res) => {
  try {
    if (!container) {
      console.log('Container not initialized, attempting to initialize...');
      container = await initializeContainer();
    }

    console.log('Fetching NCRs from Cosmos DB...');
    const { status } = req.query;
    let queryText = 'SELECT * FROM c WHERE c.number != null AND STARTSWITH(c.id, "NCR-")';

    if (status) {
      queryText += ' AND c.status = @status';
    }

    queryText += ' ORDER BY c._ts DESC';

    const querySpec = {
      query: queryText,
      parameters: status ? [{ name: '@status', value: status }] : [],
      partitionKey: 'default'
    };

    console.log('Executing query:', querySpec);
    const { resources: ncrs } = await container.items
      .query(querySpec)
      .fetchAll();

    // Get all open MRBs to check for NCR assignments
    const { resources: openMrbs } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "mrb" AND c.status != "closed"',
        partitionKey: 'default'
      })
      .fetchAll();

    // Enhance NCR data with MRB assignment information
    const enhancedNcrs = ncrs.map(ncr => {
      const assignedMrb = openMrbs.find(mrb => {
        // Check both direct mrbId reference and linkedNCRs array
        return (ncr.mrbId === mrb.id) || 
               (mrb.linkedNCRs && mrb.linkedNCRs.some((link: any) => link.ncrId === ncr.id));
      });

      return {
        ...ncr,
        assignedToMrb: assignedMrb ? {
          id: assignedMrb.id,
          number: assignedMrb.number,
          status: assignedMrb.status
        } : null
      };
    });

    console.log(`Found ${enhancedNcrs.length} NCRs${status ? ` with status ${status}` : ''}`);
    console.log('NCRs with MRB assignments:', enhancedNcrs.filter(n => n.assignedToMrb).length);
    res.json(enhancedNcrs);
  } catch (error) {
    console.error('Error fetching NCRs:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch NCRs' 
    });
  }
});

// Update NCR
router.put('/ncrs/:id', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { id } = req.params;
    console.log(`Updating NCR with ID: ${id}`);
    console.log('Update payload received:', req.body);

    // Query for NCR using id
    const { resources: [existingNcr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
        partitionKey: 'default'
      })
      .fetchAll();

    if (!existingNcr) {
      console.log(`NCR with ID ${id} not found`);
      return res.status(404).json({ message: 'NCR not found' });
    }

    console.log('Found existing NCR:', existingNcr);
    
    // Make sure we don't override important fields that aren't in the update payload
    const ncrData: NCRData = {
      ...existingNcr,
      ...req.body,
      id,                                       // Ensure ID stays the same
      userKey: existingNcr.userKey || 'default', // Preserve userKey
      number: existingNcr.number,               // Preserve NCR number
      createdAt: existingNcr.createdAt,         // Preserve creation date
      updatedAt: new Date().toISOString(),      // Update the updatedAt timestamp
      attachments: existingNcr.attachments || [] // Preserve attachments
    };
    
    // Log the final update payload
    console.log('Final update payload being sent to Cosmos DB:', ncrData);

    try {
      const { resource: updatedNcr } = await container.items.upsert(ncrData);
      console.log('NCR updated successfully:', updatedNcr);
      
      // Send success response with updated NCR data
      res.json({
        success: true,
        data: updatedNcr,
        message: 'NCR updated successfully'
      });
    } catch (upsertError) {
      console.error('Error during upsert operation:', upsertError);
      res.status(500).json({ 
        message: upsertError instanceof Error ? upsertError.message : 'Failed to update NCR during database operation',
        error: 'database_error'
      });
    }
  } catch (error) {
    console.error('Error updating NCR:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to update NCR',
      error: 'server_error'
    });
  }
});


// Upload attachment to NCR
router.post('/ncrs/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { id } = req.params;
    console.log(`Looking for NCR with ID: ${id}`);

    // Query for NCR using id
    const { resources: [ncr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
        partitionKey: 'default'
      })
      .fetchAll();

    if (!ncr) {
      console.log(`NCR with ID ${id} not found`);
      return res.status(404).json({ message: 'NCR not found' });
    }

    console.log('Found NCR:', ncr);

    // Upload file to blob storage
    console.log('Uploading file to Azure Blob Storage...');
    const attachment = await uploadNCRAttachment(
      req.file,
      id,
      req.body.uploadedBy || 'system'
    );

    // Initialize attachments array if it doesn't exist
    if (!ncr.attachments) {
      ncr.attachments = [];
    }

    // Update NCR with new attachment
    ncr.attachments.push(attachment);
    ncr.updatedAt = new Date().toISOString();

    // Update the NCR document
    console.log('Updating NCR with new attachment...');
    const { resource: updatedNcr } = await container.items.upsert(ncr);

    console.log('NCR updated successfully');
    res.json(updatedNcr);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload attachment';
    console.error('Detailed error:', errorMessage);
    res.status(500).json({ 
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Delete attachment from NCR
router.delete('/ncrs/:ncrId/attachments/:attachmentId', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { ncrId, attachmentId } = req.params;
    console.log(`Processing deletion request for attachment ${attachmentId} from NCR ${ncrId}`);

    // Query for NCR using id
    const { resources: [ncr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: ncrId }],
        partitionKey: 'default'
      })
      .fetchAll();

    if (!ncr) {
      console.log(`NCR with ID ${ncrId} not found`);
      return res.status(404).json({ message: 'NCR not found' });
    }

    // Verify attachment exists in NCR document
    const attachmentExists = ncr.attachments?.some((a: Attachment) => a.id === attachmentId);
    if (!attachmentExists) {
      console.log(`Attachment ${attachmentId} not found in NCR document`);
      return res.status(404).json({ message: 'Attachment not found in NCR' });
    }

    console.log('Found NCR and attachment in document, proceeding with deletion');

    // Delete from blob storage - now returns a boolean indicating success
    const blobDeleted = await deleteNCRAttachment(ncrId, attachmentId);
    if (blobDeleted) {
      console.log('Successfully deleted blob from storage');
    } else {
      console.log('Blob not found in storage, proceeding with document update');
    }

    // Update NCR attachments
    ncr.attachments = (ncr.attachments || []).filter((a: Attachment) => a.id !== attachmentId);
    ncr.updatedAt = new Date().toISOString();

    // Save updated NCR
    const { resource: updatedNcr } = await container.items.upsert(ncr);
    console.log('Successfully updated NCR document');

    res.json(updatedNcr);
  } catch (error: unknown) {
    console.error('Error in attachment deletion process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Error in attachment deletion process',
      details: errorMessage
    });
  }
});

// Upload attachment to Inspection
router.post('/inspections/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { id } = req.params;
    console.log(`Looking for Inspection with ID: ${id}`);

    const { resources: [inspection] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
        partitionKey: 'default'
      })
      .fetchAll();

    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    console.log('Found Inspection:', inspection);

    // Upload file to blob storage
    console.log('Uploading file to Azure Blob Storage...');
    const attachment = await uploadInspectionAttachment(
      req.file,
      id,
      req.body.uploadedBy || 'system'
    );

    // Initialize attachments array if it doesn't exist
    if (!inspection.attachments) {
      inspection.attachments = [];
    }

    // Update Inspection with new attachment
    inspection.attachments.push(attachment);
    inspection.updatedAt = new Date().toISOString();

    // Update the Inspection document
    console.log('Updating Inspection with new attachment...');
    const { resource: updatedInspection } = await container.items.upsert(inspection);

    console.log('Inspection updated successfully');
    res.json(updatedInspection);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to upload attachment' 
    });
  }
});

// Delete attachment from Inspection
router.delete('/inspections/:inspectionId/attachments/:attachmentId', async (req, res) => {
  try {
    if (!container) {
      return res.status(500).json({ message: 'Service unavailable' });
    }

    const { inspectionId, attachmentId } = req.params;

    try {
      const { resource: inspection } = await container.item(inspectionId, 'default').read();

      // Delete file from blob storage
      await deleteInspectionAttachment(inspectionId, attachmentId);

      // Update Inspection attachments
      inspection.attachments = (inspection.attachments || []).filter((a: any) => a.id !== attachmentId);
      inspection.updatedAt = new Date().toISOString();

      // Save updated Inspection
      const { resource: updatedInspection } = await container.items.upsert(inspection);
      res.json(updatedInspection);
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ message: 'Inspection not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to delete attachment' 
    });
  }
});

// Update linked NCRs when inspection project number changes
router.put('/inspections/:id/update-ncrs', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { id } = req.params;
    const { projectNumber } = req.body;

    console.log(`Updating NCRs linked to inspection ${id} with project number ${projectNumber}`);

    // First, find all NCRs linked to this inspection
    const { resources: linkedNcrs } = await container.items
      .query({
          query: "SELECT * FROM c WHERE c.inspectionId = @inspectionId",
          parameters: [{ name: "@inspectionId", value: id }],
          partitionKey: 'default'
      })
      .fetchAll();

    console.log(`Found ${linkedNcrs.length} linked NCRs to update`);

    // Update each linked NCR with the new project number
    const updatePromises = linkedNcrs.map(async (ncr) => {
      const updatedNcr = {
        ...ncr,
        projectNumber,
        updatedAt: new Date().toISOString()
      };

      return container.items.upsert(updatedNcr);
    });

    await Promise.all(updatePromises);

    console.log('Successfully updated all linked NCRs');
    res.json({ message: 'Successfully updated linked NCRs', updatedCount: linkedNcrs.length });
  } catch (error) {
    console.error('Error updating linked NCRs:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to update linked NCRs' 
    });
  }
});

// Get all CAPA categories
router.get('/capa-categories', async(req, res) => {
  try {
    console.log('Fetching CAPA categories from database...');
    const allCategories = await db.query.capaCategories.findMany({
      orderBy: [desc(capaCategories.name)]
    });

    console.log(`Successfully fetched ${allCategories.length} CAPA categories:`, allCategories);
    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching CAPA categories:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch CAPA categories',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Get all CAPAs
router.get('/capas', async (req, res) => {
  try {
    console.log('Fetching CAPAs from database with related categories...');
    const allCapas = await db.query.capas.findMany({
      orderBy: [desc(capas.createdAt)],
      with: {
        category: true,
      },
    });

    console.log(`Successfully fetched ${allCapas.length} CAPAs:`, allCapas);
    res.json(allCapas);
  } catch (error) {
    console.error('Error fetching CAPAs:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch CAPAs',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Update the CAPA creation endpoint to handle the new status workflow
router.post('/capas', async (req, res) => {
  try {
    const newCapa = await db.insert(capas).values({
      number: `CAPA-${Date.now()}`,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || 'draft',
      priority: req.body.priority,
      type: req.body.type,
      categoryId: req.body.categoryId,
      rootCause: req.body.rootCause,
      verificationMethod: req.body.verificationMethod,
      scheduledReviewDate: req.body.scheduledReviewDate,
      createdBy: req.body.createdBy,
      department: req.body.department,
      area: req.body.area,
      sourceNcrId: req.body.sourceNcrId,
      sourceInspectionId: req.body.sourceInspectionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    // If actions are provided, create them
    if (req.body.actions?.length) {
      await db.insert(capaActions).values(
        req.body.actions.map((action: any) => ({
          capaId: newCapa[0].id,
          action: action.action,
          type: action.type,
          assignedTo: action.assignedTo,
          dueDate: action.dueDate,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );
    }

    res.status(201).json(newCapa[0]);
  } catch (error) {
    console.error('Error creating CAPA:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create CAPA'
    });
  }
});

// Add a new endpoint for CAPA status transitions
router.put('/capas/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, comment } = req.body;

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'draft': ['open'],
      'open': ['in_progress', 'cancelled'],
      'in_progress': ['pending_review', 'under_investigation'],
      'under_investigation': ['implementing'],
      'implementing': ['pending_verification'],
      'pending_verification': ['completed'],
      'completed': ['verified'],
      'verified': ['closed'],
      'pending_review': ['implementing', 'cancelled']
    };

    const capa = await db.query.capas.findFirst({
      where: eq(capas.id, id)
    });

    if (!capa) {
      return res.status(404).json({ message: 'CAPA not found' });
    }

    if (!validTransitions[capa.status]?.includes(newStatus)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${capa.status} to ${newStatus}` 
      });
    }

    // Update CAPA status
    const [updatedCapa] = await db.update(capas)
      .set({ 
        status: newStatus, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(capas.id, id))
      .returning();

    // Log the status change in CAPA history
    await db.insert(capaActions).values({
      capaId: id,
      action: `Status changed from ${capa.status} to ${newStatus}`,
      type: 'status_change',
      assignedTo: req.body.updatedBy || 'system',
      status: 'completed',
      comment: comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json(updatedCapa);
  } catch (error) {
    console.error('Error updating CAPA status:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update CAPA status'
    });
  }
});

// Add import route for CAPAs
router.post('/capas/import', fileUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    let records: any[] = [];

    // Parse based on file type
    if (req.file.mimetype === 'text/csv') {
      // Parse CSV
      const parser = csvParse({
        columns: true,
        skip_empty_lines: true
      });

      records = await new Promise((resolve, reject) => {
        const results: any[] = [];
        Readable.from(req.file!.buffer)
          .pipe(parser)
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      // Parse Excel
      const workbook = XLSX.read(req.file.buffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(firstSheet);
    }

    console.log(`Parsed ${records.length} records from imported file`);

    // Transform and validate records
    const capaPromises = records.map(async (record) => {
      const capaData = {
        number: `CAPA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: record.title || 'Untitled CAPA',
        description: record.description || '',
        status: record.status || 'draft',
        priority: record.priority || 'medium',
        type: record.type || 'corrective',
        categoryId: record.category_id ? parseInt(record.category_id) : null,
        rootCause: record.rootCause || 'To be determined',
        verificationMethod: record.verificationMethod || 'To be determined',
        department: record.department || 'General',
        area: record.area || 'General',
        scheduledReviewDate: new Date(record.scheduledReviewDate || Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return db.insert(capas).values(capaData).returning();
    });

    const results = await Promise.allSettled(capaPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Successfully imported ${successful} CAPAs, ${failed} failed`);

    res.json({
      message: `Import completed`,
      count: successful,
      failed: failed,
      total: records.length
    });
  } catch (error) {
    console.error('Error importing CAPAs:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to import CAPAs',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Add import route for SCARs
router.post('/scars/import', fileUpload.single('file'), async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    let records: any[] = [];

    // Parse based on file type
    if (req.file.mimetype === 'text/csv') {
      // Parse CSV
      const parser = csvParse({
        columns: true,
        skip_empty_lines: true
      });

      records = await new Promise((resolve, reject) => {
        const results: any[] = [];
        Readable.from(req.file!.buffer)
          .pipe(parser)
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      // Parse Excel
      const workbook = XLSX.read(req.file.buffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(firstSheet);
    }

    console.log(`Parsed ${records.length} records from imported file`);

    // Transform and validate records
    const scarPromises = records.map(async (record) => {
      const scarData = {
        id: `SCAR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number: `SCAR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        supplierName: record.supplier_name || 'Unknown Supplier',
        status: 'draft',
        issue: {
          category: record.issue_category || 'general',
          severity: record.issue_severity || 'minor',
          description: record.description || ''
        },
        issueDate: new Date().toISOString(),
        responseRequired: new Date(record.response_required_date || Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: [],
        userKey: 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return container.items.create(scarData);
    });

    const results = await Promise.allSettled(scarPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Successfully imported ${successful} SCARs, ${failed} failed`);

    res.json({
      message: `Import completed`,
      count: successful,
      failed: failed,
      total: records.length
    });
  } catch (error) {
    console.error('Error importing SCARs:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to import SCARs',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Get all inspections (REST API endpoint)
router.get('/inspections', async (req, res) => {
  try {
    // Check if container is initialized
    if (!container) {
      try {
        container = await initializeContainer();
      } catch (initError) {
        console.error('Failed to initialize container for inspections API:', initError);
        return res.status(500).json({
          error: 'Database connection failed',
          details: initError instanceof Error ? initError.message : 'Unknown error'
        });
      }
    }
    
    console.log('[REST API] Getting all quality inspections');
    
    // Query for inspections from Cosmos DB
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type IN ('in-process', 'final-qc', 'executive-review', 'pdi') ORDER BY c._ts DESC",
      parameters: []
    };
    
    const { resources: inspections } = await container.items
      .query(querySpec)
      .fetchAll();
    
    console.log(`[REST API] Found ${inspections.length} inspections`);
    
    // Add important field if missing to ensure consistent format
    const processedInspections = inspections.map((inspection: any) => {
      if (!inspection.results) {
        inspection.results = { defectsFound: [], checklistItems: [] };
      }
      if (!inspection.results.defectsFound) {
        inspection.results.defectsFound = [];
      }
      if (!inspection.results.checklistItems) {
        inspection.results.checklistItems = [];
      }
      return inspection;
    });
    
    res.json(processedInspections);
  } catch (error) {
    console.error('Error getting inspections:', error);
    res.status(500).json({
      error: 'Failed to retrieve inspections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific inspection by ID
router.get('/inspections/:id', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }
    
    const { id } = req.params;
    console.log(`[REST API] Getting inspection with ID: ${id}`);
    
    const { resource: inspection } = await container.item(id, 'default').read();
    
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    // Ensure consistent format
    if (!inspection.results) {
      inspection.results = { defectsFound: [], checklistItems: [] };
    }
    if (!inspection.results.defectsFound) {
      inspection.results.defectsFound = [];
    }
    if (!inspection.results.checklistItems) {
      inspection.results.checklistItems = [];
    }
    
    res.json(inspection);
  } catch (error) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    console.error('Error getting inspection:', error);
    res.status(500).json({
      error: 'Failed to retrieve inspection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new inspection via REST API
router.post('/inspections', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }
    
    console.log('[REST API] Creating new inspection');
    
    const inspectionData = {
      ...req.body,
      id: `inspection-${Date.now()}`,
      userKey: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Ensure the inspection data has the required fields
    if (!inspectionData.results) {
      inspectionData.results = { defectsFound: [], checklistItems: [] };
    }
    if (!inspectionData.results.defectsFound) {
      inspectionData.results.defectsFound = [];
    }
    if (!inspectionData.results.checklistItems) {
      inspectionData.results.checklistItems = [];
    }
    
    const { resource: createdInspection } = await container.items.create(inspectionData);
    console.log(`[REST API] Created inspection with ID: ${createdInspection.id}`);
    
    res.status(201).json(createdInspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({
      error: 'Failed to create inspection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update an inspection
router.put('/inspections/:id', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }
    
    const { id } = req.params;
    console.log(`[REST API] Updating inspection with ID: ${id}`);
    console.log(`[DEBUG] Request body:`, JSON.stringify(req.body, null, 2));
    
    try {
      // First check if this is a quality inspection (which uses a different container)
      if (req.body.type && ['in-process', 'final-qc', 'executive-review', 'pdi'].includes(req.body.type)) {
        try {
          // Import directly from the facility service which handles quality inspections
          const { updateQualityInspection } = await import('../../services/azure/facility_service');
          
          console.log(`[REST API] Using quality-inspections container for inspection type: ${req.body.type}`);
          console.log(`[DEBUG] Delegating to updateQualityInspection function`);
          
          const result = await updateQualityInspection(id, req.body);
          
          console.log(`[REST API] Successfully updated quality inspection with ID: ${id}`);
          console.log(`[DEBUG] Result:`, JSON.stringify(result, null, 2));
          
          return res.json(result);
        } catch (specialError) {
          console.error(`[DEBUG] Error in quality inspection update:`, specialError);
          throw specialError;
        }
      }
      
      // For other inspection types, use the quality-management container
      // First get the existing inspection
      const { resource: existingInspection } = await container.item(id, 'default').read();
      
      // Merge the existing inspection with the updates
      const updatedInspection = {
        ...existingInspection,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      // Replace the document in Cosmos DB
      const { resource: result } = await container.item(id, 'default').replace(updatedInspection);
      console.log(`[REST API] Updated inspection with ID: ${id}`);
      
      res.json(result);
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: 'Inspection not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({
      error: 'Failed to update inspection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register template API routes
export function registerQualityRoutes(app: any) {
  app.use('/api/manufacturing/quality', router);
  
  // Register inspection template routes
  registerTemplateRoutes(app);
  
  // Register gages routes
  app.use('/api/manufacturing/quality/gages', gagesRouter);
}

// Upload defect photo
router.post('/defect-photos', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const uploadedBy = req.body.uploadedBy || 'system';
    console.log(`Uploading defect photo by ${uploadedBy}`);

    // Upload the defect photo
    const photo = await uploadDefectPhoto(
      req.file,
      uploadedBy
    );

    // Return the result with URL and ID
    res.json({
      id: photo.id,
      url: photo.blobUrl,
      fileName: photo.fileName,
      fileSize: photo.fileSize
    });
  } catch (error) {
    console.error('Error uploading defect photo:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to upload defect photo' 
    });
  }
});

// Delete defect photo
router.delete('/defect-photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    console.log(`Deleting defect photo with ID: ${photoId}`);

    // Delete the photo from Azure Storage
    const deleted = await deleteDefectPhoto(photoId);

    if (!deleted) {
      return res.status(404).json({ message: 'Defect photo not found or could not be deleted' });
    }

    res.json({ success: true, message: 'Defect photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting defect photo:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to delete defect photo' 
    });
  }
});

export default router;