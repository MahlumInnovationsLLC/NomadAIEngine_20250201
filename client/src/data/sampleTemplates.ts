import { InspectionTemplate } from "@/types/manufacturing/templates";

// Fabrication Inspection Template
export const fabricationInspectionTemplate: InspectionTemplate = {
  id: "template-fabrication-1",
  name: "Custom Fabricated Sub-frame Inspection",
  description: "Quality inspection template for custom fabricated sub-frames in compliance with ISO 9001 standards",
  category: "Fabrication",
  version: 1,
  createdAt: "2025-02-15T08:00:00Z",
  updatedAt: "2025-03-05T14:30:00Z",
  createdBy: "John Smith",
  updatedBy: "Maria Rodriguez",
  isActive: true,
  isArchived: false,
  sections: [
    {
      id: "section-1",
      title: "Material Verification",
      description: "Verify that materials used meet specifications and requirements",
      order: 1,
      fields: [
        {
          id: "field-1-1",
          label: "Material Type Compliance",
          type: "select",
          required: true,
          instructions: "Verify material type matches engineering specifications",
          acceptable: ["Compliant", "Non-compliant", "Requires Review"],
          defaultValue: "Compliant"
        },
        {
          id: "field-1-2",
          label: "Material Thickness",
          type: "number",
          required: true,
          instructions: "Measure and verify material thickness",
          unit: "mm",
          min: 2.0,
          max: 10.0,
          step: 0.1
        },
        {
          id: "field-1-3",
          label: "Material Certification",
          type: "boolean",
          required: true,
          instructions: "Confirm material certification documents are available and valid"
        }
      ]
    },
    {
      id: "section-2",
      title: "Dimensional Inspection",
      description: "Verify that all dimensions meet the requirements specified in engineering drawings",
      order: 2,
      fields: [
        {
          id: "field-2-1",
          label: "Overall Length",
          type: "number",
          required: true,
          instructions: "Measure the overall length of the sub-frame",
          unit: "mm",
          min: 980,
          max: 1020
        },
        {
          id: "field-2-2",
          label: "Overall Width",
          type: "number",
          required: true,
          instructions: "Measure the overall width of the sub-frame",
          unit: "mm",
          min: 480,
          max: 520
        },
        {
          id: "field-2-3",
          label: "Overall Height",
          type: "number",
          required: true,
          instructions: "Measure the overall height of the sub-frame",
          unit: "mm",
          min: 180,
          max: 220
        },
        {
          id: "field-2-4",
          label: "Diagonal Measurements",
          type: "select",
          required: true,
          instructions: "Check if diagonal measurements are within tolerance",
          acceptable: ["Within Tolerance", "Out of Tolerance", "Requires Adjustment"]
        },
        {
          id: "field-2-5",
          label: "Mounting Hole Positions",
          type: "select",
          required: true,
          instructions: "Verify mounting hole positions match specifications",
          acceptable: ["Compliant", "Non-compliant", "Adjustment Required"]
        }
      ]
    },
    {
      id: "section-3",
      title: "Weld Inspection",
      description: "Verify quality and integrity of all welds",
      order: 3,
      fields: [
        {
          id: "field-3-1",
          label: "Weld Appearance",
          type: "visual",
          required: true,
          instructions: "Visually inspect all welds for appearance and consistency",
          acceptable: ["Excellent", "Acceptable", "Poor", "Unacceptable"]
        },
        {
          id: "field-3-2",
          label: "Weld Penetration",
          type: "select",
          required: true,
          instructions: "Check for proper weld penetration",
          acceptable: ["Complete", "Incomplete", "Excessive"]
        },
        {
          id: "field-3-3",
          label: "Weld Defects",
          type: "multi-select",
          required: true,
          instructions: "Identify any weld defects present",
          acceptable: ["None", "Porosity", "Undercut", "Cracks", "Inclusions", "Overlap", "Spatter"],
          defaultValue: ["None"]
        },
        {
          id: "field-3-4",
          label: "Weld Documentation",
          type: "text",
          required: false,
          instructions: "Document any additional observations about welds",
          placeholder: "Enter any additional weld observations here"
        }
      ]
    },
    {
      id: "section-4",
      title: "Surface Finish",
      description: "Evaluate the surface finish quality",
      order: 4,
      fields: [
        {
          id: "field-4-1",
          label: "Surface Cleanliness",
          type: "select",
          required: true,
          instructions: "Evaluate surface cleanliness before finishing",
          acceptable: ["Clean", "Minor Contamination", "Major Contamination"]
        },
        {
          id: "field-4-2",
          label: "Surface Preparation",
          type: "select",
          required: true,
          instructions: "Evaluate surface preparation quality",
          acceptable: ["Excellent", "Acceptable", "Insufficient"]
        },
        {
          id: "field-4-3",
          label: "Surface Defects",
          type: "multi-select",
          required: true,
          instructions: "Identify any surface defects present",
          acceptable: ["None", "Scratches", "Dents", "Gouges", "Burrs", "Rough Edges"],
          defaultValue: ["None"]
        }
      ]
    },
    {
      id: "section-5",
      title: "Final Inspection",
      description: "Complete final verification of sub-frame",
      order: 5,
      fields: [
        {
          id: "field-5-1",
          label: "Identification Marking",
          type: "boolean",
          required: true,
          instructions: "Verify that part identification marking is present and correct"
        },
        {
          id: "field-5-2",
          label: "Documentation Complete",
          type: "boolean",
          required: true,
          instructions: "Verify that all manufacturing documentation is complete"
        },
        {
          id: "field-5-3",
          label: "Overall Assessment",
          type: "select",
          required: true,
          instructions: "Provide an overall assessment of the sub-frame",
          acceptable: ["Approved", "Approved with Notes", "Rejected", "Rework Required"]
        },
        {
          id: "field-5-4",
          label: "Inspector Notes",
          type: "text",
          required: false,
          instructions: "Add any additional observations or notes",
          placeholder: "Enter any additional notes here"
        },
        {
          id: "field-5-5",
          label: "Inspection Photos",
          type: "image",
          required: false,
          instructions: "Upload photos documenting inspection findings"
        }
      ]
    }
  ]
};

