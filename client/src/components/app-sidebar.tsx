import { useLocation, Link } from "wouter";
import { LayoutDashboard, CheckSquare, Timer, Brain, Bell, FileText, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const studentItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Pomodoro", url: "/pomodoro", icon: Timer },
  { title: "AI Study", url: "/ai-study", icon: Brain },
  { title: "Files", url: "/files", icon: FileText },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const adminItems = [
  { title: "Admin Panel", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: profile } = useQuery<{ role: string } | null>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: notifs } = useQuery<{ id: number; read: boolean }[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifs?.filter((n) => !n.read).length || 0;
  const isAdmin = profile?.role === "admin";
  const initials = user ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase() || "U" : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold" data-testid="text-app-name">StudyFlow AI</h2>
            <p className="text-xs text-muted-foreground">by Thomas Abdelmalak</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === "/" ? location === "/" : location.startsWith(item.url)}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.title === "Notifications" && unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs" data-testid="badge-unread-notifications">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith(item.url)}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName || "User"} {user?.lastName || ""}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
          <SidebarMenuButton
            onClick={() => logout()}
            className="w-8 h-8 p-0 flex items-center justify-center"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
