"use client";

import { lazy, Suspense, useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TabLayout } from "@/app/(main)/websites/[id]/_components/utils/tab-layout";
import { ChartLineUp, CreditCard, Clock } from "@phosphor-icons/react";
import { Customer, useBillingData, type Invoice } from "./data/billing-data";

const OverviewTab = lazy(() => import("./components/overview-tab").then(m => ({ default: m.OverviewTab })));
const PlansTab = lazy(() => import("./components/plans-tab").then(m => ({ default: m.PlansTab })));
const HistoryTab = lazy(() => import("./components/history-tab").then(m => ({ default: m.HistoryTab })));

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: ChartLineUp },
  { id: 'plans', label: 'Plans', icon: CreditCard },
  { id: 'history', label: 'History', icon: Clock },
]

export default function BillingPage() {
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'overview',
    clearOnDefault: true
  });

  const { customerData, isLoading } = useBillingData();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [hasLoadedInvoices, setHasLoadedInvoices] = useState(false);

  // Capture invoice data once when it first loads
  useEffect(() => {
    if (!isLoading && customerData?.invoices && !hasLoadedInvoices) {
      setInvoices(customerData.invoices as Invoice[]);
      setHasLoadedInvoices(true);
    }
  }, [customerData?.invoices, isLoading, hasLoadedInvoices]);

  const navigateToPlans = () => {
    setActiveTab('plans');
  };

  return (
    <TabLayout
      title="Billing & Subscription"
      description="Manage your subscription, usage, and billing preferences"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="border-b">
          <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer data-[state=active]:shadow-none"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <Suspense fallback={<TabSkeleton />}>
            <OverviewTab onNavigateToPlans={navigateToPlans} />
          </Suspense>
        </TabsContent>
        <TabsContent value="plans">
          <Suspense fallback={<TabSkeleton />}>
            <PlansTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="history">
          <Suspense fallback={<TabSkeleton />}>
            <HistoryTab invoices={invoices} customerData={customerData as Customer} isLoading={isLoading && !hasLoadedInvoices} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </TabLayout>
  );
} 