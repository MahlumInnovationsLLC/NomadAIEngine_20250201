import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  owner: string;
  manufacturingProject: string;
  lastContact: string;
  score: number;
  qualificationStatus: string;
  nextSteps: string;
  engagement: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  lastContact: string;
  deals: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  deals: number;
  value: number;
  updatedAt: string;
}

export function useSalesData() {
  const queryClient = useQueryClient();

  // Error handler helper
  const handleError = (error: any) => {
    console.error('API Error:', error);
    toast({
      title: 'Error',
      description: error.message || 'An error occurred',
      variant: 'destructive',
    });
  };

  // Deals queries and mutations
  const useDeals = () => useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await fetch('/api/deals');
      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }
      return response.json();
    }
  });

  const useCreateDeal = () => useMutation({
    mutationFn: async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal)
      });
      if (!response.ok) {
        throw new Error('Failed to create deal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: 'Success',
        description: 'Deal created successfully',
      });
    },
    onError: handleError
  });

  const useUpdateDeal = () => useMutation({
    mutationFn: async ({ id, ...deal }: Deal) => {
      const response = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal)
      });
      if (!response.ok) {
        throw new Error('Failed to update deal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
    },
    onError: handleError
  });

  // Contacts queries and mutations
  const useContacts = () => useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts');
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      return response.json();
    }
  });

  const useCreateContact = () => useMutation({
    mutationFn: async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      if (!response.ok) {
        throw new Error('Failed to create contact');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
    },
    onError: handleError
  });

  // Pipeline queries and mutations
  const usePipeline = () => useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => {
      const response = await fetch('/api/pipeline');
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline stages');
      }
      return response.json();
    }
  });

  // Analytics queries
  const useDealsByStage = () => useQuery({
    queryKey: ['analytics', 'deals-by-stage'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/deals-by-stage');
      if (!response.ok) {
        throw new Error('Failed to fetch deals by stage');
      }
      return response.json();
    }
  });

  const useDealsTrend = (days: number = 30) => useQuery({
    queryKey: ['analytics', 'deals-trend', days],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/deals-trend?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deals trend');
      }
      return response.json();
    }
  });

  return {
    useDeals,
    useCreateDeal,
    useUpdateDeal,
    useContacts,
    useCreateContact,
    usePipeline,
    useDealsByStage,
    useDealsTrend,
  };
}