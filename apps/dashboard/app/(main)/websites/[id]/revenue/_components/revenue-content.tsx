"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { ClipboardIcon } from "@phosphor-icons/react/dist/ssr/Clipboard";
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollar";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";
import { StripeLogoIcon } from "@phosphor-icons/react/dist/ssr/StripeLogo";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/analytics/stat-card";
import { SimpleMetricsChart } from "@/components/charts/simple-metrics-chart";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { dynamicQueryFiltersAtom } from "@/stores/jotai/filterAtoms";
import { WebsitePageHeader } from "../../_components/website-page-header";

interface RevenueContentProps {
	websiteId: string;
}

interface RevenueOverview {
	total_revenue: number;
	total_transactions: number;
	refund_amount: number;
	refund_count: number;
	subscription_revenue: number;
	subscription_count: number;
	sale_revenue: number;
	sale_count: number;
}

interface RevenueTimeSeries {
	date: string;
	revenue: number;
	transactions: number;
}

const BASKET_URL =
	process.env.NEXT_PUBLIC_BASKET_URL || "https://basket.databuddy.cc";

const STRIPE_EVENTS = {
	required: ["payment_intent.succeeded", "charge.refunded"],
	optional: [
		"payment_intent.payment_failed",
		"payment_intent.canceled",
		"invoice.payment_succeeded",
	],
};

const PADDLE_EVENTS = {
	required: ["transaction.completed"],
	optional: ["transaction.billed"],
};

