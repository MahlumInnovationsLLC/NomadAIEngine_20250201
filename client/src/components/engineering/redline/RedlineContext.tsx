import { createContext, useContext, useState, ReactNode } from 'react';

// Define the type for a redline submission
export interface RedlineSubmission {
  id: string;
  title: string;
  projectNumber: string;
  requestor: string;
  department: string;
  submittedBy: string;
  submittedDate: string;
  status: string;
  priority: string;
  assignedTo: string;
  description: string;
  attachments: {
    fileName: string;
    fileType: string;
    fileSize: string;
    filePath: string;
  }[];
}

// Define the context type
interface RedlineContextType {
  redlineSubmissions: RedlineSubmission[];
  addRedlineSubmission: (submission: RedlineSubmission) => void;
  updateRedlineSubmission: (id: string, updatedSubmission: Partial<RedlineSubmission>) => void;
  deleteRedlineSubmission: (id: string) => void;
  findRedlinesByDepartment: (department: string) => RedlineSubmission[];
  selectedSubmission: RedlineSubmission | null;
  setSelectedSubmission: (submission: RedlineSubmission | null) => void;
  isSubmitDialogOpen: boolean;
  setIsSubmitDialogOpen: (isOpen: boolean) => void;
  isViewDialogOpen: boolean;
  setIsViewDialogOpen: (isOpen: boolean) => void;
  isCommentDialogOpen: boolean;
  setIsCommentDialogOpen: (isOpen: boolean) => void;
}

// Mock data for redline submissions (would be replaced with actual API data)
const initialRedlineSubmissions: RedlineSubmission[] = [
  {
    id: "RED-001",
    title: "Update PCB Layout for Control Board",
    projectNumber: "PRJ-2025-001",
    requestor: "John Smith",
    department: "Electrical",
    submittedBy: "John Smith",
    submittedDate: "2025-03-15",
    status: "Pending",
    priority: "High",
    assignedTo: "Elizabeth Parker",
    description: "The current PCB layout needs modification to accommodate the new sensor array and improve signal integrity. Additional ground planes are required around the sensitive analog components.",
    attachments: [
      {
        fileName: "Drawing_Rev2_with_redlines.pdf",
        fileType: "application/pdf",
        fileSize: "2.4 MB",
        filePath: "/path/to/Drawing_Rev2_with_redlines.pdf" // This would be a server path in production
      }
    ]
  },
  {
    id: "RED-002",
    title: "Adjust Clearance in Mounting Bracket",
    projectNumber: "PRJ-2025-002",
    requestor: "Sarah Johnson",
    department: "Mechanical",
    submittedBy: "Sarah Johnson",
    submittedDate: "2025-03-18",
    status: "In Review",
    priority: "Medium",
    assignedTo: "Robert Chen",
    description: "The current mounting bracket has insufficient clearance for the new cooler assembly. Need to adjust dimensions according to the marked drawings.",
    attachments: [
      {
        fileName: "Bracket_Design_Rev3.pdf",
        fileType: "application/pdf",
        fileSize: "1.8 MB",
        filePath: "/path/to/Bracket_Design_Rev3.pdf"
      }
    ]
  },
  {
    id: "RED-003",
    title: "Update Network Topology Diagram",
    projectNumber: "PRJ-2025-003",
    requestor: "Michael Brown",
    department: "IT",
    submittedBy: "Michael Brown",
    submittedDate: "2025-03-20",
    status: "Approved",
    priority: "Low",
    assignedTo: "David Garcia",
    description: "Network topology diagram needs to be updated to reflect the new redundant switches and security zones implementation.",
    attachments: [
      {
        fileName: "Network_Topology_Rev2.pdf",
        fileType: "application/pdf",
        fileSize: "1.2 MB",
        filePath: "/path/to/Network_Topology_Rev2.pdf"
      }
    ]
  },
  {
    id: "RED-004",
    title: "Modify API Interface Documentation",
    projectNumber: "PRJ-2025-004",
    requestor: "Jessica Lee",
    department: "NTC",
    submittedBy: "Jessica Lee",
    submittedDate: "2025-03-22",
    status: "Pending",
    priority: "High",
    assignedTo: "Alex Chen",
    description: "The API interface documentation needs to be updated to include the new endpoints and authentication requirements.",
    attachments: [
      {
        fileName: "API_Interface_Spec_Rev5.pdf",
        fileType: "application/pdf",
        fileSize: "3.1 MB",
        filePath: "/path/to/API_Interface_Spec_Rev5.pdf"
      }
    ]
  },
];

// Create the context with default values
const RedlineContext = createContext<RedlineContextType>({
  redlineSubmissions: [],
  addRedlineSubmission: () => {},
  updateRedlineSubmission: () => {},
  deleteRedlineSubmission: () => {},
  findRedlinesByDepartment: () => [],
  selectedSubmission: null,
  setSelectedSubmission: () => {},
  isSubmitDialogOpen: false,
  setIsSubmitDialogOpen: () => {},
  isViewDialogOpen: false,
  setIsViewDialogOpen: () => {},
  isCommentDialogOpen: false,
  setIsCommentDialogOpen: () => {},
});

// Provider component
export function RedlineProvider({ children }: { children: ReactNode }) {
  const [redlineSubmissions, setRedlineSubmissions] = useState<RedlineSubmission[]>(initialRedlineSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<RedlineSubmission | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);

  const addRedlineSubmission = (submission: RedlineSubmission) => {
    setRedlineSubmissions([...redlineSubmissions, submission]);
  };

  const updateRedlineSubmission = (id: string, updatedSubmission: Partial<RedlineSubmission>) => {
    setRedlineSubmissions(redlineSubmissions.map(submission => 
      submission.id === id ? { ...submission, ...updatedSubmission } : submission
    ));
  };

  const deleteRedlineSubmission = (id: string) => {
    setRedlineSubmissions(redlineSubmissions.filter(submission => submission.id !== id));
  };

  const findRedlinesByDepartment = (department: string) => {
    return redlineSubmissions.filter(submission => submission.department === department);
  };

  return (
    <RedlineContext.Provider value={{
      redlineSubmissions,
      addRedlineSubmission,
      updateRedlineSubmission,
      deleteRedlineSubmission,
      findRedlinesByDepartment,
      selectedSubmission,
      setSelectedSubmission,
      isSubmitDialogOpen,
      setIsSubmitDialogOpen,
      isViewDialogOpen,
      setIsViewDialogOpen,
      isCommentDialogOpen,
      setIsCommentDialogOpen,
    }}>
      {children}
    </RedlineContext.Provider>
  );
}

// Hook to use the redline context
export function useRedline() {
  const context = useContext(RedlineContext);
  if (context === undefined) {
    throw new Error('useRedline must be used within a RedlineProvider');
  }
  return context;
}