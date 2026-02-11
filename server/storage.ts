import {
  userProfiles, tasks, pomodoroSessions, studyRecommendations, fileUploads, notifications,
  type UserProfile, type InsertUserProfile, type Task, type InsertTask,
  type PomodoroSession, type InsertPomodoro, type StudyRecommendation, type InsertRecommendation,
  type FileUpload, type InsertFileUpload, type Notification, type InsertNotification,
} from "@shared/schema";
import { users } from "@shared/models/auth";
import { db } from "./db";
import { eq, desc, sql, and, count } from "drizzle-orm";

export interface IStorage {
  getProfile(userId: string): Promise<UserProfile | undefined>;
  upsertProfile(data: InsertUserProfile): Promise<UserProfile>;
  getAllProfiles(): Promise<UserProfile[]>;
  updateProfileRole(userId: string, role: string): Promise<UserProfile | undefined>;

  getTasks(userId: string): Promise<Task[]>;
  getAllTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;

  getPomodoroSessions(userId: string): Promise<PomodoroSession[]>;
  getAllPomodoroSessions(): Promise<PomodoroSession[]>;
  createPomodoroSession(data: InsertPomodoro): Promise<PomodoroSession>;

  getRecommendations(userId: string): Promise<StudyRecommendation[]>;
  createRecommendation(data: InsertRecommendation): Promise<StudyRecommendation>;
  dismissRecommendation(id: number): Promise<void>;

  getFiles(userId: string): Promise<FileUpload[]>;
  getFile(id: number): Promise<FileUpload | undefined>;
  createFile(data: InsertFileUpload): Promise<FileUpload>;
  deleteFile(id: number): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string) {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertProfile(data: InsertUserProfile) {
    const [profile] = await db.insert(userProfiles).values(data)
      .onConflictDoUpdate({ target: userProfiles.userId, set: { ...data } })
      .returning();
    return profile;
  }

  async getAllProfiles() {
    return db.select().from(userProfiles);
  }

  async updateProfileRole(userId: string, role: string) {
    const [profile] = await db.update(userProfiles)
      .set({ role: role as "student" | "admin" })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return profile;
  }

  async getTasks(userId: string) {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getAllTasks() {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(data: InsertTask) {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async updateTask(id: number, data: Partial<InsertTask>) {
    const updateData: any = { ...data };
    if (data.status === "completed") {
      updateData.completedAt = new Date();
    }
    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: number) {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getPomodoroSessions(userId: string) {
    return db.select().from(pomodoroSessions).where(eq(pomodoroSessions.userId, userId)).orderBy(desc(pomodoroSessions.startedAt));
  }

  async getAllPomodoroSessions() {
    return db.select().from(pomodoroSessions);
  }

  async createPomodoroSession(data: InsertPomodoro) {
    const [session] = await db.insert(pomodoroSessions).values({
      ...data,
      endedAt: data.completed ? new Date() : null,
    }).returning();
    return session;
  }

  async getRecommendations(userId: string) {
    return db.select().from(studyRecommendations).where(eq(studyRecommendations.userId, userId)).orderBy(desc(studyRecommendations.createdAt));
  }

  async createRecommendation(data: InsertRecommendation) {
    const [rec] = await db.insert(studyRecommendations).values(data).returning();
    return rec;
  }

  async dismissRecommendation(id: number) {
    await db.update(studyRecommendations).set({ dismissed: true }).where(eq(studyRecommendations.id, id));
  }

  async getFiles(userId: string) {
    return db.select().from(fileUploads).where(eq(fileUploads.userId, userId)).orderBy(desc(fileUploads.createdAt));
  }

  async getFile(id: number) {
    const [file] = await db.select().from(fileUploads).where(eq(fileUploads.id, id));
    return file;
  }

  async createFile(data: InsertFileUpload) {
    const [file] = await db.insert(fileUploads).values(data).returning();
    return file;
  }

  async deleteFile(id: number) {
    await db.delete(fileUploads).where(eq(fileUploads.id, id));
  }

  async getNotifications(userId: string) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification) {
    const [notif] = await db.insert(notifications).values(data).returning();
    return notif;
  }

  async markNotificationRead(id: number) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
