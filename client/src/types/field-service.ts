export interface ServiceStats {
  openTickets: number;
  activeTechnicians: number;
  pendingClaims: number;
  satisfactionScore: number;
}

export interface ServiceTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  customer: {
    id: string;
    name: string;
    company: string;
    contact: string;
  };
  productInfo: {
    serialNumber: string;
    model: string;
    installationDate: string;
    warrantyStatus: 'active' | 'expired' | 'pending';
  };
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  status: 'available' | 'on_call' | 'off_duty';
  currentLocation?: {
    lat: number;
    lng: number;
    lastUpdated: string;
  };
  assignments: string[]; // Array of ticket IDs
  certifications: Array<{
    name: string;
    issuedDate: string;
    expiryDate: string;
  }>;
}

export interface CustomerFeedbackItem {
  id: string;
  ticketId: string;
  rating: number;
  comment: string;
  categories: string[];
  createdAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface WarrantyClaim {
  id: string;
  ticketId?: string;
  productInfo: {
    serialNumber: string;
    model: string;
    purchaseDate: string;
    warrantyExpiration: string;
  };
  claimDetails: {
    description: string;
    partsClaimed: Array<{
      partNumber: string;
      description: string;
      quantity: number;
      cost: number;
    }>;
    laborHours: number;
    totalCost: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  submittedAt: string;
  processedAt?: string;
  documents: Array<{
    id: string;
    type: string;
    url: string;
  }>;
}
