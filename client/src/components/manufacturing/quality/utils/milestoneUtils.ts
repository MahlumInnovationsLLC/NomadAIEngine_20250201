import type { Milestone, MilestoneStatus } from "../MilestoneTimeline";
import type { CAPA } from "@/types/manufacturing/capa";
import type { MRB } from "@/types/manufacturing/mrb";
import type { SCAR } from "@/types/manufacturing/scar";

// Type for the NonConformanceReport which doesn't have a dedicated type file
type NCR = {
  id: string;
  number: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'under_review' | 'pending_disposition' | 'closed';
  severity: 'minor' | 'major' | 'critical';
  type: 'product' | 'process' | 'material' | 'documentation';
  createdAt: string;
  updatedAt: string;
  disposition?: 'use_as_is' | 'rework' | 'repair' | 'scrap' | 'return_to_supplier' | 'pending';
  // other fields omitted
};

// NCR Milestones
export function getNcrMilestones(ncr: NCR): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: 'draft',
      label: 'Draft',
      status: getMilestoneStatus(ncr.status, 'draft', ['draft']),
      date: ncr.createdAt
    },
    {
      id: 'open',
      label: 'Open',
      status: getMilestoneStatus(ncr.status, 'open', ['open', 'under_review', 'pending_disposition', 'closed']),
      date: ncr.updatedAt
    },
    {
      id: 'under_review',
      label: 'Under Review',
      status: getMilestoneStatus(ncr.status, 'under_review', ['under_review', 'pending_disposition', 'closed']),
    },
    {
      id: 'pending_disposition',
      label: 'Pending Disposition',
      status: getMilestoneStatus(ncr.status, 'pending_disposition', ['pending_disposition', 'closed']),
    },
    {
      id: 'closed',
      label: 'Closed',
      status: getMilestoneStatus(ncr.status, 'closed', ['closed']),
    }
  ];

  return {
    milestones,
    currentMilestoneId: ncr.status
  };
}

// CAPA Milestones
export function getCapaMilestones(capa: CAPA): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: 'draft',
      label: 'Draft',
      status: getMilestoneStatus(capa.status, 'draft', ['draft', 'open', 'in_progress', 'pending_review', 'under_investigation', 'implementing', 'pending_verification', 'completed', 'verified', 'closed']),
      date: capa.createdAt
    },
    {
      id: 'open',
      label: 'Open',
      status: getMilestoneStatus(capa.status, 'open', ['open', 'in_progress', 'pending_review', 'under_investigation', 'implementing', 'pending_verification', 'completed', 'verified', 'closed']),
    },
    {
      id: 'investigation',
      label: 'Investigation',
      status: getMilestoneStatus(capa.status, 'under_investigation', ['under_investigation', 'implementing', 'pending_verification', 'completed', 'verified', 'closed']),
    },
    {
      id: 'implementing',
      label: 'Implementing',
      status: getMilestoneStatus(capa.status, 'implementing', ['implementing', 'pending_verification', 'completed', 'verified', 'closed']),
    },
    {
      id: 'verification',
      label: 'Verification',
      status: getMilestoneStatus(capa.status, 'pending_verification', ['pending_verification', 'verified', 'closed']),
    },
    {
      id: 'closed',
      label: 'Closed',
      status: getMilestoneStatus(capa.status, 'closed', ['closed']),
    }
  ];

  // Determine the current milestone ID based on the CAPA status
  let currentMilestoneId: string;
  switch (capa.status) {
    case 'draft':
      currentMilestoneId = 'draft';
      break;
    case 'open':
    case 'in_progress':
      currentMilestoneId = 'open';
      break;
    case 'under_investigation':
    case 'pending_review':
      currentMilestoneId = 'investigation';
      break;
    case 'implementing':
      currentMilestoneId = 'implementing';
      break;
    case 'pending_verification':
    case 'completed':
    case 'verified':
      currentMilestoneId = 'verification';
      break;
    case 'closed':
    case 'cancelled':
      currentMilestoneId = 'closed';
      break;
    default:
      currentMilestoneId = 'draft';
  }

  return {
    milestones,
    currentMilestoneId
  };
}

// MRB Milestones
export function getMrbMilestones(mrb: MRB): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: 'pending_review',
      label: 'Pending Review',
      status: getMilestoneStatus(mrb.status, 'pending_review', ['pending_review', 'in_review', 'pending_disposition', 'disposition_pending', 'approved', 'rejected', 'closed']),
      date: mrb.createdAt
    },
    {
      id: 'in_review',
      label: 'In Review',
      status: getMilestoneStatus(mrb.status, 'in_review', ['in_review', 'pending_disposition', 'disposition_pending', 'approved', 'rejected', 'closed']),
    },
    {
      id: 'disposition_pending',
      label: 'Disposition Pending',
      status: getMilestoneStatus(mrb.status, 'disposition_pending', ['disposition_pending', 'approved', 'rejected', 'closed']),
    },
    {
      id: 'approved',
      label: 'Approved',
      status: getMilestoneStatus(mrb.status, 'approved', ['approved', 'closed']),
    },
    {
      id: 'rejected',
      label: 'Rejected',
      status: getMilestoneStatus(mrb.status, 'rejected', ['rejected', 'closed']),
      // Set to skipped if approved
      ...(mrb.status === 'approved' && { status: 'skipped' as MilestoneStatus })
    },
    {
      id: 'closed',
      label: 'Closed',
      status: getMilestoneStatus(mrb.status, 'closed', ['closed']),
    }
  ];

  return {
    milestones,
    currentMilestoneId: mrb.status
  };
}

// SCAR Milestones
export function getScarMilestones(scar: SCAR): { milestones: Milestone[]; currentMilestoneId: string } {
  const milestones: Milestone[] = [
    {
      id: 'draft',
      label: 'Draft',
      status: getMilestoneStatus(scar.status, 'draft', ['draft', 'issued', 'supplier_response', 'review', 'closed']),
      date: scar.createdAt
    },
    {
      id: 'issued',
      label: 'Issued',
      status: getMilestoneStatus(scar.status, 'issued', ['issued', 'supplier_response', 'review', 'closed']),
      date: scar.issueDate
    },
    {
      id: 'supplier_response',
      label: 'Supplier Response',
      status: getMilestoneStatus(scar.status, 'supplier_response', ['supplier_response', 'review', 'closed']),
    },
    {
      id: 'review',
      label: 'Review',
      status: getMilestoneStatus(scar.status, 'review', ['review', 'closed']),
    },
    {
      id: 'closed',
      label: 'Closed',
      status: getMilestoneStatus(scar.status, 'closed', ['closed']),
    }
  ];

  return {
    milestones,
    currentMilestoneId: scar.status
  };
}

// Helper function to determine the status of a milestone
function getMilestoneStatus(
  currentStatus: string,
  milestoneStatus: string,
  completedStatuses: string[]
): MilestoneStatus {
  if (currentStatus === milestoneStatus) {
    return 'in-progress';
  } else if (completedStatuses.includes(currentStatus)) {
    return 'completed';
  } else {
    return 'not-started';
  }
}