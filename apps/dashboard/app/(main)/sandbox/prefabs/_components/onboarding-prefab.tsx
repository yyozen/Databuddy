"use client";

import React from "react";
import { useState } from "react";
import {
    CheckIcon,
    ArrowRightIcon,
    BuildingsIcon,
    AppStoreLogoIcon,
    GlobeIcon,
    CodeIcon,
    RocketLaunchIcon,
    Icon,
    HardDrivesIcon,
    ClipboardIcon,
    InfoIcon,
    ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { frameworks, getInstallationGuide } from "./onboarding-data";

// Framework Components

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: Icon;
}

const steps: OnboardingStep[] = [
    {
        id: "organization",
        title: "Setup Organization",
        description: "Create or join an organization to get started.",
        icon: BuildingsIcon,
    },
    {
        id: "company",
        title: "Company Details",
        description: "Tell us a bit about your company.",
        icon: AppStoreLogoIcon,
    },
    {
        id: "website",
        title: "Add Your Website",
        description: "Enter the URL of the website you want to track.",
        icon: GlobeIcon,
    },
    {
        id: "framework",
        title: "Select Your Stack",
        description: "Choose your tech stack for tailored setup instructions.",
        icon: HardDrivesIcon,
    },
    {
        id: "installation",
        title: "Installation",
        description: "Follow the instructions to install the tracking script.",
        icon: CodeIcon,
    },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
    },
};

const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4 },
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: { duration: 0.3 },
    },
};

const progressVariants = {
    hidden: { scaleX: 0 },
    visible: {
        scaleX: 1,
        transition: { duration: 0.8 },
    },
};

