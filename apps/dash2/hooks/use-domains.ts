"use client";

import { useEffect, useState, useCallback } from 'react';
import { getUserDomains } from '@/app/actions/domains';
import { toast } from 'sonner';

export interface Domain {
  id: string;
  name: string;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
  verificationToken: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
}

export function useDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [verifiedDomains, setVerifiedDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchDomains = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const result = await getUserDomains();
      if (result.error) {
        toast.error(result.error);
        setIsError(true);
        return;
      }
      
      const allDomains = result.data || [];
      setDomains(allDomains);
      
      // Filter for verified domains
      const verified = allDomains.filter(domain => 
        domain.verificationStatus === "VERIFIED"
      );
      setVerifiedDomains(verified);
    } catch (error) {
      console.error('Error fetching domains:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch domains on mount
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  return {
    domains,
    verifiedDomains,
    isLoading,
    isError,
    refetch: fetchDomains
  };
} 