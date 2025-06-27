"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon, StarIcon, CrownIcon, LightningIcon, ClockIcon } from "@phosphor-icons/react";
import { useBillingData, type Plan } from "../data/billing-data";
import { useBilling } from "@/app/(main)/billing/hooks/use-billing";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NoPaymentMethodDialog } from "./no-payment-method-dialog";

function PlanCard({ plan, onUpgrade, isLoading }: { plan: Plan, onUpgrade: (id: string) => void, isLoading: boolean }) {
  const isCurrent = plan.scenario === 'active';
  const isCanceled = plan.scenario === 'canceled';
  const isScheduled = plan.scenario === 'scheduled';
  const isDowngrade = plan.scenario === 'downgrade';
  const isUpgrade = plan.scenario === 'upgrade';
  const isPopular = plan.name.toLowerCase().includes('pro') && !isCurrent;
  const isFree = plan.id.includes('free');

  const getBadgeInfo = () => {
    if (isCurrent) {
      return {
        badge: (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-lg">
            <CrownIcon size={12} className="mr-1" />
            Current Plan
          </Badge>
        ),
        show: true
      };
    }

    if (isCanceled) {
      return {
        badge: (
          <Badge variant="destructive" className="shadow-lg">
            Cancelled
          </Badge>
        ),
        show: true
      };
    }

    if (isScheduled) {
      return {
        badge: (
          <Badge className="bg-blue-500 hover:bg-blue-600 shadow-lg">
            <ClockIcon size={12} className="mr-1" />
            Scheduled
          </Badge>
        ),
        show: true
      };
    }

    if (isPopular) {
      return {
        badge: (
          <Badge className="shadow-lg">
            <StarIcon size={12} className="mr-1" />
            Most Popular
          </Badge>
        ),
        show: true
      };
    }

    return { badge: null, show: false };
  };

  const badgeInfo = getBadgeInfo();

  const getButtonConfig = () => {
    if (isLoading) {
      return {
        text: "Processing...",
        disabled: true,
        variant: "default" as const
      };
    }

    if (isCurrent && !isCanceled) {
      return {
        text: "Current Plan",
        disabled: true,
        variant: "outline" as const
      };
    }

    if (isCanceled) {
      return {
        text: (
          <>
            <LightningIcon size={16} className="mr-2" />
            Reactivate Plan
          </>
        ),
        disabled: false,
        variant: "default" as const
      };
    }

    if (isScheduled) {
      return {
        text: "Scheduled",
        disabled: true,
        variant: "outline" as const
      };
    }

    // For upgrade, downgrade, or new plans
    return {
      text: (
        <>
          {!isFree && <LightningIcon size={16} className="mr-2" />}
          {plan.button_text || plan.buttonText || (isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Select Plan")}
        </>
      ),
      disabled: false,
      variant: "default" as const
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-lg h-full flex flex-col",
      isCurrent && "ring-2 ring-primary/20 border-primary/50",
      isPopular && "ring-2 ring-primary/20 border-primary/50 shadow-md"
    )}>
      {/* Badge positioned absolutely at top */}
      {badgeInfo.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          {badgeInfo.badge}
        </div>
      )}

      {/* Header with consistent padding */}
      <CardHeader className={cn(
        "text-center pb-3 flex-shrink-0",
        badgeInfo.show ? "pt-10" : "pt-4"
      )}>
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>

          <div className="space-y-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold tracking-tight">{plan.price.primary_text}</span>
              {plan.price.secondary_text && plan.price.secondary_text.trim() && (
                <span className="text-muted-foreground text-sm font-medium">{plan.price.secondary_text}</span>
              )}
            </div>

            {/* Free Trial Info */}
            {plan.free_trial && plan.free_trial.trial_available && !isCurrent && (
              <div className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full inline-block font-medium">
                🎉 {plan.free_trial.length} {plan.free_trial.duration} free trial
              </div>
            )}

            {plan.current_period_end && (
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full inline-block">
                {plan.canceled_at ? (
                  <span>Access until {new Date(plan.current_period_end).toLocaleDateString()}</span>
                ) : plan.status === 'scheduled' ? (
                  <span>Starts {new Date(plan.current_period_end).toLocaleDateString()}</span>
                ) : isCurrent ? (
                  <span>Renews {new Date(plan.current_period_end).toLocaleDateString()}</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content area that grows to fill space */}
      <CardContent className="flex-1 flex flex-col px-4 pb-4">
        {/* Features list */}
        <div className="space-y-2 flex-1 mb-4">
          {plan.items.map((item, index) => {
            const getFeatureText = () => {
              let mainText = item.primary_text || item.primaryText || '';

              // Add interval information if it exists and isn't already in the text
              if (item.interval && !mainText.toLowerCase().includes('per ') && !mainText.toLowerCase().includes('/')) {
                if (item.interval === 'day') {
                  mainText += ' per day';
                } else if (item.interval === 'month') {
                  mainText += ' per month';
                } else if (item.interval === 'year') {
                  mainText += ' per year';
                }
              }

              return mainText;
            };

            return (
              <div key={item.feature_id || index} className="flex items-start gap-2">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <CheckIcon size={12} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground leading-snug">
                    {getFeatureText()}
                  </div>
                  {(item.secondary_text || item.secondaryText) && (
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {item.secondary_text || item.secondaryText}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Button always at bottom */}
        <Button
          onClick={() => onUpgrade(plan.id)}
          disabled={buttonConfig.disabled}
          variant={buttonConfig.variant}
          className={cn(
            "w-full font-semibold transition-all duration-200",
            !buttonConfig.disabled && "cursor-pointer",
            buttonConfig.disabled && "cursor-default",
            isPopular && !buttonConfig.disabled && "shadow-md hover:shadow-lg"
          )}
          size="default"
        >
          {buttonConfig.text}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlansTab() {
  const { subscriptionData, isLoading: isDataLoading, refetch } = useBillingData();
  const { onUpgrade, onManageBilling, isLoading: isActionLoading, showNoPaymentDialog, setShowNoPaymentDialog } = useBilling(refetch);

  if (isDataLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[480px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  const plans = subscriptionData?.list || [];

  return (
    <>
      <NoPaymentMethodDialog
        open={showNoPaymentDialog}
        onOpenChange={setShowNoPaymentDialog}
        onConfirm={onManageBilling}
      />

      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground text-md max-w-2xl mx-auto text-center">
            Select the perfect plan for your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded border flex items-center justify-center mx-auto mb-4">
              <CrownIcon size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Plans Available</h3>
            <p className="text-muted-foreground">
              Plans will appear here once they're configured.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {plans.map((plan: Plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onUpgrade={onUpgrade}
                isLoading={isActionLoading}
              />
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground text-center">
            All plans include our core features. Need help choosing?{" "}
            <Button variant="link" className="h-auto p-0 text-sm cursor-pointer hover:underline" onClick={onManageBilling}>
              Contact support
            </Button>
          </p>
        </div>
      </div>
    </>
  );
} 