import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getAuditLogs } from '@/app/actions/audit';
import { type AuditNotification } from '@/components/notifications/types';

// Helper function to get human-readable action text
export function getActionText(action: string, resourceType: string): string {
    const resourceName = resourceType.toLowerCase();
    
    switch (action) {
      case 'CREATE':
        return `created a new ${resourceName}`;
      case 'UPDATE':
        return `updated a ${resourceName}`;
      case 'DELETE':
        return `deleted a ${resourceName}`;
      case 'SOFT_DELETE':
        return `archived a ${resourceName}`;
      default:
        return `modified a ${resourceName}`;
    }
  } 

interface AuditLogChange {
  field: string;
  oldValue?: any;
  newValue?: any;
}

interface AuditLogDetails {
  changes?: AuditLogChange[];
  name?: string;
  description?: string;
  website?: string;
  environment?: string;
  [key: string]: any;
}

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: AuditLogDetails;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface ServerActionResponse {
  success: boolean;
  data?: AuditLog[];
  error?: string;
}

export function useAuditLogs(limit = 10) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [formattedLogs, setFormattedLogs] = useState<AuditNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const result = await getAuditLogs(limit) as ServerActionResponse;
        
        if (result.success && result.data) {
          const typedLogs = result.data.map(log => ({
            ...log,
            details: typeof log.details === 'object' ? log.details as AuditLogDetails : {}
          }));
          
          setLogs(typedLogs);
          
          // Format the logs for display in notifications
          const formatted = typedLogs.map(log => {
            const timeAgo = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });
            
            // Create a more descriptive title based on the action and resource type
            let title = getActionText(log.action, log.resourceType);
            
            // Add more context to the description if available
            let description = '';
            
            // Add additional details if available
            if (log.details.name) {
              title = `${log.details.name} ${log.action.toLowerCase()}d`;
            }
            
            if (log.details.description) {
              description = log.details.description;
            } else {
              // Create a more user-friendly description
              const resourceName = log.details.name || log.resourceType;
              description = `${resourceName} was ${log.action.toLowerCase()}d`;
            }

            // Extract changes if any
            const changes = log.details.changes?.map((change: AuditLogChange) => ({
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue
            }));
            
            return {
              id: log.id,
              title,
              description,
              time: timeAgo,
              read: false,
              type: 'audit' as const,
              details: {
                resourceType: log.resourceType,
                resourceId: log.resourceId,
                action: log.action as 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE',
                changes,
                website: log.details.website || 'Unknown',
                environment: (log.details.environment || 'production') as 'production' | 'staging' | 'development'
              },
            };
          });
          
          setFormattedLogs(formatted);
        } else {
          setError(new Error(result.error || 'Failed to fetch audit logs'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch audit logs'));
        console.error('Error fetching audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [limit]);

  return {
    logs,
    formattedLogs,
    isLoading,
    error,
  };
} 