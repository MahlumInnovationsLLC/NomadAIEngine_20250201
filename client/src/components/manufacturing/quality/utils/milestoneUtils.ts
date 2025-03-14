import { NCR } from "@/types/manufacturing/ncr";
import { CAPA } from "@/types/manufacturing/capa";
import { SCAR } from "@/types/manufacturing/scar";
import { MRB } from "@/types/manufacturing/mrb";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: "complete" | "current" | "pending" | "skipped";
  date?: string;
  icon?: string;
  color?: string;
}

// Camel-case aliases for backward compatibility
export const getNcrMilestones = getNCRMilestones;
export const getCapaMilestones = getCAPAMilestones;
export const getScarMilestones = getSCARMilestones;
export const getMrbMilestones = getMRBMilestones;

// NCR Status Flow: Created → In Review → Pending Disposition → Disposition Complete
export function getNCRMilestones(ncr: NCR): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: "created",
      title: "Created",
      description: "NCR has been created and documented",
      status: ["draft", "open"].includes(ncr.status) ? "current" : "complete",
      date: ncr.createdAt,
      icon: "file-pen",
      color: "bg-blue-500",
    },
    {
      id: "in_review",
      title: "In Review",
      description: "Technical review of the non-conformance",
      status: 
        ["draft", "open"].includes(ncr.status) ? "pending" : 
        ncr.status === "under_review" ? "current" : 
        "complete",
      date: ncr.status === "under_review" || ncr.status === "pending_disposition" || ncr.status === "closed" ? 
        ncr.updatedAt : undefined,
      icon: "magnifying-glass",
      color: "bg-yellow-500",
    },
    {
      id: "pending_disposition",
      title: "Pending Disposition",
      description: "Awaiting final disposition decision",
      status: 
        ["draft", "open", "under_review"].includes(ncr.status) ? "pending" : 
        ncr.status === "pending_disposition" ? "current" : 
        "complete",
      date: ncr.status === "pending_disposition" || ncr.status === "closed" ? 
        ncr.updatedAt : undefined,
      icon: "clipboard-list",
      color: "bg-orange-500",
    },
    {
      id: "disposition_complete",
      title: "Disposition Complete",
      description: "NCR has been dispositioned and closed",
      status: ncr.status !== "closed" ? "pending" : "current",
      date: ncr.closedDate,
      icon: "check-circle",
      color: "bg-green-500",
    }
  ];

  const currentMilestoneId = milestones.find(m => m.status === "current")?.id || "";
  return { milestones, currentMilestoneId };
}

// CAPA Status Flow: draft → open → in_progress → pending_verification → verified → closed
export function getCAPAMilestones(capa: CAPA): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: "draft",
      title: "Draft",
      description: "Initial creation of the CAPA",
      status: capa.status === "draft" ? "current" : "complete",
      date: capa.createdAt,
      icon: "file-pen",
      color: "bg-gray-500",
    },
    {
      id: "open",
      title: "Open",
      description: "CAPA has been officially opened",
      status: 
        capa.status === "draft" ? "pending" : 
        capa.status === "open" ? "current" : 
        "complete",
      date: capa.submittedDate,
      icon: "folder-open",
      color: "bg-blue-500",
    },
    {
      id: "in_progress",
      title: "In Progress",
      description: "Corrective and preventive actions being implemented",
      status: 
        ["draft", "open"].includes(capa.status) ? "pending" : 
        capa.status === "in_progress" ? "current" : 
        "complete",
      date: capa.status === "in_progress" || ["pending_verification", "verified", "closed"].includes(capa.status) ? 
        capa.updatedAt : undefined,
      icon: "spinner",
      color: "bg-yellow-500",
    },
    {
      id: "pending_verification",
      title: "Pending Verification",
      description: "Awaiting verification of effectiveness",
      status: 
        ["draft", "open", "in_progress"].includes(capa.status) ? "pending" : 
        capa.status === "pending_verification" ? "current" : 
        "complete",
      date: capa.status === "pending_verification" || ["verified", "closed"].includes(capa.status) ? 
        capa.updatedAt : undefined,
      icon: "clipboard-check",
      color: "bg-orange-500",
    },
    {
      id: "verified",
      title: "Verified",
      description: "Effectiveness of actions has been verified",
      status: 
        ["draft", "open", "in_progress", "pending_verification"].includes(capa.status) ? "pending" : 
        capa.status === "verified" ? "current" : 
        "complete",
      date: capa.verificationDate,
      icon: "check-double",
      color: "bg-purple-500",
    },
    {
      id: "closed",
      title: "Closed",
      description: "CAPA has been verified and closed",
      status: capa.status !== "closed" ? "pending" : "current",
      date: capa.closedDate,
      icon: "check-circle",
      color: "bg-green-500",
    }
  ];

  const currentMilestoneId = milestones.find(m => m.status === "current")?.id || "";
  return { milestones, currentMilestoneId };
}

