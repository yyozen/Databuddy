import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface SessionFiltersProps {
  activeTab: string;
  searchQuery: string;
  onTabChange: (tab: string) => void;
  onSearchChange: (query: string) => void;
}

export function SessionFilters({ 
  activeTab, 
  searchQuery, 
  onTabChange, 
  onSearchChange 
}: SessionFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <Tabs 
        value={activeTab}
        className="w-full lg:w-auto"
        onValueChange={onTabChange}
      >
        <TabsList className="grid grid-cols-4 w-full lg:w-auto">
          <TabsTrigger value="all">All Sessions</TabsTrigger>
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="long">Long Sessions</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="relative w-full lg:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sessions, countries, browsers..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
} 