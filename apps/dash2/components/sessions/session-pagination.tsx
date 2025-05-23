import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionPaginationProps {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalDisplayed: number;
  onPageChange: (page: number) => void;
}

export function SessionPagination({ 
  currentPage, 
  hasNext, 
  hasPrev, 
  totalDisplayed, 
  onPageChange 
}: SessionPaginationProps) {
  return (
    <div className="flex items-center justify-between pt-6">
      <p className="text-sm text-muted-foreground">
        Showing {totalDisplayed} sessions on page {currentPage}
      </p>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md">
          <span className="text-sm font-medium">Page {currentPage}</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 