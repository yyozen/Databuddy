"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CreditCard, History, Settings, CheckCircle2, XCircle, Download, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock data - replace with actual API calls
const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Up to 3 websites",
      "Basic analytics",
      "24-hour data retention",
      "Community support"
    ],
    current: true,
    popular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    description: "For growing businesses",
    features: [
      "Unlimited websites",
      "Advanced analytics",
      "30-day data retention",
      "Priority support",
      "Custom domains",
      "API access"
    ],
    current: false,
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Unlimited data retention",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment"
    ],
    current: false,
    popular: false
  }
];

const billingHistory = [
  {
    id: "INV001",
    date: "2024-03-01",
    amount: "$29.00",
    status: "paid",
    description: "Pro Plan - Monthly",
    pdfUrl: "#"
  },
  {
    id: "INV002",
    date: "2024-02-01",
    amount: "$29.00",
    status: "paid",
    description: "Pro Plan - Monthly",
    pdfUrl: "#"
  },
  {
    id: "INV003",
    date: "2024-01-01",
    amount: "$29.00",
    status: "paid",
    description: "Pro Plan - Monthly",
    pdfUrl: "#"
  }
];

const paymentMethods = [
  {
    id: "pm_1",
    type: "card",
    last4: "4242",
    brand: "visa",
    expiry: "12/25",
    default: true,
    name: "John Doe"
  },
  {
    id: "pm_2",
    type: "card",
    last4: "8888",
    brand: "mastercard",
    expiry: "06/24",
    default: false,
    name: "John Doe"
  }
];

function BillingPage() {
  const [activeTab, setActiveTab] = useState("subscription");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (plan: string) => {
    setIsLoading(true);
    try {
      // Add your upgrade logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Successfully upgraded to ${plan} plan`);
    } catch (error) {
      toast.error("Failed to upgrade plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setIsLoading(true);
    try {
      // Add your payment method logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Payment method added successfully");
    } catch (error) {
      toast.error("Failed to add payment method");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setIsLoading(true);
    try {
      // Add your download logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to download invoice");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 max-w-[1600px] mx-auto">
      <header className="border-b pb-3">
        <h1 className="text-2xl font-semibold">Billing & Subscription</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription, billing history, and payment methods
        </p>
      </header>

      <Tabs defaultValue="subscription" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="h-9 bg-transparent p-0 w-full justify-start gap-1 border-b">
          <TabsTrigger 
            value="subscription" 
            className="text-xs h-9 px-4 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="text-xs h-9 px-4 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
          >
            <History className="h-4 w-4 mr-2" />
            Billing History
          </TabsTrigger>
          <TabsTrigger 
            value="payment" 
            className="text-xs h-9 px-4 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
          >
            <Settings className="h-4 w-4 mr-2" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.current ? "border-primary" : ""} ${plan.popular ? "border-2 border-primary" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {plan.current && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
                        Current Plan
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={plan.current ? "outline" : "default"}
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={plan.current || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : plan.current ? (
                      "Current Plan"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View and download your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{invoice.description}</div>
                      <div className="text-sm text-muted-foreground">
                        Invoice {invoice.id} • {new Date(invoice.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{invoice.amount}</div>
                        <div className="text-sm text-muted-foreground capitalize">{invoice.status}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-6 w-6 mr-4" />
                      <div>
                        <div className="font-medium capitalize">
                          {method.brand} •••• {method.last4}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires {method.expiry}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.default && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Default
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator className="my-4" />
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleAddPaymentMethod}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment Method
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BillingPage; 