import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { equipment, equipmentTypes, floorPlans, documents, documentVersions, trainingModules } from "@db/schema";
import { eq } from "drizzle-orm";
import { initializeOpenAI, checkOpenAIConnection } from "./services/azure/openai_service";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import multer from "multer";
import { createHash } from "crypto";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

async function initializeBlobStorage(): Promise<ContainerClient> {
  try {
    if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
      throw new Error("Azure Blob Storage connection string not configured");
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('documents');
    await containerClient.createIfNotExists();

    return containerClient;
  } catch (error) {
    console.error("Error initializing blob storage:", error);
    throw error;
  }
}

async function uploadDocument(buffer: Buffer, fileName: string, metadata: any) {
  try {
    const containerClient = await initializeBlobStorage();
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(buffer, {
      metadata,
      blobHTTPHeaders: {
        blobContentType: metadata.mimeType || 'application/octet-stream'
      }
    });

    const checksum = createHash('md5').update(buffer).digest('hex');

    return {
      url: blockBlobClient.url,
      path: fileName,
      size: buffer.length,
      checksum
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
}

async function downloadDocument(blobPath: string) {
  try {
    const containerClient = await initializeBlobStorage();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    const downloadResponse = await blockBlobClient.download(0);
    const chunks: Buffer[] = [];

    for await (const chunk of downloadResponse.readableStreamBody!) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error downloading document:", error);
    throw error;
  }
}

async function listBlobContents(prefix: string = '') {
  try {
    const containerClient = await initializeBlobStorage();

    console.log("Listing blobs with prefix:", prefix);

    const items: Array<{
      name: string;
      path: string;
      type: 'folder' | 'file';
      size?: number;
      lastModified?: string;
    }> = [];

    const processedFolders = new Set<string>();

    // List all blobs including those in subfolders
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      console.log("Found blob:", blob.name);
      const relativePath = blob.name.slice(prefix.length);
      const parts = relativePath.split('/');

      // Process all parent folders in the path
      let currentPath = prefix;
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        if (!folderName) continue;

        currentPath += folderName + '/';
        if (!processedFolders.has(currentPath)) {
          processedFolders.add(currentPath);
          items.push({
            name: folderName,
            path: currentPath,
            type: 'folder'
          });
        }
      }

      // Add the file itself if it's not a folder marker
      if (!blob.name.endsWith('/') && parts[parts.length - 1]) {
        items.push({
          name: parts[parts.length - 1],
          path: blob.name,
          type: 'file',
          size: blob.properties.contentLength || 0,
          lastModified: blob.properties.lastModified?.toISOString()
        });
      }
    }

    console.log("Found items:", items);
    return items;
  } catch (error) {
    console.error("Error listing blob contents:", error);
    throw error;
  }
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Document Management Routes
  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const file = req.file;
      const metadata = {
        mimeType: file.mimetype,
        originalName: file.originalname,
        ...req.body,
      };

      const uploadResult = await uploadDocument(file.buffer, file.originalname, metadata);
      if (!uploadResult) {
        return res.status(503).json({ error: "Document storage service unavailable" });
      }

      // Create document record in database
      const document = await db.insert(documents).values({
        title: req.body.title || file.originalname,
        description: req.body.description,
        blobStorageUrl: uploadResult.url,
        blobStorageContainer: "documents",
        blobStoragePath: uploadResult.path,
        version: "1.0",
        status: "draft",
        documentType: req.body.documentType || "general",
        mimeType: file.mimetype,
        fileSize: uploadResult.size,
        checksum: uploadResult.checksum,
        createdBy: req.body.userId || "system",
        updatedBy: req.body.userId || "system",
        metadata: req.body.metadata,
        tags: req.body.tags,
      }).returning();

      res.json(document[0]);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/documents", async (req, res) => {
    try {
      const docs = await db.query.documents.findMany({
        orderBy: (documents, { desc }) => [desc(documents.createdAt)],
        with: {
          versions: true,
          approvals: true,
          collaborators: true,
        },
      });
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, parseInt(req.params.id)),
        with: {
          versions: true,
          approvals: true,
          collaborators: true,
        },
      });

      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const metadata = await getDocumentMetadata(doc.blobStoragePath);
      res.json({ ...doc, metadata });
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, parseInt(req.params.id)),
      });

      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const fileBuffer = await downloadDocument(doc.blobStoragePath);
      res.setHeader("Content-Type", doc.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${doc.title}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // Create new version of a document
  app.post("/api/documents/:id/versions", upload.single("file"), async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, documentId),
      });

      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const file = req.file;
      const metadata = {
        mimeType: file.mimetype,
        originalName: file.originalname,
        ...req.body,
      };

      const uploadResult = await uploadDocument(file.buffer, file.originalname, metadata);
      if (!uploadResult) {
        return res.status(503).json({ error: "Document storage service unavailable" });
      }

      // Create version record
      const version = await db.insert(documentVersions).values({
        documentId,
        version: req.body.version,
        blobStorageUrl: uploadResult.url,
        blobStoragePath: uploadResult.path,
        changelog: req.body.changelog,
        createdBy: req.body.userId || "system",
        metadata: req.body.metadata,
      }).returning();

      // Update document record
      await db.update(documents)
        .set({
          version: req.body.version,
          blobStorageUrl: uploadResult.url,
          blobStoragePath: uploadResult.path,
          updatedBy: req.body.userId || "system",
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId));

      res.json(version[0]);
    } catch (error) {
      console.error("Error creating document version:", error);
      res.status(500).json({ error: "Failed to create document version" });
    }
  });

  // Azure Services Status endpoint
  app.get("/api/azure/status", async (_req, res) => {
    try {
      // Check OpenAI connection
      const openAIStatus = await checkOpenAIConnection();

      // Check Blob Storage connection
      let blobStatus = {
        status: "error",
        message: "Missing connection string"
      };

      if (process.env.AZURE_BLOB_CONNECTION_STRING) {
        try {
          const containerClient = await initializeBlobStorage();
          if (containerClient) {
            await containerClient.getProperties();
            blobStatus = {
              status: "connected",
              message: "Connected to Azure Blob Storage"
            };
          } else {
            blobStatus = {
              status: "error",
              message: "Failed to initialize Blob Storage"
            };
          }
        } catch (error) {
          blobStatus = {
            status: "error",
            message: "Failed to connect to Blob Storage: " + (error instanceof Error ? error.message : "Unknown error")
          };
        }
      }

      // Check Database connection
      let dbStatus = {
        status: "error",
        message: "Missing connection string"
      };

      if (process.env.DATABASE_URL) {
        try {
          await db.query.documents.findFirst();
          dbStatus = {
            status: "connected",
            message: "Connected to Database"
          };
        } catch (error) {
          dbStatus = {
            status: "error",
            message: "Failed to connect to Database: " + (error instanceof Error ? error.message : "Unknown error")
          };
        }
      }

      res.json([
        {
          name: "OpenAI",
          status: openAIStatus.status,
          message: openAIStatus.message
        },
        {
          name: "Blob Storage",
          status: blobStatus.status,
          message: blobStatus.message
        },
        {
          name: "Database",
          status: dbStatus.status,
          message: dbStatus.message
        }
      ]);
    } catch (error) {
      console.error("Error checking Azure services status:", error);
      res.status(500).json({
        error: "Failed to check Azure services status",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Equipment routes
  app.get("/api/equipment", async (_req, res) => {
    try {
      const items = await db.query.equipment.findMany({
        orderBy: (equipment, { asc }) => [asc(equipment.name)],
        with: {
          type: true
        }
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Usage Prediction endpoint with fixed type errors
  app.get("/api/equipment/:id/predictions", async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const item = await db.query.equipment.findFirst({
        where: eq(equipment.id, equipmentId),
        with: {
          type: true
        }
      });

      if (!item) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Generate mock prediction data with proper type handling
      const predictions = {
        usageHours: Math.floor(Math.random() * 8) + 2,
        peakTimes: ["09:00", "17:00"],
        maintenanceRecommendation: item.maintenanceScore && Number(item.maintenanceScore) < 70
          ? "Schedule maintenance soon"
          : "No immediate maintenance required",
        nextPredictedMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      res.json(predictions);
    } catch (error) {
      console.error("Error generating predictions:", error);
      res.status(500).json({ error: "Failed to generate predictions" });
    }
  });

  // Add this new endpoint for predictive usage
  app.get("/api/equipment/:id/predictive-usage", async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const item = await db.query.equipment.findFirst({
        where: eq(equipment.id, equipmentId),
        with: {
          type: true
        }
      });

      if (!item) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Generate mock predictive usage data
      // In a real application, this would come from ML models and historical data
      const currentHour = new Date().getHours();
      const peakHours = [9, 17]; // 9 AM and 5 PM are typical peak hours
      const nextPeakHour = peakHours.find(h => h > currentHour) || peakHours[0];
      const minutesToPeak = nextPeakHour > currentHour
        ? (nextPeakHour - currentHour) * 60
        : (24 - currentHour + nextPeakHour) * 60;

      const predictiveData = {
        currentCapacity: Math.floor(Math.random() * 40) + 30, // 30-70%
        predictedPeakTime: "17:00",
        predictedQuietTime: "14:00",
        utilizationRate: Math.floor(Math.random() * 30) + 60, // 60-90%
        nextPeakIn: minutesToPeak,
        recommendations: [
          "Schedule maintenance during predicted quiet period",
          "Prepare for increased usage in 2 hours",
          "Consider redistributing load to similar equipment"
        ]
      };

      res.json(predictiveData);
    } catch (error) {
      console.error("Error generating predictive usage data:", error);
      res.status(500).json({ error: "Failed to generate predictive usage data" });
    }
  });

  // Performance Report endpoint with fixed type errors
  app.post("/api/equipment/report", async (req, res) => {
    try {
      const { equipmentIds } = req.body;

      if (!Array.isArray(equipmentIds)) {
        return res.status(400).json({ error: "Invalid equipment IDs" });
      }

      const items = await db.query.equipment.findMany({
        where: eq(equipment.id, equipmentIds[0]),
        with: {
          type: true
        }
      });

      if (!items.length) {
        return res.status(404).json({ error: "No equipment found" });
      }

      // Generate mock report data with proper type handling
      const report = {
        generatedAt: new Date().toISOString(),
        equipment: items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type?.name || "Unknown",
          healthScore: Number(item.healthScore || 0),
          maintenanceScore: Number(item.maintenanceScore || 0),
          lastMaintenance: item.lastMaintenance,
          metrics: {
            uptime: Math.floor(Math.random() * 100),
            efficiency: Math.floor(Math.random() * 100),
            utilization: Math.floor(Math.random() * 100)
          }
        })),
        analysis: {
          performanceAnalysis: [
            "Equipment efficiency trends show consistent performance",
            "Usage patterns indicate optimal load distribution",
            "Maintenance schedule adherence is above target"
          ],
          maintenanceRecommendations: [
            "Schedule preventive maintenance for high-usage equipment",
            "Consider upgrading aging components",
            "Monitor wear patterns on critical components"
          ],
          usageOptimization: [
            "Redistribute peak hour equipment usage",
            "Implement energy-saving modes during off-peak hours",
            "Consider equipment rotation to balance wear"
          ],
          riskAssessment: [
            "Low risk of immediate equipment failure",
            "Medium-term maintenance needs identified",
            "Contingency plans in place for critical equipment"
          ]
        },
        summary: {
          totalEquipment: items.length,
          averageHealth: items.reduce((acc, item) => acc + Number(item.healthScore || 0), 0) / items.length,
          requiresMaintenance: items.filter(item => Number(item.maintenanceScore || 0) < 70).length,
          offline: items.filter(item => item.status === 'offline').length
        }
      };

      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Save floor plan
  app.post("/api/floor-plans", async (req, res) => {
    try {
      const { name, description, dimensions, gridSize, metadata } = req.body;

      // Try to find an active floor plan
      const result = await db.query.floorPlans.findFirst({
        where: eq(floorPlans.isActive, true)
      });

      if (result) {
        // Update existing floor plan
        await db.update(floorPlans)
          .set({
            name,
            description,
            dimensions,
            gridSize,
            metadata,
            updatedAt: new Date()
          })
          .where(eq(floorPlans.id, result.id));
      } else {
        // Create new floor plan
        await db.insert(floorPlans).values({
          name,
          description,
          dimensions,
          gridSize,
          metadata,
          isActive: true,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving floor plan:", error);
      // Still return success since equipment positions are saved
      res.json({ success: true, warning: "Some settings may not have been saved" });
    }
  });

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const result = await db.update(equipment)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(equipment.id, parseInt(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  app.patch("/api/equipment/:id/icon", async (req, res) => {
    try {
      const result = await db.update(equipment)
        .set({
          deviceType: req.body.iconKey,
          updatedAt: new Date()
        })
        .where(eq(equipment.id, parseInt(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update equipment icon" });
    }
  });

  app.get("/api/equipment/suggest-icons", async (req, res) => {
    const { name, type } = req.query;

    // Predetermined icon suggestions based on equipment type
    const suggestions = [
      {
        key: "treadmill",
        reason: "Common for cardio equipment with walking/running function",
        confidence: 0.9
      },
      {
        key: "bike",
        reason: "Suitable for cycling-based equipment",
        confidence: 0.85
      },
      {
        key: "dumbbell",
        reason: "Classic icon for strength training equipment",
        confidence: 0.8
      },
      {
        key: "bench",
        reason: "Represents equipment with seating or lying position",
        confidence: 0.75
      }
    ];

    res.json(suggestions);
  });

  // Add this new endpoint for generating sample training documents
  app.post("/api/training/generate-samples", async (_req, res) => {
    try {
      const sampleTrainingDocs = [
        {
          title: "Safety Protocols Training",
          content: "Comprehensive guide to gym safety protocols...",
          type: "training",
          moduleLevel: 1
        },
        {
          title: "Equipment Maintenance Guide",
          content: "Detailed instructions for maintaining gym equipment...",
          type: "training",
          moduleLevel: 2
        },
        {
          title: "Customer Service Best Practices",
          content: "Guidelines for providing excellent customer service...",
          type: "training",
          moduleLevel: 1
        }
      ];

      for (const doc of sampleTrainingDocs) {
        const buffer = Buffer.from(doc.content);
        const fileName = `${doc.title.toLowerCase().replace(/\s+/g, '-')}.txt`;

        const uploadResult = await uploadDocument(buffer, fileName, {
          type: doc.type,
          moduleLevel: doc.moduleLevel
        });

        if (uploadResult) {
          // Create document record
          await db.insert(documents).values({
            title: doc.title,
            description: `Training document for ${doc.title}`,
            blobStorageUrl: uploadResult.url,
            blobStorageContainer: "documents",
            blobStoragePath: uploadResult.path,
            version: "1.0",
            status: "released",
            documentType: "training",
            mimeType: "text/plain",
            fileSize: buffer.length,
            checksum: uploadResult.checksum,
            createdBy: "system",
            updatedBy: "system",
            metadata: { moduleLevel: doc.moduleLevel },
            tags: ["training", `level-${doc.moduleLevel}`],
          });
        }
      }

      res.json({ message: "Sample training documents generated successfully" });
    } catch (error) {
      console.error("Error generating sample documents:", error);
      res.status(500).json({ error: "Failed to generate sample documents" });
    }
  });


  // Generate sample documents
  app.post("/api/documents/generate-samples", async (_req, res) => {
    try {
      // Sample document structure with real content
      const sampleDocs = [
        {
          title: "Gym Equipment Safety Guidelines",
          content: `
# Gym Equipment Safety Guidelines
Last Updated: January 2025

## 1. General Safety Rules
- Always inspect equipment before use
- Report any damaged equipment immediately
- Clean equipment after use
- Follow proper form and technique

## 2. Equipment-Specific Guidelines
### Cardio Equipment
- Use emergency stop clips when provided
- Start at a comfortable pace
- Hold handrails when mounting/dismounting

### Weight Equipment
- Use spotters for free weights
- Secure weight plates with clips
- Never exceed weight limits

## 3. Emergency Procedures
Contact staff immediately in case of:
- Equipment malfunction
- Injury or medical emergency
- Unusual sounds or smells

## 4. Maintenance Schedule
Daily:
- Equipment inspection
- Cleaning and sanitization

Weekly:
- Detailed safety check
- Cable inspection
- Belt tension check`,
          folder: "policies",
          type: "policy"
        },
        {
          title: "Member Services Handbook",
          content: `
# Member Services Handbook
Version: 2025.1

## 1. Customer Service Standards
- Greet all members by name when possible
- Respond to inquiries within 10 minutes
- Maintain professional appearance
- Follow up on complaints within 24 hours

## 2. Membership Types
- Standard
- Premium
- Corporate
- Student

## 3. Check-in Procedures
- Verify membership status
- Scan membership card
- Check photo ID if needed

## 4. Common Scenarios
### New Members
- Facility tour
- Equipment orientation
- Class schedule review

### Membership Renewal
- Review benefits
- Update contact info
- Process payment`,
          folder: "training",
          type: "manual"
        },
        {
          title: "Emergency Response Protocol",
          content: `
# Emergency Response Protocol
Priority: Critical

## 1. Medical Emergencies
### Immediate Actions
1. Assess the situation
2. Call emergency services (911)
3. Clear the area
4. Provide first aid if qualified

### Follow-up
- Complete incident report
- Contact management
- Review security footage

## 2. Facility Emergencies
### Fire
- Activate alarm
- Begin evacuation
- Meet at assembly point

### Power Outage
- Activate emergency lights
- Assist members
- Secure equipment`,
          folder: "safety",
          type: "procedure"
        },
        {
          title: "Personal Trainer Guidelines",
          content: `
# Personal Trainer Guidelines
Effective: January 2025

## 1. Certification Requirements
- Current CPT certification
- First Aid/CPR certification
- Liability insurance
- Continuing education

## 2. Session Protocols
- Initial assessment
- Goal setting
- Progress tracking
- Regular reassessment

## 3. Documentation
- Client records
- Workout plans
- Progress photos
- Measurements

## 4. Professional Standards
- Punctuality
- Dress code
- Communication
- Client confidentiality`,
          folder: "training",
          type: "manual"
        },
        {
          title: "Equipment Maintenance Manual",
          content: `
# Equipment Maintenance Manual
Reference: Tech-2025

## 1. Daily Checks
- Power connection
- Display functionality
- Moving parts
- Safety features

## 2. Weekly Maintenance
- Belt alignment
- Lubrication
- Cable inspection
- Computer diagnostics

## 3. Monthly Service
- Deep cleaning
- Calibration
- Software updates
- Wear assessment

## 4. Troubleshooting
Common Issues:
- Error codes
- Strange noises
- Power problems
- Display issues`,
          folder: "manuals",
          type: "manual"
        }
      ];

      for (const doc of sampleDocs) {
        // Convert content to a Word-like format using markdown
        const buffer = Buffer.from(doc.content);
        const fileName = `${doc.folder}/${doc.title.toLowerCase().replace(/\s+/g, '-')}.txt`;

        // Create folder if it doesn't exist
        const folderPath = `${doc.folder}/.folder`;
        let containerClient: ContainerClient | null = null;
        try {
          containerClient = await initializeBlobStorage();
          const folderBlob = containerClient.getBlockBlobClient(folderPath);
          await folderBlob.uploadData(Buffer.from(""));
        } catch (error) {
          console.error("Error creating folder:", error);
        }

        // Upload document
        if (containerClient) {
          const blockBlobClient = containerClient.getBlockBlobClient(fileName);
          await blockBlobClient.upload(doc.content, doc.content.length, {
            blobHTTPHeaders: {
              blobContentType: 'text/markdown'
            }
          });
        }


        // Create document record
        await db.insert(documents).values({
          title: doc.title,
          description: `Sample ${doc.type} document`,
          blobStorageUrl: containerClient ? containerClient.getBlockBlobClient(fileName).url : "",
          blobStorageContainer: "documents",
          blobStoragePath: fileName,
          version: "1.0",
          status: "released",
          documentType: doc.type,
          mimeType: "text/markdown",
          fileSize: doc.content.length,
          checksum: createHash('md5').update(doc.content).digest('hex'),
          createdBy: "system",
          updatedBy: "system",
          metadata: { generated: true },
          tags: [doc.type, doc.folder]
        });
      }

      res.json({ message: "Sample documents generated successfully" });
    } catch (error) {
      console.error("Error generating sample documents:", error);
      res.status(500).json({ error: "Failed to generate sample documents" });
    }
  });

  // Browse blob storage contents
  app.get("/api/documents/browse", async (req, res) => {
    try {
      const prefix = (req.query.path as string || '').replace(/^\//, '');
      console.log("Browsing documents with prefix:", prefix);
      const items = await listBlobContents(prefix);
      res.json(items);
    } catch (error) {
      console.error("Error browsing documents:", error);
      res.status(500).json({
        error: "Failed to browse documents",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create folder (marker blob)
  app.post("/api/documents/folders", async (req, res) => {
    try {
      const { path } = req.body;
      if (!path) {
        return res.status(400).json({ error: "Path is required" });
      }

      const containerClient = await initializeBlobStorage();
      const folderPath = path.replace(/^\/+|\/+$/g, '') + '/.folder';
      const blockBlobClient = containerClient.getBlockBlobClient(folderPath);
      await blockBlobClient.upload("", 0);

      res.json({ success: true, path: folderPath });
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({
        error: "Failed to create folder",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Document version management routes
  app.get("/api/documents/:id/versions", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const versions = await db.query.documentVersions.findMany({
        where: eq(documentVersions.documentId, documentId),
        orderBy: (versions, { desc }) => [desc(versions.createdAt)]
      });
      res.json(versions);
    } catch (error) {
      console.error("Error fetching document versions:", error);
      res.status(500).json({ error: "Failed to fetch document versions" });
    }
  });

  app.post("/api/documents/versions/:id/review", async (req, res) => {
    try {
      const versionId = parseInt(req.params.id);
      const { approved, notes } = req.body;

      const result = await db.update(documentVersions)
        .set({
          status: approved ? 'approved' : 'rejected',
          reviewerNotes: notes,
          reviewerUserId: 'system', // Replace with actual user ID
          approvedAt: approved ? new Date() : null
        })
        .where(eq(documentVersions.id, versionId))
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Error reviewing document version:", error);
      res.status(500).json({ error: "Failed to review document version" });
    }
  });

  async function getDocumentMetadata(blobPath: string) {
    try {
      const containerClient = await initializeBlobStorage();
      const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

      const properties = await blockBlobClient.getProperties();
      return properties.metadata;
    } catch (error) {
      console.error("Error getting document metadata:", error);
      return null;
    }
  }

  return httpServer;
}