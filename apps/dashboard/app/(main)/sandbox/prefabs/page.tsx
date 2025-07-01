"use client";

import { useState } from "react";
import { CubeIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Import prefab components
import { OnboardingPrefab } from "./_components/onboarding-prefab";

interface PrefabTab {
    id: string;
    name: string;
    description: string;
    component: React.ComponentType;
    category: "onboarding" | "forms" | "ui" | "data" | "feedback" | "layout";
    status: "stable" | "beta" | "alpha";
}

const prefabTabs: PrefabTab[] = [
    {
        id: "onboarding",
        name: "Onboarding Flow",
        description: "Multi-step onboarding components with progress tracking",
        component: OnboardingPrefab,
        category: "onboarding",
        status: "stable",
    },
];

const statusColors = {
    stable: "bg-green-100 text-green-800 border-green-200",
    beta: "bg-yellow-100 text-yellow-800 border-yellow-200",
    alpha: "bg-red-100 text-red-800 border-red-200",
} as const;

export default function PrefabsPage() {
    const [activeTab, setActiveTab] = useState<string>("onboarding");

    const activePrefab = prefabTabs.find((prefab) => prefab.id === activeTab);
    const ActiveComponent = activePrefab?.component;

    return (
        <div className="w-full p-6">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <CubeIcon className="h-8 w-8 text-primary" weight="duotone" />
                    <h1 className="font-bold text-3xl text-foreground">Component Prefabs</h1>
                </div>
                <p className="text-muted-foreground">
                    Pre-built component patterns and layouts ready for development
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                {/* Sidebar Navigation */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Components</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <div className="space-y-2">
                                    {prefabTabs.map((prefab) => (
                                        <div
                                            key={prefab.id}
                                            className={cn(
                                                "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                                                activeTab === prefab.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                            onClick={() => setActiveTab(prefab.id)}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className="font-medium text-sm">{prefab.name}</h4>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs", statusColors[prefab.status])}
                                                >
                                                    {prefab.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-xs leading-relaxed">
                                                {prefab.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div>
                    {ActiveComponent ? (
                        <Card className="min-h-full">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {activePrefab.name}
                                            <Badge
                                                variant="outline"
                                                className={cn("text-xs", statusColors[activePrefab.status])}
                                            >
                                                {activePrefab.status}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>{activePrefab.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ActiveComponent />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="min-h-full">
                            <CardContent className="flex items-center justify-center h-96">
                                <div className="text-center">
                                    <CubeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" weight="duotone" />
                                    <h3 className="font-medium text-lg mb-2">Select a Prefab</h3>
                                    <p className="text-muted-foreground">
                                        Choose a component from the sidebar to view its implementation
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
} 