import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationList } from "./notification-list";
import { NotificationEmpty } from "./notification-empty";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Notification } from "./types";

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  
  // Disable notifications for now
  const notifications: Notification[] = [];
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length > 0 ? (
          <NotificationList notifications={notifications} />
        ) : (
          <NotificationEmpty />
        )}
      </PopoverContent>
    </Popover>
  );
} 