'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw, Trash2, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { checkDomainVerification, regenerateVerificationToken, deleteDomain, forceVerifyDomain } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Domain {
  id: string;
  name: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  verifiedAt: string | null;
}

interface DomainActionsProps {
  domain: Domain;
}

export function DomainActions({ domain }: DomainActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showForceVerifyDialog, setShowForceVerifyDialog] = useState(false);
  const [isForceVerifyPending, startForceVerifyTransition] = useTransition();

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await checkDomainVerification(domain.id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data?.verified) {
        toast.success("Domain verified");
      } else {
        toast.error(result.data?.message || "Verification failed");
      }
    } catch (error) {
      toast.error("Failed to verify domain");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    setLoading(true);
    try {
      const result = await regenerateVerificationToken(domain.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Token regenerated");
      }
    } catch (error) {
      toast.error("Failed to regenerate token");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteDomain(domain.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Domain deleted");
        setShowDeleteDialog(false);
      }
    } catch (error) {
      toast.error("Failed to delete domain");
    } finally {
      setLoading(false);
    }
  };

  const handleForceVerify = async () => {
    startForceVerifyTransition(async () => {
      const result = await forceVerifyDomain(domain.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Domain force verified");
        setShowForceVerifyDialog(false);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {domain.verificationStatus === "PENDING" && (
            <>
              <DropdownMenuItem onClick={handleVerify}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRegenerateToken}>
                <RefreshCw className="mr-2 h-4 w-4" />
                New Token
              </DropdownMenuItem>
            </>
          )}
          {domain.verificationStatus !== "VERIFIED" && (
            <>
              {domain.verificationStatus === "PENDING" && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setShowForceVerifyDialog(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Force Verify
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Domain"
        description={`Delete ${domain.name}? This cannot be undone.`}
      />

      <AlertDialog open={showForceVerifyDialog} onOpenChange={setShowForceVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force verify domain?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <strong>{domain.name}</strong> as verified without DNS validation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isForceVerifyPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceVerify}
              disabled={isForceVerifyPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isForceVerifyPending ? "Verifying..." : "Force Verify"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 