"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Website } from "@/hooks/use-websites";
import { useWebsitesStore } from "@/stores/use-websites-store";

// Helper to normalize a domain (remove protocol, www, and trailing slash)
function normalizeDomain(domain: string): string {
  // Remove protocol (http://, https://)
  let normalized = domain.trim().toLowerCase();
  normalized = normalized.replace(/^(https?:\/\/)?(www\.)?/i, '');
  
  // Remove trailing slash if present
  normalized = normalized.replace(/\/+$/, '');
  
  return normalized;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z.string()
    .min(1, "Domain is required")
    .transform(val => normalizeDomain(val)), // Normalize before validation
  domainId: z.string().optional(),
});

interface WebsiteDialogProps {
  website?: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  verifiedDomains?: Array<{
    id: string;
    name: string;
    verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
  }>;
  trigger?: React.ReactNode;
  initialValues?: {
    name?: string;
    domain?: string;
    domainId?: string;
  } | null;
}

export function WebsiteDialog({
  website,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  verifiedDomains = [],
  trigger,
  initialValues = null,
}: WebsiteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setSelectedWebsite = useWebsitesStore(state => state.setSelectedWebsite);
  const websites = useWebsitesStore(state => state.websites);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || website?.name || "",
      domain: initialValues?.domain || website?.domain || "",
      domainId: initialValues?.domainId || website?.domainId || undefined,
    },
  });

  // Reset form when dialog opens or initialValues/website changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name || website?.name || "",
        domain: initialValues?.domain || website?.domain || "",
        domainId: initialValues?.domainId || website?.domainId || undefined,
      });
    }
  }, [form, initialValues, website, open]);

  const handleClose = () => {
    setSelectedWebsite(null);
    onOpenChange(false);
    // Don't reset form here, we'll do it when the dialog opens next time
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    // Make domainId required if verifiedDomains are available
    if (verifiedDomains.length > 0 && !data.domainId) {
      form.setError('domainId', { 
        type: 'required', 
        message: 'Please select a verified domain' 
      });
      return;
    }
    
    // Check for duplicate domains (normalized)
    if (!website) { // Only check when creating new website
      const normalizedInput = normalizeDomain(data.domain);
      const domainExists = websites.some(w => {
        const normalizedExisting = normalizeDomain(w.domain);
        return normalizedExisting === normalizedInput;
      });
      
      if (domainExists) {
        form.setError('domain', {
          type: 'manual',
          message: 'A website with this domain already exists'
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save website");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if we're editing an existing website
  const isEditing = !!website;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Website" : "Add Website"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your website details below."
              : "Add a new website to your account."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="example.com" 
                      {...field} 
                      disabled={isEditing} 
                      className={isEditing ? "bg-muted" : ""}
                      onChange={(e) => {
                        // Pass raw value to form, normalization happens in schema
                        field.onChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {!isEditing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter domain without protocol (e.g., example.com)
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Domain cannot be changed after creation. Visit the Domains page to manage your domains.
                    </p>
                  )}
                </FormItem>
              )}
            />
            {verifiedDomains.length > 0 && (
              <FormField
                control={form.control}
                name="domainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verified Domain</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Find the selected domain and update the domain field
                        const selectedDomain = verifiedDomains.find(d => d.id === value);
                        if (selectedDomain) {
                          // Use normalized domain name
                          form.setValue('domain', normalizeDomain(selectedDomain.name));
                        }
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a verified domain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {verifiedDomains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 