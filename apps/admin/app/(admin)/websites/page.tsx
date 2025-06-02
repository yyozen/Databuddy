import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink } from "lucide-react";
import { getAllWebsitesAsAdmin } from "./actions";
import { format } from 'date-fns';
import Link from 'next/link';
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { WebsiteActions } from "./website-actions";

// Define a type for the website data including owner info
interface WebsiteWithUser {
  id: string;
  name: string | null;
  domain: string | null;
  status: string;
  createdAt: Date | string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
}

// Helper function to get initials
const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default async function AdminWebsitesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const { websites, error } = await getAllWebsitesAsAdmin();

  // Filter websites based on search
  const filteredWebsites = websites?.filter((website) => {
    if (!search) return true;
    return (
      website.name?.toLowerCase().includes(search) ||
      website.domain?.toLowerCase().includes(search) ||
      website.ownerName?.toLowerCase().includes(search) ||
      website.ownerEmail?.toLowerCase().includes(search)
    );
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Websites</h1>
          <p className="text-sm text-muted-foreground">
            {filteredWebsites?.length || 0} website{filteredWebsites?.length === 1 ? '' : 's'}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <DataTableToolbar placeholder="Search websites..." />
      </div>

      <Card>
        <CardContent className="p-0">
          {(!filteredWebsites || filteredWebsites.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground">
              {search 
                ? `No websites found matching "${search}"`
                : "No websites found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">Domain</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredWebsites as WebsiteWithUser[]).map((website) => (
                  <TableRow key={website.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {website.name || "Untitled Website"}
                            </span>
                            {website.status && (
                              <Badge 
                                variant={website.status === 'ACTIVE' ? 'default' : 'secondary'} 
                                className="text-xs h-4"
                              >
                                {website.status}
                              </Badge>
                            )}
                          </div>
                          <div className="md:hidden text-xs text-muted-foreground mt-1">
                            {website.ownerName && `Owner: ${website.ownerName}`}
                            {website.domain && (
                              <span className="ml-2">{website.domain}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {website.userId || website.ownerEmail ? (
                        <Link href={`/users/${encodeURIComponent(website.userId || website.ownerEmail || "")}`} className="flex items-center gap-2 group max-w-[200px]">
                          <Avatar className="h-6 w-6 text-xs">
                            <AvatarFallback className="text-[10px]">{getInitials(website.ownerName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate group-hover:underline">{website.ownerName || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground truncate">{website.ownerEmail}</div>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {website.domain ? (
                        <a 
                          href={`http://${website.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center gap-1 max-w-[200px]"
                        >
                          <span className="truncate">{website.domain}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(website.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <WebsiteActions website={website} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 