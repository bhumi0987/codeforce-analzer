
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.status(200).json({ message: 'Hello from API' });
  } else {
    res.status(405).send('Method Not Allowed');
  }
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {

  const httpServer = createServer(app);

  return httpServer;
}
