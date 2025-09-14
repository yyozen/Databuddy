'use client';

import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface RuleCondition {
	field: string;
	operator:
		| 'equals'
		| 'contains'
		| 'not_equals'
		| 'in'
		| 'not_in'
		| 'greater_than'
		| 'less_than';
	value: string | number | boolean | string[];
}

interface Rule {
	description?: string;
	conditions: RuleCondition[];
	rolloutPercentage: number;
}

interface RuleBuilderProps {
	rules: Rule[];
	onChange: (rules: Rule[]) => void;
}

const OPERATORS = [
	{ value: 'equals', label: 'equals' },
	{ value: 'not_equals', label: 'not equals' },
	{ value: 'contains', label: 'contains' },
	{ value: 'in', label: 'in' },
	{ value: 'not_in', label: 'not in' },
	{ value: 'greater_than', label: 'greater than' },
	{ value: 'less_than', label: 'less than' },
];

const COMMON_FIELDS = [
	'userRole',
	'planType',
	'country',
	'city',
	'browser',
	'device',
	'userId',
	'email',
	'customProperty',
];

export function RuleBuilder({ rules, onChange }: RuleBuilderProps) {
	const addRule = () => {
		const newRule: Rule = {
			description: '',
			conditions: [],
			rolloutPercentage: 100,
		};
		onChange([...rules, newRule]);
	};

	const updateRule = (index: number, updatedRule: Rule) => {
		const newRules = [...rules];
		newRules[index] = updatedRule;
		onChange(newRules);
	};

	const removeRule = (index: number) => {
		const newRules = rules.filter((_, i) => i !== index);
		onChange(newRules);
	};

	const addCondition = (ruleIndex: number) => {
		const newCondition: RuleCondition = {
			field: 'userRole',
			operator: 'equals',
			value: '',
		};
		const updatedRule = {
			...rules[ruleIndex],
			conditions: [...rules[ruleIndex].conditions, newCondition],
		};
		updateRule(ruleIndex, updatedRule);
	};

	const updateCondition = (
		ruleIndex: number,
		conditionIndex: number,
		updatedCondition: RuleCondition
	) => {
		const updatedRule = {
			...rules[ruleIndex],
			conditions: rules[ruleIndex].conditions.map((condition, i) =>
				i === conditionIndex ? updatedCondition : condition
			),
		};
		updateRule(ruleIndex, updatedRule);
	};

	const removeCondition = (ruleIndex: number, conditionIndex: number) => {
		const updatedRule = {
			...rules[ruleIndex],
			conditions: rules[ruleIndex].conditions.filter(
				(_, i) => i !== conditionIndex
			),
		};
		updateRule(ruleIndex, updatedRule);
	};

	const formatValue = (condition: RuleCondition, newValue: string) => {
		if (condition.operator === 'in' || condition.operator === 'not_in') {
			return newValue
				.split(',')
				.map((v) => v.trim())
				.filter((v) => v);
		}

		// Try to parse as number
		const numValue = Number(newValue);
		if (!Number.isNaN(numValue) && newValue !== '') {
			return numValue;
		}

		// Try to parse as boolean
		if (newValue === 'true') {
			return true;
		}
		if (newValue === 'false') {
			return false;
		}

		return newValue;
	};

	const getValueInput = (
		ruleIndex: number,
		conditionIndex: number,
		condition: RuleCondition
	) => {
		const isArrayValue =
			condition.operator === 'in' || condition.operator === 'not_in';
		const displayValue = isArrayValue
			? Array.isArray(condition.value)
				? condition.value.join(', ')
				: String(condition.value)
			: String(condition.value);

		return (
			<Input
				onChange={(e) => {
					const formattedValue = formatValue(condition, e.target.value);
					updateCondition(ruleIndex, conditionIndex, {
						...condition,
						value: formattedValue,
					});
				}}
				placeholder={isArrayValue ? 'value1, value2, value3' : 'value'}
				value={displayValue}
			/>
		);
	};

	return (
		<div className="space-y-4">
			{rules.map((rule, ruleIndex) => (
				<Card key={ruleIndex}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm">
								Rule Set {ruleIndex + 1}
							</CardTitle>
							<Button
								onClick={() => removeRule(ruleIndex)}
								size="sm"
								variant="ghost"
							>
								<TrashIcon className="h-4 w-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor={`description-${ruleIndex}`}>
								Description (optional)
							</Label>
							<Input
								id={`description-${ruleIndex}`}
								onChange={(e) =>
									updateRule(ruleIndex, {
										...rule,
										description: e.target.value,
									})
								}
								placeholder="Beta users"
								value={rule.description || ''}
							/>
						</div>

						<div>
							<Label>Conditions (all must match)</Label>
							<div className="mt-2 space-y-3">
								{rule.conditions.map((condition, conditionIndex) => (
									<div
										className="flex items-center gap-2 rounded-lg border p-3"
										key={conditionIndex}
									>
										<Select
											onValueChange={(value) =>
												updateCondition(ruleIndex, conditionIndex, {
													...condition,
													field: value,
												})
											}
											value={condition.field}
										>
											<SelectTrigger className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{COMMON_FIELDS.map((field) => (
													<SelectItem key={field} value={field}>
														{field}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<Select
											onValueChange={(value: any) =>
												updateCondition(ruleIndex, conditionIndex, {
													...condition,
													operator: value,
												})
											}
											value={condition.operator}
										>
											<SelectTrigger className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{OPERATORS.map((op) => (
													<SelectItem key={op.value} value={op.value}>
														{op.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<div className="flex-1">
											{getValueInput(ruleIndex, conditionIndex, condition)}
										</div>

										<Button
											onClick={() => removeCondition(ruleIndex, conditionIndex)}
											size="sm"
											variant="ghost"
										>
											<TrashIcon className="h-4 w-4" />
										</Button>
									</div>
								))}

								<Button
									onClick={() => addCondition(ruleIndex)}
									size="sm"
									variant="outline"
								>
									<PlusIcon className="mr-1 h-4 w-4" />
									Add Condition
								</Button>
							</div>
						</div>

						<div>
							<Label htmlFor={`rollout-${ruleIndex}`}>Rollout Percentage</Label>
							<div className="mt-1 flex items-center gap-2">
								<Input
									className="w-20"
									id={`rollout-${ruleIndex}`}
									max="100"
									min="0"
									onChange={(e) =>
										updateRule(ruleIndex, {
											...rule,
											rolloutPercentage: Number(e.target.value),
										})
									}
									type="number"
									value={rule.rolloutPercentage}
								/>
								<span className="text-muted-foreground text-sm">
									% of users in this set
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			))}

			<Button onClick={addRule} variant="outline">
				<PlusIcon className="mr-1 h-4 w-4" />
				Add Rule Set
			</Button>
		</div>
	);
}
