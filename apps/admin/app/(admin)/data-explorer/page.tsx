import { Suspense } from "react";
import { Globe } from "lucide-react";
import { fetchReferrerData } from "./actions";
import { DataExplorerFilters, PageSizeSelector, SortSelector } from "./client";
import { DataRow, DataRowSkeleton } from "./DataRow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const DEFAULT_PAGE_SIZE = 25;

async function DataList({
  pageSize = DEFAULT_PAGE_SIZE,
  page = 0,
  searchParams = {},
}: {
  pageSize?: number;
  page?: number;
  searchParams?: {
    search?: string;
    from?: string;
    to?: string;
    client_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  };
}) {
  const offset = page * pageSize;
  const { data, total, error } = await fetchReferrerData({
    ...searchParams,
    limit: pageSize,
    offset,
  });

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          <CardDescription>
            There was a problem fetching the data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <div className="flex items-center justify-between px-2 py-2 border-b bg-muted/40">
        <p className="text-xs text-muted-foreground">
          Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total} referrers
        </p>
        <div className="flex items-center gap-4">
          <SortSelector />
          <PageSizeSelector />
        </div>
      </div>
      <div className="divide-y">
        {data.length > 0 ? (
          data.map((item) => <DataRow key={item.referrer} data={item} />)
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No data found matching your criteria.
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="border-t bg-muted/40">
          <Pagination className="py-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={page > 0 ? `/data-explorer?page=${page - 1}&pageSize=${pageSize}` : "#"}
                  aria-disabled={page === 0}
                  className={page === 0 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i;
                if (totalPages > 5) {
                  if (page < 3) {
                    pageNum = i;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                }
                return (
                  <PaginationItem key={`page-${pageNum}`}>
                    <PaginationLink
                      href={`/data-explorer?page=${pageNum}&pageSize=${pageSize}`}
                      isActive={pageNum === page}
                    >
                      {pageNum + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages - 1 ? `/data-explorer?page=${page + 1}&pageSize=${pageSize}` : "#"}
                  aria-disabled={page >= totalPages - 1}
                  className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

export default async function DataExplorerPage({
  searchParams
}: {
  searchParams: {
    page?: string;
    pageSize?: string;
    search?: string;
    from?: string;
    to?: string;
    client_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page, 10) : 0;
  const pageSize = searchParams.pageSize ? Number.parseInt(searchParams.pageSize, 10) : DEFAULT_PAGE_SIZE;
  const filters = {
    search: searchParams.search,
    from: searchParams.from,
    to: searchParams.to,
    client_id: searchParams.client_id,
    sort_by: searchParams.sort_by,
    sort_order: searchParams.sort_order as 'asc' | 'desc' | undefined,
  };

  return (
    <div className="w-full space-y-4">
      <Card className="bg-gradient-to-br from-primary/5 to-muted/0 border-0 shadow-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 pb-2">
          <div className="flex items-center gap-4">
            <Globe className="h-10 w-10 text-primary bg-primary/10 rounded-full p-2 shadow" />
            <div>
              <CardTitle className="text-3xl font-bold mb-1">Data Explorer</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Investigate and analyze your data in detail.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter and search through your data to find what you're looking for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataExplorerFilters />
        </CardContent>
      </Card>
      <Suspense
        fallback={
          <div className="rounded-md border bg-card overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <DataRowSkeleton key={`skeleton-${i + 1}`} />
            ))}
          </div>
        }
      >
        <DataList page={page} pageSize={pageSize} searchParams={filters} />
      </Suspense>
    </div>
  );
} 