import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, Coffee, Zap } from "lucide-react";
import type { Task, PomodoroSession } from "@shared/schema";

type TimerState = "idle" | "work" | "break";

export default function PomodoroPage() {
  const { toast } = useToast();
  const [duration, setDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: sessions, isLoading } = useQuery<PomodoroSession[]>({ queryKey: ["/api/pomodoro"] });

  const activeTasks = tasks?.filter((t) => t.status !== "completed") || [];

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayCount = sessions?.filter(
      (s) => s.completed && s.startedAt.toString().startsWith(today)
    ).length || 0;
    setSessionsToday(todayCount);
  }, [sessions]);

  const createSessionMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      return apiRequest("POST", "/api/pomodoro", {
        taskId: selectedTaskId ? parseInt(selectedTaskId) : null,
        duration,
        breakDuration,
        completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pomodoro"] });
    },
  });

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setIsRunning(false);
        if (timerState === "work") {
          createSessionMutation.mutate(true);
          toast({ title: "Session complete! Time for a break." });
          setTimerState("break");
          return breakDuration * 60;
        } else {
          toast({ title: "Break over! Ready for another session?" });
          setTimerState("idle");
          return duration * 60;
        }
      }
      return prev - 1;
    });
  }, [timerState, duration, breakDuration, createSessionMutation, toast]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const startTimer = () => {
    if (timerState === "idle") {
      setTimerState("work");
      setTimeLeft(duration * 60);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setTimerState("idle");
    setTimeLeft(duration * 60);
  };

  const startBreak = () => {
    setTimerState("break");
    setTimeLeft(breakDuration * 60);
    setIsRunning(true);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = timerState === "break" ? breakDuration * 60 : duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 max-w-xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-pomodoro-title">Pomodoro Timer</h1>
        <p className="text-muted-foreground mt-1">Stay focused with timed study sessions.</p>
      </div>

      <Card className="overflow-visible" data-testid="card-pomodoro-timer">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="relative w-64 h-64 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle
                cx="130" cy="130" r="120"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="6"
              />
              <circle
                cx="130" cy="130" r="120"
                fill="none"
                stroke={timerState === "break" ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold font-mono tabular-nums" data-testid="text-timer-display">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                {timerState === "break" ? (
                  <><Coffee className="w-3.5 h-3.5" /> Break</>
                ) : timerState === "work" ? (
                  <><Zap className="w-3.5 h-3.5" /> Focus</>
                ) : (
                  "Ready"
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            {!isRunning ? (
              <Button onClick={startTimer} className="gap-2" data-testid="button-start-timer">
                <Play className="w-4 h-4" />
                {timerState === "idle" ? "Start" : "Resume"}
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="secondary" className="gap-2" data-testid="button-pause-timer">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            <Button onClick={resetTimer} variant="outline" size="icon" data-testid="button-reset-timer">
              <RotateCcw className="w-4 h-4" />
            </Button>
            {timerState === "work" && !isRunning && timeLeft < duration * 60 && (
              <Button onClick={startBreak} variant="outline" className="gap-2" data-testid="button-start-break">
                <Coffee className="w-4 h-4" />
                Take Break
              </Button>
            )}
          </div>

          <div className="w-full max-w-xs space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Linked Task</label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger data-testid="select-pomodoro-task"><SelectValue placeholder="Select a task (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {activeTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Focus (min)</label>
                <Select value={duration.toString()} onValueChange={(v) => { setDuration(parseInt(v)); if (timerState === "idle") setTimeLeft(parseInt(v) * 60); }}>
                  <SelectTrigger data-testid="select-focus-duration"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[15, 20, 25, 30, 45, 60].map((d) => (
                      <SelectItem key={d} value={d.toString()}>{d} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Break (min)</label>
                <Select value={breakDuration.toString()} onValueChange={(v) => setBreakDuration(parseInt(v))}>
                  <SelectTrigger data-testid="select-break-duration"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 5, 10, 15].map((d) => (
                      <SelectItem key={d} value={d.toString()}>{d} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-session-stats">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today's Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary" data-testid="text-sessions-today">{sessionsToday}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{sessionsToday * duration}</p>
              <p className="text-xs text-muted-foreground">Minutes Studied</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-3 rounded-sm ${i < sessionsToday ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Goal: 8 sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
