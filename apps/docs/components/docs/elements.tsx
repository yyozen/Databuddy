import type * as React from "react";
import { cn } from "@/lib/utils";

function Blockquote({
	children,
	className,
	...props
}: React.ComponentProps<"blockquote">) {
	return (
		<blockquote
			className={cn(
				"my-4 border-l-2 border-l-border bg-muted py-3 pr-4 pl-4 text-foreground/80 dark:bg-[#101010] [&_p]:m-0",
				className
			)}
			{...props}
		>
			{children}
		</blockquote>
	);
}

function Anchor({ children, className, ...props }: React.ComponentProps<"a">) {
	return (
		<a
			className={cn(
				"font-medium text-primary underline underline-offset-4",
				className
			)}
			{...props}
		>
			{children}
		</a>
	);
}

function HorizontalRule({ className, ...props }: React.ComponentProps<"hr">) {
	return (
		<hr className={cn("my-8 border-border border-t", className)} {...props} />
	);
}

function UnorderedList({
	children,
	className,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			className={cn(
				"my-4 ml-6 list-disc space-y-2 text-foreground/90",
				className
			)}
			{...props}
		>
			{children}
		</ul>
	);
}

function OrderedList({
	children,
	className,
	...props
}: React.ComponentProps<"ol">) {
	return (
		<ol
			className={cn(
				"my-4 ml-6 list-decimal space-y-2 text-foreground/90",
				className
			)}
			{...props}
		>
			{children}
		</ol>
	);
}

function ListItem({
	children,
	className,
	...props
}: React.ComponentProps<"li">) {
	return (
		<li className={cn("leading-relaxed", className)} {...props}>
			{children}
		</li>
	);
}

export {
	Anchor,
	Blockquote,
	HorizontalRule,
	ListItem,
	OrderedList,
	UnorderedList,
};
