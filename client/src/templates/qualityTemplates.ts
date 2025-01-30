import { QualityFormTemplate } from "@/types/manufacturing";

export const fabInspectionTemplates: QualityFormTemplate[] = [
  {
    id: "fab-subframe-template",
    name: "Subframe Inspection Form",
    type: "inspection",
    description: "Quality inspection form for subframe fabrication process",
    version: 1,
    isActive: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "dimensions",
        title: "Dimensional Inspection",
        description: "Check critical dimensions and alignments",
        fields: [
          {
            id: "length",
            label: "Overall Length",
            type: "number",
            required: true,
            validation: {
              min: 0,
              max: 1000
            }
          },
          {
            id: "width",
            label: "Overall Width",
            type: "number",
            required: true,
            validation: {
              min: 0,
              max: 500
            }
          },
          {
            id: "height",
            label: "Overall Height",
            type: "number",
            required: true,
            validation: {
              min: 0,
              max: 300
            }
          }
        ]
      },
      {
        id: "welds",
        title: "Weld Inspection",
        description: "Verify weld quality and placement",
        fields: [
          {
            id: "weld-visual",
            label: "Visual Inspection",
            type: "select",
            required: true,
            options: ["Pass", "Fail", "Needs Review"]
          },
          {
            id: "weld-penetration",
            label: "Weld Penetration",
            type: "select",
            required: true,
            options: ["Acceptable", "Unacceptable"]
          },
          {
            id: "weld-defects",
            label: "Defects Found",
            type: "multiselect",
            required: false,
            options: [
              "Porosity",
              "Undercut",
              "Overlap",
              "Cracks",
              "Incomplete Fusion"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "fab-birdcage-template",
    name: "Birdcage Inspection Form",
    type: "inspection",
    description: "Quality inspection for birdcage assembly",
    version: 1,
    isActive: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "assembly-check",
        title: "Assembly Verification",
        description: "Verify proper assembly and fitment",
        fields: [
          {
            id: "component-alignment",
            label: "Component Alignment",
            type: "select",
            required: true,
            options: ["Pass", "Fail"]
          },
          {
            id: "fastener-torque",
            label: "Fastener Torque Check",
            type: "select",
            required: true,
            options: ["Pass", "Fail"]
          }
        ]
      },
      {
        id: "measurements",
        title: "Critical Measurements",
        fields: [
          {
            id: "diagonal-measurements",
            label: "Diagonal Measurements",
            type: "text",
            required: true
          },
          {
            id: "clearances",
            label: "Component Clearances",
            type: "text",
            required: true
          }
        ]
      }
    ]
  }
];

export const paintQCTemplates: QualityFormTemplate[] = [
  {
    id: "post-paint-qc",
    name: "Post Paint Quality Control",
    type: "inspection",
    description: "Quality inspection after paint application",
    version: 1,
    isActive: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "visual-inspection",
        title: "Visual Inspection",
        description: "Check paint quality and appearance",
        fields: [
          {
            id: "coverage",
            label: "Paint Coverage",
            type: "select",
            required: true,
            options: ["Complete", "Incomplete", "Touch-up Required"]
          },
          {
            id: "defects",
            label: "Surface Defects",
            type: "multiselect",
            required: true,
            options: [
              "Orange Peel",
              "Runs",
              "Sags",
              "Dirt/Debris",
              "Fish Eyes",
              "None"
            ]
          }
        ]
      },
      {
        id: "measurements",
        title: "Paint Measurements",
        fields: [
          {
            id: "thickness",
            label: "Paint Thickness (mils)",
            type: "number",
            required: true,
            validation: {
              min: 0,
              max: 100
            }
          },
          {
            id: "gloss-reading",
            label: "Gloss Reading",
            type: "number",
            required: true,
            validation: {
              min: 0,
              max: 100
            }
          }
        ]
      }
    ]
  }
];

export const productionQCTemplates: QualityFormTemplate[] = [
  {
    id: "equipment-id-qc",
    name: "Equipment ID Quality Check",
    type: "inspection",
    description: "Quality verification for equipment identification",
    version: 1,
    isActive: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "id-verification",
        title: "ID Verification",
        fields: [
          {
            id: "internal-equip-id",
            label: "Internal Equipment ID",
            type: "text",
            required: true
          },
          {
            id: "external-equip-id",
            label: "External Equipment ID",
            type: "text",
            required: true
          }
        ]
      }
    ]
  },
  {
    id: "testing-qc",
    name: "Equipment Testing QC",
    type: "inspection",
    description: "Quality checks for equipment testing",
    version: 1,
    isActive: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "operational-tests",
        title: "Operational Tests",
        fields: [
          {
            id: "road-test",
            label: "Road Test Results",
            type: "select",
            required: true,
            options: ["Pass", "Fail", "N/A"]
          },
          {
            id: "water-test",
            label: "Water Test Results",
            type: "select",
            required: true,
            options: ["Pass", "Fail", "N/A"]
          }
        ]
      },
      {
        id: "measurements",
        title: "Physical Measurements",
        fields: [
          {
            id: "operational",
            label: "Operational Check",
            type: "select",
            required: true,
            options: ["Pass", "Fail"]
          },
          {
            id: "quantitative",
            label: "Quantitative Measurements",
            type: "text",
            required: true
          }
        ]
      }
    ]
  }
];

export const finalQCTemplates: QualityFormTemplate[] = [
  {
    id: "final-qc-checklist",
    name: "Final Quality Control Checklist",
    type: "inspection",
    description: "Final quality control inspection before delivery",
    version: 1,
    isActive: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "documentation",
        title: "Documentation Check",
        fields: [
          {
            id: "manuals",
            label: "Operation Manuals",
            type: "checkbox",
            required: true
          },
          {
            id: "certificates",
            label: "Certificates",
            type: "checkbox",
            required: true
          }
        ]
      },
      {
        id: "final-inspection",
        title: "Final Inspection Points",
        fields: [
          {
            id: "appearance",
            label: "Overall Appearance",
            type: "select",
            required: true,
            options: ["Acceptable", "Needs Attention"]
          },
          {
            id: "functionality",
            label: "Functionality Check",
            type: "select",
            required: true,
            options: ["Pass", "Fail"]
          }
        ]
      }
    ]
  }
];

export const postDeliveryQCTemplates: QualityFormTemplate[] = [
  {
    id: "post-delivery-inspection",
    name: "Post-Delivery Inspection",
    type: "inspection",
    description: "Quality verification after delivery",
    version: 1,
    isActive: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "delivery-condition",
        title: "Delivery Condition",
        fields: [
          {
            id: "transport-damage",
            label: "Transportation Damage",
            type: "select",
            required: true,
            options: ["None", "Minor", "Major"]
          },
          {
            id: "completeness",
            label: "Shipment Completeness",
            type: "select",
            required: true,
            options: ["Complete", "Incomplete"]
          }
        ]
      }
    ]
  }
];
