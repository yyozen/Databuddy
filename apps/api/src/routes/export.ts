import { Elysia, t } from 'elysia';
import { logger } from '../lib/logger';
import { processExport, type ExportRequest } from '../lib/export';
import { createRateLimitMiddleware } from '../middleware/rate-limit';
import { auth } from '@databuddy/auth';
import { getCachedWebsite } from '../lib/website-utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

// Rate limiting for exports - use expensive rate limit (stricter limits)
const exportRateLimit = createRateLimitMiddleware({
	type: 'expensive',
	skipAuth: false,
});

export const exportRoute = new Elysia({ prefix: '/v1/export' })
	.use(exportRateLimit)
	.post(
		'/data',
		async ({ body, request }) => {
			const startTime = Date.now();
			const requestId = Math.random().toString(36).slice(2, 12);

			try {
				const websiteId = body.website_id;
				
				if (!websiteId) {
					logger.warn('Export request missing website_id', {
						requestId,
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					});
					return new Response(
						JSON.stringify({
							success: false,
							error: 'Website ID is required',
							code: 'MISSING_WEBSITE_ID',
						}),
						{ 
							status: 400,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}

				// Get user session
				const session = await auth.api.getSession({ headers: request.headers });
				const user = session?.user;

				if (!user) {
					logger.warn('Export request without authentication', {
						requestId,
						websiteId,
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					});
					return new Response(
						JSON.stringify({
							success: false,
							error: 'Authentication required',
							code: 'AUTH_REQUIRED',
						}),
						{ 
							status: 401,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}

				// Get website and verify ownership
				const website = await getCachedWebsite(websiteId);
				if (!website) {
					logger.warn('Export request for non-existent website', {
						requestId,
						websiteId,
						userId: user.id,
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					});
					return new Response(
						JSON.stringify({
							success: false,
							error: 'Website not found',
							code: 'WEBSITE_NOT_FOUND',
						}),
						{ 
							status: 404,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}

				// Check if user owns the website (assuming website has userId field)
				if (website.userId !== user.id) {
					logger.warn('Export request for unauthorized website', {
						requestId,
						websiteId,
						userId: user.id,
						websiteOwnerId: website.userId,
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					});
					return new Response(
						JSON.stringify({
							success: false,
							error: 'Access denied. You may not have permission to export data for this website.',
							code: 'ACCESS_DENIED',
						}),
						{ 
							status: 403,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}

				// Validate and sanitize date inputs
				const { validatedDates, error: dateError } = validateDateRange(
					body.start_date,
					body.end_date
				);
				
				if (dateError) {
					logger.warn('Export request with invalid dates', {
						requestId,
						websiteId,
						userId: user.id,
						startDate: body.start_date,
						endDate: body.end_date,
						error: dateError,
					});
					return new Response(
						JSON.stringify({
							success: false,
							error: dateError,
							code: 'INVALID_DATE_RANGE',
						}),
						{ 
							status: 400,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}

				// Validate export format
				const format = body.format || 'json';
				if (!['csv', 'json', 'txt', 'proto'].includes(format)) {
					logger.warn('Export request with invalid format', {
						requestId,
						websiteId,
						userId: user.id,
						format,
					});
					return new Response(
						JSON.stringify({
							success: false,
							error: 'Invalid export format. Supported formats: csv, json, txt, proto',
							code: 'INVALID_FORMAT',
						}),
						{ 
							status: 400,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}

				// Log export initiation for audit trail
				logger.info('Data export initiated', {
					requestId,
					websiteId,
					userId: user.id,
					userEmail: user.email,
					startDate: validatedDates.startDate,
					endDate: validatedDates.endDate,
					format,
					userAgent: request.headers.get('user-agent'),
					ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					timestamp: new Date().toISOString(),
				});

				// Process the export with validated data
				const exportRequest: ExportRequest = {
					website_id: websiteId,
					start_date: validatedDates.startDate,
					end_date: validatedDates.endDate,
					format: format as ExportRequest['format'],
				};

				const result = await processExport(exportRequest);

				// Log successful export for audit trail
				logger.info('Data export completed successfully', {
					requestId,
					websiteId,
					userId: user.id,
					userEmail: user.email,
					filename: result.filename,
					fileSize: result.buffer.length,
					totalRecords: result.metadata.totalRecords,
					processingTime: Date.now() - startTime,
					timestamp: new Date().toISOString(),
				});

				return new Response(result.buffer, {
					headers: {
						'Content-Type': 'application/zip',
						'Content-Disposition': `attachment; filename="${result.filename}"`,
						'Content-Length': result.buffer.length.toString(),
					},
				});

			} catch (error) {
				// Log export failure for audit trail
				logger.error('Data export failed', {
					requestId,
					websiteId: body.website_id,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					processingTime: Date.now() - startTime,
					userAgent: request.headers.get('user-agent'),
					ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					timestamp: new Date().toISOString(),
				});

				return new Response(
					JSON.stringify({
						success: false,
						error: 'Export failed. Please try again later.',
						code: 'EXPORT_FAILED',
						requestId,
					}),
					{ 
						status: 500,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			}
		},
		{
			body: t.Object({
				website_id: t.String({
					minLength: 1,
					maxLength: 100,
					pattern: '^[a-zA-Z0-9_-]+$',
					error: 'Website ID must be alphanumeric with dashes/underscores only'
				}),
				start_date: t.Optional(t.String({
					pattern: '^\\d{4}-\\d{2}-\\d{2}$',
					error: 'Start date must be in YYYY-MM-DD format'
				})),
				end_date: t.Optional(t.String({
					pattern: '^\\d{4}-\\d{2}-\\d{2}$',
					error: 'End date must be in YYYY-MM-DD format'
				})),
				format: t.Optional(t.Union([
					t.Literal('csv'), 
					t.Literal('json'), 
					t.Literal('txt'), 
					t.Literal('proto')
				], {
					error: 'Format must be one of: csv, json, txt, proto'
				})),
			}),
		}
	);

/**
 * Validates and sanitizes date range inputs
 * Prevents SQL injection and ensures reasonable date ranges
 */
function validateDateRange(startDate?: string, endDate?: string): {
	validatedDates: { startDate?: string; endDate?: string };
	error?: string;
} {
	const now = dayjs.utc();
	const maxHistoryDays = 365 * 2; // 2 years max
	const maxRangeDays = 365; // 1 year max range

	// If no dates provided, allow (will default to reasonable limits in query)
	if (!startDate && !endDate) {
		return { validatedDates: {} };
	}

	let validatedStartDate: string | undefined;
	let validatedEndDate: string | undefined;

	// Validate start date
	if (startDate) {
		const start = dayjs.utc(startDate, 'YYYY-MM-DD', true);
		if (!start.isValid()) {
			return { validatedDates: {}, error: 'Invalid start date format. Use YYYY-MM-DD.' };
		}
		if (start.isAfter(now)) {
			return { validatedDates: {}, error: 'Start date cannot be in the future.' };
		}
		if (start.isBefore(now.subtract(maxHistoryDays, 'day'))) {
			return { validatedDates: {}, error: `Start date cannot be more than ${maxHistoryDays} days ago.` };
		}
		validatedStartDate = start.format('YYYY-MM-DD');
	}

	// Validate end date
	if (endDate) {
		const end = dayjs.utc(endDate, 'YYYY-MM-DD', true);
		if (!end.isValid()) {
			return { validatedDates: {}, error: 'Invalid end date format. Use YYYY-MM-DD.' };
		}
		if (end.isAfter(now)) {
			return { validatedDates: {}, error: 'End date cannot be in the future.' };
		}
		if (end.isBefore(now.subtract(maxHistoryDays, 'day'))) {
			return { validatedDates: {}, error: `End date cannot be more than ${maxHistoryDays} days ago.` };
		}
		validatedEndDate = end.format('YYYY-MM-DD');
	}

	// Validate date range
	if (validatedStartDate && validatedEndDate) {
		const start = dayjs.utc(validatedStartDate);
		const end = dayjs.utc(validatedEndDate);
		
		if (start.isAfter(end)) {
			return { validatedDates: {}, error: 'Start date must be before or equal to end date.' };
		}
		
		const rangeDays = end.diff(start, 'day');
		if (rangeDays > maxRangeDays) {
			return { validatedDates: {}, error: `Date range cannot exceed ${maxRangeDays} days.` };
		}
	}

	return {
		validatedDates: {
			startDate: validatedStartDate,
			endDate: validatedEndDate,
		},
	};
}