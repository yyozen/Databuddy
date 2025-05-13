"use client";

import { useState, Suspense, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapComponent } from "@/components/analytics/map-component";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWebsitesStore } from "@/stores/use-websites-store";
import { useWebsites } from "@/hooks/use-websites";
import { useParams } from "next/navigation";
import { useAnalyticsLocations } from "@/hooks/use-analytics";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { AlertCircle, Globe, HelpCircle, Info, MapPin } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function WebsiteMapPage() {
  const { id } = useParams<{ id: string }>();
  const { websites } = useWebsites();
  const { setSelectedWebsite } = useWebsitesStore();
  const [mode, setMode] = useState<"total" | "perCapita">("total");
  
  // Set the selected website based on URL params
  useEffect(() => {
    if (id && websites) {
      const website = websites.find((site: any) => site.id === id);
      if (website) {
        setSelectedWebsite(website);
      }
    }
  }, [id, websites, setSelectedWebsite]);
  
  // Pass the date range to the analytics hook to get real data
  const { data: locationData, isLoading } = useAnalyticsLocations(
    id
  );

  const topCountries = locationData?.countries?.slice(0, 5) || [];
  const totalVisitors = locationData?.countries?.reduce((sum, country) => sum + country.visitors, 0) || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-3xl font-bold tracking-tight">Geographic Distribution</h1>
          </div>
          <p className="text-muted-foreground">
            View visitor distribution by country and region across your website
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* <CalendarDateRangePicker
            onUpdate={(value: DateRange | undefined) => {
              if (value?.from && value?.to) {
                setDateRange({
                  start_date: value.from.toISOString().split('T')[0],
                  end_date: value.to.toISOString().split('T')[0]
                });
              }
            }}
          /> */}
          
          <Tabs 
            defaultValue="total" 
            className="w-[240px]"
            onValueChange={(value) => setMode(value as "total" | "perCapita")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="total">Total Visits</TabsTrigger>
              <TabsTrigger value="perCapita">Per Capita</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 flex-1 overflow-hidden">
        <Card className="lg:col-span-3 flex flex-col overflow-hidden relative group">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" strokeWidth={2} />
                  Visitor Map
                </CardTitle>
                <CardDescription>
                  {mode === "total" 
                    ? "Showing total visitor count by location" 
                    : "Showing visitors per million people"}
                </CardDescription>
              </div>
              
              {!isLoading && totalVisitors > 0 && (
                <Badge variant="outline" className="text-sm font-medium">
                  {totalVisitors.toLocaleString()} total visitors
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="h-full transition-opacity duration-300">
              <MapComponent height="100%" mode={mode} />
            </div>
          </CardContent>
          
          {/* Hover instructions overlay */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-md">
              <Info className="h-3 w-3 mr-1" /> Hover over countries for details
            </Badge>
          </div>
        </Card>
        
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" strokeWidth={2} />
                Top Countries
              </CardTitle>
              <CardDescription>Most visitors by country</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3 pt-1">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={`skeleton-${i+1}`} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-5 rounded-sm" />
                        <Skeleton className="h-4 w-24 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-12 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : topCountries.length > 0 ? (
                <div className="space-y-3">
                  {topCountries.map((country, index) => (
                    <div 
                      key={country.country || "unknown"} 
                      className={cn(
                        "flex justify-between items-center p-2 rounded-md transition-colors",
                        index === 0 ? "bg-primary/5" : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {country.country ? (
                          <div className="w-6 h-4 relative overflow-hidden rounded-sm shadow-sm">
                            <img 
                              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.country.toUpperCase()}.svg`}
                              alt={country.country}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-4 flex items-center justify-center rounded-sm bg-muted">
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className={cn(index === 0 && "font-medium")}>
                          {country.country ? country.country : "Unknown"}
                        </span>
                      </div>
                      <span className={cn("font-semibold", index === 0 && "text-primary")}>
                        {country.visitors.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No geographic data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border border-muted/40 bg-gradient-to-b from-card to-card/80">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" strokeWidth={2} />
                About This View
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-sm space-y-3">
                <p className="leading-relaxed">
                  The map shows the geographic distribution of your website's visitors across the globe.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-card border shadow-sm">
                    <p className="font-medium text-xs tracking-wide uppercase text-muted-foreground mb-1">
                      Total Visits
                    </p>
                    <p className="text-xs">
                      Shows the absolute number of visitors from each location.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border shadow-sm">
                    <p className="font-medium text-xs tracking-wide uppercase text-muted-foreground mb-1">
                      Per Capita
                    </p>
                    <p className="text-xs">
                      Shows visitors normalized by country population size.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
          <span className="text-muted-foreground font-medium">Loading map data...</span>
        </div>
      </div>
    }>
      <WebsiteMapPage />
    </Suspense>
  );
} 