// SCAR Status Flow: draft → issued → supplier_response → review → closed
export function getSCARMilestones(scar: SCAR): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: "draft",
      title: "Draft",
      description: "Initial creation of the SCAR",
      status: scar.status === "draft" ? "current" : "complete",
      date: scar.createdAt,
      icon: "file-pen",
      color: "bg-gray-500",
    },
    {
      id: "issued",
      title: "Issued",
      description: "SCAR has been issued to the supplier",
      status: 
        scar.status === "draft" ? "pending" : 
        scar.status === "issued" ? "current" : 
        "complete",
      date: scar.issueDate,
      icon: "paper-plane",
      color: "bg-blue-500",
    },
    {
      id: "supplier_response",
      title: "Supplier Response",
      description: "Supplier has responded to the SCAR",
      status: 
        ["draft", "issued"].includes(scar.status) ? "pending" : 
        scar.status === "supplier_response" ? "current" : 
        "complete",
      date: scar.supplierResponse?.responseDate,
      icon: "reply",
      color: "bg-yellow-500",
    },
    {
      id: "review",
      title: "Review",
      description: "Response is being reviewed for adequacy",
      status: 
        ["draft", "issued", "supplier_response"].includes(scar.status) ? "pending" : 
        scar.status === "review" ? "current" : 
        "complete",
      date: scar.reviewDate,
      icon: "magnifying-glass",
      color: "bg-orange-500",
    },
    {
      id: "closed",
      title: "Closed",
      description: "SCAR has been closed",
      status: scar.status !== "closed" ? "pending" : "current",
      date: scar.closeDate, // SCAR uses closeDate, not closedDate
      icon: "check-circle",
      color: "bg-green-500",
    }
  ];

  const currentMilestoneId = milestones.find(m => m.status === "current")?.id || "";
  return { milestones, currentMilestoneId };
}

