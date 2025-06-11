import { Hono } from 'hono';
import { db, domains, eq, projectAccess, and, or, inArray } from '@databuddy/db';
import type { AppVariables } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { cacheable } from '@databuddy/redis/cacheable';
import { Resolver } from "node:dns";
import { randomUUID, randomBytes } from "node:crypto";

// DNS resolver setup
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

// Types for domain context
type DomainsContext = {
  Variables: AppVariables;
};

// Helper functions - Redis cached
async function _getUserProjectIds(userId: string): Promise<string[]> {
  try {
    const projects = await db.query.projectAccess.findMany({
      where: eq(projectAccess.userId, userId),
      columns: {
        projectId: true
      }
    });
    
    return projects.map(access => access.projectId);
  } catch (error) {
    logger.error('[Domain API] Error fetching project IDs:', {error, userId});
    return [];
  }
}

// Cache user project IDs for 5 minutes
const getUserProjectIds = cacheable(_getUserProjectIds, {
  expireInSec: 300, // 5 minutes
  prefix: 'user_projects_domains',
  staleWhileRevalidate: true,
  staleTime: 60 // Revalidate if cache is older than 1 minute
});

async function findAccessibleDomain(user: any, id: string) {
  const projectIds = await getUserProjectIds(user.id);
  return db.query.domains.findFirst({
    where: or(
      and(eq(domains.id, id), eq(domains.userId, user.id)),
      and(
        eq(domains.id, id),
        projectIds.length > 0 ? inArray(domains.projectId, projectIds) : eq(domains.id, "impossible-match")
      )
    )
  });
}

// Standardized response helper
function createResponse<T = unknown>(success: boolean, data?: T, error?: string, status = 200) {
  const response: { success: boolean; data?: T; error?: string } = { success };
  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  return { response, status };
}

// Error handler
function handleError(operation: string, error: unknown, context?: any) {
  logger.error(`[Domain API] ${operation} failed:`, { error, context });
  
  if (error instanceof Error) {
    return createResponse(false, undefined, `${operation} failed: ${error.message}`, 500);
  }
  return createResponse(false, undefined, `${operation} failed`, 500);
}

// Verification token generator
function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Owner data extractor
function getOwnerData(user: any, data: any) {
  return data.projectId 
    ? { projectId: data.projectId }
    : { userId: user.id };
}

// Create router
export const domainsRouter = new Hono<DomainsContext>();

// Apply auth middleware to all routes
domainsRouter.use('*', authMiddleware);

/**
 * Get all user domains - Optimized
 * GET /domains
 */
domainsRouter.get('/', async (c) => {
  const user = c.get('user');

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const userDomains = await db.query.domains.findMany({
      where: eq(domains.userId, user.id),
      orderBy: (domains, { desc }) => [desc(domains.createdAt)],
      columns: {
        id: true,
        name: true,
        verificationStatus: true,
        verificationToken: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const { response, status } = createResponse(true, userDomains);
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Fetching domains', error, { userId: user.id });
    return c.json(response, status as any);
  }
});

/**
 * Get domain by ID - Optimized
 * GET /domains/:id
 */
domainsRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      const { response, status } = createResponse(false, undefined, 'Domain not found', 404);
      return c.json(response, status as any);
    }

    const { response, status } = createResponse(true, domain);
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Fetching domain', error, { domainId: id, userId: user.id });
    return c.json(response, status as any);
  }
});

/**
 * Get domains by project ID - Optimized
 * GET /domains/project/:projectId
 */