function formatCurrency(amount: number, currency = "USD"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function ProviderCard({
	name,
	icon: Icon,
	configured,
	webhookUrl,
	secretValue,
	secretPlaceholder,
	onSecretChange,
	dashboardUrl,
	events,
	onCreateWebhook,
	isCreatingWebhook,
}: {
	name: string;
	icon: React.ComponentType<{ className?: string; weight?: "duotone" }>;
	configured: boolean;
	webhookUrl: string | null;
	secretValue: string;
	secretPlaceholder: string;
	onSecretChange: (value: string) => void;
	dashboardUrl: string;
	events: { required: string[]; optional: string[] };
	onCreateWebhook: () => void;
	isCreatingWebhook: boolean;
}) {
	const [expanded, setExpanded] = useState(!configured);
	const [copied, setCopied] = useState(false);
	const [showSecret, setShowSecret] = useState(false);

	const handleCopy = () => {
		if (webhookUrl) {
			navigator.clipboard.writeText(webhookUrl);
			setCopied(true);
			toast.success("Webhook URL copied");
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const hasWebhookUrl = Boolean(webhookUrl);

	return (
		<div className="overflow-hidden rounded border">
			<button
				className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/50"
				onClick={() => setExpanded(!expanded)}
				type="button"
			>
				<div className="flex items-center gap-2.5">
					<Icon className="size-5 text-muted-foreground" weight="duotone" />
					<span className="font-medium text-sm">{name}</span>
					{configured && (
						<CheckCircleIcon className="size-4 text-success" weight="duotone" />
					)}
				</div>
				<CaretDownIcon
					className={cn(
						"size-4 text-muted-foreground transition-transform duration-200",
						expanded && "rotate-180"
					)}
					weight="fill"
				/>
			</button>

			<AnimatePresence initial={false}>
				{expanded && (
					<motion.div
						animate={{ height: "auto", opacity: 1 }}
						className="overflow-hidden"
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
					>
						<div className="space-y-4 border-t px-4 pt-3 pb-4">
							{/* Step 1: Webhook URL */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<p className="font-medium text-foreground text-xs">
										1. Webhook URL
									</p>
									{hasWebhookUrl && (
										<a
											className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
											href={dashboardUrl}
											rel="noopener noreferrer"
											target="_blank"
										>
											Open dashboard
											<ArrowSquareOutIcon className="size-3" />
										</a>
									)}
								</div>
								{hasWebhookUrl ? (
									<div className="flex items-center gap-2">
										<code className="flex-1 truncate rounded bg-secondary px-2.5 py-2 font-mono text-xs">
											{webhookUrl}
										</code>
										<Button onClick={handleCopy} size="sm" variant="ghost">
											{copied ? (
												<CheckIcon className="size-4 text-success" />
											) : (
												<ClipboardIcon className="size-4" weight="duotone" />
											)}
										</Button>
									</div>
								) : (
									<Button
										className="w-full"
										disabled={isCreatingWebhook}
										onClick={onCreateWebhook}
										size="sm"
										variant="secondary"
									>
										{isCreatingWebhook ? (
											<SpinnerIcon className="mr-2 size-4 animate-spin" />
										) : null}
										Generate Webhook URL
									</Button>
								)}
							</div>

							{/* Step 2: Signing secret */}
							<div className="space-y-1.5">
								<p
									className={cn(
										"font-medium text-xs",
										hasWebhookUrl ? "text-foreground" : "text-muted-foreground"
									)}
								>
									2. Signing secret
								</p>
								<div className="flex items-center gap-2">
									<Input
										className="flex-1 font-mono text-xs"
										disabled={!hasWebhookUrl}
										onChange={(e) => onSecretChange(e.target.value)}
										placeholder={
											hasWebhookUrl
												? configured
													? "••••••••"
													: secretPlaceholder
												: "Generate webhook URL first"
										}
										type={showSecret ? "text" : "password"}
										value={secretValue}
									/>
									<Button
										disabled={!hasWebhookUrl}
										onClick={() => setShowSecret(!showSecret)}
										size="sm"
										variant="ghost"
									>
										{showSecret ? (
											<EyeSlashIcon className="size-4" weight="duotone" />
										) : (
											<EyeIcon className="size-4" weight="duotone" />
										)}
									</Button>
								</div>
							</div>

							{/* Events list */}
							<div className="space-y-3">
								<div className="space-y-1.5">
									<p className="font-medium text-foreground text-xs">
										Required events
									</p>
									<div className="flex flex-wrap gap-1">
										{events.required.map((event) => (
											<code
												className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary"
												key={event}
											>
												{event}
											</code>
										))}
									</div>
								</div>
								{events.optional.length > 0 && (
									<div className="space-y-1.5">
										<p className="text-muted-foreground text-xs">
											Optional events
										</p>
										<div className="flex flex-wrap gap-1">
											{events.optional.map((event) => (
												<code
													className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
													key={event}
												>
													{event}
												</code>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function RevenueSettingsSheet({
	websiteId,
	open,
	onOpenChangeAction,
}: {
	websiteId: string;
	open: boolean;
	onOpenChangeAction: (open: boolean) => void;
}) {
	const queryClient = useQueryClient();
	const [stripeSecret, setStripeSecret] = useState("");
	const [paddleSecret, setPaddleSecret] = useState("");

	const { data: config, isLoading } = useQuery({
		queryKey: ["revenue-config", websiteId],
		queryFn: () => orpc.revenue.get.call({ websiteId }),
	});

	const createWebhookMutation = useMutation({
		mutationFn: () => orpc.revenue.upsert.call({ websiteId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["revenue-config", websiteId],
			});
			toast.success("Webhook URL generated");
		},
		onError: () => toast.error("Failed to generate webhook URL"),
	});

	const upsertMutation = useMutation({
		mutationFn: (data: {
			stripeWebhookSecret?: string;
			paddleWebhookSecret?: string;
		}) => orpc.revenue.upsert.call({ websiteId, ...data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["revenue-config", websiteId],
			});
			setStripeSecret("");
			setPaddleSecret("");
			toast.success("Configuration saved");
		},
		onError: () => toast.error("Failed to save"),
	});

	const regenerateMutation = useMutation({
		mutationFn: () => orpc.revenue.regenerateHash.call({ websiteId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["revenue-config", websiteId],
			});
			toast.success("Webhook URLs regenerated");
		},
		onError: () => toast.error("Failed to regenerate"),
	});

	const handleSave = () => {
		const updates: {
			stripeWebhookSecret?: string;
			paddleWebhookSecret?: string;
		} = {};
		if (stripeSecret) {
			updates.stripeWebhookSecret = stripeSecret;
		}
		if (paddleSecret) {
			updates.paddleWebhookSecret = paddleSecret;
		}
		if (Object.keys(updates).length > 0) {
			upsertMutation.mutate(updates);
		}
	};

	const webhookHash = config?.webhookHash;
	const stripeUrl = webhookHash
		? `${BASKET_URL}/webhooks/stripe/${webhookHash}`
		: null;
	const paddleUrl = webhookHash
		? `${BASKET_URL}/webhooks/paddle/${webhookHash}`
		: null;

	return (
		<Sheet onOpenChange={onOpenChangeAction} open={open}>
			<SheetContent className="sm:max-w-lg">
				<SheetHeader>
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded border bg-secondary">
							<CurrencyDollarIcon
								className="size-5 text-primary"
								weight="duotone"
							/>
						</div>
						<div>
							<SheetTitle>Revenue Tracking</SheetTitle>
							<SheetDescription>
								Connect your payment providers via webhooks
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<SheetBody className="space-y-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<SpinnerIcon className="size-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<>
							<ProviderCard
								configured={config?.stripeConfigured ?? false}
								dashboardUrl="https://dashboard.stripe.com/webhooks/create"
								events={STRIPE_EVENTS}
								icon={StripeLogoIcon}
								isCreatingWebhook={createWebhookMutation.isPending}
								name="Stripe"
								onCreateWebhook={() => createWebhookMutation.mutate()}
								onSecretChange={setStripeSecret}
								secretPlaceholder="whsec_..."
								secretValue={stripeSecret}
								webhookUrl={stripeUrl}
							/>

							<ProviderCard
								configured={config?.paddleConfigured ?? false}
								dashboardUrl="https://vendors.paddle.com/notifications"
								events={PADDLE_EVENTS}
								icon={CurrencyDollarIcon}
								isCreatingWebhook={createWebhookMutation.isPending}
								name="Paddle"
								onCreateWebhook={() => createWebhookMutation.mutate()}
								onSecretChange={setPaddleSecret}
								secretPlaceholder="pdl_ntfset_..."
								secretValue={paddleSecret}
								webhookUrl={paddleUrl}
							/>

							{webhookHash && (
								<button
									className="flex w-full items-center justify-center gap-1.5 py-2 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:opacity-50"
									disabled={regenerateMutation.isPending}
									onClick={() => regenerateMutation.mutate()}
									type="button"
								>
									{regenerateMutation.isPending ? (
										<SpinnerIcon className="size-3 animate-spin" />
									) : (
										<ArrowClockwiseIcon className="size-3" />
									)}
									Regenerate webhook URLs
								</button>
							)}
						</>
					)}
				</SheetBody>

				<SheetFooter>
					<Button
						onClick={() => onOpenChangeAction(false)}
						type="button"
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						className="min-w-24"
						disabled={
							upsertMutation.isPending ||
							!webhookHash ||
							(stripeSecret === "" && paddleSecret === "")
						}
						onClick={handleSave}
					>
						{upsertMutation.isPending ? (
							<SpinnerIcon className="size-4 animate-spin" />
						) : (
							"Save"
						)}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

export function RevenueContent({ websiteId }: RevenueContentProps) {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const { dateRange } = useDateFilters();
	const [filters] = useAtom(dynamicQueryFiltersAtom);

	const { data: config } = useQuery({
		queryKey: ["revenue-config", websiteId],
		queryFn: () => orpc.revenue.get.call({ websiteId }),
	});

	const queries = [
		{ id: "revenue-overview", parameters: ["revenue_overview"], filters },
		{ id: "revenue-time-series", parameters: ["revenue_time_series"], filters },
	];

	const { isLoading, getDataForQuery } = useBatchDynamicQuery(
		websiteId,
		dateRange,
		queries
	);

	const overviewData = (getDataForQuery(
		"revenue-overview",
		"revenue_overview"
	) ?? []) as RevenueOverview[];
	const timeSeriesData = (getDataForQuery(
		"revenue-time-series",
		"revenue_time_series"
	) ?? []) as RevenueTimeSeries[];

	const overview = overviewData[0];
	const hasData = overview && overview.total_transactions > 0;
	const isConfigured = config?.stripeConfigured || config?.paddleConfigured;

	const chartData = useMemo(() => {
		if (timeSeriesData.length === 0) {
			return [];
		}
		return timeSeriesData.map((row) => ({
			date: row.date,
			Revenue: row.revenue,
		}));
	}, [timeSeriesData]);

	const chartMetrics = useMemo(
		() => [
			{
				key: "Revenue",
				label: "Revenue",
				color: "#10b981",
				formatValue: formatCurrency,
			},
		],
		[]
	);

	const netRevenue = overview
		? overview.total_revenue + overview.refund_amount
		: 0;

	const getSubtitle = () => {
		if (isConfigured) {
			const providers: string[] = [];
			if (config?.stripeConfigured) {
				providers.push("Stripe");
			}
			if (config?.paddleConfigured) {
				providers.push("Paddle");
			}
			return `Connected to ${providers.join(" & ")}`;
		}
		return "Not configured";
	};

	return (
		<>
			<WebsitePageHeader
				additionalActions={
					<Button onClick={() => setSettingsOpen(true)} variant="outline">
						<GearIcon className="mr-2 size-4" weight="duotone" />
						Configure
					</Button>
				}
				description="Track revenue from Stripe and Paddle"
				docsUrl="https://databuddy.cc/docs/revenue"
				icon={<CurrencyDollarIcon />}
				isLoading={isLoading}
				subtitle={getSubtitle()}
				title="Revenue"
				websiteId={websiteId}
			/>

			{isLoading || hasData ? (
				<div className="space-y-4 p-4">
					<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
						<StatCard
							chartData={chartData.map((d) => ({
								date: d.date,
								value: d.Revenue,
							}))}
							chartType="area"
							formatChartValue={formatCurrency}
							icon={CurrencyDollarIcon}
							id="net-revenue"
							isLoading={isLoading}
							showChart
							title="Net Revenue"
							value={formatCurrency(netRevenue)}
						/>
						<StatCard
							icon={TrendUpIcon}
							id="gross-revenue"
							isLoading={isLoading}
							title="Gross Revenue"
							value={formatCurrency(overview?.total_revenue ?? 0)}
						/>
						<StatCard
							description={`${overview?.subscription_count ?? 0} active`}
							icon={ChartLineUpIcon}
							id="subscriptions"
							isLoading={isLoading}
							title="Subscriptions"
							value={formatCurrency(overview?.subscription_revenue ?? 0)}
						/>
						<StatCard
							description={`${overview?.refund_count ?? 0} refunds`}
							icon={TrendUpIcon}
							id="refunds"
							invertTrend
							isLoading={isLoading}
							title="Refunds"
							value={formatCurrency(Math.abs(overview?.refund_amount ?? 0))}
						/>
					</div>

					{chartData.length > 0 && (
						<SimpleMetricsChart
							data={chartData}
							description="Revenue over time"
							height={300}
							isLoading={isLoading}
							metrics={chartMetrics}
							title="Revenue Trend"
						/>
					)}

					<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
						<StatCard
							icon={ChartLineUpIcon}
							id="total-transactions"
							isLoading={isLoading}
							title="Total Transactions"
							value={overview?.total_transactions ?? 0}
						/>
						<StatCard
							description={`${overview?.sale_count ?? 0} sales`}
							icon={CurrencyDollarIcon}
							id="one-time-sales"
							isLoading={isLoading}
							title="One-time Sales"
							value={formatCurrency(overview?.sale_revenue ?? 0)}
						/>
						<StatCard
							icon={TrendUpIcon}
							id="avg-transaction"
							isLoading={isLoading}
							title="Avg Transaction"
							value={
								overview && overview.total_transactions > 0
									? formatCurrency(
											overview.total_revenue / overview.total_transactions
										)
									: "$0"
							}
						/>
					</div>
				</div>
			) : (
				<EmptyState
					action={{
						label: "Configure Webhooks",
						onClick: () => setSettingsOpen(true),
					}}
					description={
						isConfigured
							? "Revenue data will appear here once transactions are processed through your payment provider webhooks."
							: "Connect Stripe or Paddle to start tracking revenue from your payment providers."
					}
					icon={<CurrencyDollarIcon />}
					showPlusBadge={false}
					title={
						isConfigured ? "No revenue data yet" : "Set up revenue tracking"
					}
				/>
			)}

			<RevenueSettingsSheet
				onOpenChangeAction={setSettingsOpen}
				open={settingsOpen}
				websiteId={websiteId}
			/>
		</>
	);
}
