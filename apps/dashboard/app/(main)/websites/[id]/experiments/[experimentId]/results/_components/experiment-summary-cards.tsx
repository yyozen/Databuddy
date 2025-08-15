'use client';

import { TrendUpIcon, UsersIcon, CalendarIcon, ChartLineIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { StatCard } from '@/components/analytics';
import type { Experiment } from '@/hooks/use-experiments';

interface ExperimentSummaryCardsProps {
	experiment: Experiment;
}

export function ExperimentSummaryCards({ experiment }: ExperimentSummaryCardsProps) {
	const results = {
		conversionRateControl: 11.1,
		conversionRateVariant: 12.4,
		lift: 11.7,
		confidence: 95,
		sampleSizeControl: 5234,
		sampleSizeVariant: 5189,
		duration: dayjs().diff(dayjs(experiment.createdAt), 'days'),
	};

	const formatNumber = (value: number): string => {
		return Intl.NumberFormat(undefined, {
			notation: 'compact',
			maximumFractionDigits: 1,
		}).format(value);
	};

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
			<StatCard
				title="CONVERSION LIFT"
				value={`+${results.lift}%`}
				description={`${results.conversionRateVariant}% vs ${results.conversionRateControl}%`}
				icon={TrendUpIcon}
				variant="positive"
				className="h-full"
			/>

			<StatCard
				title="CONFIDENCE"
				value={`${results.confidence}%`}
				description="Statistical significance"
				icon={ChartLineIcon}
				className="h-full"
			/>

			<StatCard
				title="SAMPLE SIZE"
				value={formatNumber(results.sampleSizeControl + results.sampleSizeVariant)}
				description={`${formatNumber(results.sampleSizeControl)} / ${formatNumber(results.sampleSizeVariant)}`}
				icon={UsersIcon}
				className="h-full"
			/>

			<StatCard
				title="DURATION"
				value={`${results.duration} days`}
				description={`Since ${dayjs(experiment.createdAt).format('MMM D')}`}
				icon={CalendarIcon}
				className="h-full"
			/>
		</div>
	);
}
