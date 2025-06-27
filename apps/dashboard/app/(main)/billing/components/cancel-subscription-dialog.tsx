"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, LightningIcon, XIcon } from "@phosphor-icons/react";

interface CancelSubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel: (immediate: boolean) => void;
    planName: string;
    currentPeriodEnd?: number;
    isLoading: boolean;
}

export function CancelSubscriptionDialog({
    open,
    onOpenChange,
    onCancel,
    planName,
    currentPeriodEnd,
    isLoading
}: CancelSubscriptionDialogProps) {
    const periodEndDate = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl">Cancel {planName}</DialogTitle>
                    <DialogDescription>
                        Choose how you'd like to cancel your subscription
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <button
                        onClick={() => {
                            onCancel(false);
                            onOpenChange(false);
                        }}
                        disabled={isLoading}
                        className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-default"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <CalendarIcon size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium">Cancel at period end</div>
                                <div className="text-sm text-muted-foreground">Recommended</div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground ml-11">
                            {periodEndDate ? (
                                <>Keep access until {periodEndDate}. No additional charges.</>
                            ) : (
                                <>Keep access until your current billing period ends. No additional charges.</>
                            )}
                        </p>
                    </button>

                    <button
                        onClick={() => {
                            onCancel(true);
                            onOpenChange(false);
                        }}
                        disabled={isLoading}
                        className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-default"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <LightningIcon size={16} className="text-orange-600" />
                            </div>
                            <div>
                                <div className="font-medium">Cancel immediately</div>
                                <div className="text-sm text-muted-foreground">Lose access now</div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground ml-11">
                            Access ends immediately. You'll be invoiced for any pending usage charges.
                        </p>
                    </button>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="cursor-pointer"
                    >
                        Keep subscription
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 