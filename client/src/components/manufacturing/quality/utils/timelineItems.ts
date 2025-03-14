import { format } from "date-fns";
import { CAPA } from "@/types/manufacturing/capa";
import { MRB } from "@/types/manufacturing/mrb";
import { NCR } from "@/types/manufacturing/ncr";
import { SCAR } from "@/types/manufacturing/scar";
import { TimelineItem, TimelineItemStatus } from "@/components/manufacturing/quality/MilestoneTimeline";

// Our internal timeline item with order index for sorting
interface InternalTimelineItem extends TimelineItem {
  sortOrder: number;
}

/**
 * Creates timeline items for an NCR
 */
export function createNCRTimelineItems(ncr: NCR): TimelineItem[] {
  // Create internal items with sortOrder for sorting based on standardized flow:
  // Created → In Review → Pending Disposition → Disposition Complete
  const internalItems: InternalTimelineItem[] = [
    {
      id: "1",
      label: "Created",
      status: "completed",
      date: ncr.createdAt,
      tooltip: `Created on ${format(new Date(ncr.createdAt), "MMM d, yyyy")}`,
      sortOrder: 0
    },
    {
      id: "2",
      label: "In Review",
      status: ncr.status === "under_review" || ncr.status === "pending_disposition" || ncr.status === "closed" 
        ? "completed" 
        : ncr.status === "open" || ncr.status === "draft"
          ? "current" 
          : "pending",
      date: ncr.status === "under_review" ? ncr.updatedAt : undefined,
      tooltip: ncr.status === "under_review" ? "Under review" : ncr.status === "pending_disposition" || ncr.status === "closed" ? "Review completed" : "Pending review",
      sortOrder: 1
    },
    {
      id: "3",
      label: "Pending Disposition",
      status: ncr.status === "pending_disposition" || ncr.status === "closed" 
        ? "completed" 
        : ncr.status === "under_review" 
          ? "current" 
          : "pending",
      date: ncr.disposition?.approvalDate,
      tooltip: ncr.status === "pending_disposition" ? "Disposition in progress" : ncr.status === "closed" ? "Disposition completed" : "Pending disposition",
      sortOrder: 2
    },
    {
      id: "4",
      label: "Disposition Complete",
      status: ncr.status === "closed" ? "completed" : 
             ncr.status === "pending_disposition" ? "current" : "pending",
      date: ncr.closedDate,
      tooltip: ncr.status === "closed" ? `Disposition completed on ${ncr.closedDate ? format(new Date(ncr.closedDate), "MMM d, yyyy") : "unknown date"}` : "Disposition not complete",
      sortOrder: 3
    }
  ];

  // Sort by sortOrder and strip out the sortOrder from the returned items
  return internalItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder, ...item }) => item);
}

/**
 * Creates timeline items for a CAPA
 */
export function createCAPATimelineItems(capa: CAPA): TimelineItem[] {
  // Create internal items with sortOrder for sorting
  const internalItems: InternalTimelineItem[] = [
    {
      id: "1",
      label: "Draft",
      status: "completed",
      date: capa.createdAt,
      tooltip: `Created on ${format(new Date(capa.createdAt), "MMM d, yyyy")}`,
      sortOrder: 0
    },
    {
      id: "2",
      label: "Open",
      status: capa.status === "open" || capa.status === "in_progress" || capa.status === "pending_verification" || capa.status === "verified" || capa.status === "closed" 
        ? "completed" 
        : "pending",
      tooltip: "CAPA planning phase",
      sortOrder: 1
    },
    {
      id: "3",
      label: "In Progress",
      status: capa.status === "in_progress" || capa.status === "pending_verification" || capa.status === "verified" || capa.status === "closed" 
        ? "completed" 
        : capa.status === "open" 
          ? "current" 
          : "pending",
      tooltip: capa.status === "in_progress" ? "Implementation in progress" : capa.status === "pending_verification" || capa.status === "verified" || capa.status === "closed" ? "Implementation completed" : "Pending implementation",
      sortOrder: 2
    },
    {
      id: "4",
      label: "Verification",
      status: capa.status === "pending_verification" || capa.status === "verified" || capa.status === "closed" 
        ? "completed" 
        : capa.status === "in_progress" 
          ? "current" 
          : "pending",
      date: capa.verificationDate,
      tooltip: capa.status === "pending_verification" ? "Verification in progress" : capa.status === "verified" || capa.status === "closed" ? "Verification completed" : "Pending verification",
      sortOrder: 3
    },
    {
      id: "5",
      label: "Closed",
      status: capa.status === "closed" ? "completed" : "pending",
      date: capa.closedDate,
      tooltip: capa.status === "closed" ? `Closed on ${capa.closedDate ? format(new Date(capa.closedDate), "MMM d, yyyy") : "unknown date"}` : "Not closed",
      sortOrder: 4
    }
  ];

  // Sort by sortOrder and strip out the sortOrder from the returned items
  return internalItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder, ...item }) => item);
}

