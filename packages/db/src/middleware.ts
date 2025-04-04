// import { Prisma, prisma } from './client';

// // Define the models that should be audited
// const AUDITED_MODELS = [
//   'User',
//   'Organization',
//   'Project',
//   'Website',
//   'Member',
//   'Client',
//   'Subscription',
//   'Post',
//   'Category',
//   'Tag',
//   'EventMeta',
//   'ProjectAccess',
//   'Invite',
// ] as const;

// type AuditedModel = typeof AUDITED_MODELS[number];

// // Define the actions that should be audited
// const AUDIT_ACTIONS = {
//   create: 'CREATE',
//   update: 'UPDATE',
//   delete: 'DELETE',
//   softDelete: 'SOFT_DELETE',
// } as const;

// type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// interface AuditContext {
//   userId?: string;
//   ipAddress?: string;
//   userAgent?: string;
// }

// // Helper to determine if a model should be audited
// const isAuditedModel = (model: string): model is AuditedModel => {
//   return AUDITED_MODELS.includes(model as AuditedModel);
// };

// // Helper to get the action type
// const getAuditAction = (operation: string): AuditAction => {
//   switch (operation) {
//     case 'create':
//       return AUDIT_ACTIONS.create;
//     case 'update':
//       return AUDIT_ACTIONS.update;
//     case 'delete':
//       return AUDIT_ACTIONS.delete;
//     default:
//       return AUDIT_ACTIONS.update;
//   }
// };

// // Helper to detect soft deletes
// const isSoftDelete = (args: any): boolean => {
//   return args?.data?.deletedAt !== undefined;
// };

// // Helper to extract relevant data for audit
// const extractAuditData = (args: any, operation: string): any => {
//   const data: any = {};

//   if (operation === 'create') {
//     data.new = args.data;
//   } else if (operation === 'update') {
//     data.old = args.where;
//     data.new = args.data;
//   } else if (operation === 'delete') {
//     data.old = args.where;
//   }

//   return data;
// };

// // Create the middleware
// export const createAuditMiddleware = (context: AuditContext = {}) => {
//   return async (
//     params: Prisma.MiddlewareParams,
//     next: (params: Prisma.MiddlewareParams) => Promise<any>
//   ) => {
//     const { model, action, args } = params;
    
//     // Skip if model shouldn't be audited
//     if (!model || !isAuditedModel(model)) {
//       return next(params);
//     }

//     // Execute the original operation
//     const result = await next(params);

//     try {
      
//       // Determine the audit action
//       let auditAction = getAuditAction(action);
//       if (action === 'update' && isSoftDelete(args)) {
//         auditAction = AUDIT_ACTIONS.softDelete;
//       }

//       // Extract relevant data
//       const auditData = extractAuditData(args, action);

//       // Create the audit log entry
//       await prisma.auditLog.create({
//         data: {
//           action: auditAction,
//           resourceType: model,
//           resourceId: result?.id || args?.where?.id || 'unknown',
//           details: auditData,
//           userId: context.userId,
//           ipAddress: context.ipAddress,
//           userAgent: context.userAgent,
//         },
//       });
//     } catch (error) {
//       // Log the error but don't block the original operation
//       console.error('Failed to create audit log:', error);
//     }

//     return result;
//   };
// };

// // Export a function to create middleware with context
// export const withAuditContext = (context: AuditContext) => {
//   return {
//     middleware: createAuditMiddleware(context),
//   };
// }; 