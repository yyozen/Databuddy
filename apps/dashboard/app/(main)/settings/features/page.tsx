"use client";

import { RocketIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { RightSidebar } from "@/components/right-sidebar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SettingsRow, SettingsSection } from "../_components/settings-section";

export default function FeaturesSettingsPage() {
	const [earlyAccess, setEarlyAccess] = useState(false);
	const [betaUI, setBetaUI] = useState(false);
	const [experimentalPerformance, setExperimentalPerformance] = useState(false);

	return (
		<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
			<div className="flex flex-col">
				<div className="flex-1 overflow-y-auto">
					{/* Early Access */}
					<SettingsSection
						description="Get access to new features before they're released"
						title="Early Access Program"
					>
						<div className="space-y-4">
							<SettingsRow
								description="Be among the first to try new features and provide feedback"
								label={
									<span className="flex items-center gap-2">
										Early Access Features
										<Badge variant="blue">Alpha</Badge>
									</span>
								}
							>
								<Switch
									checked={earlyAccess}
									onCheckedChange={setEarlyAccess}
								/>
							</SettingsRow>

							<SettingsRow
								description="Test experimental UI changes before they go live"
								label={
									<span className="flex items-center gap-2">
										Beta UI
										<Badge variant="blue">Beta</Badge>
									</span>
								}
							>
								<Switch checked={betaUI} onCheckedChange={setBetaUI} />
							</SettingsRow>
						</div>
					</SettingsSection>

					{/* Experimental */}
					<SettingsSection
						description="Opt into experimental features that may be unstable"
						title="Experimental Features"
					>
						<div className="space-y-4">
							<SettingsRow
								description="Use experimental rendering optimizations for faster charts and tables"
								label={
									<span className="flex items-center gap-2">
										Experimental Performance Mode
										<Badge variant="amber">Experimental</Badge>
									</span>
								}
							>
								<Switch
									checked={experimentalPerformance}
									onCheckedChange={setExperimentalPerformance}
								/>
							</SettingsRow>
						</div>
					</SettingsSection>

					{/* Info */}
					<div className="border-b px-5 py-4">
						<div className="flex items-start gap-3 rounded border border-blue-500/30 bg-blue-500/10 p-3">
							<RocketIcon className="mt-0.5 size-5 shrink-0 text-blue-600" />
							<div>
								<p className="font-medium text-blue-800 text-sm dark:text-blue-200">
									Help shape the future
								</p>
								<p className="text-blue-700 text-xs dark:text-blue-300">
									By enabling early access features, you help us improve
									Databuddy. Your feedback is invaluable!
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<RightSidebar className="gap-0 p-0">
				<RightSidebar.Section border title="Feature Status">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Early access
							</span>
							<Badge variant={earlyAccess ? "blue" : "gray"}>
								{earlyAccess ? "On" : "Off"}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Beta UI</span>
							<Badge variant={betaUI ? "blue" : "gray"}>
								{betaUI ? "On" : "Off"}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Experimental
							</span>
							<Badge variant={experimentalPerformance ? "amber" : "gray"}>
								{experimentalPerformance ? "On" : "Off"}
							</Badge>
						</div>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section>
					<RightSidebar.Tip description="Experimental features may be unstable or change without notice. Use with caution in production environments." />
				</RightSidebar.Section>
			</RightSidebar>
		</div>
	);
}
