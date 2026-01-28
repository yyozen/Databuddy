import {
	CheckCircleIcon,
	InfoIcon,
	LightbulbIcon,
	WarningCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react/ssr";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const calloutVariants = cva(
	"my-4 flex items-center gap-3 border-l-2 bg-muted py-3 pr-4 pl-4 dark:bg-[#101010]",
	{
		variants: {
			type: {
				info: "border-l-blue-500",
				success: "border-l-green-500",
				warn: "border-l-yellow-500",
				error: "border-l-red-500",
				tip: "border-l-purple-500",
				note: "border-l-border",
			},
		},
		defaultVariants: {
			type: "info",
		},
	}
);

const iconVariants = cva("size-6 shrink-0", {
	variants: {
		type: {
			info: "text-blue-500",
			success: "text-green-500",
			warn: "text-yellow-500",
			error: "text-red-500",
			tip: "text-purple-500",
			note: "text-muted-foreground",
		},
	},
	defaultVariants: {
		type: "info",
	},
});

const iconMap = {
	info: InfoIcon,
	success: CheckCircleIcon,
	warn: WarningCircleIcon,
	error: XCircleIcon,
	tip: LightbulbIcon,
	note: InfoIcon,
};

interface CalloutProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof calloutVariants> {
	title?: string;
}

function Callout({
	className,
	type = "info",
	title,
	children,
	...props
}: CalloutProps) {
	const Icon = iconMap[type as keyof typeof iconMap] || iconMap.info;

	return (
		<div
			className={cn(calloutVariants({ type }), className)}
			role="alert"
			{...props}
		>
			<Icon className={cn(iconVariants({ type }))} weight="duotone" />
			<div className="min-w-0 flex-1">
				{title && (
					<div className="mb-1 font-semibold text-foreground text-sm">
						{title}
					</div>
				)}
				<div className="text-foreground/90 text-sm [&_p]:leading-relaxed">
					{children}
				</div>
			</div>
		</div>
	);
}

export { Callout };
