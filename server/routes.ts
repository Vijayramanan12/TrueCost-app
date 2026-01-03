import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema } from "@shared/schema";


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)


  app.get("/api/documents", async (_req, res) => {
    const docs = await storage.getDocuments();
    res.json(docs);
  });

  app.post("/api/documents", async (req, res) => {
    // In a real app, handle file upload here using multer or similar
    // For now, we accept metadata primarily
    // We expect the frontend to send the file metadata matching insertDocumentSchema
    // If the frontend sends FormData, we might need to parse it differently. 
    // Assuming JSON body for metadata for this step as we are replacing a mock that just set state.

    // Validate request body
    const parseResult = insertDocumentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Invalid document data", errors: parseResult.error });
      return;
    }

    const doc = await storage.createDocument(parseResult.data);
    res.json(doc);
  });

  app.get("/api/events", async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  // Mock Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const defaults = {
      baseRent: 45000,
      parking: 2000,
      petFee: 500,
      utilities: {
        water: 400,
        electricity: 3500,
        internet: 800,
        trash: 200
      },
      oneTime: {
        deposit: 90000, // 2 * 45000
        appFee: 0,
        adminFee: 2500,
        moveIn: 0
      }
    };

    // Merge body with defaults to allow "manual" overrides or analyzed data simulation
    const input = req.body || {};

    // If input has baseRent, recalculate deposit if not provided
    let deposit = input.oneTime?.deposit;
    if (deposit === undefined && input.baseRent) {
      deposit = input.baseRent * 2;
    }

    const result = {
      baseRent: input.baseRent ?? defaults.baseRent,
      parking: input.parking ?? defaults.parking,
      petFee: input.petFee ?? defaults.petFee,
      utilities: {
        ...defaults.utilities,
        ...(input.utilities || {})
      },
      oneTime: {
        ...defaults.oneTime,
        ...(input.oneTime || {}),
        deposit: deposit ?? defaults.oneTime.deposit
      }
    };

    res.json(result);
  });

  return httpServer;

}