// MRB Status Flow: pending_review → in_review → pending_disposition → approved/rejected → closed
export function getMRBMilestones(mrb: MRB): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: "pending_review",
      title: "Pending Review",
      description: "MRB has been created and is awaiting review",
      status: mrb.status === "pending_review" ? "current" : "complete",
      date: mrb.createdAt,
      icon: "file-circle-plus",
      color: "bg-gray-500",
    },
    {
      id: "in_review",
      title: "In Review",
      description: "MRB is being reviewed by the board",
      status: 
        mrb.status === "pending_review" ? "pending" : 
        mrb.status === "in_review" ? "current" : 
        "complete",
      date: mrb.reviewStartDate,
      icon: "users",
      color: "bg-blue-500",
    },
    {
      id: "pending_disposition",
      title: "Pending Disposition",
      description: "MRB is pending final disposition decision",
      status: 
        ["pending_review", "in_review"].includes(mrb.status) ? "pending" : 
        mrb.status === "pending_disposition" ? "current" : 
        "complete",
      date: mrb.status === "pending_disposition" || ["approved", "rejected", "closed"].includes(mrb.status) ? 
        mrb.updatedAt : undefined,
      icon: "clipboard-list",
      color: "bg-yellow-500",
    },
    {
      id: "decision",
      title: mrb.disposition?.decision === "approved" ? "Approved" : 
             mrb.disposition?.decision === "rejected" ? "Rejected" : 
             "Decision",
      description: "Final disposition decision has been made",
      status: 
        ["pending_review", "in_review", "pending_disposition"].includes(mrb.status) ? "pending" : 
        ["approved", "rejected"].includes(mrb.status) ? "current" : 
        "complete",
      date: mrb.disposition?.approvalDate,
      icon: mrb.disposition?.decision === "approved" ? "check" : 
            mrb.disposition?.decision === "rejected" ? "xmark" : 
            "circle-question",
      color: mrb.disposition?.decision === "approved" ? "bg-green-500" : 
             mrb.disposition?.decision === "rejected" ? "bg-red-500" : 
             "bg-orange-500",
    },
    {
      id: "closed",
      title: "Closed",
      description: "MRB has been closed",
      status: mrb.status !== "closed" ? "pending" : "current",
      date: mrb.closedDate,
      icon: "check-circle",
      color: "bg-green-500",
    }
  ];

  const currentMilestoneId = milestones.find(m => m.status === "current")?.id || "";
  return { milestones, currentMilestoneId };
}

interface StatusTransition {
  from: string;
  to: string;
  label: string;
  icon?: string;
  color?: string;
  reasons?: string[];
  requiresComment?: boolean;
  requiresApproval?: boolean;
}

// Valid NCR status transitions
export const ncrStatusTransitions: StatusTransition[] = [
  {
    from: "draft",
    to: "open",
    label: "Open NCR",
    icon: "folder-open",
    color: "bg-blue-500",
  },
  {
    from: "open",
    to: "under_review",
    label: "Start Review",
    icon: "magnifying-glass",
    color: "bg-yellow-500",
  },
  {
    from: "under_review",
    to: "pending_disposition",
    label: "Request Disposition",
    icon: "clipboard-list",
    color: "bg-orange-500",
  },
  {
    from: "pending_disposition",
    to: "closed",
    label: "Close NCR",
    icon: "check-circle",
    color: "bg-green-500",
    requiresComment: true,
  },
  {
    from: "under_review",
    to: "open",
    label: "Return to Open",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Incomplete information",
      "Incorrect classification",
      "Additional investigation needed"
    ]
  },
  {
    from: "pending_disposition",
    to: "under_review",
    label: "Return to Review",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Additional analysis required",
      "New information available",
      "Disposition requires clarification"
    ]
  }
];

// Valid CAPA status transitions
export const capaStatusTransitions: StatusTransition[] = [
  {
    from: "draft",
    to: "open",
    label: "Submit CAPA",
    icon: "paper-plane",
    color: "bg-blue-500",
  },
  {
    from: "open",
    to: "in_progress",
    label: "Start Implementation",
    icon: "play",
    color: "bg-yellow-500",
  },
  {
    from: "in_progress",
    to: "pending_verification",
    label: "Submit for Verification",
    icon: "clipboard-check",
    color: "bg-orange-500",
    requiresComment: true,
  },
  {
    from: "pending_verification",
    to: "verified",
    label: "Verify Effectiveness",
    icon: "check-double",
    color: "bg-purple-500",
    requiresComment: true,
  },
  {
    from: "verified",
    to: "closed",
    label: "Close CAPA",
    icon: "check-circle",
    color: "bg-green-500",
  },
  {
    from: "open",
    to: "draft",
    label: "Return to Draft",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Incomplete information",
      "Requires revision",
      "Further planning needed"
    ]
  },
  {
    from: "in_progress",
    to: "open",
    label: "Return to Open",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Implementation issues encountered",
      "Change in scope required",
      "Resource constraints"
    ]
  },
  {
    from: "pending_verification",
    to: "in_progress",
    label: "Return to Implementation",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Additional actions required",
      "Verification criteria not met",
      "Implementation incomplete"
    ]
  }
];

