import { InspectionTemplate } from "@/types/manufacturing/templates";

export const fabricationInspectionTemplate: InspectionTemplate = {
  id: "fab-template-1",
  name: "Custom Fabricated Sub-frame Inspection",
  description: "Comprehensive inspection template for custom fabricated sub-frames",
  category: "Fabrication",
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: "section-dimensions",
      title: "Dimensional Inspection",
      description: "Verify all critical dimensions against engineering specifications",
      order: 1,
      fields: [
        {
          id: "field-length",
          type: "measurement",
          label: "Overall Length",
          description: "Measure the total length of the sub-frame",
          required: true,
          unit: "mm",
          min: 1800,
          max: 1805
        },
        {
          id: "field-width",
          type: "measurement",
          label: "Overall Width",
          description: "Measure the total width of the sub-frame",
          required: true,
          unit: "mm",
          min: 950,
          max: 955
        },
        {
          id: "field-height",
          type: "measurement",
          label: "Overall Height",
          description: "Measure the total height of the sub-frame",
          required: true,
          unit: "mm",
          min: 300,
          max: 305
        },
        {
          id: "field-diagonal",
          type: "measurement",
          label: "Diagonal Measurement",
          description: "Check for squareness by measuring diagonally",
          required: true,
          unit: "mm",
          min: 2030,
          max: 2035
        }
      ]
    },
    {
      id: "section-welds",
      title: "Weld Inspection",
      description: "Check quality of all welds on the sub-frame",
      order: 2,
      fields: [
        {
          id: "field-weld-visual",
          type: "boolean",
          label: "Visual Weld Inspection",
          description: "Inspect all welds for uniformity, cracks, and proper penetration",
          required: true
        },
        {
          id: "field-weld-porosity",
          type: "select",
          label: "Weld Porosity Check",
          description: "Check welds for any signs of porosity",
          required: true,
          options: ["None", "Minimal", "Moderate", "Severe"]
        },
        {
          id: "field-weld-photos",
          type: "image",
          label: "Weld Photos",
          description: "Take photos of critical welds for documentation",
          required: false,
          multiple: true
        },
        {
          id: "field-weld-notes",
          type: "text",
          label: "Weld Inspector Notes",
          description: "Additional notes on weld quality",
          required: false
        }
      ]
    },
    {
      id: "section-materials",
      title: "Material Verification",
      description: "Verify materials used match specifications",
      order: 3,
      fields: [
        {
          id: "field-material-cert",
          type: "boolean",
          label: "Material Certification Verified",
          description: "Confirm material certification documents match requirements",
          required: true
        },
        {
          id: "field-material-type",
          type: "select",
          label: "Material Type",
          description: "Confirm the material type used",
          required: true,
          options: ["A36 Steel", "4130 Chrome-Moly", "6061-T6 Aluminum", "304 Stainless Steel"]
        },
        {
          id: "field-material-thickness",
          type: "measurement",
          label: "Material Thickness",
          description: "Measure material thickness at key points",
          required: true,
          unit: "mm",
          min: 3.0,
          max: 3.2
        }
      ]
    },
    {
      id: "section-finish",
      title: "Surface Finish",
      description: "Inspect surface preparation and finishing",
      order: 4,
      fields: [
        {
          id: "field-surface-prep",
          type: "boolean",
          label: "Surface Preparation Complete",
          description: "Verify surface has been properly prepared for coating",
          required: true
        },
        {
          id: "field-coating-type",
          type: "select",
          label: "Coating Type Applied",
          description: "Record the type of protective coating applied",
          required: true,
          options: ["Powder Coat", "E-Coat", "Paint", "Galvanized", "None"]
        },
        {
          id: "field-coating-thickness",
          type: "measurement",
          label: "Coating Thickness",
          description: "Measure coating thickness",
          required: true,
          unit: "mil",
          min: 2.5,
          max: 3.5
        },
        {
          id: "field-finish-quality",
          type: "select",
          label: "Overall Finish Quality",
          description: "Assess the overall quality of the finish",
          required: true,
          options: ["Excellent", "Good", "Acceptable", "Poor", "Unacceptable"]
        }
      ]
    }
  ]
};