export function OnboardingPrefab() {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [formData, setFormData] = useState({
        organizationName: "",
        companyCategory: "",
        companySize: "",
        websiteUrl: "",
        framework: "nextjs",
    });

    const handleNext = () => {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const progress = ((currentStep) / (steps.length - 1)) * 100;

    const InstallationGuide = () => {
        const selectedFramework = frameworks.find((f) => f.id === formData.framework);
        const installation = getInstallationGuide(formData.framework, "your-website-id");

        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
            >
                <motion.div
                    className="flex items-center gap-3"
                    variants={itemVariants}
                >
                    {selectedFramework &&
                        React.createElement(selectedFramework.icon, { className: "h-8 w-8" })}
                    <div>
                        <h3 className="text-lg font-semibold">
                            {installation.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Follow these steps to integrate Databuddy into your {selectedFramework?.name} project.
                        </p>
                    </div>
                </motion.div>

                <motion.div className="space-y-4" variants={itemVariants}>
                    {installation.steps.map((step, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="space-y-2"
                        >
                            <h4 className="font-medium text-sm">{step.title}</h4>
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                            >
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                                    <code>{step.code}</code>
                                </pre>
                                <Button
                                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                                    onClick={() => {
                                        navigator.clipboard.writeText(step.code);
                                        // You could add a toast here
                                    }}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <ClipboardIcon className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>

                {installation.tip && (
                    <motion.div
                        className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400"
                        variants={itemVariants}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <div className="flex items-start gap-2">
                            <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Pro Tip:</p>
                                <p>{installation.tip}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800"
                    variants={itemVariants}
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="h-5 w-5 text-white" weight="bold" />
                        </div>
                        <div>
                            <p className="font-medium text-green-800 dark:text-green-400">Ready to track!</p>
                            <p className="text-sm text-green-600 dark:text-green-500">
                                Your website will start collecting analytics data once the code is deployed.
                            </p>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-400">
                        View Docs
                        <ArrowSquareOutIcon className="ml-1 h-3 w-3" />
                    </Button>
                </motion.div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
            <motion.div
                className="w-full max-w-2xl space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Progress Header */}
                <motion.div className="space-y-4" variants={itemVariants}>
                    <motion.div
                        className="flex items-center justify-between"
                        variants={itemVariants}
                    >
                        <h2 className="font-semibold text-2xl">Databuddy Setup</h2>
                        <Badge variant="outline" className="text-sm">
                            Step {currentStep + 1} of {steps.length}
                        </Badge>
                    </motion.div>

                    <motion.div variants={progressVariants}>
                        <Progress value={progress} className="h-2" />
                    </motion.div>

                    <motion.div
                        className="flex items-center justify-between"
                        variants={itemVariants}
                    >
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <motion.div
                                        className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                                            isCompleted
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : isCurrent
                                                    ? "border-primary text-primary"
                                                    : "border-muted-foreground/30 text-muted-foreground"
                                        )}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        animate={
                                            isCompleted
                                                ? { scale: [1, 1.1, 1], transition: { duration: 0.3 } }
                                                : {}
                                        }
                                    >
                                        <AnimatePresence mode="wait">
                                            {isCompleted ? (
                                                <motion.div
                                                    key="check"
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0, rotate: 180 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <CheckIcon className="w-5 h-5" weight="bold" />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="icon"
                                                    initial={{ scale: 0, rotate: 180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0, rotate: -180 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <Icon className="w-5 h-5" weight="duotone" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                    {index < steps.length - 1 && (
                                        <motion.div
                                            className={cn(
                                                "flex-1 h-0.5 mx-4 transition-all origin-left",
                                                isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                                            )}
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: isCompleted ? 1 : 0.3 }}
                                            transition={{ duration: 0.5, delay: isCompleted ? 0.2 : 0 }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <motion.div
                                        whileHover={{ rotate: 5, scale: 1.1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {React.createElement(steps[currentStep].icon, {
                                            className: "w-6 h-6",
                                            weight: "duotone",
                                        })}
                                    </motion.div>
                                    {steps[currentStep].title}
                                </CardTitle>
                                <CardDescription>{steps[currentStep].description}</CardDescription>
                            </motion.div>
                        </CardHeader>

                        <CardContent className="p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="min-h-[320px] flex flex-col justify-center"
                                >
                                    {currentStep === 0 && (
                                        <motion.div
                                            className="w-full max-w-md mx-auto text-center"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <motion.div variants={itemVariants}>
                                                <BuildingsIcon
                                                    className="w-12 h-12 mx-auto mb-4 text-primary/30"
                                                    weight="duotone"
                                                />
                                            </motion.div>
                                            <motion.h3
                                                className="text-lg font-semibold mb-2"
                                                variants={itemVariants}
                                            >
                                                What's the name of your organization?
                                            </motion.h3>
                                            <motion.p
                                                className="text-muted-foreground text-sm mb-6"
                                                variants={itemVariants}
                                            >
                                                This will be your workspace where you can invite team members.
                                            </motion.p>
                                            <motion.div variants={itemVariants}>
                                                <Input
                                                    id="organizationName"
                                                    placeholder="Acme Inc."
                                                    value={formData.organizationName}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, organizationName: e.target.value }))
                                                    }
                                                    className="text-center h-12"
                                                />
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {currentStep === 1 && (
                                        <motion.div
                                            className="w-full max-w-md mx-auto"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <motion.div
                                                className="text-center mb-6"
                                                variants={itemVariants}
                                            >
                                                <AppStoreLogoIcon
                                                    className="w-12 h-12 mx-auto mb-4 text-primary/30"
                                                    weight="duotone"
                                                />
                                                <h3 className="text-lg font-semibold mb-2">
                                                    Tell us about your company
                                                </h3>
                                                <p className="text-muted-foreground text-sm">
                                                    This helps us provide you with relevant insights and personalized recommendations.
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                className="space-y-4"
                                                variants={itemVariants}
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="companyCategory" className="text-sm font-medium">
                                                        What type of business are you in?
                                                    </Label>
                                                    <Select
                                                        value={formData.companyCategory}
                                                        onValueChange={(value) =>
                                                            setFormData((prev) => ({ ...prev, companyCategory: value }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue placeholder="Select your business type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="saas">
                                                                <div className="flex items-center gap-3">
                                                                    <span>💻</span>
                                                                    <div>
                                                                        <div className="font-medium">SaaS</div>
                                                                        <div className="text-xs text-muted-foreground">Software as a Service</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="ecommerce">
                                                                <div className="flex items-center gap-3">
                                                                    <span>🛒</span>
                                                                    <div>
                                                                        <div className="font-medium">E-commerce</div>
                                                                        <div className="text-xs text-muted-foreground">Online retail</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="marketing">
                                                                <div className="flex items-center gap-3">
                                                                    <span>📈</span>
                                                                    <div>
                                                                        <div className="font-medium">Marketing Agency</div>
                                                                        <div className="text-xs text-muted-foreground">Marketing & Creative services</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="blog">
                                                                <div className="flex items-center gap-3">
                                                                    <span>📝</span>
                                                                    <div>
                                                                        <div className="font-medium">Content & Media</div>
                                                                        <div className="text-xs text-muted-foreground">Blog, news, or media site</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="other">
                                                                <div className="flex items-center gap-3">
                                                                    <span>🏢</span>
                                                                    <div>
                                                                        <div className="font-medium">Other</div>
                                                                        <div className="text-xs text-muted-foreground">Something else</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="companySize" className="text-sm font-medium">
                                                        How big is your team?
                                                    </Label>
                                                    <Select
                                                        value={formData.companySize}
                                                        onValueChange={(value) =>
                                                            setFormData((prev) => ({ ...prev, companySize: value }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue placeholder="Select your team size" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1-10">
                                                                <div className="flex items-center gap-3">
                                                                    <span>👤</span>
                                                                    <div>
                                                                        <div className="font-medium">1-10 employees</div>
                                                                        <div className="text-xs text-muted-foreground">Small team or startup</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="11-50">
                                                                <div className="flex items-center gap-3">
                                                                    <span>👥</span>
                                                                    <div>
                                                                        <div className="font-medium">11-50 employees</div>
                                                                        <div className="text-xs text-muted-foreground">Growing company</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="51-200">
                                                                <div className="flex items-center gap-3">
                                                                    <span>👨‍👩‍👧‍👦</span>
                                                                    <div>
                                                                        <div className="font-medium">51-200 employees</div>
                                                                        <div className="text-xs text-muted-foreground">Medium-sized business</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="201+">
                                                                <div className="flex items-center gap-3">
                                                                    <span>🏢</span>
                                                                    <div>
                                                                        <div className="font-medium">201+ employees</div>
                                                                        <div className="text-xs text-muted-foreground">Large enterprise</div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {currentStep === 2 && (
                                        <motion.div
                                            className="w-full max-w-md mx-auto text-center"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <motion.div variants={itemVariants}>
                                                <GlobeIcon
                                                    className="w-12 h-12 mx-auto mb-4 text-primary/30"
                                                    weight="duotone"
                                                />
                                            </motion.div>
                                            <motion.h3
                                                className="text-lg font-semibold mb-2"
                                                variants={itemVariants}
                                            >
                                                What's your website's address?
                                            </motion.h3>
                                            <motion.p
                                                className="text-muted-foreground text-sm mb-6"
                                                variants={itemVariants}
                                            >
                                                We'll use this to start tracking and provide you with insights.
                                            </motion.p>
                                            <motion.div variants={itemVariants}>
                                                <Input
                                                    id="websiteUrl"
                                                    type="url"
                                                    placeholder="https://example.com"
                                                    value={formData.websiteUrl}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                                                    className="text-center h-12"
                                                />
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {currentStep === 3 && (
                                        <motion.div
                                            className="w-full max-w-4xl mx-auto"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <motion.div
                                                className="text-center mb-6"
                                                variants={itemVariants}
                                            >
                                                <HardDrivesIcon
                                                    className="w-12 h-12 mx-auto mb-4 text-primary/30"
                                                    weight="duotone"
                                                />
                                                <h3 className="text-lg font-semibold mb-2">
                                                    Choose your platform
                                                </h3>
                                                <p className="text-muted-foreground text-sm">
                                                    Select your platform or framework to get tailored installation instructions.
                                                </p>
                                            </motion.div>

                                            <motion.div variants={itemVariants}>
                                                {/* Popular frameworks first */}
                                                <div className="mb-6">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Badge variant="secondary" className="text-xs">
                                                            Popular
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            Most commonly used platforms
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                                        {frameworks.filter(f => f.popular).map((framework, index) => (
                                                            <motion.div
                                                                key={framework.id}
                                                                variants={itemVariants}
                                                                custom={index}
                                                            >
                                                                <Card
                                                                    className={cn(
                                                                        "p-3 flex flex-col items-center gap-2 cursor-pointer transition-all h-20 relative",
                                                                        formData.framework === framework.id
                                                                            ? "border-primary ring-2 ring-primary bg-primary/5"
                                                                            : "hover:border-primary/50 hover:shadow-sm"
                                                                    )}
                                                                    onClick={() => setFormData((prev) => ({ ...prev, framework: framework.id }))}
                                                                >
                                                                    <motion.div
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        transition={{ duration: 0.2 }}
                                                                    >
                                                                        <framework.icon className="h-5 w-5" />
                                                                    </motion.div>
                                                                    <span className="font-medium text-xs text-center">{framework.name}</span>
                                                                    {formData.framework === framework.id && (
                                                                        <motion.div
                                                                            className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1"
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            transition={{ duration: 0.2 }}
                                                                        >
                                                                            <CheckIcon className="h-3 w-3" weight="bold" />
                                                                        </motion.div>
                                                                    )}
                                                                </Card>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Other options */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Badge variant="outline" className="text-xs">
                                                            Other
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            Additional platforms and custom setups
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {frameworks.filter(f => !f.popular).map((framework, index) => (
                                                            <motion.div
                                                                key={framework.id}
                                                                variants={itemVariants}
                                                                custom={index}
                                                            >
                                                                <Card
                                                                    className={cn(
                                                                        "p-3 flex flex-col items-center gap-2 cursor-pointer transition-all h-20 relative",
                                                                        formData.framework === framework.id
                                                                            ? "border-primary ring-2 ring-primary bg-primary/5"
                                                                            : "hover:border-primary/50 hover:shadow-sm"
                                                                    )}
                                                                    onClick={() => setFormData((prev) => ({ ...prev, framework: framework.id }))}
                                                                >
                                                                    <motion.div
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        transition={{ duration: 0.2 }}
                                                                    >
                                                                        <framework.icon className="h-5 w-5" />
                                                                    </motion.div>
                                                                    <span className="font-medium text-xs text-center">{framework.name}</span>
                                                                    {formData.framework === framework.id && (
                                                                        <motion.div
                                                                            className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1"
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            transition={{ duration: 0.2 }}
                                                                        >
                                                                            <CheckIcon className="h-3 w-3" weight="bold" />
                                                                        </motion.div>
                                                                    )}
                                                                </Card>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Selected framework info */}
                                                {formData.framework && (
                                                    <motion.div
                                                        className="mt-6 p-4 bg-muted/50 rounded-lg"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        {(() => {
                                                            const selected = frameworks.find(f => f.id === formData.framework);
                                                            if (!selected) return null;

                                                            return (
                                                                <div className="flex items-start gap-3">
                                                                    <selected.icon className="h-8 w-8 mt-1" />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="font-medium">{selected.name}</h4>
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {selected.category}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground mb-2">
                                                                            {selected.description}
                                                                        </p>
                                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                            <span className="flex items-center gap-1">
                                                                                <CodeIcon className="h-3 w-3" weight="duotone" />
                                                                                {selected.setupMethod === 'component' ? 'Component-based setup' : 'Script tag setup'}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <CheckIcon className="h-3 w-3" weight="duotone" />
                                                                                Automatic tracking
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {currentStep === 4 && <InstallationGuide />}
                                </motion.div>
                            </AnimatePresence>
                        </CardContent>

                        <CardFooter className="flex items-center justify-between pt-6 border-t">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                                    Previous
                                </Button>
                            </motion.div>

                            {currentStep === steps.length - 1 ? (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button className="flex items-center gap-2">
                                        Finish Setup
                                        <motion.div
                                            animate={{ x: [0, 3, 0] }}
                                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                                        >
                                            <RocketLaunchIcon className="w-4 h-4" weight="bold" />
                                        </motion.div>
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={handleNext}
                                        className="flex items-center gap-2"
                                    >
                                        Next Step
                                        <motion.div
                                            animate={{ x: [0, 3, 0] }}
                                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                                        >
                                            <ArrowRightIcon className="w-4 h-4" weight="bold" />
                                        </motion.div>
                                    </Button>
                                </motion.div>
                            )}
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
} 