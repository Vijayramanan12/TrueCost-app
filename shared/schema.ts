import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: text("size").notNull(),
  date: text("date").notNull(), // using text for simple date formatting as per mock
  url: text("url").notNull(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(), // completed, upcoming, past
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  type: true,
  size: true,
  date: true,
  url: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  date: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

