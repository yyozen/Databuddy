export interface Website {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  domain: string;
}

export interface DomainEntry {
  id: string;
  name: string | null;
  verifiedAt: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED" | null;
  verificationToken?: string | null; // Ensure this is always selected in queries
  createdAt: string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerImage: string | null;
  websites: Website[] | null;
} 