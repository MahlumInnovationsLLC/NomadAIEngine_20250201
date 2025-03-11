import { InspectionTemplate } from "../../../../types/manufacturing/templates";

// Sample inspection templates for various processes

// Custom Fabricated Sub-frame template
export const customFabricatedSubFrameTemplate: InspectionTemplate = {
  id: "custom-fabricated-sub-frame-template",
  name: "Custom Fabricated Sub-frame Inspection",
  description: "Quality inspection for custom fabricated sub-frames with dimensional, visual, and mechanical checks",
  type: "fabrication",
  category: "custom_fabricated_sub_frame",
  standard: "ISO 9001",
  isActive: true,
  version: 1,
  sections: [
    {
      id: "section-1",
      title: "Dimensional Checks",
      description: "Measurements and dimensional verification of the sub-frame",
      fields: [
        {
          id: "field-1-1",
          type: "measurement",
          label: "Overall Length",
          description: "Measure the overall length of the sub-frame",
          required: true,
          unit: "mm",
          min: 3000,
          max: 3010
        },
        {
          id: "field-1-2",
          type: "measurement",
          label: "Overall Width",
          description: "Measure the overall width of the sub-frame",
          required: true,
          unit: "mm",
          min: 1490,
          max: 1500
        },
        {
          id: "field-1-3",
          type: "measurement",
          label: "Overall Height",
          description: "Measure the overall height of the sub-frame",
          required: true,
          unit: "mm",
          min: 490,
          max: 500
        },
        {
          id: "field-1-4",
          type: "measurement",
          label: "Diagonal Measurement 1",
          description: "Measure diagonal from front-left to rear-right",
          required: true,
          unit: "mm"
        },
        {
          id: "field-1-5",
          type: "measurement",
          label: "Diagonal Measurement 2",
          description: "Measure diagonal from front-right to rear-left",
          required: true,
          unit: "mm"
        }
      ]
    },
    {
      id: "section-2",
      title: "Welding Quality",
      description: "Visual inspection of all welded joints",
      fields: [
        {
          id: "field-2-1",
          type: "visual",
          label: "Weld Uniformity",
          description: "Check if welds are uniform in appearance",
          required: true,
          acceptable: [
            "Uniform bead appearance",
            "No undercutting",
            "No excessive buildup",
            "Proper fusion evident"
          ]
        },
        {
          id: "field-2-2",
          type: "visual",
          label: "Weld Porosity",
          description: "Check for porosity in welds",
          required: true,
          acceptable: [
            "No visible surface porosity",
            "No clustered pinholes",
            "No wormholes or linear porosity"
          ]
        },
        {
          id: "field-2-3",
          type: "visual",
          label: "Weld Cracks",
          description: "Check for cracks in welds",
          required: true,
          acceptable: [
            "No visible cracks in weld metal",
            "No cracks in heat-affected zone",
            "No crater cracks"
          ]
        },
        {
          id: "field-2-4",
          type: "boolean",
          label: "100% Weld Penetration",
          description: "Verify complete penetration on all required welds",
          required: true
        }
      ]
    },
    {
      id: "section-3",
      title: "Material Verification",
      description: "Verification of materials used in sub-frame construction",
      fields: [
        {
          id: "field-3-1",
          type: "text",
          label: "Material Certificate Number",
          description: "Record material certificate number for traceability",
          required: true
        },
        {
          id: "field-3-2",
          type: "select",
          label: "Material Grade",
          description: "Select the material grade used for main frame members",
          required: true,
          options: [
            "HS350 (S350)",
            "HS400 (S400)",
            "HS420 (S420)",
            "HS460 (S460)",
            "HS500 (S500)"
          ]
        },
        {
          id: "field-3-3",
          type: "measurement",
          label: "Material Thickness",
          description: "Measure and record material thickness at specified points",
          required: true,
          unit: "mm",
          min: 3.8,
          max: 4.2
        }
      ]
    },
    {
      id: "section-4",
      title: "Mounting Points",
      description: "Verification of mounting point locations and features",
      fields: [
        {
          id: "field-4-1",
          type: "measurement",
          label: "Front Mount Point - Left",
          description: "Distance from datum point A to left front mount center",
          required: true,
          unit: "mm"
        },
        {
          id: "field-4-2",
          type: "measurement",
          label: "Front Mount Point - Right",
          description: "Distance from datum point A to right front mount center",
          required: true,
          unit: "mm"
        },
        {
          id: "field-4-3",
          type: "measurement",
          label: "Rear Mount Point - Left",
          description: "Distance from datum point B to left rear mount center",
          required: true,
          unit: "mm"
        },
        {
          id: "field-4-4",
          type: "measurement",
          label: "Rear Mount Point - Right",
          description: "Distance from datum point B to right rear mount center",
          required: true,
          unit: "mm"
        },
        {
          id: "field-4-5",
          type: "boolean",
          label: "Mount Thread Integrity",
          description: "Check thread integrity on all mounting points",
          required: true
        }
      ]
    },
    {
      id: "section-5",
      title: "Surface Treatment",
      description: "Inspection of surface treatment quality",
      fields: [
        {
          id: "field-5-1",
          type: "select",
          label: "Surface Treatment Type",
          description: "Type of surface treatment applied",
          required: true,
          options: [
            "Powder Coating",
            "Galvanization",
            "E-Coating",
            "Zinc Primer",
            "Other"
          ]
        },
        {
          id: "field-5-2",
          type: "visual",
          label: "Coating Uniformity",
          description: "Check for uniform application of coating",
          required: true,
          acceptable: [
            "Even color throughout",
            "No visible bare spots",
            "No runs or sags",
            "Uniform texture"
          ]
        },
        {
          id: "field-5-3",
          type: "measurement",
          label: "Coating Thickness",
          description: "Measure coating thickness at specified points",
          required: true,
          unit: "μm",
          min: 60,
          max: 100
        },
        {
          id: "field-5-4",
          type: "boolean",
          label: "Adhesion Test Passed",
          description: "Verify coating adhesion meets standards",
          required: true
        }
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Birdcage Inspection Template
export const birdcageInspectionTemplate: InspectionTemplate = {
  id: "birdcage-inspection-template",
  name: "Birdcage Assembly Inspection",
  description: "Quality inspection for birdcage assembly with structural, fitment, and safety checks",
  type: "assembly",
  category: "birdcage",
  standard: "ISO 9001",
  isActive: true,
  version: 1,
  sections: [
    {
      id: "section-1",
      title: "Structural Integrity",
      description: "Verification of structural components and integrity",
      fields: [
        {
          id: "field-1-1",
          type: "visual",
          label: "Roll Cage Structure",
          description: "Inspect overall roll cage structure for defects",
          required: true,
          acceptable: [
            "No visible deformation",
            "All tubes properly aligned",
            "No evidence of stress fractures",
            "All gussets correctly positioned"
          ]
        },
        {
          id: "field-1-2",
          type: "visual",
          label: "Weld Quality",
          description: "Inspect all welds on the birdcage structure",
          required: true,
          acceptable: [
            "Complete penetration on critical joints",
            "No visible porosity",
            "No cracks in weld or surrounding metal",
            "Consistent bead appearance"
          ]
        },
        {
          id: "field-1-3",
          type: "boolean",
          label: "Tube End Caps Installed",
          description: "Verify all open tube ends are properly capped",
          required: true
        },
        {
          id: "field-1-4",
          type: "text",
          label: "Material Certificate Reference",
          description: "Record reference number of material certificate",
          required: true
        }
      ]
    },
    {
      id: "section-2",
      title: "Door Functionality",
      description: "Inspection of door operation and security",
      fields: [
        {
          id: "field-2-1",
          type: "boolean",
          label: "Door Operation",
          description: "Check if doors open and close smoothly",
          required: true
        },
        {
          id: "field-2-2",
          type: "visual",
          label: "Door Seal",
          description: "Verify door seal integrity around perimeter",
          required: true,
          acceptable: [
            "Continuous contact with door frame",
            "No visible gaps",
            "Seal properly adhered to surface",
            "No damage or deformation"
          ]
        },
        {
          id: "field-2-3",
          type: "boolean",
          label: "Door Latch Security",
          description: "Test door latches for proper security",
          required: true
        },
        {
          id: "field-2-4",
          type: "boolean",
          label: "Emergency Release Mechanism",
          description: "Test emergency release functionality",
          required: true
        }
      ]
    },
    {
      id: "section-3",
      title: "Window Installation",
      description: "Inspection of window installation and functionality",
      fields: [
        {
          id: "field-3-1",
          type: "visual",
          label: "Window Installation",
          description: "Check window installation in all openings",
          required: true,
          acceptable: [
            "Windows properly seated in frame",
            "Uniform gap around perimeter",
            "No stress marks in corners",
            "Proper sealant application"
          ]
        },
        {
          id: "field-3-2",
          type: "boolean",
          label: "Window Operation",
          description: "Test operation of all operable windows",
          required: true
        },
        {
          id: "field-3-3",
          type: "visual",
          label: "Window Seal Water Test",
          description: "Perform water test on window seals",
          required: true,
          acceptable: [
            "No water penetration",
            "Proper drainage through channels",
            "No pooling in corners"
          ]
        }
      ]
    },
    {
      id: "section-4",
      title: "Electrical Systems",
      description: "Verification of electrical components and wiring",
      fields: [
        {
          id: "field-4-1",
          type: "boolean",
          label: "Interior Lighting Functionality",
          description: "Test all interior lighting fixtures",
          required: true
        },
        {
          id: "field-4-2",
          type: "boolean",
          label: "Emergency Lighting Functionality",
          description: "Test emergency lighting system",
          required: true
        },
        {
          id: "field-4-3",
          type: "visual",
          label: "Wiring Installation",
          description: "Inspect electrical wiring installation",
          required: true,
          acceptable: [
            "Wires properly secured",
            "No exposed conductors",
            "Proper strain relief at connections",
            "Protective conduit intact where required"
          ]
        },
        {
          id: "field-4-4",
          type: "boolean",
          label: "Circuit Breaker Panel Labeling",
          description: "Verify all circuit breakers and fuses are properly labeled",
          required: true
        }
      ]
    },
    {
      id: "section-5",
      title: "Final Verification",
      description: "Final checks before completion",
      fields: [
        {
          id: "field-5-1",
          type: "text",
          label: "Serial Number",
          description: "Record birdcage serial number",
          required: true
        },
        {
          id: "field-5-2",
          type: "date",
          label: "Assembly Completion Date",
          description: "Date assembly was completed",
          required: true
        },
        {
          id: "field-5-3",
          type: "text",
          label: "Inspector Notes",
          description: "Additional notes from inspector",
          required: false
        }
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Final Shelter Inspection Template
export const finalShelterInspectionTemplate: InspectionTemplate = {
  id: "final-shelter-inspection-template",
  name: "Final Shelter Inspection",
  description: "Comprehensive inspection for completed shelter units prior to shipment",
  type: "final",
  category: "final_shelter",
  standard: "ISO 9001",
  isActive: true,
  version: 1,
  sections: [
    {
      id: "section-1",
      title: "Exterior Inspection",
      description: "Inspection of all exterior components and finishes",
      fields: [
        {
          id: "field-1-1",
          type: "visual",
          label: "Exterior Paint/Finish",
          description: "Inspect exterior finish for defects",
          required: true,
          acceptable: [
            "Uniform color throughout",
            "No scratches, chips or dents",
            "No visible runs or sags",
            "Consistent texture across all surfaces"
          ]
        },
        {
          id: "field-1-2",
          type: "visual",
          label: "Door & Window Seals",
          description: "Verify sealing of all doors and windows",
          required: true,
          acceptable: [
            "Continuous and even compression",
            "No visible gaps",
            "Proper adhesion to surfaces",
            "No damage or deformation"
          ]
        },
        {
          id: "field-1-3",
          type: "boolean",
          label: "Roof Integrity",
          description: "Check roof for proper installation and sealing",
          required: true
        },
        {
          id: "field-1-4",
          type: "boolean",
          label: "External Lighting Function",
          description: "Test all exterior lights",
          required: true
        }
      ]
    },
    {
      id: "section-2",
      title: "Interior Inspection",
      description: "Verification of interior components and finishes",
      fields: [
        {
          id: "field-2-1",
          type: "visual",
          label: "Interior Finish",
          description: "Inspect all interior finishes",
          required: true,
          acceptable: [
            "Wall panels properly secured",
            "No visible damage or stains",
            "Trim properly installed",
            "No gaps at seams"
          ]
        },
        {
          id: "field-2-2",
          type: "visual",
          label: "Floor Installation",
          description: "Inspect floor installation",
          required: true,
          acceptable: [
            "Floor covering properly adhered",
            "No bubbling or lifting at seams",
            "No damage or discoloration",
            "Transitions properly secured"
          ]
        },
        {
          id: "field-2-3",
          type: "boolean",
          label: "Interior Lighting Function",
          description: "Test all interior lighting fixtures",
          required: true
        }
      ]
    },
    {
      id: "section-3",
      title: "Systems Testing",
      description: "Functional testing of all shelter systems",
      fields: [
        {
          id: "field-3-1",
          type: "boolean",
          label: "HVAC Operation",
          description: "Test heating, ventilation, and air conditioning system",
          required: true
        },
        {
          id: "field-3-2",
          type: "boolean",
          label: "Plumbing System",
          description: "Test all plumbing fixtures and check for leaks",
          required: true
        },
        {
          id: "field-3-3",
          type: "boolean",
          label: "Electrical System",
          description: "Test all electrical circuits and outlets",
          required: true
        },
        {
          id: "field-3-4",
          type: "boolean",
          label: "Communications Systems",
          description: "Test phone, data, and other communication systems",
          required: true
        },
        {
          id: "field-3-5",
          type: "boolean",
          label: "Generator Function",
          description: "Test generator startup and operation if installed",
          required: false
        }
      ]
    },
    {
      id: "section-4",
      title: "Safety Equipment",
      description: "Verification of safety equipment installation and function",
      fields: [
        {
          id: "field-4-1",
          type: "boolean",
          label: "Fire Extinguishers",
          description: "Verify correct fire extinguishers installed and charged",
          required: true
        },
        {
          id: "field-4-2",
          type: "boolean",
          label: "Smoke/CO Detectors",
          description: "Test smoke and carbon monoxide detectors",
          required: true
        },
        {
          id: "field-4-3",
          type: "boolean",
          label: "Emergency Lighting",
          description: "Test emergency lighting system",
          required: true
        },
        {
          id: "field-4-4",
          type: "boolean",
          label: "First Aid Kit",
          description: "Verify first aid kit contents and expiration dates",
          required: true
        },
        {
          id: "field-4-5",
          type: "boolean",
          label: "Emergency Exit Signs",
          description: "Verify emergency exit signs are properly installed and illuminated",
          required: true
        }
      ]
    },
    {
      id: "section-5",
      title: "Documentation",
      description: "Verification of required documentation",
      fields: [
        {
          id: "field-5-1",
          type: "boolean",
          label: "User Manuals Included",
          description: "Verify all required user manuals are included",
          required: true
        },
        {
          id: "field-5-2",
          type: "boolean",
          label: "Warranty Documentation",
          description: "Verify all warranty documentation is included",
          required: true
        },
        {
          id: "field-5-3",
          type: "text",
          label: "Serial Number",
          description: "Record shelter serial number",
          required: true
        },
        {
          id: "field-5-4",
          type: "date",
          label: "Inspection Date",
          description: "Date of final inspection",
          required: true
        }
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Paint Inspection Template
export const paintInspectionTemplate: InspectionTemplate = {
  id: "paint-inspection-template",
  name: "Paint Process Inspection",
  description: "Quality inspection for paint preparation, application, and finish",
  type: "paint",
  category: "paint",
  standard: "ISO 9001",
  isActive: true,
  version: 1,
  sections: [
    {
      id: "section-1",
      title: "Surface Preparation",
      description: "Inspection of surface preparation prior to painting",
      fields: [
        {
          id: "field-1-1",
          type: "visual",
          label: "Surface Cleanliness",
          description: "Inspect surface for cleanliness before painting",
          required: true,
          acceptable: [
            "No visible contaminants",
            "Free of oil, grease, and dirt",
            "No water spots or residue",
            "Properly dried after cleaning"
          ]
        },
        {
          id: "field-1-2",
          type: "select",
          label: "Surface Profile",
          description: "Check surface profile after preparation",
          required: true,
          options: [
            "Smooth",
            "Fine",
            "Medium",
            "Coarse"
          ]
        },
        {
          id: "field-1-3",
          type: "visual",
          label: "Surface Defects",
          description: "Check for surface defects requiring repair",
          required: true,
          acceptable: [
            "No visible dents or dings",
            "No sharp edges",
            "No weld spatter",
            "No visible corrosion"
          ]
        }
      ]
    },
    {
      id: "section-2",
      title: "Environmental Conditions",
      description: "Verification of environmental conditions during painting",
      fields: [
        {
          id: "field-2-1",
          type: "measurement",
          label: "Ambient Temperature",
          description: "Record ambient temperature in paint area",
          required: true,
          unit: "°C",
          min: 15,
          max: 30
        },
        {
          id: "field-2-2",
          type: "measurement",
          label: "Relative Humidity",
          description: "Record relative humidity in paint area",
          required: true,
          unit: "%",
          min: 30,
          max: 70
        },
        {
          id: "field-2-3",
          type: "measurement",
          label: "Surface Temperature",
          description: "Record surface temperature of item being painted",
          required: true,
          unit: "°C",
          min: 15,
          max: 35
        },
        {
          id: "field-2-4",
          type: "boolean",
          label: "Above Dew Point",
          description: "Verify surface temperature is at least 3°C above dew point",
          required: true
        }
      ]
    },
    {
      id: "section-3",
      title: "Paint Application",
      description: "Inspection of paint mixing and application process",
      fields: [
        {
          id: "field-3-1",
          type: "text",
          label: "Paint Batch Number",
          description: "Record batch number of paint used",
          required: true
        },
        {
          id: "field-3-2",
          type: "select",
          label: "Paint Type",
          description: "Record type of paint used",
          required: true,
          options: [
            "Water-based",
            "Oil-based",
            "Epoxy",
            "Polyurethane",
            "Acrylic",
            "Alkyd"
          ]
        },
        {
          id: "field-3-3",
          type: "text",
          label: "Paint Color",
          description: "Record paint color code/name",
          required: true
        },
        {
          id: "field-3-4",
          type: "boolean",
          label: "Proper Mixing",
          description: "Verify paint was properly mixed according to specifications",
          required: true
        }
      ]
    },
    {
      id: "section-4",
      title: "Coating Inspection",
      description: "Inspection of applied coating",
      fields: [
        {
          id: "field-4-1",
          type: "measurement",
          label: "Wet Film Thickness",
          description: "Measure wet film thickness at specified points",
          required: false,
          unit: "μm"
        },
        {
          id: "field-4-2",
          type: "measurement",
          label: "Dry Film Thickness",
          description: "Measure dry film thickness at specified points",
          required: true,
          unit: "μm",
          min: 75,
          max: 125
        },
        {
          id: "field-4-3",
          type: "visual",
          label: "Film Continuity",
          description: "Inspect coating for continuity",
          required: true,
          acceptable: [
            "No visible holidays",
            "No thin spots",
            "Even opacity throughout",
            "Complete coverage of substrate"
          ]
        },
        {
          id: "field-4-4",
          type: "visual",
          label: "Coating Defects",
          description: "Inspect for coating defects",
          required: true,
          acceptable: [
            "No runs or sags",
            "No orange peel beyond specification",
            "No fish eyes or cratering",
            "No dust inclusions"
          ]
        }
      ]
    },
    {
      id: "section-5",
      title: "Final Verification",
      description: "Final checks and tests of paint finish",
      fields: [
        {
          id: "field-5-1",
          type: "visual",
          label: "Color Match",
          description: "Verify color matches specification/standard",
          required: true,
          acceptable: [
            "Matches approved color sample",
            "Consistent color across all surfaces",
            "No visible variation in sheen"
          ]
        },
        {
          id: "field-5-2",
          type: "boolean",
          label: "Adhesion Test",
          description: "Perform adhesion test on sample area if required",
          required: false
        },
        {
          id: "field-5-3",
          type: "date",
          label: "Coating Date",
          description: "Record date coating was applied",
          required: true
        },
        {
          id: "field-5-4",
          type: "text",
          label: "Inspector Notes",
          description: "Additional notes regarding paint finish",
          required: false
        }
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Export all templates in a collection
export const allTemplates = [
  customFabricatedSubFrameTemplate,
  birdcageInspectionTemplate,
  finalShelterInspectionTemplate,
  paintInspectionTemplate
];