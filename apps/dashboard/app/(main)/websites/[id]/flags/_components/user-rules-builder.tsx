"use client";

import {
	CaretDownIcon,
	EnvelopeIcon,
	PlusIcon,
	TrashIcon,
	UserIcon,
	WrenchIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TagsChat } from "@/components/ui/tags";
import { cn } from "@/lib/utils";
import type { UserRule, UserRulesBuilderProps } from "./types";

const RULE_TYPE_CONFIG = {
	user_id: {
		icon: UserIcon,
		label: "User ID",
		placeholder: "Enter user ID…",
		batchPlaceholder: "Type user ID and press Enter…",
	},
	email: {
		icon: EnvelopeIcon,
		label: "Email",
		placeholder: "Enter email address…",
		batchPlaceholder: "Type email and press Enter…",
	},
	property: {
		icon: WrenchIcon,
		label: "Property",
		placeholder: "Enter property value…",
		batchPlaceholder: "Type value and press Enter…",
	},
} as const;

const OPERATORS = [
	{ value: "equals", label: "equals" },
	{ value: "contains", label: "contains" },
	{ value: "starts_with", label: "starts with" },
	{ value: "ends_with", label: "ends with" },
	{ value: "in", label: "is one of" },
	{ value: "not_in", label: "is not one of" },
] as const;

const PROPERTY_OPERATORS = [
	...OPERATORS,
	{ value: "exists", label: "exists" },
	{ value: "not_exists", label: "does not exist" },
] as const;

