"use client";

import { DownloadIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { RightSidebar } from "@/components/right-sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SettingsRow, SettingsSection } from "../_components/settings-section";

export default function PrivacySettingsPage() {
	const [retentionPeriod, setRetentionPeriod] = useState("forever");
	const [trackingConsent, setTrackingConsent] = useState(true);
	const [anonymousAnalytics, setAnonymousAnalytics] = useState(true);

	return (
		<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
			<div className="flex flex-col">
				<div className="flex-1 overflow-y-auto">
					{/* Data Retention */}
					<SettingsSection
						description="Control how long your data is stored"
						title="Data Retention"
					>
						<div className="space-y-2">
							<Label htmlFor="retention">Retention Period</Label>
							<Select
								onValueChange={setRetentionPeriod}
								value={retentionPeriod}
							>
								<SelectTrigger className="w-full sm:w-64" id="retention">
									<SelectValue placeholder="Select period…" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="30days">30 days</SelectItem>
									<SelectItem value="90days">90 days</SelectItem>
									<SelectItem value="1year">1 year</SelectItem>
									<SelectItem value="2years">2 years</SelectItem>
									<SelectItem value="forever">Forever</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-muted-foreground text-xs">
								Analytics data older than this period will be automatically
								deleted.
							</p>
						</div>
					</SettingsSection>

					{/* Consent */}
					<SettingsSection
						description="Manage your tracking preferences"
						title="Consent & Tracking"
					>
						<div className="space-y-4">
							<SettingsRow
								description="Allow us to collect usage data to improve your experience"
								label="Tracking Consent"
							>
								<Switch
									checked={trackingConsent}
									onCheckedChange={setTrackingConsent}
								/>
							</SettingsRow>

							<SettingsRow
								description="Help improve Databuddy by sharing anonymous usage statistics"
								label="Anonymous Analytics for Databuddy"
							>
								<Switch
									checked={anonymousAnalytics}
									onCheckedChange={setAnonymousAnalytics}
								/>
							</SettingsRow>
						</div>
					</SettingsSection>

					{/* Data Actions */}
					<SettingsSection
						description="Export or delete your personal data"
						title="Your Data"
					>
						<div className="space-y-4">
							<SettingsRow
								description="Download a copy of all your personal data"
								label="Export My Data"
							>
								<Button size="sm" variant="outline">
									<DownloadIcon className="mr-2 size-4" />
									Export
								</Button>
							</SettingsRow>

							<SettingsRow
								description="Permanently delete your account and all associated data"
								label="Delete My Data"
							>
								<Button size="sm" variant="destructive">
									<TrashIcon className="mr-2 size-4" />
									Delete
								</Button>
							</SettingsRow>
						</div>
					</SettingsSection>

					{/* Warning */}
					<div className="border-b px-5 py-4">
						<div className="flex items-start gap-3 rounded border border-amber-500/30 bg-amber-500/10 p-3">
							<WarningIcon className="mt-0.5 size-5 shrink-0 text-amber-600" />
							<div>
								<p className="font-medium text-amber-800 text-sm dark:text-amber-200">
									Data deletion is permanent
								</p>
								<p className="text-amber-700 text-xs dark:text-amber-300">
									Once deleted, your data cannot be recovered. This includes all
									analytics, settings, and account information.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<RightSidebar className="gap-0 p-0">
				<RightSidebar.Section border title="Your Privacy">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Data retention
							</span>
							<span className="font-medium text-sm">
								{retentionPeriod === "forever" ? "Forever" : retentionPeriod}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Tracking</span>
							<span className="font-medium text-sm">
								{trackingConsent ? "Enabled" : "Disabled"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Anonymous stats
							</span>
							<span className="font-medium text-sm">
								{anonymousAnalytics ? "Enabled" : "Disabled"}
							</span>
						</div>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section border title="Data Protection">
					<div className="space-y-2 text-muted-foreground text-sm">
						<p>Your data is encrypted at rest and in transit using AES-256.</p>
						<p>We comply with GDPR and CCPA regulations.</p>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section>
					<RightSidebar.Tip description="We take your privacy seriously. You can export or delete your data at any time." />
				</RightSidebar.Section>
			</RightSidebar>
		</div>
	);
}
