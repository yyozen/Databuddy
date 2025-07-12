import { Suspense } from "react";
import { Activity, Filter } from "lucide-react";
import { fetchEvents, type ClickhouseEvent } from "./actions";
import { EventFilters, PageSizeSelector } from "./client";
import { EventRow, EventRowSkeleton } from "./EventRow";
import {
  Card,
  CardContent,
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
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_PAGE_SIZE = 25;

async function EventsList({
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
    event_name?: string;
  };
}) {
  const offset = page * pageSize;
  const { data, total, error } = await fetchEvents({
    ...searchParams,
    limit: pageSize,
    offset,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${offset + 1}-${Math.min(offset + pageSize, total)} of ${total} events` : 'No events'}
          </p>
          <PageSizeSelector />
        </div>
        <div className="divide-y">
          {data.length > 0 ? (
            data.map((event) => <EventRow key={event.id} event={event} />)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events found matching your criteria
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="border-t bg-muted/40">
            <Pagination className="py-3">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={page > 0 ? `/events?page=${page - 1}&pageSize=${pageSize}` : "#"}
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
                        href={`/events?page=${pageNum}&pageSize=${pageSize}`}
                        isActive={pageNum === page}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href={page < totalPages - 1 ? `/events?page=${page + 1}&pageSize=${pageSize}` : "#"}
                    aria-disabled={page >= totalPages - 1}
                    className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function EventsPage({
  searchParams
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    from?: string;
    to?: string;
    client_id?: string;
    event_name?: string;
    browser_name?: string;
    os_name?: string;
    country?: string;
    device_type?: string;
    path?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 0;
  const pageSize = params.pageSize ? Number.parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;
  const filters = {
    search: params.search,
    from: params.from,
    to: params.to,
    client_id: params.client_id,
    event_name: params.event_name,
    browser_name: params.browser_name,
    os_name: params.os_name,
    country: params.country,
    device_type: params.device_type,
    path: params.path,
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-muted-foreground">
          View and analyze raw event data collected by Databuddy
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventFilters />
        </CardContent>
      </Card>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <EventRowSkeleton key={`skeleton-${i + 1}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        }
      >
        <EventsList page={page} pageSize={pageSize} searchParams={filters} />
      </Suspense>
    </div>
  );
} 