domainsRouter.get('/project/:projectId', async (c) => {
  const user = c.get('user');
  const { projectId } = c.req.param();

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const access = await db.query.projectAccess.findFirst({
      where: and(eq(projectAccess.projectId, projectId), eq(projectAccess.userId, user.id)),
      columns: { id: true }
    });
    
    if (!access) {
      const { response, status } = createResponse(false, undefined, "You don't have access to this project", 403);
      return c.json(response, status as any);
    }

    const projectDomains = await db.query.domains.findMany({
      where: eq(domains.projectId, projectId),
      orderBy: (domains, { desc }) => [desc(domains.createdAt)],
      columns: {
        id: true,
        name: true,
        verificationStatus: true,
        verificationToken: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const { response, status } = createResponse(true, projectDomains);
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Fetching project domains', error, { projectId, userId: user.id });
    return c.json(response, status as any);
  }
});

/**
 * Create domain - Optimized with parallel checks
 * POST /domains
 */
domainsRouter.post('/', async (c) => {
  const user = c.get('user');
  const data = await c.req.json();

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    logger.info(`[Domain API] Creating domain: ${data.name}`);
    
    // Check if domain already exists
    const existingDomain = await db.query.domains.findFirst({ 
      where: eq(domains.name, data.name),
      columns: { id: true }
    });
    
    if (existingDomain) {
      const { response, status } = createResponse(false, undefined, 'Domain already exists', 400);
      return c.json(response, status as any);
    }

    const verificationToken = generateVerificationToken();
    const ownerData = getOwnerData(user, data);
    const domainId = randomUUID();

    const [createdDomain] = await db.insert(domains).values({
      id: domainId,
      name: data.name,
      verificationToken,
      verificationStatus: "PENDING",
      ...ownerData
    }).returning();

    logger.info('[Domain API] Domain created successfully:', { id: domainId });

    const { response, status } = createResponse(true, createdDomain);
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Domain creation', error, { domainName: data.name, userId: user.id });
    return c.json(response, status as any);
  }
});

/**
 * Update domain - Optimized
 * PATCH /domains/:id
 */
domainsRouter.patch('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const data = await c.req.json();

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    logger.info(`[Domain API] Updating domain: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      const { response, status } = createResponse(false, undefined, 'Domain not found', 404);
      return c.json(response, status as any);
    }

    const [updatedDomain] = await db.update(domains).set({
      ...data,
      updatedAt: new Date().toISOString()
    }).where(eq(domains.id, id)).returning();

    logger.info('[Domain API] Domain updated successfully:', { id });

    const { response, status } = createResponse(true, updatedDomain);
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Domain update', error, { domainId: id, userId: user.id });
    return c.json(response, status as any);
  }
});

/**
 * Delete domain - Optimized
 * DELETE /domains/:id
 */
domainsRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    logger.info(`[Domain API] Deleting domain: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      const { response, status } = createResponse(false, undefined, 'Domain not found', 404);
      return c.json(response, status as any);
    }

    await db.delete(domains).where(eq(domains.id, id));

    logger.info('[Domain API] Domain deleted successfully:', { id });

    const { response, status } = createResponse(true, { success: true });
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Domain deletion', error, { domainId: id, userId: user.id });
    return c.json(response, status as any);
  }
});

/**
 * Check domain verification - Optimized DNS lookup
 * POST /domains/:id/verify
 */
