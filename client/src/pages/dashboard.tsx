import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Timer, Brain, TrendingUp, Calendar, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import type { Task, PomodoroSession } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<PomodoroSession[]>({
    queryKey: ["/api/pomodoro"],
  });

  const isLoading = tasksLoading || sessionsLoading;

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;
  const pendingTasks = tasks?.filter((t) => t.status === "pending").length || 0;
  const inProgressTasks = tasks?.filter((t) => t.status === "in_progress").length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalStudyMinutes = sessions?.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0) || 0;
  const totalSessions = sessions?.filter((s) => s.completed).length || 0;

  const upcomingTasks = tasks
    ?.filter((t) => t.status !== "completed" && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5) || [];

  const statusData = [
    { name: "Completed", value: completedTasks, color: "hsl(var(--chart-2))" },
    { name: "In Progress", value: inProgressTasks, color: "hsl(var(--chart-1))" },
    { name: "Pending", value: pendingTasks, color: "hsl(var(--chart-4))" },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = date.toISOString().split("T")[0];
    const dayCompleted = tasks?.filter((t) => t.completedAt && t.completedAt.toString().startsWith(dateStr)).length || 0;
    const dayMinutes = sessions?.filter((s) => s.completed && s.startedAt.toString().startsWith(dateStr)).reduce((sum, s) => sum + s.duration, 0) || 0;
    return { day: dayStr, tasks: dayCompleted, minutes: dayMinutes };
  });

  const priorityData = [
    { name: "High", count: tasks?.filter((t) => t.priority === "high" && t.status !== "completed").length || 0 },
    { name: "Medium", count: tasks?.filter((t) => t.priority === "medium" && t.status !== "completed").length || 0 },
    { name: "Low", count: tasks?.filter((t) => t.priority === "low" && t.status !== "completed").length || 0 },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-welcome">
          Welcome back, {user?.firstName || "Student"}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your study overview for today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-tasks">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold mt-1">{totalTasks}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={completionRate} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1.5">{completionRate}% completed</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-study-time">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Study Time</p>
                <p className="text-2xl font-bold mt-1">{Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-chart-2/10">
                <Timer className="w-5 h-5 text-chart-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{totalSessions} sessions completed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-completion-rate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold mt-1">{completionRate}%</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-chart-4/10">
                <TrendingUp className="w-5 h-5 text-chart-4" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{completedTasks} of {totalTasks} tasks done</p>
          </CardContent>
        </Card>

        <Card data-testid="card-focus-score">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold mt-1">{inProgressTasks + pendingTasks}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-chart-5/10">
                <Target className="w-5 h-5 text-chart-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{inProgressTasks} in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-weekly-activity">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-base">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area type="monotone" dataKey="minutes" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.15} name="Study (min)" />
                <Area type="monotone" dataKey="tasks" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} name="Tasks Done" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-task-status">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-base">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {statusData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No tasks yet. Create your first task!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-priority-breakdown">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-base">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date"}
                      </p>
                    </div>
                    <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No upcoming deadlines
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
