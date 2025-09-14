'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FlagIcon, PlusIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';

const flagFormSchema = z.object({
	key: z
		.string()
		.min(1, 'Key is required')
		.max(100, 'Key too long')
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'Key must contain only letters, numbers, underscores, and hyphens'
		),
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name too long')
		.optional(),
	description: z.string().optional(),
	type: z.enum(['boolean', 'rollout']),
	status: z.enum(['active', 'inactive', 'archived']),
	defaultValue: z.boolean(),
	payload: z.string().optional(),
	rolloutPercentage: z.number().min(0).max(100),
});

type FlagFormData = z.infer<typeof flagFormSchema>;

interface FlagSheetProps {
	isOpen: boolean;
	onClose: () => void;
	websiteId: string;
	flagId?: string | null;
}

export function FlagSheet({
	isOpen,
	onClose,
	websiteId,
	flagId,
}: FlagSheetProps) {
	const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
	const [showPayload, setShowPayload] = useState(false);
	const [sliderValue, setSliderValue] = useState(0);
	const isEditing = Boolean(flagId);

	const form = useForm<FlagFormData>({
		resolver: zodResolver(flagFormSchema),
		defaultValues: {
			key: '',
			name: '',
			description: '',
			type: 'boolean',
			status: 'active',
			defaultValue: false,
			payload: '',
			rolloutPercentage: 0,
		},
	});

	// Fetch flag data for editing
	const { data: flagData } = trpc.flags.getById.useQuery(
		{ id: flagId ?? '', websiteId },
		{ enabled: isEditing && Boolean(flagId) }
	);

	// Mutations
	const createMutation = trpc.flags.create.useMutation();
	const updateMutation = trpc.flags.update.useMutation();

	// Reset form when sheet opens/closes or flag data changes
	useEffect(() => {
		if (isOpen) {
			if (flagData && isEditing) {
				const hasPayload = Boolean(flagData.payload);
				form.reset({
					key: flagData.key,
					name: flagData.name || '',
					description: flagData.description || '',
					type: flagData.type as 'boolean' | 'rollout',
					status: flagData.status as 'active' | 'inactive' | 'archived',
					defaultValue: Boolean(flagData.defaultValue),
					payload: flagData.payload
						? JSON.stringify(flagData.payload, null, 2)
						: '',
					rolloutPercentage: flagData.rolloutPercentage || 0,
				});
				setShowPayload(hasPayload);
				setSliderValue(flagData.rolloutPercentage || 0);
			} else {
				form.reset();
				setShowPayload(false);
				setSliderValue(0);
			}
			setKeyManuallyEdited(false);
		}
	}, [isOpen, flagData, isEditing, form]);

	// Auto-generate key from name
	const watchedName = form.watch('name');
	const watchedType = form.watch('type');

	useEffect(() => {
		if (isEditing || keyManuallyEdited || !watchedName) {
			return;
		}

		const key = watchedName
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 50);
		form.setValue('key', key);
	}, [watchedName, keyManuallyEdited, isEditing, form]);

	// Show rollout percentage only for rollout type
	const showRolloutPercentage = watchedType === 'rollout';

	const onSubmit = async (data: FlagFormData) => {
		try {
			let payload;
			if (data.payload?.trim()) {
				try {
					payload = JSON.parse(data.payload);
				} catch {
					toast.error('Invalid JSON payload');
					return;
				}
			}

			const mutation = isEditing ? updateMutation : createMutation;
			const mutationData =
				isEditing && flagId
					? {
							id: flagId,
							name: data.name || undefined,
							description: data.description || undefined,
							type: data.type,
							status: data.status,
							defaultValue: data.defaultValue,
							payload,
							rolloutPercentage: data.rolloutPercentage,
						}
					: {
							websiteId,
							key: data.key,
							name: data.name || undefined,
							description: data.description || undefined,
							type: data.type,
							status: data.status,
							defaultValue: data.defaultValue,
							payload,
							rolloutPercentage: data.rolloutPercentage,
						};

			await mutation.mutateAsync(mutationData as any);
			toast.success(`Flag ${isEditing ? 'updated' : 'created'} successfully`);
			onClose();
		} catch (error: any) {
			if (
				error?.message?.includes('unique') ||
				error?.message?.includes('CONFLICT')
			) {
				toast.error('A flag with this key already exists in this scope');
			} else if (error?.message?.includes('FORBIDDEN')) {
				toast.error('You do not have permission to perform this action');
			} else {
				toast.error(`Failed to ${isEditing ? 'update' : 'create'} flag`);
			}
		}
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<Sheet onOpenChange={onClose} open={isOpen}>
			<SheetContent
				className="w-full overflow-y-auto p-4 sm:w-[60vw] sm:max-w-[800px]"
				side="right"
			>
				<SheetHeader className="space-y-3 border-border/50 border-b pb-6">
					<div className="flex items-center gap-3">
						<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
							<FlagIcon
								className="h-6 w-6 text-primary"
								size={16}
								weight="duotone"
							/>
						</div>
						<div>
							<SheetTitle className="font-semibold text-foreground text-xl">
								{isEditing ? 'Edit Feature Flag' : 'Create Feature Flag'}
							</SheetTitle>
							<SheetDescription className="mt-1 text-muted-foreground">
								{isEditing
									? 'Update flag configuration and settings'
									: 'Set up a new feature flag for controlled rollouts'}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<div className="space-y-8 pt-6">
					<Form {...form}>
						<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
							{/* Basic Information */}
							<div className="space-y-6">
								<div className="space-y-1">
									<h3 className="font-semibold text-base text-foreground">
										Basic Information
									</h3>
									<p className="text-muted-foreground text-xs">
										Configure the flag name, key, and description
									</p>
								</div>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Flag Name
												</FormLabel>
												<FormControl>
													<Input
														className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
														placeholder="New Dashboard"
														{...field}
													/>
												</FormControl>
												<FormDescription className="text-muted-foreground text-xs">
													A human-readable name for this flag
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="key"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Key {!isEditing && '*'}
												</FormLabel>
												<FormControl>
													<Input
														className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
														placeholder="new-dashboard"
														{...field}
														disabled={isEditing}
														onChange={(e) => {
															const value = e.target.value;
															setKeyManuallyEdited(value.length > 0);
															field.onChange(value);
														}}
													/>
												</FormControl>
												<FormDescription className="text-muted-foreground text-xs">
													{isEditing
														? 'Cannot be changed after creation'
														: 'Unique identifier used in code'}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-medium text-foreground text-sm">
												Description
											</FormLabel>
											<FormControl>
												<Textarea
													className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
													placeholder="Enable the redesigned dashboard with improved UX"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-muted-foreground text-xs">
												Optional description of what this flag controls
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Flag Configuration */}
							<div className="space-y-6">
								<div className="space-y-1">
									<h3 className="font-semibold text-base text-foreground">
										Configuration
									</h3>
									<p className="text-muted-foreground text-xs">
										Set flag type, status, and default behavior
									</p>
								</div>

								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Flag Type *
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="rounded border-border/50">
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="rounded">
														<SelectItem value="boolean">
															<div className="flex flex-col">
																<span className="font-medium">Boolean</span>
																<span className="text-muted-foreground text-xs">
																	Simple on/off toggle
																</span>
															</div>
														</SelectItem>
														<SelectItem value="rollout">
															<div className="flex flex-col">
																<span className="font-medium">Rollout</span>
																<span className="text-muted-foreground text-xs">
																	Percentage-based gradual release
																</span>
															</div>
														</SelectItem>
													</SelectContent>
												</Select>
												<FormDescription className="text-muted-foreground text-xs">
													{watchedType === 'boolean' &&
														'Simple true/false flag for feature toggles'}
													{watchedType === 'rollout' &&
														'Gradual rollout with percentage control'}
													{!watchedType && 'Choose the type of feature flag'}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Status
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="rounded border-border/50">
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="rounded">
														<SelectItem value="active">Active</SelectItem>
														<SelectItem value="inactive">Inactive</SelectItem>
														<SelectItem value="archived">Archived</SelectItem>
													</SelectContent>
												</Select>
												<FormDescription className="text-muted-foreground text-xs">
													Current flag status
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="defaultValue"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded border bg-muted/30 p-4">
											<div className="space-y-0.5">
												<FormLabel className="font-medium text-foreground text-sm">
													Default Value
												</FormLabel>
												<FormDescription className="text-muted-foreground text-xs">
													Value returned when no conditions match
												</FormDescription>
											</div>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>

							{/* Advanced Settings */}
							<div className="space-y-6">
								<div className="space-y-1">
									<h3 className="font-semibold text-base text-foreground">
										Advanced Settings
									</h3>
									<p className="text-muted-foreground text-xs">
										Configure rollout and payload options
									</p>
								</div>

								{/* Rollout Percentage - Only show for rollout type */}
								{showRolloutPercentage && (
									<div className="slide-in-from-top-2 animate-in duration-300">
										<FormField
											control={form.control}
											name="rolloutPercentage"
											render={({ field }) => {
												// Sync slider value with form value when form changes
												useEffect(() => {
													const formValue = Number(field.value) || 0;
													if (formValue !== sliderValue) {
														setSliderValue(formValue);
													}
												}, [field.value]);

												return (
													<FormItem>
														<FormLabel className="font-medium text-foreground text-sm">
															Rollout Percentage
														</FormLabel>
														<FormControl>
															<div className="space-y-3">
																<Slider
																	className="w-full"
																	max={100}
																	min={0}
																	onValueChange={(values) => {
																		const newValue = values[0];
																		setSliderValue(newValue);
																		field.onChange(newValue);
																	}}
																	step={1}
																	value={[sliderValue]}
																/>
																<div className="flex items-center justify-between text-muted-foreground text-xs">
																	<span>0%</span>
																	<span className="font-medium text-foreground">
																		{sliderValue}%
																	</span>
																	<span>100%</span>
																</div>
															</div>
														</FormControl>
														<FormDescription className="text-muted-foreground text-xs">
															{sliderValue}% of users will see this flag enabled
														</FormDescription>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
								)}

								{/* Payload Section - Expandable */}
								<div className="space-y-3">
									{showPayload ? (
										<div className="slide-in-from-top-2 animate-in duration-300">
											<FormField
												control={form.control}
												name="payload"
												render={({ field }) => (
													<FormItem>
														<div className="flex items-center justify-between">
															<FormLabel className="font-medium text-foreground text-sm">
																Payload (Optional)
															</FormLabel>
															<Button
																className="h-6 px-2 text-muted-foreground hover:text-foreground"
																onClick={() => {
																	setShowPayload(false);
																	form.setValue('payload', '');
																}}
																size="sm"
																type="button"
																variant="ghost"
															>
																Remove
															</Button>
														</div>
														<FormControl>
															<Textarea
																className="rounded border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
																placeholder='{"theme": "dark", "timeout": 5000}'
																rows={4}
																{...field}
															/>
														</FormControl>
														<FormDescription className="text-muted-foreground text-xs">
															JSON data returned when flag is enabled
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									) : (
										<Button
											className="group w-full rounded border-2 border-primary/30 border-dashed transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
											onClick={() => setShowPayload(true)}
											type="button"
											variant="outline"
										>
											<PlusIcon
												className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
												size={16}
											/>
											Add Payload (Optional)
										</Button>
									)}
								</div>
							</div>

							<div className="flex justify-end gap-3 border-border/50 border-t pt-6">
								<Button
									className="rounded"
									onClick={onClose}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
								<Button
									className="relative rounded"
									disabled={isLoading}
									type="submit"
								>
									{isLoading && (
										<div className="absolute left-3">
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
										</div>
									)}
									<span className={isLoading ? 'ml-6' : ''}>
										{isLoading
											? 'Saving...'
											: isEditing
												? 'Update Flag'
												: 'Create Flag'}
									</span>
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
