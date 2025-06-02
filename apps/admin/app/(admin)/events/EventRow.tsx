"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  Globe,
  User,
  Clock,
  Copy as CopyIcon,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ClickhouseEvent } from "./actions";

function tryParseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

function copyToClipboard(text: string) {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text);
  }
}

export function EventRow({ event }: { event: ClickhouseEvent }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const properties = tryParseJSON(event.properties || "{}");
  const date = new Date(event.time);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const formattedTime = date.toLocaleString();

  const getEventBadgeVariant = (eventName: string) => {
    switch (eventName) {
      case "pageview": return "default";
      case "click": return "secondary";
      case "error": return "destructive";
      default: return "outline";
    }
  };

  function handleCopy() {
    copyToClipboard(JSON.stringify(properties, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 w-full text-left cursor-pointer hover:bg-muted/50 transition-colors",
          open && "bg-muted/30"
        )}>
          <Badge variant={getEventBadgeVariant(event.event_name)} className="min-w-[80px] justify-center text-xs">
            {event.event_name}
          </Badge>
          
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{event.path || "/"}</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
              <div className="hidden md:flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="truncate max-w-[120px]" title={event.client_id}>
                  {event.client_id}
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[120px]" title={event.session_id}>
                  {event.session_id.slice(-8)}
                </span>
              </div>
              <div className="md:hidden">
                Client: {event.client_id.slice(0, 8)}...
              </div>
            </div>
          </div>

          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-4 py-4 border-t bg-muted/20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Event Details</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs truncate max-w-[160px]" title={event.id}>
                    {event.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="text-xs">{formattedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="text-xs truncate max-w-[160px]" title={event.url}>
                    {event.url}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referrer:</span>
                  <span className="text-xs truncate max-w-[160px]" title={event.referrer || "-"}>
                    {event.referrer || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">User & Device</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP:</span>
                  <span className="text-xs">{event.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Browser:</span>
                  <span className="text-xs">{event.browser_name} {event.browser_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OS:</span>
                  <span className="text-xs">{event.os_name} {event.os_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-xs">
                    {[event.city, event.region, event.country].filter(Boolean).join(", ") || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">Properties</h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="h-7 text-xs"
              >
                <CopyIcon className="h-3 w-3 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="bg-muted text-foreground rounded-md p-3 text-xs font-mono overflow-auto max-h-[200px] border">
              {JSON.stringify(properties, null, 2)}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function EventRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-6 w-20 rounded" />
      <Skeleton className="h-4 w-16 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 rounded mb-1" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <Skeleton className="h-4 w-4 rounded" />
    </div>
  );
} 