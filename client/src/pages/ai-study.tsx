import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, BookOpen, Target, Clock, X, RefreshCw, Lightbulb } from "lucide-react";
import type { StudyRecommendation } from "@shared/schema";

const typeIcons: Record<string, typeof Brain> = {
  study_tip: Lightbulb,
  focus: Target,
  review: BookOpen,
  schedule: Clock,
};

const typeColors: Record<string, string> = {
  study_tip: "bg-chart-4/10 text-chart-4",
  focus: "bg-chart-1/10 text-chart-1",
  review: "bg-chart-2/10 text-chart-2",
  schedule: "bg-chart-5/10 text-chart-5",
};

export default function AIStudyPage() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const { data: recommendations, isLoading } = useQuery<StudyRecommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      return apiRequest("POST", "/api/recommendations/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({ title: "New recommendations generated!" });
      setGenerating(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate recommendations", variant: "destructive" });
      setGenerating(false);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/recommendations/${id}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });

  const activeRecs = recommendations?.filter((r) => !r.dismissed) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-ai-title">AI Study Recommendations</h1>
          <p className="text-muted-foreground mt-1">Personalized tips powered by AI to boost your learning.</p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generating || generateMutation.isPending}
          className="gap-2"
          data-testid="button-generate-recommendations"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating ? "Generating..." : "Generate New"}
        </Button>
      </div>

      {activeRecs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
              Click "Generate New" to get personalized AI study recommendations based on your tasks and progress.
            </p>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generating}
              className="gap-2"
              data-testid="button-generate-first"
            >
              <Sparkles className="w-4 h-4" />
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeRecs.map((rec) => {
            const IconComponent = typeIcons[rec.type] || Brain;
            const colorClass = typeColors[rec.type] || "bg-primary/10 text-primary";
            return (
              <Card key={rec.id} className="hover-elevate" data-testid={`card-recommendation-${rec.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0 ${colorClass}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{rec.title}</h3>
                        {rec.subject && (
                          <Badge variant="outline" className="mt-1 text-xs">{rec.subject}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => dismissMutation.mutate(rec.id)}
                      data-testid={`button-dismiss-${rec.id}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "secondary" : "outline"}>
                      {rec.priority} priority
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rec.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
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
