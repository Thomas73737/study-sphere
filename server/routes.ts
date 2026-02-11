import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { tasks, pomodoroSessions, userProfiles, insertTaskSchema, insertPomodoroSchema } from "@shared/schema";
import { eq, count, sql } from "drizzle-orm";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

const taskCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  dueDate: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(1440).optional().nullable(),
});

const taskUpdateSchema = taskCreateSchema.partial();

const pomodoroCreateSchema = z.object({
  taskId: z.number().int().optional().nullable(),
  duration: z.number().int().min(1).max(120),
  breakDuration: z.number().int().min(1).max(60),
  completed: z.boolean(),
});

const fileUploadBodySchema = z.object({
  taskId: z.string().optional().nullable(),
});

const roleUpdateSchema = z.object({
  role: z.enum(["student", "admin"]),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let profile = await storage.getProfile(userId);
      if (!profile) {
        profile = await storage.upsertProfile({ userId, role: "student" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTasks = await storage.getTasks(userId);
      res.json(userTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = taskCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid task data", errors: parsed.error.flatten() });
      }
      const data = parsed.data;
      const task = await storage.createTask({
        userId,
        title: data.title,
        description: data.description || null,
        subject: data.subject || null,
        priority: data.priority || "medium",
        status: data.status || "pending",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedMinutes: data.estimatedMinutes || null,
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid task ID" });

      const existing = await storage.getTask(id);
      if (!existing) return res.status(404).json({ message: "Task not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Access denied" });

      const parsed = taskUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid task data", errors: parsed.error.flatten() });
      }
      const data = parsed.data;
      const updateData: any = { ...data };
      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      }
      const task = await storage.updateTask(id, updateData);
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid task ID" });

      const existing = await storage.getTask(id);
      if (!existing) return res.status(404).json({ message: "Task not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Access denied" });

      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get("/api/pomodoro", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getPomodoroSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post("/api/pomodoro", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = pomodoroCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid session data", errors: parsed.error.flatten() });
      }
      if (parsed.data.taskId) {
        const task = await storage.getTask(parsed.data.taskId);
        if (!task || task.userId !== userId) {
          return res.status(403).json({ message: "Task not found or access denied" });
        }
      }
      const session = await storage.createPomodoroSession({ ...parsed.data, userId });
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recs = await storage.getRecommendations(userId);
      res.json(recs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI service is not configured" });
      }

      const userTasks = await storage.getTasks(userId);
      const sessions = await storage.getPomodoroSessions(userId);

      const completedTasks = userTasks.filter(t => t.status === "completed").length;
      const pendingTasks = userTasks.filter(t => t.status === "pending").length;
      const totalStudyMin = sessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0);
      const subjects = [...new Set(userTasks.map(t => t.subject).filter(Boolean))];

      const prompt = `You are a study advisor AI. Based on this student's data, generate exactly 4 study recommendations as a JSON array.

Student data:
- ${userTasks.length} total tasks (${completedTasks} completed, ${pendingTasks} pending)
- ${totalStudyMin} minutes studied total
- Subjects: ${subjects.length > 0 ? subjects.join(", ") : "general studies"}
- ${sessions.length} pomodoro sessions

Generate a JSON array with exactly 4 objects. Each object must have:
- "title": short actionable title (max 60 chars)
- "description": helpful advice paragraph (max 200 chars)
- "subject": relevant subject or null
- "type": one of "study_tip", "focus", "review", "schedule"
- "priority": one of "low", "medium", "high"

Respond ONLY with the JSON array, no markdown.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content || "[]";
      let recommendations: any[];
      try {
        recommendations = JSON.parse(content);
      } catch {
        const match = content.match(/\[[\s\S]*\]/);
        recommendations = match ? JSON.parse(match[0]) : [];
      }

      const created = [];
      for (const rec of recommendations.slice(0, 4)) {
        const saved = await storage.createRecommendation({
          userId,
          title: String(rec.title || "Study Tip").substring(0, 60),
          description: String(rec.description || "Keep up the great work!").substring(0, 200),
          subject: rec.subject || null,
          type: rec.type || "study_tip",
          priority: rec.priority || "medium",
          dismissed: false,
        });
        created.push(saved);
      }

      res.json(created);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.patch("/api/recommendations/:id/dismiss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const recs = await storage.getRecommendations(userId);
      const rec = recs.find(r => r.id === id);
      if (!rec) return res.status(404).json({ message: "Recommendation not found" });

      await storage.dismissRecommendation(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss" });
    }
  });

  app.get("/api/files", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getFiles(userId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file provided" });
      const userId = req.user.claims.sub;

      let taskId: number | null = null;
      if (req.body.taskId) {
        taskId = parseInt(req.body.taskId);
        if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID" });
        const task = await storage.getTask(taskId);
        if (!task || task.userId !== userId) {
          return res.status(403).json({ message: "Task not found or access denied" });
        }
      }

      const file = await storage.createFile({
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        taskId,
      });
      res.status(201).json(file);
    } catch (error: any) {
      if (error.message === "File type not allowed") {
        return res.status(400).json({ message: "File type not allowed" });
      }
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/files/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const file = await storage.getFile(id);
      if (!file) return res.status(404).json({ message: "File not found" });
      if (file.userId !== userId) return res.status(403).json({ message: "Access denied" });

      const filePath = path.join(uploadDir, file.filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found on disk" });
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
      res.setHeader("Content-Type", file.mimeType);
      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.delete("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const file = await storage.getFile(id);
      if (!file) return res.status(404).json({ message: "File not found" });
      if (file.userId !== userId) return res.status(403).json({ message: "Access denied" });

      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await storage.deleteFile(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifs = await storage.getNotifications(userId);
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const notifs = await storage.getNotifications(userId);
      const notif = notifs.find(n => n.id === id);
      if (!notif) return res.status(404).json({ message: "Notification not found" });

      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (profile?.role !== "admin") return res.status(403).json({ message: "Access denied" });

      const allUsers = await db.select().from(users);
      const allTasks = await storage.getAllTasks();
      const allSessions = await storage.getAllPomodoroSessions();
      const completedTasks = allTasks.filter(t => t.status === "completed").length;
      const completedSessions = allSessions.filter(s => s.completed);
      const totalStudyMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);

      const userActivity = allUsers.map(u => ({
        email: u.email || u.id.substring(0, 8),
        taskCount: allTasks.filter(t => t.userId === u.id).length,
        sessionCount: allSessions.filter(s => s.userId === u.id && s.completed).length,
      }));

      res.json({
        totalUsers: allUsers.length,
        totalTasks: allTasks.length,
        completedTasks,
        totalSessions: completedSessions.length,
        totalStudyMinutes,
        userActivity,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (profile?.role !== "admin") return res.status(403).json({ message: "Access denied" });

      const allUsers = await db.select().from(users);
      const allProfiles = await storage.getAllProfiles();

      const enriched = allUsers.map(u => {
        const p = allProfiles.find(p => p.userId === u.id);
        return { ...u, role: p?.role || "student" };
      });

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:userId/role", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminProfile = await storage.getProfile(adminId);
      if (adminProfile?.role !== "admin") return res.status(403).json({ message: "Access denied" });

      const parsed = roleUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid role data" });
      }

      const { userId } = req.params;
      const { role } = parsed.data;

      let profile = await storage.getProfile(userId);
      if (!profile) {
        profile = await storage.upsertProfile({ userId, role });
      } else {
        profile = await storage.updateProfileRole(userId, role);
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  return httpServer;
}