export const electricalInspectionTemplate: InspectionTemplate = {
  id: "elec-template-1",
  name: "Electrical System Inspection",
  description: "Comprehensive inspection template for electrical systems in shelters",
  category: "Electrical",
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: "section-power",
      title: "Power Distribution",
      description: "Verify power distribution systems",
      order: 1,
      fields: [
        {
          id: "field-voltage",
          type: "measurement",
          label: "Main Voltage",
          description: "Measure the main input voltage",
          required: true,
          unit: "V",
          min: 117,
          max: 123
        },
        {
          id: "field-circuit-breakers",
          type: "boolean",
          label: "Circuit Breakers Operational",
          description: "Test all circuit breakers for proper operation",
          required: true
        },
        {
          id: "field-gfci",
          type: "boolean",
          label: "GFCI Protection Working",
          description: "Test GFCI outlets for proper operation",
          required: true
        }
      ]
    },
    {
      id: "section-wiring",
      title: "Wiring Inspection",
      description: "Check all electrical wiring",
      order: 2,
      fields: [
        {
          id: "field-wire-gauge",
          type: "select",
          label: "Wire Gauge Verification",
          description: "Verify correct wire gauge is used according to specs",
          required: true,
          options: ["Correct", "Incorrect", "Mixed"]
        },
        {
          id: "field-connection-quality",
          type: "select",
          label: "Connection Quality",
          description: "Check quality of all electrical connections",
          required: true,
          options: ["Excellent", "Good", "Acceptable", "Poor", "Unacceptable"]
        },
        {
          id: "field-insulation",
          type: "boolean",
          label: "Insulation Integrity",
          description: "Check insulation for damage or wear",
          required: true
        }
      ]
    },
    {
      id: "section-safety",
      title: "Safety Systems",
      description: "Verify electrical safety systems",
      order: 3,
      fields: [
        {
          id: "field-grounding",
          type: "boolean",
          label: "Proper Grounding",
          description: "Verify proper grounding of all electrical systems",
          required: true
        },
        {
          id: "field-resistance",
          type: "measurement",
          label: "Ground Resistance",
          description: "Measure ground resistance",
          required: true,
          unit: "Ω",
          min: 0,
          max: 5
        },
        {
          id: "field-safety-labels",
          type: "boolean",
          label: "Safety Labels Present",
          description: "Verify all required safety labels are in place",
          required: true
        }
      ]
    }
  ]
};

export const paintInspectionTemplate: InspectionTemplate = {
  id: "paint-template-1",
  name: "Paint Inspection Checklist",
  description: "Quality control template for paint application on shelters",
  category: "Paint",
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: "section-prep",
      title: "Surface Preparation",
      description: "Verify surface preparation before painting",
      order: 1,
      fields: [
        {
          id: "field-cleaning",
          type: "boolean",
          label: "Surface Cleaning Complete",
          description: "Verify surface is properly cleaned of all contaminants",
          required: true
        },
        {
          id: "field-sanding",
          type: "boolean",
          label: "Surface Sanding Complete",
          description: "Verify surface is properly sanded where required",
          required: true
        },
        {
          id: "field-primer",
          type: "boolean",
          label: "Primer Applied Correctly",
          description: "Verify primer application meets specifications",
          required: true
        }
      ]
    },
    {
      id: "section-application",
      title: "Paint Application",
      description: "Inspect the paint application process",
      order: 2,
      fields: [
        {
          id: "field-paint-type",
          type: "select",
          label: "Paint Type Used",
          description: "Record the type of paint used",
          required: true,
          options: ["Epoxy", "Polyurethane", "Acrylic", "Latex", "Oil-based"]
        },
        {
          id: "field-paint-batch",
          type: "text",
          label: "Paint Batch Number",
          description: "Record the batch number of the paint used",
          required: true
        },
        {
          id: "field-application-method",
          type: "select",
          label: "Application Method",
          description: "Record the method used to apply the paint",
          required: true,
          options: ["Spray", "Brush", "Roller", "Dip", "Electrostatic"]
        }
      ]
    },
    {
      id: "section-quality",
      title: "Quality Assessment",
      description: "Assess the quality of the finished paint job",
      order: 3,
      fields: [
        {
          id: "field-coverage",
          type: "select",
          label: "Paint Coverage",
          description: "Assess the completeness of paint coverage",
          required: true,
          options: ["Excellent", "Good", "Acceptable", "Poor", "Unacceptable"]
        },
        {
          id: "field-thickness",
          type: "measurement",
          label: "Paint Thickness",
          description: "Measure the thickness of the paint",
          required: true,
          unit: "mil",
          min: 3.0,
          max: 5.0
        },
        {
          id: "field-defects",
          type: "select",
          label: "Surface Defects",
          description: "Identify any defects in the paint",
          required: true,
          options: ["None", "Minor", "Moderate", "Severe"]
        },
        {
          id: "field-gloss",
          type: "select",
          label: "Gloss Level",
          description: "Assess the gloss level of the finish",
          required: true,
          options: ["Flat", "Eggshell", "Satin", "Semi-gloss", "High-gloss"]
        }
      ]
    }
  ]
};