// Electrical Inspection Template
export const electricalInspectionTemplate: InspectionTemplate = {
  id: "template-electrical-1",
  name: "Electrical Systems Inspection",
  description: "Quality inspection template for electrical systems in compliance with ISO 9001 standards",
  category: "Electrical",
  version: 1,
  createdAt: "2025-02-18T09:15:00Z",
  updatedAt: "2025-03-01T11:45:00Z",
  createdBy: "Sarah Johnson",
  updatedBy: "Robert Chen",
  isActive: true,
  isArchived: false,
  sections: [
    {
      id: "section-1",
      title: "Component Verification",
      description: "Verify that all electrical components meet specifications",
      order: 1,
      fields: [
        {
          id: "field-1-1",
          label: "Component List Check",
          type: "boolean",
          required: true,
          instructions: "Verify that all components in the BOM are present"
        },
        {
          id: "field-1-2",
          label: "Component Rating Check",
          type: "boolean",
          required: true,
          instructions: "Verify all components meet rating requirements"
        },
        {
          id: "field-1-3",
          label: "Component Condition",
          type: "select",
          required: true,
          instructions: "Assess the condition of all components",
          acceptable: ["Excellent", "Acceptable", "Damaged", "Incorrect"]
        }
      ]
    },
    {
      id: "section-2",
      title: "Wiring Inspection",
      description: "Verify wiring quality and routing",
      order: 2,
      fields: [
        {
          id: "field-2-1",
          label: "Wire Gauge Compliance",
          type: "boolean",
          required: true,
          instructions: "Verify wire gauges match specification requirements"
        },
        {
          id: "field-2-2",
          label: "Wire Color Coding",
          type: "boolean",
          required: true,
          instructions: "Verify wire color coding follows the wiring diagram"
        },
        {
          id: "field-2-3",
          label: "Wire Routing Quality",
          type: "select",
          required: true,
          instructions: "Assess the quality of wire routing",
          acceptable: ["Excellent", "Acceptable", "Poor", "Unacceptable"]
        },
        {
          id: "field-2-4",
          label: "Wire Terminations",
          type: "select",
          required: true,
          instructions: "Inspect wire termination quality",
          acceptable: ["Secure & Proper", "Loose", "Improper Crimp", "Poor Contact"]
        }
      ]
    },
    {
      id: "section-3",
      title: "Connection Testing",
      description: "Test all electrical connections for proper function",
      order: 3,
      fields: [
        {
          id: "field-3-1",
          label: "Continuity Test",
          type: "boolean",
          required: true,
          instructions: "Perform continuity test on all circuits"
        },
        {
          id: "field-3-2",
          label: "Insulation Resistance",
          type: "number",
          required: true,
          instructions: "Measure insulation resistance",
          unit: "MΩ",
          min: 1.0,
          max: 999.9
        },
        {
          id: "field-3-3",
          label: "Voltage Test Results",
          type: "select",
          required: true,
          instructions: "Record voltage test results",
          acceptable: ["Within Spec", "Out of Spec", "Not Applicable"]
        },
        {
          id: "field-3-4",
          label: "Ground Connection",
          type: "boolean",
          required: true,
          instructions: "Verify ground connection integrity"
        }
      ]
    },
    {
      id: "section-4",
      title: "Enclosure & Protection",
      description: "Inspect electrical enclosures and protection systems",
      order: 4,
      fields: [
        {
          id: "field-4-1",
          label: "Enclosure Integrity",
          type: "select",
          required: true,
          instructions: "Inspect enclosure for damage or defects",
          acceptable: ["Intact", "Minor Damage", "Major Damage"]
        },
        {
          id: "field-4-2",
          label: "Sealing & Weatherproofing",
          type: "select",
          required: true,
          instructions: "Assess sealing and weatherproofing",
          acceptable: ["Excellent", "Acceptable", "Compromised", "Failed"]
        },
        {
          id: "field-4-3",
          label: "Access & Serviceability",
          type: "select",
          required: true,
          instructions: "Evaluate access for maintenance and serviceability",
          acceptable: ["Good", "Adequate", "Poor", "Inaccessible"]
        }
      ]
    },
    {
      id: "section-5",
      title: "Function Testing",
      description: "Perform functional tests of the electrical system",
      order: 5,
      fields: [
        {
          id: "field-5-1",
          label: "Power-Up Test",
          type: "boolean",
          required: true,
          instructions: "System powers up correctly without issues"
        },
        {
          id: "field-5-2",
          label: "Function Test Results",
          type: "select",
          required: true,
          instructions: "Results of functional testing",
          acceptable: ["Pass - All Functions", "Pass - Minor Issues", "Fail - Major Issues", "Not Tested"]
        },
        {
          id: "field-5-3",
          label: "Circuit Protection Test",
          type: "boolean",
          required: true,
          instructions: "Test circuit protection devices (fuses, breakers)"
        },
        {
          id: "field-5-4",
          label: "Test Notes",
          type: "text",
          required: false,
          instructions: "Document any observations during testing",
          placeholder: "Enter test observations here"
        }
      ]
    },
    {
      id: "section-6",
      title: "Final Electrical Inspection",
      description: "Complete final verification of electrical system",
      order: 6,
      fields: [
        {
          id: "field-6-1",
          label: "Safety Compliance",
          type: "boolean",
          required: true,
          instructions: "Verify system meets all safety requirements"
        },
        {
          id: "field-6-2",
          label: "Labeling & Documentation",
          type: "boolean",
          required: true,
          instructions: "Verify all required labels and documentation are present"
        },
        {
          id: "field-6-3",
          label: "Overall Assessment",
          type: "select",
          required: true,
          instructions: "Provide overall assessment of the electrical system",
          acceptable: ["Approved", "Approved with Notes", "Rejected", "Rework Required"]
        },
        {
          id: "field-6-4",
          label: "Inspector Notes",
          type: "text",
          required: false,
          instructions: "Add any additional observations or notes",
          placeholder: "Enter any additional notes here"
        },
        {
          id: "field-6-5",
          label: "Inspection Photos",
          type: "image",
          required: false,
          instructions: "Upload photos documenting inspection findings"
        }
      ]
    }
  ]
};

