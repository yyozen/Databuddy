import { Clock, Users, MousePointer, Eye } from "lucide-react";

interface SessionStatsProps {
  totalSessions: number;
  avgDuration: number;
  bounceRate: number;
  totalPageViews: number;
}

export function SessionStats({ totalSessions, avgDuration, bounceRate, totalPageViews }: SessionStatsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;
    return result.trim();
  };

  const stats = [
    {
      label: "Total Sessions",
      value: totalSessions.toLocaleString(),
      icon: Users,
    },
    {
      label: "Avg Duration",
      value: formatDuration(avgDuration),
      icon: Clock,
    },
    {
      label: "Bounce Rate",
      value: `${bounceRate.toFixed(1)}%`,
      icon: MousePointer,
    },
    {
      label: "Page Views",
      value: totalPageViews.toLocaleString(),
      icon: Eye,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-background border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 