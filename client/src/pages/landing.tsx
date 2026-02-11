import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brain, CheckSquare, Timer, BarChart3, FileText, Bell, ArrowRight, Sparkles } from "lucide-react";

const features = [
  {
    icon: CheckSquare,
    title: "Smart Task Management",
    description: "Organize assignments with priorities, due dates, and progress tracking. Never miss a deadline again.",
  },
  {
    icon: Brain,
    title: "AI Study Recommendations",
    description: "Get personalized study tips powered by AI that adapt to your learning style and progress.",
  },
  {
    icon: Timer,
    title: "Pomodoro Timer",
    description: "Stay focused with built-in Pomodoro technique. Track study sessions and build productive habits.",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description: "Visualize your study patterns with beautiful charts. Track completion rates and study time.",
  },
  {
    icon: FileText,
    title: "File Management",
    description: "Upload and organize notes, PDFs, and study materials alongside your tasks.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get timely reminders for deadlines, study sessions, and AI-generated study suggestions.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold" data-testid="text-logo">StudyFlow AI</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/api/login">
                <Button data-testid="button-login">Sign In</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border bg-card text-sm text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI-Powered Study Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-serif">
            Study Smarter,{" "}
            <span className="text-primary">Not Harder</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one study platform that combines task management, AI recommendations,
            and focus tools to help you achieve your academic goals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/api/login">
              <Button size="lg" className="gap-2 text-base" data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Free forever plan
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              No credit card required
            </span>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-serif mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful tools designed specifically for students who want to maximize their study efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            &copy; {new Date().getFullYear()} StudyFlow AI. All rights reserved. Thomas Abdelmalak.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span>Powered by AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
