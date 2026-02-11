import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, CheckCheck, Info, AlertTriangle, Calendar } from "lucide-react";
import type { Notification } from "@shared/schema";

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  deadline: Calendar,
  achievement: Check,
};

export default function NotificationsPage() {
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-notifications-title">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            className="gap-2"
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              You're all caught up! Notifications about tasks, deadlines, and study tips will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const IconComponent = typeIcons[notif.type] || Info;
            return (
              <Card
                key={notif.id}
                className={`hover-elevate ${!notif.read ? "border-l-2 border-l-primary" : ""}`}
                data-testid={`card-notification-${notif.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0 ${
                      notif.type === "warning" ? "bg-chart-5/10" : "bg-primary/10"
                    }`}>
                      <IconComponent className={`w-4 h-4 ${notif.type === "warning" ? "text-chart-5" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium">{notif.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                          {!notif.read && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => markReadMutation.mutate(notif.id)}
                              data-testid={`button-mark-read-${notif.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
