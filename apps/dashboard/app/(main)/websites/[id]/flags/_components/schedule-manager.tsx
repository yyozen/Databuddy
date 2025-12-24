"use client";

import { DATE_FORMATS, formatDate } from "@lib/formatters";
import {
	CalendarIcon,
	ClockIcon,
	LightningIcon,
	PlusIcon,
	PowerIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ScheduleManagerProps } from "./types";

type ScheduleType = "enable" | "disable" | "update_rollout";

function DateTimePicker({
	value,
	onChange,
}: {
	value: string | undefined;
	onChange: (date: string) => void;
}) {
	const dateValue = value ? new Date(value) : undefined;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className={cn(
						"h-8 w-full justify-start gap-2 text-left font-normal",
						!value && "text-muted-foreground"
					)}
					type="button"
					variant="outline"
				>
					<CalendarIcon size={14} />
					{value
						? formatDate(new Date(value), DATE_FORMATS.DATE_TIME_12H)
						: "Pick date…"}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-0">
				<Calendar
					mode="single"
					onSelect={(date) => {
						if (date) {
							const currentTime = dateValue || new Date();
							date.setHours(currentTime.getHours());
							date.setMinutes(currentTime.getMinutes());
							onChange(date.toISOString());
						}
					}}
					selected={dateValue}
				/>
				<div className="flex items-center gap-2 border-t p-3">
					<ClockIcon className="text-muted-foreground" size={14} />
					<Input
						className="h-8 flex-1"
						defaultValue={
							value ? formatDate(new Date(value), DATE_FORMATS.TIME_ONLY) : ""
						}
						onChange={(e) => {
							const date = dateValue || new Date();
							const [h, m] = e.target.value.split(":");
							date.setHours(Number(h), Number(m));
							onChange(date.toISOString());
						}}
						type="time"
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function ScheduleManager({ form, flagId }: ScheduleManagerProps) {
	const scheduleEnabled = form.watch("schedule.isEnabled");
	const scheduleType = form.watch("schedule.type") as ScheduleType | undefined;
	const rolloutSteps = form.watch("schedule.rolloutSteps") || [];
	const flagType = form.watch("flag.type");
	const isRolloutFlag = flagType === "rollout";

	const enableSchedule = (type: ScheduleType) => {
		form.setValue("schedule.isEnabled", true);
		form.setValue("schedule.type", type);
		if (flagId) {
			form.setValue("schedule.flagId", flagId);
		}
		if (type === "update_rollout" && rolloutSteps.length === 0) {
			form.setValue("schedule.rolloutSteps", [
				{
					scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
					value: 0,
				},
			]);
		}
	};

	const disableSchedule = () => {
		form.setValue("schedule", undefined);
	};

	const addRolloutStep = () => {
		const lastStep = rolloutSteps.at(-1);
		const nextDate = lastStep
			? new Date(new Date(lastStep.scheduledAt).getTime() + 24 * 60 * 60 * 1000)
			: new Date(Date.now() + 60 * 60 * 1000);
		const nextValue = lastStep
			? Math.min(Number(lastStep.value) + 25, 100)
			: 25;

		form.setValue("schedule.rolloutSteps", [
			...rolloutSteps,
			{
				scheduledAt: nextDate.toISOString(),
				value: nextValue,
			},
		]);
	};

	const removeRolloutStep = (index: number) => {
		const filtered = rolloutSteps.filter((_, i) => i !== index);
		form.setValue("schedule.rolloutSteps", filtered);
		if (filtered.length === 0 && scheduleType === "update_rollout") {
			disableSchedule();
		}
	};

	const updateRolloutStep = (
		index: number,
		field: "scheduledAt" | "value",
		value: string | number
	) => {
		const newSteps = [...rolloutSteps];
		newSteps[index] = { ...newSteps[index], [field]: value };
		form.setValue("schedule.rolloutSteps", newSteps);
	};

	// Not enabled - show options
	if (!scheduleEnabled) {
		return (
			<div className="space-y-2">
				<button
					className="flex w-full items-center gap-3 rounded py-2 text-left transition-colors hover:bg-accent/50"
					onClick={() => enableSchedule("enable")}
					type="button"
				>
					<PowerIcon className="text-green-500" size={16} weight="fill" />
					<div>
						<p className="font-medium text-sm">Enable on schedule</p>
						<p className="text-muted-foreground text-xs">
							Automatically enable this flag
						</p>
					</div>
				</button>

				<button
					className="flex w-full items-center gap-3 rounded py-2 text-left transition-colors hover:bg-accent/50"
					onClick={() => enableSchedule("disable")}
					type="button"
				>
					<PowerIcon
						className="rotate-180 text-red-500"
						size={16}
						weight="fill"
					/>
					<div>
						<p className="font-medium text-sm">Disable on schedule</p>
						<p className="text-muted-foreground text-xs">
							Automatically disable this flag
						</p>
					</div>
				</button>

				{isRolloutFlag && (
					<button
						className="flex w-full items-center gap-3 rounded py-2 text-left transition-colors hover:bg-accent/50"
						onClick={() => enableSchedule("update_rollout")}
						type="button"
					>
						<LightningIcon className="text-primary" size={16} weight="fill" />
						<div>
							<p className="font-medium text-sm">Gradual rollout</p>
							<p className="text-muted-foreground text-xs">
								Schedule percentage increases
							</p>
						</div>
					</button>
				)}
			</div>
		);
	}

	// Enabled - show configuration
	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<span className="font-medium text-sm">
					{scheduleType === "enable"
						? "Enable on schedule"
						: scheduleType === "disable"
							? "Disable on schedule"
							: "Gradual rollout"}
				</span>
				<Button
					onClick={disableSchedule}
					size="sm"
					type="button"
					variant="ghost"
				>
					Cancel
				</Button>
			</div>

			{/* Simple enable/disable */}
			{scheduleType !== "update_rollout" && (
				<FormField
					control={form.control}
					name="schedule.scheduledAt"
					render={({ field }) => (
						<FormItem>
							<DateTimePicker onChange={field.onChange} value={field.value} />
						</FormItem>
					)}
				/>
			)}

			{/* Rollout steps */}
			{scheduleType === "update_rollout" && (
				<div className="space-y-2">
					<AnimatePresence mode="popLayout">
						{rolloutSteps.map((step, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="flex items-center gap-2"
								exit={{ opacity: 0, y: -10 }}
								initial={{ opacity: 0, y: 10 }}
								key={index}
								layout
							>
								<span className="w-5 shrink-0 text-center text-muted-foreground text-xs">
									{index + 1}.
								</span>
								<div className="flex-1">
									<DateTimePicker
										onChange={(date) =>
											updateRolloutStep(index, "scheduledAt", date)
										}
										value={step.scheduledAt}
									/>
								</div>
								<div className="flex items-center gap-1">
									<Input
										className="h-8 w-16"
										max={100}
										min={0}
										onChange={(e) =>
											updateRolloutStep(index, "value", Number(e.target.value))
										}
										type="number"
										value={step.value}
									/>
									<span className="text-muted-foreground text-xs">%</span>
								</div>
								<Button
									className="h-8 w-8 shrink-0"
									onClick={() => removeRolloutStep(index)}
									size="icon"
									type="button"
									variant="ghost"
								>
									<TrashIcon className="text-destructive" size={14} />
								</Button>
							</motion.div>
						))}
					</AnimatePresence>

					<Button
						className="w-full"
						onClick={addRolloutStep}
						size="sm"
						type="button"
						variant="ghost"
					>
						<PlusIcon size={14} />
						Add step
					</Button>
				</div>
			)}
		</div>
	);
}
