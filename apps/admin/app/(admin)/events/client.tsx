"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  RotateCcw, 
  Search, 
  Calendar, 
  Globe, 
  Filter,
  Clock,
  MapPin,
  Monitor,
  X,
  ChevronDown,
  Smartphone,
  Chrome,
  Settings,
  Star,
  MousePointer,
  AlertTriangle,
  Eye,
  Download,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FilterState {
  search: string;
  from: string;
  to: string;
  client_id: string;
  event_name: string;
  browser_name: string;
  os_name: string;
  country: string;
  device_type: string;
  path: string;
}

const TIME_PRESETS = [
  { 
    label: "Last hour", 
    value: "1h", 
    from: () => new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  { 
    label: "Last 24 hours", 
    value: "24h", 
    from: () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  { 
    label: "Last 7 days", 
    value: "7d", 
    from: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  { 
    label: "Last 30 days", 
    value: "30d", 
    from: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  { 
    label: "Last 90 days", 
    value: "90d", 
    from: () => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const EVENT_TYPES = [
  { label: "All Events", value: "all", icon: Star },
  { label: "Page Views", value: "pageview", icon: Eye },
  { label: "Clicks", value: "click", icon: MousePointer },
  { label: "Errors", value: "error", icon: AlertTriangle },
  { label: "Form Submissions", value: "submit", icon: FileText },
  { label: "Downloads", value: "download", icon: Download },
];

const DEVICE_TYPES = [
  { label: "All Devices", value: "all", icon: Monitor },
  { label: "Desktop", value: "desktop", icon: Monitor },
  { label: "Mobile", value: "mobile", icon: Smartphone },
  { label: "Tablet", value: "tablet", icon: Smartphone },
];

const COMMON_BROWSERS = [
  { label: "All Browsers", value: "all", icon: Chrome },
  { label: "Chrome", value: "Chrome", icon: Chrome },
  { label: "Firefox", value: "Firefox", icon: Chrome },
  { label: "Safari", value: "Safari", icon: Chrome },
  { label: "Edge", value: "Edge", icon: Chrome },
];

const COMMON_OS = [
  { label: "All OS", value: "all", icon: Settings },
  { label: "Windows", value: "Windows", icon: Settings },
  { label: "macOS", value: "macOS", icon: Settings },
  { label: "Linux", value: "Linux", icon: Settings },
  { label: "iOS", value: "iOS", icon: Settings },
  { label: "Android", value: "Android", icon: Settings },
];

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoApply, setAutoApply] = useState(true);
  
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get("search") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    client_id: searchParams.get("client_id") || "",
    event_name: searchParams.get("event_name") || "",
    browser_name: searchParams.get("browser_name") || "",
    os_name: searchParams.get("os_name") || "",
    country: searchParams.get("country") || "",
    device_type: searchParams.get("device_type") || "",
    path: searchParams.get("path") || "",
  });

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params.set(key, value);
      }
    }
    
    params.set("page", "0");
    
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      params.set("pageSize", pageSize);
    }
    
    router.push(`/events?${params.toString()}`);
  }, [filters, router, searchParams]);

  // Auto-apply filters with debounce
  useEffect(() => {
    if (!autoApply) return;
    
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [applyFilters, autoApply]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== "").length;
  }, [filters]);

  // Generate active filter badges
  const activeFilterBadges = useMemo(() => {
    const badges = [];
    const filterLabels = {
      search: "Search",
      event_name: "Event",
      from: "From",
      to: "To",
      client_id: "Website",
      browser_name: "Browser",
      os_name: "OS",
      country: "Country",
      device_type: "Device",
      path: "Path",
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        badges.push({
          key,
          label: filterLabels[key as keyof typeof filterLabels],
          value: key === "from" || key === "to" ? 
            new Date(value).toLocaleDateString() : 
            value.length > 20 ? `${value.substring(0, 20)}...` : value
        });
      }
    }
    return badges;
  }, [filters]);

  const updateFilter = (key: keyof FilterState) => (value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: "" }));
  };

  const applyTimePreset = (preset: typeof TIME_PRESETS[0]) => {
    setFilters(prev => ({
      ...prev,
      from: preset.from().split('T')[0], // Convert to YYYY-MM-DD format
      to: new Date().toISOString().split('T')[0]
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      from: "",
      to: "",
      client_id: "",
      event_name: "",
      browser_name: "",
      os_name: "",
      country: "",
      device_type: "",
      path: "",
    });
    
    const params = new URLSearchParams();
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      params.set("pageSize", pageSize);
    }
    params.set("page", "0");
    
    router.push(`/events?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Quick Search & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
            <Input
              placeholder="Search events, URLs, properties..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => updateFilter("search")(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick Time Presets */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Quick Time
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-1">
                {TIME_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => applyTimePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 ml-1 transition-transform",
              showAdvanced && "rotate-180"
            )} />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilterBadges.map((badge) => (
            <Badge key={badge.key} variant="secondary" className="gap-1">
              <span className="text-xs font-medium">{badge.label}:</span>
              <span className="text-xs">{badge.value}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => removeFilter(badge.key as keyof FilterState)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Event Type */}
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select 
                value={filters.event_name || "all"}
                onValueChange={(value) => updateFilter("event_name")(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter("from")(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter("to")(e.target.value)}
              />
            </div>

            {/* Website ID */}
            <div className="space-y-2">
              <Label>Website ID</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                  placeholder="Enter website ID"
                  className="pl-10"
                  value={filters.client_id}
                  onChange={(e) => updateFilter("client_id")(e.target.value)}
                />
              </div>
            </div>

            {/* Page Path */}
            <div className="space-y-2">
              <Label>Page Path</Label>
              <Input
                placeholder="/about, /product/*"
                value={filters.path}
                onChange={(e) => updateFilter("path")(e.target.value)}
              />
            </div>

            {/* Device Type */}
            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select 
                value={filters.device_type || "all"}
                onValueChange={(value) => updateFilter("device_type")(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All devices" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Browser */}
            <div className="space-y-2">
              <Label>Browser</Label>
              <Select 
                value={filters.browser_name || "all"}
                onValueChange={(value) => updateFilter("browser_name")(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All browsers" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_BROWSERS.map((browser) => {
                    const IconComponent = browser.icon;
                    return (
                      <SelectItem key={browser.value} value={browser.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {browser.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Operating System */}
            <div className="space-y-2">
              <Label>Operating System</Label>
              <Select 
                value={filters.os_name || "all"}
                onValueChange={(value) => updateFilter("os_name")(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All OS" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_OS.map((os) => {
                    const IconComponent = os.icon;
                    return (
                      <SelectItem key={os.value} value={os.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {os.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                  placeholder="US, UK, Canada..."
                  className="pl-10"
                  value={filters.country}
                  onChange={(e) => updateFilter("country")(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Apply/Reset Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoApply"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="autoApply" className="text-sm">
                Auto-apply filters
              </Label>
            </div>
            
            {!autoApply && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function PageSizeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const pageSize = searchParams.get("pageSize") || "25";
  
  const handlePageSizeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", value);
    params.set("page", "0");
    router.push(`/events?${params.toString()}`);
  };
  
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">Show</Label>
      <Select
        value={pageSize}
        onValueChange={handlePageSizeChange}
      >
        <SelectTrigger id="pageSize" className="h-8 w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="top">
          {[10, 25, 50, 100, 200].map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 