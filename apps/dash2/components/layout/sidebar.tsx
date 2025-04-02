"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/app/once-ui/components";
import { Icon } from "@/app/once-ui/components";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { TopHeader } from "./top-header";
import { useWebsites } from "@/hooks/use-websites";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavigationItem {
  name: string;
  icon: string;
  href: string;
  rootLevel?: boolean;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

// Main navigation items
const mainNavigation: NavigationSection[] = [
  {
    title: "Main",
    items: [
      { name: "Websites", icon: "globe", href: "/websites", rootLevel: true },
      // { name: "Analytics", icon: "barChart", href: "/analytics", rootLevel: true },
      { name: "Settings", icon: "settings", href: "/settings", rootLevel: true },
      { name: "Billing", icon: "creditCard", href: "/billing", rootLevel: true },
    ],
  },
];

// Website-specific navigation items
const websiteNavigation: NavigationSection[] = [
  {
    title: "Analytics",
    items: [
      { name: "Overview", icon: "barChart", href: "" },
      { name: "Sessions", icon: "clock", href: "/sessions" },
      { name: "Profiles", icon: "users", href: "/profiles" },
    ],
  },
  {
    title: "Settings",
    items: [
      { name: "General", icon: "settings", href: "/settings" },
      { name: "Team", icon: "users", href: "/team" },
      { name: "Integrations", icon: "plug", href: "/integrations" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { websites, isLoading } = useWebsites();

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^\/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch ? websitePathMatch[1] : null;
  const isInWebsiteContext = !!currentWebsiteId;

  // Find current website details
  const currentWebsite = isInWebsiteContext 
    ? websites?.find(site => site.id === currentWebsiteId) 
    : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderNavigationItems = (items: NavigationItem[], currentPath: string) => {
    return items.map((item) => {
      const fullPath = item.rootLevel ? item.href : `/websites/${currentWebsiteId}${item.href}`;
      const isActive = item.rootLevel 
        ? pathname === item.href
        : (item.href === "" 
            ? pathname === `/websites/${currentWebsiteId}` 
            : pathname === fullPath);
      
      return (
        <Link
          key={item.name}
          href={fullPath}
          className={cn(
            "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-all",
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <Icon 
            name={item.icon} 
            size="s" 
            onBackground={isActive ? "brand-strong" : "neutral-medium"} 
          />
          <span>{item.name}</span>
        </Link>
      );
    });
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={setIsMobileOpen} />

      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0 pt-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4">
            {isInWebsiteContext ? (
              // Website-specific navigation
              <>
                {/* Back to websites button */}
                <div className="mb-6">
                  <Link href="/websites">
                    <Button variant="secondary" size="m" prefixIcon="chevronLeft" className="w-full justify-start mb-4">
                      <span>Back to Websites</span>
                    </Button>
                  </Link>
                  
                  {/* Current website name */}
                  <div className="px-2 py-1 mb-6">
                    <h2 className="text-base font-semibold truncate">
                      {currentWebsite?.name || currentWebsite?.domain || (
                        <Skeleton className="h-5 w-36" />
                      )}
                    </h2>
                    <div className="text-sm text-muted-foreground truncate mt-0.5">
                      {currentWebsite ? 
                        currentWebsite.domain : 
                        <Skeleton className="h-4 w-24 mt-1" />
                      }
                    </div>
                  </div>
                </div>
                
                {/* Website navigation sections */}
                {websiteNavigation.map((section) => (
                  <div key={section.title} className="mb-6">
                    <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {renderNavigationItems(section.items, pathname)}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // Main navigation
              <>
                {/* Main navigation sections */}
                {mainNavigation.map((section) => (
                  <div key={section.title} className="mb-6">
                    <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {renderNavigationItems(section.items, pathname)}
                    </div>
                  </div>
                ))}

                {/* Websites section */}
                <div className="mb-6">
                  <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider">
                    Websites
                  </h3>
                  <div className="space-y-1">
                    {isLoading ? (
                      // Loading skeletons
                      <>
                        <div className="px-3 py-2">
                          <Skeleton className="h-8 w-full rounded-md" />
                        </div>
                        <div className="px-3 py-2">
                          <Skeleton className="h-8 w-full rounded-md" />
                        </div>
                        <div className="px-3 py-2">
                          <Skeleton className="h-8 w-full rounded-md" />
                        </div>
                      </>
                    ) : websites?.length === 0 ? (
                      // No websites message
                      <div className="px-3 py-2 text-sm text-muted-foreground bg-accent/50 rounded-md">
                        No websites yet
                      </div>
                    ) : (
                      // Website list
                      websites.map((site) => (
                        <Link
                          key={site.id}
                          href={`/websites/${site.id}`}
                          className={cn(
                            "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-all",
                            pathname === `/websites/${site.id}`
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-accent/50"
                          )}
                        >
                          <Icon name="globe" size="s" onBackground={pathname === `/websites/${site.id}` ? "brand-strong" : "neutral-medium"} />
                          <span className="truncate">{site.name || site.domain}</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}   