domainsRouter.post('/:id/verify', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  if (!id) {
    const { response, status } = createResponse(false, undefined, 'Invalid domain ID', 400);
    return c.json(response, status as any);
  }

  try {
    logger.info(`[Domain API] Verifying domain: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      const { response, status } = createResponse(false, undefined, 'Domain not found', 404);
      return c.json(response, status as any);
    }

    if (!domain.name) {
      const { response, status } = createResponse(false, undefined, 'Invalid domain name', 400);
      return c.json(response, status as any);
    }

    const isLocalhost = domain.name.includes("localhost") || domain.name.includes("127.0.0.1");
    
    // Auto-verify localhost domains
    if (isLocalhost) {
      await db.update(domains).set({
        verifiedAt: new Date().toISOString(),
        verificationStatus: "VERIFIED"
      }).where(eq(domains.id, id));

      const { response, status } = createResponse(true, { 
        verified: true, 
        message: "Localhost domain automatically verified" 
      });
      return c.json(response, status as any);
    }
    
    // Check if already verified
    if (domain.verificationStatus === "VERIFIED" && domain.verifiedAt) {
      const { response, status } = createResponse(true, { 
        verified: true, 
        message: "Domain already verified" 
      });
      return c.json(response, status as any);
    }
    
    const rootDomain = domain.name.replace(/^www\./, "");
    const expectedToken = domain.verificationToken;
    
    if (!expectedToken) {
      const { response, status } = createResponse(true, { 
        verified: false, 
        message: "Missing verification token. Please regenerate the token and try again." 
      });
      return c.json(response, status as any);
    }
    
    const dnsRecord = `_databuddy.${rootDomain}`;
    let txtRecords: string[][] | undefined;
    
    try {
      // DNS lookup with timeout and better error handling
      txtRecords = await Promise.race([
        new Promise<string[][]>((resolve, reject) => {
          resolver.resolveTxt(dnsRecord, (err, records) => {
            if (err) return reject(err);
            resolve(records);
          });
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('DNS lookup timeout')), 10000);
        })
      ]);
    } catch (dnsError: unknown) {
      const errorMessage = dnsError instanceof Error && dnsError.message.includes('timeout')
        ? "DNS lookup timed out. The DNS servers may be slow or the record doesn't exist yet."
        : "DNS lookup failed. Please make sure the TXT record is correctly configured and try again.";
      
      await db.update(domains).set({ verificationStatus: "FAILED" }).where(eq(domains.id, id));
      
      const { response, status } = createResponse(true, { 
        verified: false, 
        message: errorMessage 
      });
      return c.json(response, status as any);
    }
    
    if (!txtRecords || txtRecords.length === 0) {
      await db.update(domains).set({ verificationStatus: "FAILED" }).where(eq(domains.id, id));
      
      const { response, status } = createResponse(true, { 
        verified: false, 
        message: "No DNS records found. Please add the TXT record and wait for DNS propagation (which can take up to 24-48 hours)." 
      });
      return c.json(response, status as any);
    }
    
    const isVerified = txtRecords.some(record => 
      Array.isArray(record) && record.some(txt => 
        typeof txt === "string" && txt.includes(expectedToken)
      )
    );
    
    const updateData = isVerified 
      ? {
          verifiedAt: new Date().toISOString(),
          verificationStatus: "VERIFIED" as const
        }
      : {
          verificationStatus: "FAILED" as const
        };

    await db.update(domains).set(updateData).where(eq(domains.id, id));

    const message = isVerified
      ? "Domain verified successfully. You can now use this domain for websites."
      : "Verification token not found in DNS records. Please check your DNS configuration and try again.";

    logger.info('[Domain API] Verification completed:', { id, verified: isVerified });

    const { response, status } = createResponse(true, { 
      verified: isVerified, 
      message 
    });
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Domain verification', error, { domainId: id, userId: user.id });
    return c.json(response, status as any);
  }
});

/**
 * Regenerate verification token - Optimized
 * POST /domains/:id/regenerate-token
 */
domainsRouter.post('/:id/regenerate-token', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  if (!user || !user.id) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    logger.info(`[Domain API] Regenerating token for domain: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      const { response, status } = createResponse(false, undefined, 'Domain not found', 404);
      return c.json(response, status as any);
    }

    const verificationToken = generateVerificationToken();
    
    const [updatedDomain] = await db.update(domains).set({
      verificationToken,
      verificationStatus: "PENDING",
      verifiedAt: null,
      updatedAt: new Date().toISOString()
    }).where(eq(domains.id, id)).returning();

    logger.info('[Domain API] Token regenerated successfully:', { id });

    const { response, status } = createResponse(true, updatedDomain);
    return c.json(response, status as any);
  } catch (error) {
    const { response, status } = handleError('Token regeneration', error, { domainId: id, userId: user.id });
    return c.json(response, status as any);
  }
});

export default domainsRouter; 