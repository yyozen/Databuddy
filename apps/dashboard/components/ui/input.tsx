"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef, useState } from "react";

type InputProps = React.ComponentProps<"input"> & {
	variant?: "default" | "ghost";
	showFocusIndicator?: boolean;
	wrapperClassName?: string;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			variant = "default",
			showFocusIndicator = true,
			wrapperClassName,
			prefix,
			suffix,
			onFocus,
			onBlur,
			...props
		},
		ref
	) => {
		const [isFocused, setIsFocused] = useState(false);
		const hasError =
			props["aria-invalid"] === true || props["aria-invalid"] === "true";

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			onFocus?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			onBlur?.(e);
		};

		const hasPrefix = !!prefix;
		const hasSuffix = !!suffix;

		const isSmallHeight = className?.includes("h-8");
		const heightClass = isSmallHeight ? "h-8" : "h-9";

		if (hasPrefix || hasSuffix) {
			return (
				<div
					className={cn(
						"group flex min-w-0 flex-1 items-stretch rounded border border-accent-brighter bg-input transition-all dark:bg-input/80",
						"focus-within:blue-angled-rectangle-gradient focus-within:border-ring focus-within:bg-background focus-within:ring-[3px] focus-within:ring-ring/50",
						"has-[input[aria-invalid=true]]:border-destructive/60 has-[input[aria-invalid=true]]:bg-destructive/5",
						"has-[input[aria-invalid=true]]:focus-within:border-destructive has-[input[aria-invalid=true]]:focus-within:ring-destructive/20",
						wrapperClassName
					)}
				>
					{hasPrefix && (
						<span
							className={cn(
								"inline-flex shrink-0 select-none items-center border-r border-accent-brighter/50 bg-background px-3 text-muted-foreground text-sm",
								heightClass
							)}
						>
							{prefix}
						</span>
					)}
					<div className="relative min-w-0 flex-1">
						<input
							ref={ref}
							className={cn(
								"peer flex h-9 w-full min-w-0 cursor-text border-none bg-transparent px-3 py-1 text-[13px] text-sm outline-none transition-all placeholder:text-[13px] placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
								variant === "ghost" && "hover:bg-accent/30 focus-visible:bg-accent/50",
								className
							)}
							data-slot="input"
							onBlur={handleBlur}
							onFocus={handleFocus}
							type={type}
							{...props}
						/>
						{showFocusIndicator && (
							<motion.span
								animate={{
									scaleX: isFocused ? 1 : 0,
									opacity: isFocused ? 1 : 0,
								}}
								className={cn(
									"pointer-events-none absolute bottom-0 h-[2px]",
									hasError ? "bg-destructive" : "bg-primary",
									hasPrefix ? "left-0" : "left-1",
									hasSuffix ? "right-0" : "right-1",
									!hasPrefix && !hasSuffix && "rounded-full",
									hasPrefix && !hasSuffix && "rounded-r-full",
									!hasPrefix && hasSuffix && "rounded-l-full"
								)}
								initial={false}
								style={{ originX: 0.5 }}
								transition={{
									type: "spring",
									stiffness: 500,
									damping: 35,
								}}
							/>
						)}
					</div>
					{hasSuffix && (
						<span
							className={cn(
								"inline-flex shrink-0 select-none items-center border-l border-accent-brighter/50 bg-background px-3 text-muted-foreground text-sm",
								heightClass
							)}
						>
							{suffix}
						</span>
					)}
				</div>
			);
		}

		const hasRoundedLeft = className?.includes("rounded-l-none");
		const hasRoundedRight = className?.includes("rounded-r-none");

		return (
			<div className={cn("relative min-w-0 flex-1", wrapperClassName)}>
				<input
					ref={ref}
					className={cn(
						"peer flex h-9 w-full min-w-0 cursor-text rounded-sm border border-accent-brighter px-3 py-1 text-[13px] text-sm outline-none transition-all placeholder:text-[13px] placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
						"bg-input dark:bg-input/80",
						"focus-visible:blue-angled-rectangle-gradient focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50",
						"aria-invalid:border-destructive/60 aria-invalid:bg-destructive/5 dark:aria-invalid:border-destructive/50 dark:aria-invalid:bg-destructive/10",
						"aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20 dark:aria-invalid:focus-visible:ring-destructive/30",
						variant === "ghost" &&
							"border-transparent bg-transparent hover:bg-accent/30 focus-visible:bg-accent/50",
						className
					)}
					data-slot="input"
					onBlur={handleBlur}
					onFocus={handleFocus}
					type={type}
					{...props}
				/>
				{showFocusIndicator && (
					<motion.span
						animate={{
							scaleX: isFocused ? 1 : 0,
							opacity: isFocused ? 1 : 0,
						}}
						className={cn(
							"pointer-events-none absolute bottom-0 h-[2px]",
							hasError ? "bg-destructive" : "bg-primary",
							hasRoundedLeft ? "left-0 rounded-r-full" : "left-1 rounded-l-full",
							hasRoundedRight ? "right-0 rounded-l-full" : "right-1 rounded-r-full"
						)}
						initial={false}
						style={{ originX: 0.5 }}
						transition={{
							type: "spring",
							stiffness: 500,
							damping: 35,
						}}
					/>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
