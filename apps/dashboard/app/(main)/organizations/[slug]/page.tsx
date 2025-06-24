"use client";

import { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    BuildingsIcon,
    UsersIcon,
    GearIcon,
    ChartBarIcon,
    CaretLeftIcon,
    CheckIcon
} from "@phosphor-icons/react";
import { useOrganizations } from "@/hooks/use-organizations";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Tab components
import { OverviewTab } from "./components/overview-tab";
import { TeamsTab } from "./components/teams-tab";
import { SettingsTab } from "./components/settings-tab";

function TabSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-48 w-full rounded" />
        </div>
    );
}

export default function OrganizationPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [activeTab, setActiveTab] = useState("overview");

    const { organizations, activeOrganization, setActiveOrganization, isSettingActiveOrganization, isLoading } = useOrganizations();

    // Find the organization by slug
    const organization = organizations?.find(org => org.slug === slug);
    const isCurrentlyActive = activeOrganization?.id === organization?.id;

    const getOrganizationInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSetActive = () => {
        if (organization && !isCurrentlyActive) {
            setActiveOrganization(organization.id);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
                <Skeleton className="h-32 w-full rounded" />
                <Skeleton className="h-64 w-full rounded" />
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                <div className="text-center py-12">
                    <div className="p-6 rounded border border-border/50 bg-muted/30 max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20 w-fit mx-auto mb-4">
                            <BuildingsIcon size={32} weight="duotone" className="h-8 w-8 text-destructive" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Organization Not Found</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            The organization you're looking for doesn't exist or you don't have access to it.
                        </p>
                        <Button asChild className="rounded">
                            <Link href="/organizations">
                                <CaretLeftIcon size={16} className="h-4 w-4 mr-2" />
                                Back to Organizations
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
            {/* Back Navigation */}
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground cursor-pointer group"
                    asChild
                >
                    <Link href="/organizations">
                        <CaretLeftIcon size={16} className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Back to Organizations</span>
                    </Link>
                </Button>
            </div>

            {/* Organization Header */}
            <div className="p-6 rounded border border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border border-border/50">
                            <AvatarImage src={organization.logo || undefined} alt={organization.name} />
                            <AvatarFallback className="text-lg font-medium bg-accent">
                                {getOrganizationInitials(organization.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold">{organization.name}</h1>
                                {isCurrentlyActive && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        <CheckIcon size={16} className="h-3 w-3 mr-1" />
                                        Active Workspace
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {organization.slug} • Created {new Date(organization.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isCurrentlyActive && (
                            <Button
                                onClick={handleSetActive}
                                disabled={isSettingActiveOrganization}
                                size="sm"
                                className="rounded"
                            >
                                {isSettingActiveOrganization ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full border border-primary-foreground/30 border-t-primary-foreground animate-spin mr-2" />
                                        Switching...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon size={16} className="h-4 w-4 mr-2" />
                                        Set as Active
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="border-b relative">
                    <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
                        <TabsTrigger
                            value="overview"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <ChartBarIcon size={16} className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Overview</span>
                            {activeTab === "overview" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="teams"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <UsersIcon size={16} className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Teams</span>
                            {activeTab === "teams" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <GearIcon size={16} className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Settings</span>
                            {activeTab === "settings" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded" />
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<TabSkeleton />}>
                        <OverviewTab organization={organization} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="teams" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<TabSkeleton />}>
                        <TeamsTab organization={organization} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="settings" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<TabSkeleton />}>
                        <SettingsTab organization={organization} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
} 