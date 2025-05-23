import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavigationItem as NavigationItemType } from "./types";

interface NavigationItemProps extends Omit<NavigationItemType, 'icon'> {
  icon: NavigationItemType['icon'];
  isActive: boolean;
  isRootLevel: boolean;
  isExternal?: boolean;
  isHighlighted?: boolean;
  currentWebsiteId?: string | null;
}

export function NavigationItem({
  name,
  icon: Icon,
  href,
  isActive,
  isRootLevel,
  isExternal,
  isHighlighted,
  currentWebsiteId
}: NavigationItemProps) {
  const fullPath = isRootLevel ? href : `/websites/${currentWebsiteId}${href}`;
  const LinkComponent = isExternal ? 'a' : Link;
  const linkProps = isExternal 
    ? { href, target: "_blank", rel: "noopener noreferrer" } 
    : { href: fullPath };

  return (
    <LinkComponent
      {...linkProps}
      className={cn(
        "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-all cursor-pointer",
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : isHighlighted 
            ? "text-foreground hover:text-primary hover:bg-accent/50" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <span className={cn("flex-shrink-0", isActive && "text-primary")}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-grow truncate">{name}</span>
      {isExternal && <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground" />}
    </LinkComponent>
  );
} 