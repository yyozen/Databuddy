'use client';

import { PauseIcon, DownloadIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Experiment } from '@/hooks/use-experiments';

interface ExperimentResultsHeaderProps {
	experiment: Experiment;
	onDeclareWinner: () => void;
	onPauseExperiment: () => void;
	onExportResults: () => void;
}

export function ExperimentResultsHeader({
	experiment,
	onDeclareWinner,
	onPauseExperiment,
	onExportResults,
}: ExperimentResultsHeaderProps) {
	const isRunning = experiment.status === 'running';
	const confidence = 95; // Mock data - would come from actual results
	const hasWinner = confidence >= 95;

	return (
		<div className="flex items-center gap-3">
			<div className="flex items-center gap-2">
				<Badge variant={isRunning ? 'default' : 'outline'}>
					{experiment.status}
				</Badge>
				{hasWinner && (
					<Badge variant="secondary">
						95% Confident
					</Badge>
				)}
			</div>

			<div className="flex items-center gap-2">
				{isRunning && (
					<Button size="sm" variant="outline" onClick={onPauseExperiment}>
						<PauseIcon className="mr-2 h-4 w-4" size={16} />
						Pause
					</Button>
				)}

				<Button size="sm" variant="ghost" onClick={onExportResults}>
					<DownloadIcon className="mr-2 h-4 w-4" size={16} />
					Export
				</Button>
			</div>
		</div>
	);
}
