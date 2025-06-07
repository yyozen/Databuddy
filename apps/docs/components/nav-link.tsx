import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLinkProps {
	href: string;
	children: React.ReactNode;
	className?: string;
	external?: boolean;
}

export function NavLink({ href, children, className, external }: NavLinkProps) {
	const Component = external ? "a" : Link;
	const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

	return (
		<Component
			href={href}
			className={cn(
				"flex items-center gap-2 px-4 py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
				className
			)}
			{...externalProps}
		>
			{children}
		</Component>
	);
} 