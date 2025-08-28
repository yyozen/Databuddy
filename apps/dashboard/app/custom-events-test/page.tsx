'use client';

import { useState } from 'react';
import { sendBatchCustomEvents, sendCustomEvent } from './actions';

export default function CustomEventsTestPage() {
	const generateRandomId = () => Math.random().toString(36).substring(2, 15);
	const generateRandomSessionId = () => `session_${generateRandomId()}`;
	const generateRandomAnonymousId = () => `anon_${generateRandomId()}`;

	const [formData, setFormData] = useState({
		clientId: 'OXmNQsViBT-FOS_wZCTHc',
		name: 'test_event',
		anonymousId: generateRandomAnonymousId(),
		sessionId: generateRandomSessionId(),
		properties: JSON.stringify(
			{
				value: Math.floor(Math.random() * 1000),
				currency: 'USD',
				category: 'test',
				source: 'dashboard',
			},
			null,
			2
		),
	});

	const [batchData, setBatchData] = useState(() =>
		JSON.stringify(
			[
				{
					name: 'purchase',
					anonymousId: generateRandomAnonymousId(),
					sessionId: generateRandomSessionId(),
					timestamp: Date.now(),
					properties: {
						value: Math.floor(Math.random() * 500) + 50,
						currency: 'USD',
						product_id: `prod_${generateRandomId()}`,
						category: 'ecommerce',
					},
				},
				{
					name: 'signup',
					anonymousId: generateRandomAnonymousId(),
					sessionId: generateRandomSessionId(),
					timestamp: Date.now(),
					properties: {
						plan: 'premium',
						source: 'landing_page',
						campaign: 'summer_promo',
					},
				},
			],
			null,
			2
		)
	);

	const [response, setResponse] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

	const regenerateRandomData = () => {
		if (activeTab === 'single') {
			setFormData({
				...formData,
				anonymousId: generateRandomAnonymousId(),
				sessionId: generateRandomSessionId(),
				properties: JSON.stringify(
					{
						value: Math.floor(Math.random() * 1000),
						currency: 'USD',
						category: 'test',
						source: 'dashboard',
						timestamp: new Date().toISOString(),
					},
					null,
					2
				),
			});
		} else {
			setBatchData(
				JSON.stringify(
					[
						{
							name: 'purchase',
							anonymousId: generateRandomAnonymousId(),
							sessionId: generateRandomSessionId(),
							timestamp: Date.now(),
							properties: {
								value: Math.floor(Math.random() * 500) + 50,
								currency: 'USD',
								product_id: `prod_${generateRandomId()}`,
								category: 'ecommerce',
							},
						},
						{
							name: 'signup',
							anonymousId: generateRandomAnonymousId(),
							sessionId: generateRandomSessionId(),
							timestamp: Date.now(),
							properties: {
								plan: ['free', 'premium', 'enterprise'][
									Math.floor(Math.random() * 3)
								],
								source: ['landing_page', 'email', 'social'][
									Math.floor(Math.random() * 3)
								],
								campaign: `campaign_${generateRandomId()}`,
							},
						},
					],
					null,
					2
				)
			);
		}
		setResponse(null); // Clear previous response
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			if (activeTab === 'single') {
				const result = await sendCustomEvent({
					clientId: formData.clientId,
					name: formData.name,
					anonymousId: formData.anonymousId || undefined,
					sessionId: formData.sessionId || undefined,
					properties: formData.properties
						? JSON.parse(formData.properties)
						: undefined,
				});
				setResponse(result);
			} else {
				const batchEvents = JSON.parse(batchData);
				const result = await sendBatchCustomEvents(
					formData.clientId,
					batchEvents
				);
				setResponse(result);
			}
		} catch (error) {
			setResponse({
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="mb-6 font-bold text-2xl">Custom Events Test</h1>

			{/* Tabs */}
			<div className="mb-6 border-b">
				<div className="flex space-x-4">
					<button
						className={`border-b-2 px-4 py-2 font-medium text-sm ${
							activeTab === 'single'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'
						}`}
						onClick={() => setActiveTab('single')}
						type="button"
					>
						Single Event
					</button>
					<button
						className={`border-b-2 px-4 py-2 font-medium text-sm ${
							activeTab === 'batch'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'
						}`}
						onClick={() => setActiveTab('batch')}
						type="button"
					>
						Batch Events
					</button>
				</div>
			</div>

			<form className="space-y-4" onSubmit={handleSubmit}>
				<div>
					<label className="mb-1 block font-medium text-sm" htmlFor="clientId">
						Client ID *
					</label>
					<input
						className="w-full rounded border p-2"
						id="clientId"
						onChange={(e) =>
							setFormData({ ...formData, clientId: e.target.value })
						}
						placeholder="web_123"
						required
						type="text"
						value={formData.clientId}
					/>
				</div>

				{activeTab === 'single' ? (
					<>
						<div>
							<label className="mb-1 block font-medium text-sm" htmlFor="name">
								Event Name *
							</label>
							<input
								className="w-full rounded border p-2"
								id="name"
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="purchase"
								required
								type="text"
								value={formData.name}
							/>
						</div>

						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="anonymousId"
							>
								Anonymous ID
							</label>
							<input
								className="w-full rounded border p-2"
								id="anonymousId"
								onChange={(e) =>
									setFormData({ ...formData, anonymousId: e.target.value })
								}
								placeholder="anon_user_123"
								type="text"
								value={formData.anonymousId}
							/>
						</div>

						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="sessionId"
							>
								Session ID
							</label>
							<input
								className="w-full rounded border p-2"
								id="sessionId"
								onChange={(e) =>
									setFormData({ ...formData, sessionId: e.target.value })
								}
								placeholder="session_456"
								type="text"
								value={formData.sessionId}
							/>
						</div>

						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="properties"
							>
								Properties (JSON)
							</label>
							<textarea
								className="h-24 w-full rounded border p-2"
								id="properties"
								onChange={(e) =>
									setFormData({ ...formData, properties: e.target.value })
								}
								placeholder='{"value": 99.99, "currency": "USD", "product_id": "prod_123"}'
								value={formData.properties}
							/>
						</div>
					</>
				) : (
					<div>
						<label
							className="mb-1 block font-medium text-sm"
							htmlFor="batchEvents"
						>
							Batch Events (JSON Array) *
						</label>
						<textarea
							className="h-64 w-full rounded border p-2 font-mono text-sm"
							id="batchEvents"
							onChange={(e) => setBatchData(e.target.value)}
							placeholder={`[
  {
    "name": "purchase",
    "anonymousId": "anon_user_123",
    "sessionId": "session_456",
    "timestamp": 1704067200000,
    "properties": {
      "value": 99.99,
      "currency": "USD",
      "product_id": "prod_123"
    }
  },
  {
    "name": "signup",
    "anonymousId": "anon_user_124",
    "sessionId": "session_457",
    "properties": {
      "plan": "premium",
      "source": "landing_page"
    }
  }
]`}
							required
							value={batchData}
						/>
					</div>
				)}

				<div className="flex gap-4">
					<button
						className="flex-1 rounded border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
						disabled={loading}
						onClick={regenerateRandomData}
						type="button"
					>
						🔄 Regenerate Random Data
					</button>
					<button
						className="flex-1 rounded bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
						disabled={loading}
						type="submit"
					>
						{loading
							? 'Sending...'
							: activeTab === 'single'
								? 'Send Custom Event'
								: 'Send Batch Custom Events'}
					</button>
				</div>
			</form>

			{response && (
				<div className="mt-6">
					<h2 className="mb-2 font-semibold text-lg">Response:</h2>
					<pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
						{JSON.stringify(response, null, 2)}
					</pre>
				</div>
			)}

			<div className="mt-6 text-gray-600 text-sm">
				{activeTab === 'single' ? (
					<>
						<h3 className="mb-2 font-medium">Single Event API Endpoint:</h3>
						<code className="block rounded bg-gray-100 p-2">
							POST basket.databuddy.cc/?client_id={'{website_id}'}
						</code>

						<h3 className="mt-4 mb-2 font-medium">Example Request:</h3>
						<pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
							{`{
  "type": "custom",
  "name": "purchase",
  "anonymousId": "anon_user_123",
  "sessionId": "session_456",
  "timestamp": 1704067200000,
  "properties": {
    "value": 99.99,
    "currency": "USD",
    "product_id": "prod_123"
  }
}`}
						</pre>
					</>
				) : (
					<>
						<h3 className="mb-2 font-medium">Batch Events API Endpoint:</h3>
						<code className="block rounded bg-gray-100 p-2">
							POST basket.databuddy.cc/batch?client_id={'{website_id}'}
						</code>

						<h3 className="mt-4 mb-2 font-medium">Example Request:</h3>
						<pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
							{`[
  {
    "type": "custom",
    "name": "purchase",
    "anonymousId": "anon_user_123",
    "sessionId": "session_456",
    "timestamp": 1704067200000,
    "properties": {
      "value": 99.99,
      "currency": "USD",
      "product_id": "prod_123"
    }
  },
  {
    "type": "custom",
    "name": "signup",
    "anonymousId": "anon_user_124",
    "sessionId": "session_457",
    "properties": {
      "plan": "premium",
      "source": "landing_page"
    }
  }
]`}
						</pre>
					</>
				)}
			</div>
		</div>
	);
}
