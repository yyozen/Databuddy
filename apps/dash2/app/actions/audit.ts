"use server";

import { db } from "@databuddy/db";

type AuditLog = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

export async function getAuditLogs(limit = 10) {
  try {
    const auditLogs = await db.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    return { success: true, data: auditLogs };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}

