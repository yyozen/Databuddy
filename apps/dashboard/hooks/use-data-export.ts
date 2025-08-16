import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export type ExportFormat = 'json' | 'csv' | 'txt' | 'proto';

interface UseDataExportOptions {
	websiteId: string;
	websiteName?: string;
}

interface ExportParams {
	format: ExportFormat;
	startDate?: string;
	endDate?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useDataExport({ websiteId, websiteName }: UseDataExportOptions) {
	const [isExporting, setIsExporting] = useState(false);

	const exportData = useCallback(async ({ format = 'csv', startDate, endDate }: ExportParams) => {
		setIsExporting(true);
		
		try {
			const response = await fetch(`${API_BASE_URL}/v1/export/data`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					website_id: websiteId,
					format,
					start_date: startDate,
					end_date: endDate,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Export failed');
			}

			// Get filename from response headers if available
			const contentDisposition = response.headers.get('Content-Disposition');
			let filename = `${websiteName || 'website'}-export-${new Date().toISOString().split('T')[0]}.zip`;
			
			if (contentDisposition) {
				const filenameMatch = contentDisposition.match(/filename="(.+)"/);
				if (filenameMatch) {
					filename = filenameMatch[1];
				}
			}

			// Create blob and trigger download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			
			// Cleanup
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success('Data exported successfully!');
			return { success: true, filename };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Export failed';
			toast.error(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			setIsExporting(false);
		}
	}, [websiteId, websiteName]);

	return {
		exportData,
		isExporting,
	};
}
