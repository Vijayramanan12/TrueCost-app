import { type User, type InsertUser, type Document, type InsertDocument, type Event, type InsertEvent } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need


export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getDocuments(): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;

  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private events: Map<string, Event>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.events = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const doc: Document = { ...insertDoc, id };
    this.documents.set(id, doc);
    return doc;
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }
}

export const storage = new MemStorage();

