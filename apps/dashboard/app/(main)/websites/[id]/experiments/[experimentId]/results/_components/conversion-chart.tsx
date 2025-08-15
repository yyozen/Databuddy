'use client';

import { ChartLineIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { MetricsChart } from '@/components/charts/metrics-chart';
import type { Experiment } from '@/hooks/use-experiments';

interface ConversionChartProps {
	experiment: Experiment;
}

// Mock data generator following the same pattern as overview-tab
const generateTimeSeriesData = (startDate: Date, days: number) => {
	const data = [];
	for (let i = 0; i < days; i++) {
		const date = dayjs(startDate).add(i, 'day');
		// Simulate conversion rates with some variance
		const controlRate = 11.1 + (Math.random() - 0.5) * 2;
		const variantRate = 12.4 + (Math.random() - 0.5) * 2;
		
		data.push({
			date: date.format('YYYY-MM-DD'),
			control: Number(controlRate.toFixed(1)),
			variant: Number(variantRate.toFixed(1)),
		});
	}
	return data;
};

export function ConversionChart({ experiment }: ConversionChartProps) {
	const days = dayjs().diff(dayjs(experiment.createdAt), 'days') || 1;
	const data = generateTimeSeriesData(new Date(experiment.createdAt), Math.min(days, 30));

	return (
		<div className="rounded border bg-card shadow-sm">
			<div className="flex flex-col items-start justify-between gap-3 border-b p-4 sm:flex-row">
				<div>
					<h2 className="font-semibold text-lg tracking-tight">
						Conversion Rates
					</h2>
					<p className="text-muted-foreground text-sm">
						Daily conversion rates for control vs variant
					</p>
				</div>
			</div>
			<div>
				<MetricsChart data={data} height={350} isLoading={false} />
			</div>
		</div>
	);
}
