import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, CheckSquare, Timer, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { User } from "@shared/models/auth";

interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  totalSessions: number;
  totalStudyMinutes: number;
  userActivity: { email: string; taskCount: number; sessionCount: number }[];
}

export default function AdminPage() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<(User & { role: string })[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    },
  });

  const isLoading = statsLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const taskDistribution = [
    { name: "Completed", value: stats?.completedTasks || 0, color: "hsl(var(--chart-2))" },
    { name: "Active", value: (stats?.totalTasks || 0) - (stats?.completedTasks || 0), color: "hsl(var(--chart-1))" },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Platform analytics and user management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-admin-users">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-admin-tasks">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalTasks || 0}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-chart-2/10">
                <CheckSquare className="w-5 h-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-admin-sessions">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Study Sessions</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalSessions || 0}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-chart-4/10">
                <Timer className="w-5 h-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-admin-study-time">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Study Time</p>
                <p className="text-2xl font-bold mt-1">{Math.floor((stats?.totalStudyMinutes || 0) / 60)}h</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-chart-5/10">
                <BarChart3 className="w-5 h-5 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-admin-task-dist">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {taskDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {taskDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {taskDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-admin-user-activity">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.userActivity && stats.userActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.userActivity.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="email" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="taskCount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Tasks" />
                  <Bar dataKey="sessionCount" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No user activity</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-admin-user-list">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <div className="space-y-3">
              {users.map((u) => {
                const initials = `${(u.firstName || "")[0] || ""}${(u.lastName || "")[0] || ""}`.toUpperCase() || "U";
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-md hover-elevate" data-testid={`row-user-${u.id}`}>
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={u.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.firstName || "Unknown"} {u.lastName || ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                    </div>
                    <Select
                      defaultValue={u.role || "student"}
                      onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role })}
                    >
                      <SelectTrigger className="w-28" data-testid={`select-role-${u.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No users found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
