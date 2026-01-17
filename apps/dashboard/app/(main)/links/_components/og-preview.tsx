"use client";

import {
	ArrowCounterClockwiseIcon,
	CircleNotchIcon,
	ImageIcon,
	VideoIcon,
	XIcon as CloseIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface OgData {
	ogTitle: string;
	ogDescription: string;
	ogImageUrl: string;
	ogVideoUrl: string;
}

interface OgPreviewProps {
	targetUrl: string;
	value: OgData;
	onChange: (data: OgData) => void;
	useCustomOg: boolean;
	onUseCustomOgChange: (useCustom: boolean) => void;
}

interface FetchedOgData {
	title: string;
	description: string;
	image: string;
}

async function fetchOgData(url: string): Promise<FetchedOgData> {
	if (!url) {
		throw new Error("No URL provided");
	}

	const fullUrl = url.startsWith("http") ? url : `https://${url}`;

	const response = await fetch(
		`https://api.microlink.io?url=${encodeURIComponent(fullUrl)}`
	);

	if (!response.ok) {
		throw new Error("Failed to fetch OG data");
	}

	const data = await response.json();

	return {
		title: data.data?.title ?? "",
		description: data.data?.description ?? "",
		image: data.data?.image?.url ?? data.data?.logo?.url ?? "",
	};
}

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 240;

export function OgPreview({
	targetUrl,
	value,
	onChange,
	useCustomOg,
	onUseCustomOgChange,
}: OgPreviewProps) {
	const [imageError, setImageError] = useState(false);

	const { data: fetchedOg, isLoading } = useQuery({
		queryKey: ["og-preview", targetUrl],
		queryFn: () => fetchOgData(targetUrl),
		enabled: !!targetUrl && targetUrl.length > 3,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});

	const displayData = useMemo<FetchedOgData>(() => {
		if (useCustomOg) {
			return {
				title: value.ogTitle || fetchedOg?.title || "",
				description: value.ogDescription || fetchedOg?.description || "",
				image: value.ogImageUrl || fetchedOg?.image || "",
			};
		}
		return fetchedOg ?? { title: "", description: "", image: "" };
	}, [useCustomOg, value, fetchedOg]);

	const handleFieldChange = useCallback(
		(field: keyof OgData, fieldValue: string) => {
			onChange({ ...value, [field]: fieldValue });
		},
		[onChange, value]
	);

	const handleReset = useCallback(() => {
		onChange({
			ogTitle: "",
			ogDescription: "",
			ogImageUrl: "",
			ogVideoUrl: "",
		});
	}, [onChange]);

	const handleImageLoad = useCallback(() => setImageError(false), []);
	const handleImageError = useCallback(() => setImageError(true), []);

	const hasCustomValues =
		value.ogTitle || value.ogDescription || value.ogImageUrl || value.ogVideoUrl;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<ImageIcon size={16} weight="duotone" />
				<span className="font-medium text-sm">Social Preview</span>
			</div>

			{/* Preview Card */}
			<div className="overflow-hidden rounded border bg-muted/30">
				{isLoading ? (
					<div className="flex h-40 items-center justify-center">
						<CircleNotchIcon className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						{displayData.image && !imageError ? (
							<div className="group relative aspect-video w-full overflow-hidden bg-muted">
								{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: img onLoad/onError are valid for tracking load state */}
								<img
									alt="OG Preview"
									className="size-full object-cover"
									height={630}
									onError={handleImageError}
									onLoad={handleImageLoad}
									src={displayData.image}
									width={1200}
								/>
								{useCustomOg && value.ogImageUrl && (
									<button
										className="absolute top-2 right-2 rounded bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
										onClick={() => handleFieldChange("ogImageUrl", "")}
										type="button"
									>
										<CloseIcon className="size-4 text-white" />
									</button>
								)}
								<div className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-white text-xs">
									1200 × 630
								</div>
							</div>
						) : (
							<div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted">
								<ImageIcon
									className="size-10 text-muted-foreground/50"
									weight="duotone"
								/>
								<p className="text-muted-foreground text-xs">
									Enter a URL to generate preview
								</p>
							</div>
						)}
						<div className="space-y-1 p-3">
							<p className="line-clamp-1 font-medium text-sm">
								{displayData.title || "No title"}
							</p>
							<p className="line-clamp-2 text-muted-foreground text-xs">
								{displayData.description || "No description"}
							</p>
						</div>
					</>
				)}
			</div>

			{/* Custom OG Toggle */}
			<div className="flex items-center justify-between">
				<Label className="text-sm" htmlFor="use-custom-og">
					Use custom social preview
				</Label>
				<Switch
					checked={useCustomOg}
					id="use-custom-og"
					onCheckedChange={onUseCustomOgChange}
				/>
			</div>

			{/* Custom OG Fields */}
			{useCustomOg && (
				<div className="space-y-3 border-primary/20 border-l-2 pl-4">
					{/* Title */}
					<div className="grid gap-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-xs" htmlFor="og-title">
								Title
							</Label>
							<span className="text-muted-foreground text-xs tabular-nums">
								{value.ogTitle.length}/{TITLE_MAX}
							</span>
						</div>
						<Input
							className="h-8 text-sm"
							id="og-title"
							maxLength={TITLE_MAX}
							onChange={(e) => handleFieldChange("ogTitle", e.target.value)}
							placeholder={fetchedOg?.title || "Enter custom title…"}
							value={value.ogTitle}
						/>
					</div>

					{/* Description */}
					<div className="grid gap-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-xs" htmlFor="og-description">
								Description
							</Label>
							<span className="text-muted-foreground text-xs tabular-nums">
								{value.ogDescription.length}/{DESCRIPTION_MAX}
							</span>
						</div>
						<Textarea
							className="min-h-16 resize-none text-sm"
							id="og-description"
							maxLength={DESCRIPTION_MAX}
							onChange={(e) =>
								handleFieldChange("ogDescription", e.target.value)
							}
							placeholder={
								fetchedOg?.description || "Enter custom description…"
							}
							rows={2}
							value={value.ogDescription}
						/>
					</div>

					{/* Image URL */}
					<div className="grid gap-1.5">
						<Label className="text-xs" htmlFor="og-image">
							Image URL
						</Label>
						<Input
							className="h-8 text-sm"
							id="og-image"
							onChange={(e) => handleFieldChange("ogImageUrl", e.target.value)}
							placeholder={fetchedOg?.image || "https://example.com/og.png"}
							type="url"
							value={value.ogImageUrl}
						/>
						<p className="text-muted-foreground text-xs">
							Recommended: 1200 × 630 pixels
						</p>
					</div>

					{/* Video URL */}
					<div className="grid gap-1.5">
						<Label
							className="flex items-center gap-1.5 text-xs"
							htmlFor="og-video"
						>
							<VideoIcon size={12} weight="duotone" />
							Video URL (optional)
						</Label>
						<Input
							className="h-8 text-sm"
							id="og-video"
							onChange={(e) => handleFieldChange("ogVideoUrl", e.target.value)}
							placeholder="https://example.com/video.mp4"
							type="url"
							value={value.ogVideoUrl}
						/>
					</div>

					{/* Reset Button */}
					{hasCustomValues && (
						<Button
							className="h-7 w-full"
							onClick={handleReset}
							size="sm"
							type="button"
							variant="ghost"
						>
							<ArrowCounterClockwiseIcon className="mr-1.5 size-3.5" />
							Reset to default
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
