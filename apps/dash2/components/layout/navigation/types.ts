import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  name: string;
  icon: LucideIcon;
  href: string;
  rootLevel?: boolean;
  external?: boolean;
  highlight?: boolean;
  alpha?: boolean;
  production?: boolean;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
} 