/**
 * Creates timeline items for an SCAR
 */
export function createSCARTimelineItems(scar: SCAR): TimelineItem[] {
  // Create internal items with sortOrder for sorting
  const internalItems: InternalTimelineItem[] = [
    {
      id: "1",
      label: "Draft",
      status: "completed",
      date: scar.createdAt,
      tooltip: `Created on ${format(new Date(scar.createdAt), "MMM d, yyyy")}`,
      sortOrder: 0
    },
    {
      id: "2",
      label: "Issued",
      status: scar.status === "issued" || scar.status === "supplier_response" || scar.status === "review" || scar.status === "closed" 
        ? "completed" 
        : scar.status === "draft" 
          ? "current" 
          : "pending",
      date: scar.issueDate,
      tooltip: scar.status === "issued" ? `Issued on ${scar.issueDate ? format(new Date(scar.issueDate), "MMM d, yyyy") : "unknown date"}` : scar.status === "supplier_response" || scar.status === "review" || scar.status === "closed" ? "Issued to supplier" : "Not yet issued",
      sortOrder: 1
    },
    {
      id: "3",
      label: "Response",
      status: scar.status === "supplier_response" || scar.status === "review" || scar.status === "closed" 
        ? "completed" 
        : scar.status === "issued" 
          ? "current" 
          : "pending",
      date: scar.supplierResponse?.responseDate,
      tooltip: scar.status === "supplier_response" ? "Supplier responded" : scar.status === "review" || scar.status === "closed" ? "Response received" : "Awaiting supplier response",
      sortOrder: 2
    },
    {
      id: "4",
      label: "Review",
      status: scar.status === "review" || scar.status === "closed" 
        ? "completed" 
        : scar.status === "supplier_response" 
          ? "current" 
          : "pending",
      date: scar.reviewDate,
      tooltip: scar.status === "review" ? "Under review" : scar.status === "closed" ? "Review completed" : "Pending review",
      sortOrder: 3
    },
    {
      id: "5",
      label: "Closed",
      status: scar.status === "closed" ? "completed" : "pending",
      date: scar.closeDate, // SCAR uses closeDate, not closedDate
      tooltip: scar.status === "closed" ? `Closed on ${scar.closeDate ? format(new Date(scar.closeDate), "MMM d, yyyy") : "unknown date"}` : "Not closed",
      sortOrder: 4
    }
  ];

  // Sort by sortOrder and strip out the sortOrder from the returned items
  return internalItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder, ...item }) => item);
}

/**
 * Creates timeline items for an MRB
 */
export function createMRBTimelineItems(mrb: MRB): TimelineItem[] {
  // Create internal items with sortOrder for sorting
  const internalItems: InternalTimelineItem[] = [
    {
      id: "1",
      label: "Pending",
      status: "completed",
      date: mrb.createdAt,
      tooltip: `Created on ${format(new Date(mrb.createdAt), "MMM d, yyyy")}`,
      sortOrder: 0
    },
    {
      id: "2",
      label: "In Review",
      status: mrb.status === "in_review" || mrb.status === "pending_disposition" || mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed" 
        ? "completed" 
        : mrb.status === "pending_review" 
          ? "current" 
          : "pending",
      date: mrb.reviewDate,
      tooltip: mrb.status === "in_review" ? "Under review" : mrb.status === "pending_disposition" || mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed" ? "Review completed" : "Pending review",
      sortOrder: 1
    },
    {
      id: "3",
      label: "Disposition",
      status: mrb.status === "pending_disposition" || mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed" 
        ? "completed" 
        : mrb.status === "in_review" 
          ? "current" 
          : "pending",
      date: mrb.disposition?.approvalDate,
      tooltip: mrb.status === "pending_disposition" ? "Disposition in progress" : mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed" ? "Disposition completed" : "Pending disposition",
      sortOrder: 2
    },
    {
      id: "4",
      label: "Decision",
      status: (mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed") 
        ? "completed" 
        : mrb.status === "pending_disposition" 
          ? "current" 
          : "pending",
      tooltip: mrb.status === "approved" ? "Approved" : mrb.status === "rejected" ? "Rejected" : mrb.status === "closed" ? "Decision made" : "Pending decision",
      sortOrder: 3
    },
    {
      id: "5",
      label: "Closed",
      status: mrb.status === "closed" ? "completed" : "pending",
      date: mrb.closedDate,
      tooltip: mrb.status === "closed" ? `Closed on ${mrb.closedDate ? format(new Date(mrb.closedDate), "MMM d, yyyy") : "unknown date"}` : "Not closed",
      sortOrder: 4
    }
  ];

  // Sort by sortOrder and strip out the sortOrder from the returned items
  return internalItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder, ...item }) => item);
}