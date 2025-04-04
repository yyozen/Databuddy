import { Bell } from "lucide-react";

export function NotificationEmpty() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>No notifications yet</p>
    </div>
  );
} 