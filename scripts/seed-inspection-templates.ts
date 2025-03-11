import { CosmosClient, Container, Database } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Templates
const inspectionTemplates = [
  {
    id: uuidv4(),
    name: "Production Line Startup Checklist",
    description: "Daily inspection for production line startup verification",
    category: "production",
    version: 1,
    isActive: true,
    isArchived: false,
    standard: "ISO 9001",
    type: "inspection-template",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    sections: [
      {
        id: uuidv4(),
        title: "Safety Check",
        description: "Verify all safety equipment is operational",
        order: 1,
        fields: [
          {
            id: uuidv4(),
            type: "boolean",
            label: "Emergency stop buttons functional",
            description: "Test all emergency stop buttons to ensure they trigger machine shutdown",
            required: true,
            order: 1
          },
          {
            id: uuidv4(),
            type: "boolean",
            label: "Safety guards in place",
            description: "Verify that all machine guards are properly installed and secure",
            required: true,
            order: 2
          },
          {
            id: uuidv4(),
            type: "boolean",
            label: "Warning lights operational",
            description: "Check that caution/warning lights illuminate when required",
            required: true,
            order: 3
          }
        ]
      },
      {
        id: uuidv4(),
        title: "Equipment Inspection",
        description: "Check mechanical and electrical systems",
        order: 2,
        fields: [
          {
            id: uuidv4(),
            type: "visual",
            label: "Conveyor belt condition",
            description: "Inspect conveyor belt for damage, wear or alignment issues",
            required: true,
            acceptable: ["Good", "Minor wear", "Needs adjustment"],
            order: 1
          },
          {
            id: uuidv4(),
            type: "measurement",
            label: "Hydraulic pressure",
            description: "Measure hydraulic system pressure at startup",
            required: true,
            unit: "PSI",
            min: 1200,
            max: 1500,
            order: 2
          },
          {
            id: uuidv4(),
            type: "select",
            label: "Machine noise level",
            description: "Rate the operational noise level of the production line",
            required: true,
            options: ["Normal", "Slightly louder than normal", "Concerning noise", "Very loud"],
            order: 3
          }
        ]
      },
      {
        id: uuidv4(),
        title: "System Verification",
        description: "Ensure control systems are operating correctly",
        order: 3,
        fields: [
          {
            id: uuidv4(),
            type: "boolean",
            label: "Control panel responsive",
            description: "Verify control system boots up and responds to input",
            required: true,
            order: 1
          },
          {
            id: uuidv4(),
            type: "boolean",
            label: "Software version current",
            description: "Check that the control system is running the latest software",
            required: true,
            order: 2
          },
          {
            id: uuidv4(),
            type: "text",
            label: "System status messages",
            description: "Record any warning or error messages displayed on startup",
            required: false,
            order: 3
          }
        ]
      }
    ]
  },
  {
    id: uuidv4(),
    name: "Finished Product Quality Inspection",
    description: "Final quality check before product shipment",
    category: "quality",
    version: 1,
    isActive: true,
    isArchived: false,
    standard: "ISO 9001",
    type: "inspection-template",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    sections: [
      {
        id: uuidv4(),
        title: "Visual Inspection",
        description: "Check for visual defects",
        order: 1,
        fields: [
          {
            id: uuidv4(),
            type: "visual",
            label: "Surface finish",
            description: "Inspect for scratches, dents or discoloration",
            required: true,
            acceptable: ["Perfect", "Minor imperfections", "Unacceptable defects"],
            order: 1
          },
          {
            id: uuidv4(),
            type: "visual",
            label: "Assembly quality",
            description: "Check for proper assembly of all components",
            required: true,
            acceptable: ["Correct", "Minor issues", "Major issues"],
            order: 2
          },
          {
            id: uuidv4(),
            type: "image",
            label: "Product photo",
            description: "Take a photo of the complete product",
            required: true,
            order: 3
          }
        ]
      },
      {
        id: uuidv4(),
        title: "Functional Testing",
        description: "Verify product functionality",
        order: 2,
        fields: [
          {
            id: uuidv4(),
            type: "boolean",
            label: "Power on test",
            description: "Product powers on and initializes correctly",
            required: true,
            order: 1
          },
          {
            id: uuidv4(),
            type: "boolean",
            label: "Feature test",
            description: "All product features function as specified",
            required: true,
            order: 2
          },
          {
            id: uuidv4(),
            type: "text",
            label: "Test notes",
            description: "Record any observations during functional testing",
            required: false,
            order: 3
          }
        ]
      },
      {
        id: uuidv4(),
        title: "Packaging Inspection",
        description: "Verify packaging quality and completeness",
        order: 3,
        fields: [
          {
            id: uuidv4(),
            type: "boolean",
            label: "Box condition",
            description: "Packaging is undamaged and clean",
            required: true,
            order: 1
          },
          {
            id: uuidv4(),
            type: "boolean",
            label: "All components included",
            description: "All required accessories and documentation are in the package",
            required: true,
            order: 2
          },
          {
            id: uuidv4(),
            type: "select",
            label: "Label quality",
            description: "Check that all labels are correctly applied and legible",
            required: true,
            options: ["Perfect", "Acceptable", "Needs replacement"],
            order: 3
          }
        ]
      }
    ]
  },
  {
    id: uuidv4(),
    name: "Equipment Maintenance Inspection",
    description: "Routine maintenance verification checklist",
    category: "maintenance",
    version: 1,
    isActive: true,
    isArchived: false,
    standard: "ISO 9001",
    type: "inspection-template",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    sections: [
      {
        id: uuidv4(),
        title: "Lubrication System",
        description: "Check lubrication system components",
        order: 1,
        fields: [
          {
            id: uuidv4(),
            type: "measurement",
            label: "Oil level",
            description: "Measure oil reservoir level",
            required: true,
            unit: "%",
            min: 50,
            max: 100,
            order: 1
          },
          {
            id: uuidv4(),
            type: "visual",
            label: "Oil condition",
            description: "Inspect oil for contamination or discoloration",
            required: true,
            acceptable: ["Clean", "Slightly dirty", "Needs replacement"],
            order: 2
          },
          {
            id: uuidv4(),
            type: "boolean",
            label: "Lubrication points checked",
            description: "Verify all lubrication points have been serviced",
            required: true,
            order: 3
          }
        ]
      },
      {
        id: uuidv4(),
        title: "Electrical System",
        description: "Inspect electrical components",
        order: 2,
        fields: [
          {
            id: uuidv4(),
            type: "boolean",
            label: "Wiring condition",
            description: "Check for frayed wires, loose connections, or damage",
            required: true,
            order: 1
          },
          {
            id: uuidv4(),
            type: "measurement",
            label: "Voltage test",
            description: "Measure supply voltage",
            required: true,
            unit: "V",
            min: 220,
            max: 240,
            order: 2
          },
          {
            id: uuidv4(),
            type: "boolean",
            label: "Control panel functionality",
            description: "Test all buttons, switches and indicators",
            required: true,
            order: 3
          }
        ]
      },
      {
        id: uuidv4(),
        title: "Mechanical Components",
        description: "Check mechanical parts for wear and proper operation",
        order: 3,
        fields: [
          {
            id: uuidv4(),
            type: "boolean",
            label: "Belt tension correct",
            description: "Verify drive belts have proper tension",
            required: true,
            order: 1
          },
          {
            id: uuidv4(),
            type: "visual",
            label: "Bearing condition",
            description: "Inspect bearings for wear or damage",
            required: true,
            acceptable: ["Good", "Minor wear", "Needs replacement"],
            order: 2
          },
          {
            id: uuidv4(),
            type: "text",
            label: "Maintenance notes",
            description: "Record any findings or recommendations",
            required: false,
            order: 3
          }
        ]
      }
    ]
  }
];

