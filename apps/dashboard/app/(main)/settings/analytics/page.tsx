"use client";

import { useState } from "react";
import { RightSidebar } from "@/components/right-sidebar";
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

export default function AnalyticsSettingsPage() {
	const [defaultDateRange, setDefaultDateRange] = useState("7d");
	const [defaultTimezone, setDefaultTimezone] = useState("auto");
	const [preferredChartType, setPreferredChartType] = useState("area");
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [hideBots, setHideBots] = useState(true);

	return (
		<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
			<div className="flex flex-col">
				<div className="flex-1 overflow-y-auto">
					{/* Default Views */}
					<SettingsSection
						description="Set your preferred defaults for analytics views"
						title="Default Views"
					>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="date-range">Default Date Range</Label>
								<Select
									onValueChange={setDefaultDateRange}
									value={defaultDateRange}
								>
									<SelectTrigger className="w-full sm:w-64" id="date-range">
										<SelectValue placeholder="Select range…" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="today">Today</SelectItem>
										<SelectItem value="yesterday">Yesterday</SelectItem>
										<SelectItem value="7d">Last 7 days</SelectItem>
										<SelectItem value="14d">Last 14 days</SelectItem>
										<SelectItem value="30d">Last 30 days</SelectItem>
										<SelectItem value="90d">Last 90 days</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="timezone">Default Timezone</Label>
								<Select
									onValueChange={setDefaultTimezone}
									value={defaultTimezone}
								>
									<SelectTrigger className="w-full sm:w-64" id="timezone">
										<SelectValue placeholder="Select timezone…" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="auto">
											Auto-detect from browser
										</SelectItem>
										<SelectItem value="UTC">UTC</SelectItem>
										<SelectItem value="America/New_York">
											Eastern Time (ET)
										</SelectItem>
										<SelectItem value="America/Los_Angeles">
											Pacific Time (PT)
										</SelectItem>
										<SelectItem value="Europe/London">London (GMT)</SelectItem>
										<SelectItem value="Europe/Paris">
											Central European (CET)
										</SelectItem>
										<SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="chart-type">Preferred Chart Type</Label>
								<Select
									onValueChange={setPreferredChartType}
									value={preferredChartType}
								>
									<SelectTrigger className="w-full sm:w-64" id="chart-type">
										<SelectValue placeholder="Select chart…" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="area">Area Chart</SelectItem>
										<SelectItem value="line">Line Chart</SelectItem>
										<SelectItem value="bar">Bar Chart</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</SettingsSection>

					{/* Behavior */}
					<SettingsSection
						description="Configure how analytics data is displayed and updated"
						title="Behavior"
					>
						<div className="space-y-4">
							<SettingsRow
								description="Automatically refresh analytics data every 30 seconds"
								label="Auto Refresh"
							>
								<Switch
									checked={autoRefresh}
									onCheckedChange={setAutoRefresh}
								/>
							</SettingsRow>

							<SettingsRow
								description="Filter out known bot and crawler traffic from your analytics"
								label="Hide Bots from Analytics"
							>
								<Switch checked={hideBots} onCheckedChange={setHideBots} />
							</SettingsRow>
						</div>
					</SettingsSection>
				</div>
			</div>

			<RightSidebar className="gap-0 p-0">
				<RightSidebar.Section border title="Current Defaults">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Date range</span>
							<span className="font-medium text-sm">
								{defaultDateRange === "7d" ? "7 days" : defaultDateRange}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Timezone</span>
							<span className="font-medium text-sm">
								{defaultTimezone === "auto" ? "Auto" : defaultTimezone}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Chart type</span>
							<span className="font-medium text-sm capitalize">
								{preferredChartType}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Auto refresh
							</span>
							<span className="font-medium text-sm">
								{autoRefresh ? "On" : "Off"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Hide bots</span>
							<span className="font-medium text-sm">
								{hideBots ? "Yes" : "No"}
							</span>
						</div>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section>
					<RightSidebar.Tip description="These defaults apply to all websites. You can override them per website in the website settings." />
				</RightSidebar.Section>
			</RightSidebar>
		</div>
	);
}