// Valid SCAR status transitions
export const scarStatusTransitions: StatusTransition[] = [
  {
    from: "draft",
    to: "issued",
    label: "Issue to Supplier",
    icon: "paper-plane",
    color: "bg-blue-500",
  },
  {
    from: "issued",
    to: "supplier_response",
    label: "Record Response",
    icon: "reply",
    color: "bg-yellow-500",
    requiresComment: true,
  },
  {
    from: "supplier_response",
    to: "review",
    label: "Start Review",
    icon: "magnifying-glass",
    color: "bg-orange-500",
  },
  {
    from: "review",
    to: "closed",
    label: "Close SCAR",
    icon: "check-circle",
    color: "bg-green-500",
    requiresComment: true,
  },
  {
    from: "supplier_response",
    to: "issued",
    label: "Request Clarification",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Incomplete response",
      "Inadequate root cause analysis",
      "Insufficient corrective actions",
      "Missing evidence"
    ]
  },
  {
    from: "review",
    to: "supplier_response",
    label: "Request Additional Information",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Additional evidence required",
      "Effectiveness verification needed",
      "Implementation timeline unclear"
    ]
  }
];

// Valid MRB status transitions
export const mrbStatusTransitions: StatusTransition[] = [
  {
    from: "pending_review",
    to: "in_review",
    label: "Start Review",
    icon: "users",
    color: "bg-blue-500",
  },
  {
    from: "in_review",
    to: "pending_disposition",
    label: "Request Disposition",
    icon: "clipboard-list",
    color: "bg-yellow-500",
  },
  {
    from: "pending_disposition",
    to: "approved",
    label: "Approve",
    icon: "check",
    color: "bg-green-500",
    requiresComment: true,
    requiresApproval: true,
  },
  {
    from: "pending_disposition",
    to: "rejected",
    label: "Reject",
    icon: "xmark",
    color: "bg-red-500",
    requiresComment: true,
    requiresApproval: true,
  },
  {
    from: "approved",
    to: "closed",
    label: "Close MRB",
    icon: "check-circle",
    color: "bg-green-500",
  },
  {
    from: "rejected",
    to: "closed",
    label: "Close MRB",
    icon: "check-circle",
    color: "bg-green-500",
  },
  {
    from: "in_review",
    to: "pending_review",
    label: "Return to Pending",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Additional information needed",
      "Key stakeholders unavailable",
      "Reschedule required"
    ]
  },
  {
    from: "pending_disposition",
    to: "in_review",
    label: "Return to Review",
    icon: "arrow-rotate-left",
    color: "bg-gray-500",
    requiresComment: true,
    reasons: [
      "Further analysis required",
      "New information available",
      "Additional testing needed"
    ]
  }
];

// Validate if a transition is allowed
export function isValidTransition(
  currentStatus: string,
  newStatus: string,
  itemType: "ncr" | "capa" | "scar" | "mrb"
): StatusTransition | null {
  let transitions: StatusTransition[];
  
  switch (itemType) {
    case "ncr":
      transitions = ncrStatusTransitions;
      break;
    case "capa":
      transitions = capaStatusTransitions;
      break;
    case "scar":
      transitions = scarStatusTransitions;
      break;
    case "mrb":
      transitions = mrbStatusTransitions;
      break;
    default:
      return null;
  }
  
  return transitions.find(t => t.from === currentStatus && t.to === newStatus) || null;
}

// Get all valid transitions from a given status
export function getValidTransitions(
  currentStatus: string,
  itemType: "ncr" | "capa" | "scar" | "mrb"
): StatusTransition[] {
  let transitions: StatusTransition[];
  
  switch (itemType) {
    case "ncr":
      transitions = ncrStatusTransitions;
      break;
    case "capa":
      transitions = capaStatusTransitions;
      break;
    case "scar":
      transitions = scarStatusTransitions;
      break;
    case "mrb":
      transitions = mrbStatusTransitions;
      break;
    default:
      return [];
  }
  
  return transitions.filter(t => t.from === currentStatus);
}