"use server";

import { revalidatePath } from "next/cache";
import { db } from "@databuddy/db";
import { auth } from "@databuddy/auth";
import { headers } from "next/headers";
import { cache } from "react";
import dns from "dns";
import { promisify } from "util";

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

// Helper to get authenticated user
const getUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return null;
  return session.user;
});

// Generate a verification token
function generateVerificationToken() {
  const token = `databuddy-${Math.random().toString(36).substring(2, 15)}`;
  console.log(`[Verification] Generated token: ${token}`);
  return token;
}

// Create website with proper revalidation
export async function createWebsite(data: { domain: string; name: string }) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    console.log(`[Website] Creating: ${data.name} (${data.domain})`);
    
    // Check if website already exists
    const existingWebsite = await db.website.findFirst({
      where: {
        domain: data.domain,
        userId: user.id
      }
    });

    if (existingWebsite) {
      console.log(`[Website] Already exists: ${data.domain}`);
      return { error: "Website already exists" };
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    const website = await db.website.create({
      data: {
        domain: data.domain,
        name: data.name,
        userId: user.id,
        verificationToken,
        verificationStatus: "PENDING"
      }
    });

    console.log(`[Website] Created: ${website.id} (${website.domain})`);
    
    revalidatePath("/websites");
    return { data: website };
  } catch (error) {
    console.error("[Website] Creation failed:", error);
    return { error: "Failed to create website" };
  }
}

// Get all websites for current user with caching
export const getUserWebsites = cache(async () => {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const websites = await db.website.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { data: websites };
  } catch (error) {
    console.error("[Website] Fetch failed:", error);
    return { error: "Failed to fetch websites" };
  }
});

// Get single website by ID with caching
export const getWebsiteById = cache(async (id: string) => {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const website = await db.website.findFirst({
      where: {
        id,
        userId: user.id
      }
    });
    
    if (!website) {
      return { error: "Website not found" };
    }
    
    return { data: website };
  } catch (error) {
    console.error("[Website] Fetch failed:", error);
    return { error: "Failed to fetch website" };
  }
});

// Update website with revalidation
export async function updateWebsite(id: string, data: { domain?: string; name?: string }) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    console.log(`[Website] Updating: ${id}`);
    
    const website = await db.website.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!website) {
      return { error: "Website not found" };
    }

    // Only allow updating the name, not the domain
    const { name } = data;
    
    const updated = await db.website.update({
      where: { id },
      data: { name }
    });

    console.log(`[Website] Updated: ${updated.id}`);
    
    revalidatePath("/websites");
    revalidatePath(`/websites/${id}`);
    return { data: updated };
  } catch (error) {
    console.error("[Website] Update failed:", error);
    return { error: "Failed to update website" };
  }
}

// Delete website with revalidation
export async function deleteWebsite(id: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    console.log(`[Website] Deleting: ${id}`);
    
    const website = await db.website.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!website) {
      return { error: "Website not found" };
    }

    await db.website.delete({
      where: { id }
    });

    console.log(`[Website] Deleted: ${id}`);
    
    revalidatePath("/websites");
    return { success: true };
  } catch (error) {
    console.error("[Website] Delete failed:", error);
    return { error: "Failed to delete website" };
  }
}

// Check domain verification status
export async function checkDomainVerification(id: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    console.log(`[Verification] Checking: ${id}`);
    
    const website = await db.website.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!website) {
      return { error: "Website not found" };
    }

    // If already verified, return success
    if (website.verifiedAt) {
      console.log(`[Verification] Already verified: ${website.domain}`);
      return { data: { verified: true, message: "Domain already verified" } };
    }

    // Extract domain from URL and remove www. prefix
    const domain = new URL(website.domain).hostname;
    const rootDomain = domain.replace(/^www\./, '');
    console.log(`[Verification] Checking DNS for: ${rootDomain}`);
    
    // Check for TXT record
    try {
      const dnsRecord = `_databuddy.${rootDomain}`;
      console.log(`[Verification] Looking up: ${dnsRecord}`);
      
      const txtRecords = await dns.promises.resolveTxt(dnsRecord);
      console.log(`[Verification] Found ${txtRecords.length} TXT records`);
      
      // Check if any TXT record contains our verification token
      const expectedToken = website.verificationToken || '';
      
      const isVerified = txtRecords.some(record => 
        record.some(txt => txt.includes(expectedToken))
      );
      
      if (isVerified) {
        console.log(`[Verification] Success: ${website.domain}`);
        
        // Update website as verified
        await db.website.update({
          where: { id },
          data: {
            verifiedAt: new Date(),
            verificationStatus: "VERIFIED"
          }
        });
        
        revalidatePath("/websites");
        revalidatePath(`/websites/${id}`);
        
        return { 
          data: { 
            verified: true, 
            message: "Domain verified successfully. Your website is now active." 
          } 
        };
      } else {
        console.log(`[Verification] Failed: ${website.domain} - token not found`);
        return { 
          data: { 
            verified: false, 
            message: "Verification token not found in DNS records. Your website will remain inactive until verified." 
          } 
        };
      }
    } catch (error) {
      console.error("[Verification] DNS lookup error:", error);
      return { 
        data: { 
          verified: false, 
          message: "Could not find verification record. Make sure the DNS record has been added and propagated. Your website will remain inactive until verified." 
        } 
      };
    }
  } catch (error) {
    console.error("[Verification] Check failed:", error);
    return { error: "Failed to check domain verification" };
  }
}

// Regenerate verification token
export async function regenerateVerificationToken(id: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    console.log(`[Verification] Regenerating token: ${id}`);
    
    const website = await db.website.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!website) {
      return { error: "Website not found" };
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    
    // Update website with new token
    const updated = await db.website.update({
      where: { id },
      data: {
        verificationToken,
        verificationStatus: "PENDING",
        verifiedAt: null
      }
    });

    console.log(`[Verification] Token regenerated: ${updated.id}`);
    
    revalidatePath("/websites");
    revalidatePath(`/websites/${id}`);
    
    return { data: updated };
  } catch (error) {
    console.error("[Verification] Token regeneration failed:", error);
    return { error: "Failed to regenerate verification token" };
  }
} 