async function seedTemplates() {
  try {
    // Check for connection string
    if (!process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING) {
      throw new Error("Azure Cosmos DB connection string not configured");
    }

    const connectionString = process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING.trim();
    console.log("Connecting to Cosmos DB...");
    
    // Create client
    const client = new CosmosClient(connectionString);
    
    // Get or create database
    const { database } = await client.databases.createIfNotExists({
      id: "NomadAIEngineDB"
    });
    
    console.log("Connected to database NomadAIEngineDB");
    
    // Get or create container
    const { container } = await database.containers.createIfNotExists({
      id: "inspection-templates",
      partitionKey: { paths: ["/id"] }
    });
    
    console.log("Connected to container inspection-templates");
    
    // Check for existing templates to avoid duplicates
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = @type",
      parameters: [
        {
          name: "@type",
          value: "inspection-template"
        }
      ]
    };
    
    const { resources: existingTemplates } = await container.items.query(querySpec).fetchAll();
    
    if (existingTemplates.length > 0) {
      console.log(`Found ${existingTemplates.length} existing templates.`);
      const shouldProceed = process.argv.includes("--force");
      
      if (!shouldProceed) {
        console.log("Templates already exist. Use --force to overwrite/add anyway.");
        console.log("Existing template names:");
        existingTemplates.forEach((template: any) => {
          console.log(`- ${template.name}`);
        });
        return;
      }
    }
    
    // Upload templates
    console.log("Uploading templates...");
    
    for (const template of inspectionTemplates) {
      const response = await container.items.create(template);
      console.log(`Created template: ${template.name} (${response.resource.id})`);
    }
    
    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

// Run seeding
seedTemplates();