"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    CreditCard,
    DollarSign,
    TrendingUp,
    Settings,
    Zap,
    Shield,
    CheckCircle,
    AlertCircle,
    Copy,
    ExternalLink,
    Webhook,
    Key,
    Database,
    Check,
    Info
} from "lucide-react";
import { toast } from "sonner";

type OnboardingStep = 'overview' | 'webhook' | 'testing' | 'complete';

export default function RevenuePage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('overview');
    const [webhookToken, setWebhookToken] = useState('');
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [webhookSecret, setWebhookSecret] = useState('');
    const [copied, setCopied] = useState(false);

    // Generate webhook token on component mount
    useState(() => {
        if (!webhookToken) {
            setWebhookToken(`wh_${Math.random().toString(36).substring(2, 15)}`);
        }
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${label} copied to clipboard`);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateWebhookSecret = () => {
        const secret = `whsec_${Math.random().toString(36).substring(2, 30)}`;
        setWebhookSecret(secret);
        toast.success('Webhook secret generated');
    };

    const webhookUrl = `https://basket.databuddy.cc/stripe/webhook/${webhookToken}`;

    return (
        <div className="p-3 sm:p-4 max-w-[1600px] mx-auto">
            <header className="border-b pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
                        <p className="text-muted-foreground">Track payments, refunds, and revenue metrics</p>
                    </div>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="border-b relative">
                    <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
                        <TabsTrigger
                            value="overview"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Overview
                            {activeTab === 'overview' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Database className="h-4 w-4 mr-2" />
                            Analytics
                            {activeTab === 'analytics' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                            {activeTab === 'settings' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>
                                Your revenue analytics will appear here once Stripe is connected
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">No revenue data yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Connect your Stripe account to start tracking revenue metrics
                                </p>
                                <Button onClick={() => setActiveTab('settings')}>
                                    Set up Stripe Integration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Analytics</CardTitle>
                            <CardDescription>
                                Detailed revenue insights and trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">Analytics coming soon</h3>
                                <p className="text-muted-foreground">
                                    Advanced revenue analytics will be available here
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    {/* Integration Status Alert */}
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Stripe Integration Required
                            </CardTitle>
                            <CardDescription>
                                Connect your Stripe account to start tracking revenue analytics automatically.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Onboarding Flow */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-500" />
                                DataBuddy Stripe Integration
                            </CardTitle>
                            <CardDescription>
                                Connect your Stripe account to track revenue analytics automatically
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Step Indicator */}
                            <div className="flex items-center gap-4">
                                {(['overview', 'webhook', 'testing', 'complete'] as OnboardingStep[]).map((step, index) => (
                                    <div key={step} className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${onboardingStep === step
                                            ? 'bg-blue-500 text-white'
                                            : index < (['overview', 'webhook', 'testing', 'complete'] as OnboardingStep[]).indexOf(onboardingStep)
                                                ? 'bg-green-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {index < (['overview', 'webhook', 'testing', 'complete'] as OnboardingStep[]).indexOf(onboardingStep) ? (
                                                <CheckCircle className="h-4 w-4" />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>
                                        {index < 3 && <div className="w-8 h-px bg-border" />}
                                    </div>
                                ))}
                            </div>

                            {/* Step Content */}
                            {onboardingStep === 'overview' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/20 dark:border-blue-800">
                                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What you'll get:</h3>
                                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                Real-time payment tracking
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                Revenue analytics and trends
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                Refund and chargeback monitoring
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                Customer payment insights
                                            </li>
                                        </ul>
                                    </div>
                                    <Button onClick={() => setOnboardingStep('webhook')} className="w-full">
                                        Start Integration
                                    </Button>
                                </div>
                            )}

                            {onboardingStep === 'webhook' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium mb-3">Step 1: Configure Stripe Webhook</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="webhook-url">Webhook Endpoint URL</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        id="webhook-url"
                                                        value={webhookUrl}
                                                        readOnly
                                                        className="font-mono text-sm"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Add this URL to your Stripe webhook endpoints
                                                </p>
                                            </div>

                                            <div>
                                                <Label htmlFor="webhook-secret">Webhook Signing Secret</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        id="webhook-secret"
                                                        value={webhookSecret}
                                                        placeholder="whsec_..."
                                                        className="font-mono text-sm"
                                                        onChange={(e) => setWebhookSecret(e.target.value)}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateWebhookSecret}
                                                    >
                                                        Generate
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Get this from your Stripe webhook endpoint settings
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="live-mode"
                                                    checked={isLiveMode}
                                                    onCheckedChange={setIsLiveMode}
                                                />
                                                <Label htmlFor="live-mode">Live Mode</Label>
                                                <Badge variant={isLiveMode ? "default" : "secondary"}>
                                                    {isLiveMode ? "Production" : "Test"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-amber-900">Stripe Dashboard Setup</h4>
                                                <p className="text-sm text-amber-800 mt-1">
                                                    You'll need to add this webhook URL in your Stripe Dashboard under
                                                    Developers → Webhooks → Add endpoint
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Open Stripe Dashboard
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setOnboardingStep('overview')}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setOnboardingStep('testing')}
                                            disabled={!webhookSecret}
                                            className="flex-1"
                                        >
                                            Continue to Testing
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {onboardingStep === 'testing' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium mb-3">Step 2: Test Integration</h3>
                                        <div className="space-y-4">
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 className="font-medium text-green-900 mb-2">Test with Stripe CLI</h4>
                                                <div className="space-y-2">
                                                    <code className="block bg-green-100 p-2 rounded text-sm font-mono text-green-800">
                                                        stripe payment_intents create \<br />
                                                        &nbsp;&nbsp;--amount 2000 \<br />
                                                        &nbsp;&nbsp;--currency usd \<br />
                                                        &nbsp;&nbsp;--client-reference-id "sess_db_test_123" \<br />
                                                        &nbsp;&nbsp;--metadata[user_id]="user_test_123"
                                                    </code>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(
                                                            'stripe payment_intents create --amount 2000 --currency usd --client-reference-id "sess_db_test_123" --metadata[user_id]="user_test_123"',
                                                            'Test command'
                                                        )}
                                                    >
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy Command
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-900 mb-2">Integration Status</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                        <span>Waiting for test webhook...</span>
                                                    </div>
                                                    <p className="text-xs text-blue-800">
                                                        Create a test payment in Stripe to verify the integration
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setOnboardingStep('webhook')}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setOnboardingStep('complete')}
                                            className="flex-1"
                                        >
                                            Complete Setup
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {onboardingStep === 'complete' && (
                                <div className="space-y-4">
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-2">Integration Complete!</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Your Stripe account is now connected to DataBuddy
                                        </p>
                                    </div>

                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-900 mb-2">What's Next?</h4>
                                        <ul className="space-y-1 text-sm text-green-800">
                                            <li>• Revenue data will appear in the Overview tab</li>
                                            <li>• Analytics will be available within 24 hours</li>
                                            <li>• You'll receive real-time payment notifications</li>
                                        </ul>
                                    </div>

                                    <Button
                                        onClick={() => setActiveTab('overview')}
                                        className="w-full"
                                    >
                                        View Revenue Dashboard
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Configuration Summary */}
                    {onboardingStep !== 'overview' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Configuration Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Webhook Token</Label>
                                        <p className="font-mono">{webhookToken}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Mode</Label>
                                        <p>{isLiveMode ? 'Production' : 'Test'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                                        <p className="font-mono text-xs break-all">{webhookUrl}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}