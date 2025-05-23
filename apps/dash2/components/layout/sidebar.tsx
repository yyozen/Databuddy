"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe } from "lucide-react";
import { TopHeader } from "./top-header";
import { useWebsites } from "@/hooks/use-websites";
import { WebsiteHeader } from "./navigation/website-header";
import { mainNavigation, websiteNavigation } from "./navigation/navigation-config";
import dynamic from "next/dynamic";

const WebsiteList = dynamic(() => import("./navigation/website-list").then(mod => mod.WebsiteList), {
  ssr: false,
  loading: () => null
});

const NavigationSection = dynamic(() => import("./navigation/navigation-section").then(mod => mod.NavigationSection), {
  ssr: false,
  loading: () => null
});


export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { websites, isLoading } = useWebsites();

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^\/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch ? websitePathMatch[1] : null;
  const isInWebsiteContext = !!currentWebsiteId;

  // Find current website details
  const currentWebsite = isInWebsiteContext 
    ? websites?.find((site: any) => site.id === currentWebsiteId) 
    : null;

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={setIsMobileOpen} />

      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsMobileOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border/40 transition-transform duration-300 ease-in-out md:translate-x-0 pt-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-6">
            {isInWebsiteContext ? (
              // Website-specific navigation
              <>
                <WebsiteHeader website={currentWebsite} />
                
                {/* Website navigation sections */}
                {websiteNavigation.map((section) => (
                  <NavigationSection
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    pathname={pathname}
                    currentWebsiteId={currentWebsiteId}
                  />
                ))}
              </>
            ) : (
              // Main navigation
              <>
                {/* Main navigation sections */}
                {mainNavigation.map((section) => (
                  <NavigationSection
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    pathname={pathname}
                  />
                ))}

                {/* Websites section */}
                <div>
                  <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center">
                    <Globe className="h-3 w-3 mr-1.5 text-primary/70" />
                    Websites
                  </h3>
                  <div className="space-y-1 ml-1 mt-3">
                    <WebsiteList
                      websites={websites}
                      isLoading={isLoading}
                      pathname={pathname}
                    />
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