// Paint Inspection Template
export const paintInspectionTemplate: InspectionTemplate = {
  id: "template-paint-1",
  name: "Paint Quality Inspection",
  description: "Quality inspection template for paint and surface finishes in compliance with ISO 9001 standards",
  category: "Paint",
  version: 1,
  createdAt: "2025-01-25T14:20:00Z",
  updatedAt: "2025-03-10T09:30:00Z",
  createdBy: "Michael Brown",
  updatedBy: "Lisa Garcia",
  isActive: true,
  isArchived: false,
  sections: [
    {
      id: "section-1",
      title: "Pre-Paint Surface Preparation",
      description: "Evaluate surface preparation before painting",
      order: 1,
      fields: [
        {
          id: "field-1-1",
          label: "Surface Cleanliness",
          type: "select",
          required: true,
          instructions: "Evaluate surface cleanliness before painting",
          acceptable: ["Clean", "Minor Contamination", "Major Contamination", "Unacceptable"]
        },
        {
          id: "field-1-2",
          label: "Surface Profile",
          type: "number",
          required: true,
          instructions: "Measure surface profile depth",
          unit: "μm",
          min: 25,
          max: 100,
          step: 1
        },
        {
          id: "field-1-3",
          label: "Pretreatment Verification",
          type: "boolean",
          required: true,
          instructions: "Verify pretreatment has been properly applied"
        },
        {
          id: "field-1-4",
          label: "Surface Temperature",
          type: "number",
          required: true,
          instructions: "Measure and record surface temperature before painting",
          unit: "°C",
          min: 10,
          max: 40,
          step: 0.1
        }
      ]
    },
    {
      id: "section-2",
      title: "Paint Application Conditions",
      description: "Verify environmental conditions during paint application",
      order: 2,
      fields: [
        {
          id: "field-2-1",
          label: "Ambient Temperature",
          type: "number",
          required: true,
          instructions: "Record ambient temperature during application",
          unit: "°C",
          min: 10,
          max: 35,
          step: 0.1
        },
        {
          id: "field-2-2",
          label: "Relative Humidity",
          type: "number",
          required: true,
          instructions: "Record relative humidity during application",
          unit: "%",
          min: 30,
          max: 85,
          step: 1
        },
        {
          id: "field-2-3",
          label: "Dew Point Verification",
          type: "boolean",
          required: true,
          instructions: "Verify surface temperature is at least 3°C above dew point"
        },
        {
          id: "field-2-4",
          label: "Ventilation Adequacy",
          type: "select",
          required: true,
          instructions: "Assess ventilation adequacy during application",
          acceptable: ["Excellent", "Adequate", "Inadequate", "Poor"]
        }
      ]
    },
    {
      id: "section-3",
      title: "Paint Material Verification",
      description: "Verify paint material quality and preparation",
      order: 3,
      fields: [
        {
          id: "field-3-1",
          label: "Paint Material Type",
          type: "select",
          required: true,
          instructions: "Verify paint material type matches specification",
          acceptable: ["Compliant", "Non-compliant", "Substitute Approved", "Unknown"]
        },
        {
          id: "field-3-2",
          label: "Paint Mixing Ratio",
          type: "select",
          required: true,
          instructions: "Verify paint mixing ratio is according to specification",
          acceptable: ["Correct Ratio", "Incorrect Ratio", "Not Verifiable"]
        },
        {
          id: "field-3-3",
          label: "Paint Viscosity",
          type: "number",
          required: true,
          instructions: "Measure paint viscosity",
          unit: "seconds",
          min: 15,
          max: 60,
          step: 1
        },
        {
          id: "field-3-4",
          label: "Paint Batch Numbers",
          type: "text",
          required: true,
          instructions: "Record paint batch numbers for traceability",
          placeholder: "Enter batch numbers here"
        }
      ]
    },
    {
      id: "section-4",
      title: "Paint Application",
      description: "Evaluate paint application technique and coverage",
      order: 4,
      fields: [
        {
          id: "field-4-1",
          label: "Application Method",
          type: "select",
          required: true,
          instructions: "Record application method used",
          acceptable: ["Spray", "Brush", "Roller", "Dip", "Electrostatic"]
        },
        {
          id: "field-4-2",
          label: "Number of Coats",
          type: "number",
          required: true,
          instructions: "Record number of coats applied",
          min: 1,
          max: 10,
          step: 1
        },
        {
          id: "field-4-3",
          label: "Wet Film Thickness",
          type: "number",
          required: true,
          instructions: "Measure wet film thickness",
          unit: "μm",
          min: 50,
          max: 500,
          step: 1
        },
        {
          id: "field-4-4",
          label: "Cure Time Between Coats",
          type: "number",
          required: true,
          instructions: "Record cure time between coats",
          unit: "minutes",
          min: 15,
          max: 1440,
          step: 5
        }
      ]
    },
    {
      id: "section-5",
      title: "Cured Paint Inspection",
      description: "Inspect the quality of the cured paint finish",
      order: 5,
      fields: [
        {
          id: "field-5-1",
          label: "Dry Film Thickness",
          type: "number",
          required: true,
          instructions: "Measure dry film thickness",
          unit: "μm",
          min: 25,
          max: 300,
          step: 1
        },
        {
          id: "field-5-2",
          label: "Color Verification",
          type: "select",
          required: true,
          instructions: "Verify color matches specification",
          acceptable: ["Match", "Slight Variation", "Significant Variation"]
        },
        {
          id: "field-5-3",
          label: "Gloss Level",
          type: "number",
          required: true,
          instructions: "Measure gloss level at 60 degrees",
          unit: "GU",
          min: 0,
          max: 100,
          step: 0.1
        },
        {
          id: "field-5-4",
          label: "Surface Defects",
          type: "multi-select",
          required: true,
          instructions: "Identify any surface defects present",
          acceptable: ["None", "Runs", "Sags", "Orange Peel", "Pinholes", "Fisheyes", "Cracking", "Blistering", "Wrinkling"],
          defaultValue: ["None"]
        }
      ]
    },
    {
      id: "section-6",
      title: "Paint Performance Tests",
      description: "Perform tests to evaluate paint performance",
      order: 6,
      fields: [
        {
          id: "field-6-1",
          label: "Adhesion Test",
          type: "select",
          required: true,
          instructions: "Perform adhesion test and record results",
          acceptable: ["Excellent", "Good", "Fair", "Poor", "Failed"]
        },
        {
          id: "field-6-2",
          label: "Hardness Test",
          type: "select",
          required: true,
          instructions: "Perform pencil hardness test",
          acceptable: ["6H", "5H", "4H", "3H", "2H", "H", "F", "HB", "B", "2B", "3B", "4B", "5B", "6B"]
        },
        {
          id: "field-6-3",
          label: "Impact Resistance",
          type: "select",
          required: false,
          instructions: "Perform impact resistance test if required",
          acceptable: ["Pass", "Fail", "Not Tested"]
        }
      ]
    },
    {
      id: "section-7",
      title: "Final Paint Inspection",
      description: "Complete final verification of paint quality",
      order: 7,
      fields: [
        {
          id: "field-7-1",
          label: "Overall Appearance",
          type: "select",
          required: true,
          instructions: "Evaluate overall appearance quality",
          acceptable: ["Excellent", "Good", "Acceptable", "Poor", "Unacceptable"]
        },
        {
          id: "field-7-2",
          label: "Coverage Completeness",
          type: "select",
          required: true,
          instructions: "Verify completeness of coverage",
          acceptable: ["Complete", "Minor Misses", "Major Misses"]
        },
        {
          id: "field-7-3",
          label: "Overall Assessment",
          type: "select",
          required: true,
          instructions: "Provide overall assessment of the paint quality",
          acceptable: ["Approved", "Approved with Notes", "Rejected", "Rework Required"]
        },
        {
          id: "field-7-4",
          label: "Inspector Notes",
          type: "text",
          required: false,
          instructions: "Add any additional observations or notes",
          placeholder: "Enter any additional notes here"
        },
        {
          id: "field-7-5",
          label: "Inspection Photos",
          type: "image",
          required: false,
          instructions: "Upload photos documenting inspection findings"
        }
      ]
    }
  ]
};