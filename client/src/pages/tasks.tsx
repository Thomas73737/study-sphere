import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle2, Circle, Clock, Trash2, Edit, Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Task } from "@shared/schema";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "completed"]),
  dueDate: z.string().optional(),
  estimatedMinutes: z.coerce.number().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

function TaskForm({ onClose, editTask }: { onClose: () => void; editTask?: Task }) {
  const { toast } = useToast();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: editTask?.title || "",
      description: editTask?.description || "",
      subject: editTask?.subject || "",
      priority: (editTask?.priority as "low" | "medium" | "high") || "medium",
      status: (editTask?.status as "pending" | "in_progress" | "completed") || "pending",
      dueDate: editTask?.dueDate ? new Date(editTask.dueDate).toISOString().split("T")[0] : "",
      estimatedMinutes: editTask?.estimatedMinutes || undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const body = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        estimatedMinutes: data.estimatedMinutes || null,
      };
      if (editTask) {
        return apiRequest("PATCH", `/api/tasks/${editTask.id}`, body);
      }
      return apiRequest("POST", "/api/tasks", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: editTask ? "Task updated" : "Task created" });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save task", variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input {...field} placeholder="Task title" data-testid="input-task-title" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea {...field} placeholder="Describe your task..." data-testid="input-task-description" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="subject" render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Mathematics" data-testid="input-task-subject" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="estimatedMinutes" render={({ field }) => (
            <FormItem>
              <FormLabel>Est. Minutes</FormLabel>
              <FormControl><Input type="number" {...field} placeholder="60" data-testid="input-task-minutes" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-task-priority"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-task-status"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="dueDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Due Date</FormLabel>
            <FormControl><Input type="date" {...field} data-testid="input-task-due-date" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-task">
            {createMutation.isPending ? "Saving..." : editTask ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function TasksPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (task: Task) =>
      apiRequest("PATCH", `/api/tasks/${task.id}`, {
        status: task.status === "completed" ? "pending" : "completed",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const filteredTasks = tasks?.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  }) || [];

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-chart-2" />;
    if (status === "in_progress") return <Clock className="w-4 h-4 text-chart-1" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-tasks-title">Tasks & Assignments</h1>
          <p className="text-muted-foreground mt-1">{filteredTasks.length} tasks shown</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTask(undefined); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-task">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            </DialogHeader>
            <TaskForm onClose={() => { setDialogOpen(false); setEditingTask(undefined); }} editTask={editingTask} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36" data-testid="filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36" data-testid="filter-priority"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">No tasks found. Create your first task!</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover-elevate" data-testid={`card-task-${task.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleMutation.mutate(task)}
                    className="mt-0.5 flex-shrink-0"
                    data-testid={`button-toggle-task-${task.id}`}
                  >
                    {statusIcon(task.status)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setEditingTask(task); setDialogOpen(true); }}
                          data-testid={`button-edit-task-${task.id}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(task.id)}
                          data-testid={`button-delete-task-${task.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
                        {task.priority}
                      </Badge>
                      {task.subject && <Badge variant="outline">{task.subject}</Badge>}
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="text-xs text-muted-foreground">
                          {task.estimatedMinutes}min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
