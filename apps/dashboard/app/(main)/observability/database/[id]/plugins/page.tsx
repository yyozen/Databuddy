'use client';

import {
	CheckIcon,
	DatabaseIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	TrashIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { use, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

interface ExtensionsPageProps {
	params: Promise<{ id: string }>;
}

const COMMON_EXTENSIONS = [
	{
		name: 'pg_stat_statements',
		description: 'Track execution statistics of SQL statements',
		category: 'Monitoring',
		useCase: 'Query performance analysis and optimization',
	},
	{
		name: 'uuid-ossp',
		description: 'Generate universally unique identifiers (UUIDs)',
		category: 'Utilities',
		useCase: 'Generate UUIDs for primary keys',
	},
	{
		name: 'pg_trgm',
		description: 'Text similarity using trigram matching',
		category: 'Search',
		useCase: 'Fuzzy text search and similarity queries',
	},
	{
		name: 'pgcrypto',
		description: 'Cryptographic functions and hashing',
		category: 'Security',
		useCase: 'Password hashing and data encryption',
	},
	{
		name: 'hstore',
		description: 'Key-value pairs storage type',
		category: 'Data Types',
		useCase: 'Store flexible key-value data structures',
	},
];

function LoadingState() {
	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-5 w-96" />
			</div>
			<Skeleton className="h-10 w-80" />
			<Skeleton className="h-10 w-full" />
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div className="space-y-3 rounded-lg border p-4" key={i.toString()}>
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
						<Skeleton className="h-4 w-full" />
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-8 w-20" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ErrorState({ error }: { error: string }) {
	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<DatabaseIcon
						className="h-6 w-6 text-muted-foreground"
						weight="duotone"
					/>
					<h1 className="font-bold text-2xl">PostgreSQL Extensions</h1>
				</div>
			</div>
			<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
				<p className="font-medium text-destructive">
					Failed to load extensions
				</p>
				<p className="mt-1 text-muted-foreground text-sm">{error}</p>
			</div>
		</div>
	);
}

// biome-ignore lint: Complex UI component with multiple interactions
export default function ExtensionsPage({ params }: ExtensionsPageProps) {
	const [search, setSearch] = useState('');
	const [installDialog, setInstallDialog] = useState(false);
	const [removeDialog, setRemoveDialog] = useState<string | null>(null);
	const [selectedExtension, setSelectedExtension] = useState('');
	const [installSchema, setInstallSchema] = useState('public');

	const resolvedParams = use(params);
	const connectionId = resolvedParams.id;

	const {
		data: extensions,
		isLoading: extensionsLoading,
		error: extensionsError,
		refetch: refetchExtensions,
	} = trpc.dbConnections.getExtensions.useQuery({ id: connectionId });

	const {
		data: availableExtensions,
		isLoading: availableLoading,
		error: availableError,
	} = trpc.dbConnections.getAvailableExtensions.useQuery({ id: connectionId });

	const installMutation = trpc.dbConnections.installExtension.useMutation({
		onSuccess: () => {
			refetchExtensions();
			setInstallDialog(false);
			setSelectedExtension('');
		},
	});

	const removeMutation = trpc.dbConnections.dropExtension.useMutation({
		onSuccess: () => {
			refetchExtensions();
			setRemoveDialog(null);
		},
	});

	const filteredInstalled =
		extensions?.filter(
			(ext) =>
				ext.name.toLowerCase().includes(search.toLowerCase()) ||
				ext.description.toLowerCase().includes(search.toLowerCase())
		) || [];

	const filteredAvailable =
		availableExtensions?.filter(
			(ext) =>
				ext.name.toLowerCase().includes(search.toLowerCase()) ||
				ext.description.toLowerCase().includes(search.toLowerCase())
		) || [];

	const handleInstall = () => {
		if (!selectedExtension) {
			return;
		}
		installMutation.mutate({
			id: connectionId,
			extensionName: selectedExtension,
			schema: installSchema || undefined,
		});
	};

	const handleRemove = (extensionName: string) => {
		removeMutation.mutate({
			id: connectionId,
			extensionName,
		});
	};

	if (extensionsError || availableError) {
		return (
			<ErrorState
				error={
					extensionsError?.message || availableError?.message || 'Unknown error'
				}
			/>
		);
	}

	if (extensionsLoading || availableLoading) {
		return <LoadingState />;
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<DatabaseIcon
						className="h-6 w-6 text-muted-foreground"
						weight="duotone"
					/>
					<h1 className="font-bold text-2xl">PostgreSQL Extensions</h1>
				</div>
				<p className="text-muted-foreground">
					Manage database extensions to add new functionality and capabilities
				</p>
			</div>

			{/* Stats Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<CheckIcon className="h-5 w-5 text-green-600" weight="bold" />
							<div>
								<p className="font-medium text-2xl">
									{extensions?.length || 0}
								</p>
								<p className="text-muted-foreground text-sm">Installed</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<PlusIcon className="h-5 w-5 text-blue-600" weight="bold" />
							<div>
								<p className="font-medium text-2xl">
									{availableExtensions?.length || 0}
								</p>
								<p className="text-muted-foreground text-sm">Available</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<DatabaseIcon
								className="h-5 w-5 text-purple-600"
								weight="duotone"
							/>
							<div>
								<p className="font-medium text-2xl">
									{(extensions?.length || 0) +
										(availableExtensions?.length || 0)}
								</p>
								<p className="text-muted-foreground text-sm">Total</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search and Actions */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="relative max-w-md flex-1">
					<MagnifyingGlassIcon
						className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
						weight="duotone"
					/>
					<Input
						className="pl-10"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search extensions..."
						value={search}
					/>
				</div>

				<Dialog onOpenChange={setInstallDialog} open={installDialog}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="mr-2 h-4 w-4" weight="bold" />
							Install Extension
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Install Extension</DialogTitle>
							<DialogDescription>
								Select an extension to install from the available options.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="extension-select">Extension</Label>
								<Select
									onValueChange={setSelectedExtension}
									value={selectedExtension}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select an extension" />
									</SelectTrigger>
									<SelectContent>
										{availableExtensions?.map((ext) => (
											<SelectItem key={ext.name} value={ext.name}>
												<div className="flex flex-col">
													<span className="font-medium">{ext.name}</span>
													<span className="max-w-xs truncate text-muted-foreground text-sm">
														{ext.description}
													</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="schema-input">Schema (optional)</Label>
								<Input
									id="schema-input"
									onChange={(e) => setInstallSchema(e.target.value)}
									placeholder="public"
									value={installSchema}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								onClick={() => {
									setInstallDialog(false);
									setSelectedExtension('');
								}}
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								disabled={!selectedExtension || installMutation.isPending}
								onClick={handleInstall}
							>
								{installMutation.isPending ? 'Installing...' : 'Install'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Common Extensions Recommendations */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PlusIcon className="h-5 w-5" weight="duotone" />
						Recommended Extensions
					</CardTitle>
					<CardDescription>
						Popular extensions that add useful functionality to PostgreSQL
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{COMMON_EXTENSIONS.map((ext) => {
							const isInstalled = extensions?.some((e) => e.name === ext.name);
							const isAvailable = availableExtensions?.some(
								(a) => a.name === ext.name
							);

							return (
								<div className="rounded-lg border p-3" key={ext.name}>
									<div className="mb-2 flex items-center justify-between">
										<h4 className="font-medium text-sm">{ext.name}</h4>
										{isInstalled ? (
											<Badge className="text-xs" variant="secondary">
												Installed
											</Badge>
										) : isAvailable ? (
											<Badge className="text-xs" variant="outline">
												Available
											</Badge>
										) : (
											<Badge className="text-xs" variant="destructive">
												N/A
											</Badge>
										)}
									</div>
									<p className="mb-1 text-muted-foreground text-xs">
										{ext.description}
									</p>
									<p className="text-muted-foreground text-xs italic">
										{ext.useCase}
									</p>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Extensions Tabs */}
			<Tabs className="w-full" defaultValue="installed">
				<TabsList>
					<TabsTrigger value="installed">
						Installed ({extensions?.length || 0})
					</TabsTrigger>
					<TabsTrigger value="available">
						Available ({availableExtensions?.length || 0})
					</TabsTrigger>
				</TabsList>

				<TabsContent className="space-y-4" value="installed">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredInstalled.map((ext) => (
							<div
								className="space-y-3 rounded-lg border bg-card p-4"
								key={ext.name}
							>
								<div className="flex items-center justify-between">
									<h3 className="font-semibold">{ext.name}</h3>
									<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
										<CheckIcon className="mr-1 h-3 w-3" weight="bold" />
										Installed
									</Badge>
								</div>

								<p className="text-muted-foreground text-sm">
									{ext.description}
								</p>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs">
											v{ext.version}
										</span>
										{ext.schema && (
											<Badge className="text-xs" variant="outline">
												{ext.schema}
											</Badge>
										)}
									</div>
									<Dialog
										onOpenChange={(open) =>
											setRemoveDialog(open ? ext.name : null)
										}
										open={removeDialog === ext.name}
									>
										<DialogTrigger asChild>
											<Button size="sm" variant="destructive">
												<TrashIcon className="mr-1 h-3 w-3" weight="bold" />
												Remove
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle className="flex items-center gap-2">
													<WarningIcon
														className="h-5 w-5 text-amber-500"
														weight="bold"
													/>
													Remove Extension
												</DialogTitle>
												<DialogDescription>
													Are you sure you want to remove the{' '}
													<strong>{ext.name}</strong> extension? This action
													cannot be undone and may break dependent objects.
												</DialogDescription>
											</DialogHeader>
											<DialogFooter>
												<Button
													onClick={() => setRemoveDialog(null)}
													variant="outline"
												>
													Cancel
												</Button>
												<Button
													disabled={removeMutation.isPending}
													onClick={() => handleRemove(ext.name)}
													variant="destructive"
												>
													{removeMutation.isPending ? 'Removing...' : 'Remove'}
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
							</div>
						))}
					</div>

					{filteredInstalled.length === 0 && (
						<div className="py-12 text-center">
							<DatabaseIcon
								className="mx-auto mb-3 h-12 w-12 text-muted-foreground"
								weight="duotone"
							/>
							<p className="text-muted-foreground">
								No installed extensions found
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent className="space-y-4" value="available">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredAvailable.map((ext) => (
							<div
								className="space-y-3 rounded-lg border bg-card p-4"
								key={ext.name}
							>
								<div className="flex items-center justify-between">
									<h3 className="font-semibold">{ext.name}</h3>
									<Badge variant="outline">
										<PlusIcon className="mr-1 h-3 w-3" weight="bold" />
										Available
									</Badge>
								</div>

								<p className="text-muted-foreground text-sm">
									{ext.description}
								</p>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs">
											v{ext.defaultVersion}
										</span>
									</div>
									<Button
										onClick={() => {
											setSelectedExtension(ext.name);
											setInstallDialog(true);
										}}
										size="sm"
									>
										<PlusIcon className="mr-1 h-3 w-3" weight="bold" />
										Install
									</Button>
								</div>
							</div>
						))}
					</div>

					{filteredAvailable.length === 0 && (
						<div className="py-12 text-center">
							<CheckIcon
								className="mx-auto mb-3 h-12 w-12 text-muted-foreground"
								weight="duotone"
							/>
							<p className="text-muted-foreground">
								No available extensions found
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Admin Access Notice */}
			{installMutation.error && (
				<Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
					<CardContent className="pt-6">
						<div className="flex items-start gap-3">
							<WarningIcon
								className="mt-0.5 h-5 w-5 text-amber-600"
								weight="bold"
							/>
							<div>
								<h4 className="font-semibold text-amber-800 dark:text-amber-200">
									Admin Access Required
								</h4>
								<p className="mt-1 text-amber-700 text-sm dark:text-amber-300">
									{installMutation.error.message}
								</p>
								<p className="mt-2 text-amber-600 text-sm dark:text-amber-400">
									To install or remove extensions, you need to connect with an
									admin database user that has CREATE/DROP extension privileges.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