function RuleRow({
	rule,
	index,
	onUpdate,
	onRemove,
	isExpanded,
	onToggle,
}: {
	rule: UserRule;
	index: number;
	onUpdate: (updates: Partial<UserRule>) => void;
	onRemove: () => void;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const config = RULE_TYPE_CONFIG[rule.type];
	const Icon = config.icon;
	const operators = rule.type === "property" ? PROPERTY_OPERATORS : OPERATORS;
	const needsValue =
		rule.operator !== "exists" && rule.operator !== "not_exists";
	const isMultiValue = rule.operator === "in" || rule.operator === "not_in";
	const idPrefix = `rule-${index}`;

	const getSummary = () => {
		if (rule.batch) {
			return `${(rule.batchValues || []).length} values`;
		}
		if (rule.operator === "exists" || rule.operator === "not_exists") {
			return `${rule.field || "property"} ${rule.operator.replace("_", " ")}`;
		}
		return `${rule.operator.replace("_", " ")} "${rule.value || "..."}"`;
	};

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="group"
			exit={{ opacity: 0 }}
			initial={{ opacity: 0 }}
			layout
		>
			{/* Collapsed Row */}
			<button
				className={cn(
					"flex w-full items-center gap-3 rounded py-2.5 text-left transition-colors hover:bg-accent/50",
					isExpanded && "bg-accent/30"
				)}
				onClick={onToggle}
				type="button"
			>
				<Icon
					className={cn(
						"shrink-0",
						rule.enabled ? "text-primary" : "text-muted-foreground"
					)}
					size={16}
					weight="duotone"
				/>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<span className="font-medium text-sm">{config.label}</span>
					<span className="truncate text-muted-foreground text-xs">
						{getSummary()}
					</span>
					{!rule.enabled && (
						<span className="shrink-0 text-amber-600 text-xs">disabled</span>
					)}
				</div>
				<CaretDownIcon
					className={cn(
						"size-3.5 shrink-0 text-muted-foreground transition-transform",
						isExpanded && "rotate-180"
					)}
					weight="fill"
				/>
			</button>

			{/* Expanded Content */}
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						animate={{ height: "auto" }}
						className="overflow-hidden"
						exit={{ height: 0 }}
						initial={{ height: 0 }}
						transition={{ duration: 0.15 }}
					>
						<div className="space-y-4 py-3 pl-6">
							{/* Type & Property */}
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-1">
									<label
										className="text-muted-foreground text-xs"
										htmlFor={`${idPrefix}-type`}
									>
										Target
									</label>
									<Select
										onValueChange={(value: UserRule["type"]) =>
											onUpdate({ type: value })
										}
										value={rule.type}
									>
										<SelectTrigger id={`${idPrefix}-type`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{(
												Object.keys(RULE_TYPE_CONFIG) as UserRule["type"][]
											).map((type) => (
												<SelectItem key={type} value={type}>
													{RULE_TYPE_CONFIG[type].label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{rule.type === "property" && (
									<div className="space-y-1">
										<label
											className="text-muted-foreground text-xs"
											htmlFor={`${idPrefix}-field`}
										>
											Property name
										</label>
										<Input
											id={`${idPrefix}-field`}
											onChange={(e) => onUpdate({ field: e.target.value })}
											placeholder="e.g. plan, role…"
											value={rule.field || ""}
										/>
									</div>
								)}
							</div>

							{/* Batch Toggle */}
							{needsValue && (
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">
										Match multiple values
									</span>
									<Switch
										checked={rule.batch}
										onCheckedChange={(batch) => onUpdate({ batch })}
									/>
								</div>
							)}

							{/* Condition & Value */}
							{rule.batch ? (
								<div className="space-y-1">
									<p className="text-muted-foreground text-xs">Values</p>
									<TagsChat
										allowDuplicates={false}
										maxTags={100}
										onChange={(values: string[]) =>
											onUpdate({ batchValues: values })
										}
										placeholder={config.batchPlaceholder}
										values={rule.batchValues || []}
									/>
								</div>
							) : (
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="space-y-1">
										<label
											className="text-muted-foreground text-xs"
											htmlFor={`${idPrefix}-operator`}
										>
											Condition
										</label>
										<Select
											onValueChange={(value: UserRule["operator"]) =>
												onUpdate({ operator: value })
											}
											value={rule.operator}
										>
											<SelectTrigger id={`${idPrefix}-operator`}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{operators.map((op) => (
													<SelectItem key={op.value} value={op.value}>
														{op.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{needsValue && (
										<div className="space-y-1">
											<label
												className="text-muted-foreground text-xs"
												htmlFor={`${idPrefix}-value`}
											>
												{isMultiValue ? "Values" : "Value"}
											</label>
											{isMultiValue ? (
												<TagsChat
													allowDuplicates={false}
													maxTags={20}
													onChange={(values: string[]) => onUpdate({ values })}
													placeholder={config.batchPlaceholder}
													values={rule.values || []}
												/>
											) : (
												<Input
													id={`${idPrefix}-value`}
													onChange={(e) => onUpdate({ value: e.target.value })}
													placeholder={config.placeholder}
													value={rule.value || ""}
												/>
											)}
										</div>
									)}
								</div>
							)}

							{/* Result & Delete */}
							<div className="flex items-center justify-between border-t pt-3">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-sm">Result:</span>
									<button
										className={cn(
											"rounded px-2 py-0.5 text-sm transition-colors",
											rule.enabled
												? "bg-green-500/15 text-green-600"
												: "bg-amber-500/15 text-amber-600"
										)}
										onClick={() => onUpdate({ enabled: !rule.enabled })}
										type="button"
									>
										{rule.enabled ? "Enable" : "Disable"} flag
									</button>
								</div>
								<Button
									className="text-destructive hover:text-destructive"
									onClick={onRemove}
									size="sm"
									type="button"
									variant="ghost"
								>
									<TrashIcon size={14} />
									Remove
								</Button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export function UserRulesBuilder({ rules, onChange }: UserRulesBuilderProps) {
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

	const addRule = () => {
		const newRule: UserRule = {
			type: "user_id",
			operator: "equals",
			value: "",
			enabled: true,
			batch: false,
		};
		onChange([...rules, newRule]);
		setExpandedIndex(rules.length);
	};

	const updateRule = (index: number, updates: Partial<UserRule>) => {
		const newRules = [...rules];
		newRules[index] = { ...newRules[index], ...updates };
		onChange(newRules);
	};

	const removeRule = (index: number) => {
		onChange(rules.filter((_, i) => i !== index));
		if (expandedIndex === index) {
			setExpandedIndex(null);
		}
	};

	if (rules.length === 0) {
		return (
			<div className="py-4 text-center">
				<p className="mb-3 text-balance text-muted-foreground text-sm">
					No targeting rules yet
				</p>
				<Button onClick={addRule} size="sm" type="button" variant="secondary">
					<PlusIcon size={14} />
					Add Rule
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-1">
			<AnimatePresence mode="popLayout">
				{rules.map((rule, index) => (
					<RuleRow
						index={index}
						isExpanded={expandedIndex === index}
						key={index}
						onRemove={() => removeRule(index)}
						onToggle={() =>
							setExpandedIndex(expandedIndex === index ? null : index)
						}
						onUpdate={(updates) => updateRule(index, updates)}
						rule={rule}
					/>
				))}
			</AnimatePresence>

			<Button
				className="mt-2 w-full"
				onClick={addRule}
				size="sm"
				type="button"
				variant="ghost"
			>
				<PlusIcon size={14} />
				Add Rule
			</Button>
		</div>
	);
}
