import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
export * from "./models/chat";

export const roleEnum = pgEnum("user_role", ["student", "admin"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const statusEnum = pgEnum("task_status", ["pending", "in_progress", "completed"]);

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  role: roleEnum("role").notNull().default("student"),
  studyGoal: text("study_goal"),
  preferredSubjects: text("preferred_subjects"),
  dailyStudyTarget: integer("daily_study_target").default(120),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  priority: priorityEnum("priority").notNull().default("medium"),
  status: statusEnum("status").notNull().default("pending"),
  dueDate: timestamp("due_date"),
  estimatedMinutes: integer("estimated_minutes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  taskId: integer("task_id"),
  duration: integer("duration").notNull().default(25),
  breakDuration: integer("break_duration").notNull().default(5),
  completed: boolean("completed").notNull().default(false),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const studyRecommendations = pgTable("study_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject"),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("medium"),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  taskId: integer("task_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertPomodoroSchema = createInsertSchema(pomodoroSessions).omit({ id: true, startedAt: true, endedAt: true });
export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertRecommendationSchema = createInsertSchema(studyRecommendations).omit({ id: true, createdAt: true });

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoro = z.infer<typeof insertPomodoroSchema>;
export type StudyRecommendation = typeof studyRecommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
