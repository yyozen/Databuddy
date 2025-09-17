'use client';

import { useFlags } from '@databuddy/sdk/react';

export function TestFlags() {
	const { isEnabled } = useFlags();

	const testFlag = isEnabled('test-123');

	return (
		<div className="space-y-4 rounded border p-4">
			<h3 className="font-medium">Feature Flags Test</h3>
			<div className="space-y-2 text-sm">
				<div>
					<span className="font-medium">test-123:</span>{' '}
					<span className={testFlag ? 'text-green-600' : 'text-red-600'}>
						{testFlag ? 'Enabled' : 'Disabled'}
					</span>
				</div>
			</div>
		</div>
	);
}
