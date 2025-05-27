import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCppFileSchema, insertAnalysisResultSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // C++ File Routes
  app.post("/api/files", async (req, res) => {
    try {
      const validatedData = insertCppFileSchema.parse(req.body);
      const file = await storage.createCppFile({
        ...validatedData,
        uploaded_at: new Date().toISOString(),
      });
      res.json(file);
    } catch (error) {
      res.status(400).json({ message: "Invalid file data", error });
    }
  });

  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllCppFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files", error });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getCppFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file", error });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCppFile(id);
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file", error });
    }
  });

  // Analysis Routes
  app.post("/api/analysis", async (req, res) => {
    try {
      const validatedData = insertAnalysisResultSchema.parse(req.body);
      const analysis = await storage.createAnalysisResult({
        ...validatedData,
        created_at: new Date().toISOString(),
      });
      res.json(analysis);
    } catch (error) {
      res.status(400).json({ message: "Invalid analysis data", error });
    }
  });

  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysisResult(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis", error });
    }
  });

  app.get("/api/analysis/file/:fileId", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const analysis = await storage.getAnalysisResultByFileId(fileId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found for this file" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis", error });
    }
  });

  app.put("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertAnalysisResultSchema.partial().parse(req.body);
      const updated = await storage.updateAnalysisResult(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data", error });
    }
  });

  // Code analysis endpoint
  app.post("/api/analyze-code", async (req, res) => {
    try {
      const { fileId, content } = req.body;
      
      // Simulate C++ code analysis
      const structures = await analyzeCode(content);
      const matrixData = generateMatrixData(structures);
      
      const analysis = await storage.createAnalysisResult({
        file_id: fileId,
        structures: structures,
        matrix_data: matrixData,
        analysis_status: "completed",
        created_at: new Date().toISOString(),
      });
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze code", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for code analysis
async function analyzeCode(content: string) {
  // Simple regex-based structure detection
  const structures = [];
  
  // Detect struct definitions
  const structRegex = /struct\s+(\w+)\s*{[^}]*}/g;
  let match;
  while ((match = structRegex.exec(content)) !== null) {
    structures.push({
      name: match[1],
      type: 'linked_list',
      startLine: content.substring(0, match.index).split('\n').length,
      endLine: content.substring(0, match.index + match[0].length).split('\n').length,
      instances: Math.floor(Math.random() * 50) + 5,
      depth: Math.floor(Math.random() * 5) + 1,
    });
  }
  
  // Detect class definitions
  const classRegex = /class\s+(\w+)\s*{[^}]*}/g;
  while ((match = classRegex.exec(content)) !== null) {
    structures.push({
      name: match[1],
      type: 'nested',
      startLine: content.substring(0, match.index).split('\n').length,
      endLine: content.substring(0, match.index + match[0].length).split('\n').length,
      instances: Math.floor(Math.random() * 30) + 3,
      depth: Math.floor(Math.random() * 7) + 2,
    });
  }
  
  return structures;
}

function generateMatrixData(structures: any[]) {
  const matrix = [];
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 12; j++) {
      const random = Math.random();
      let type: 'active' | 'dropped' | 'empty' | 'pointer';
      
      if (random < 0.4) type = 'active';
      else if (random < 0.6) type = 'pointer';
      else if (random < 0.8) type = 'dropped';
      else type = 'empty';
      
      matrix.push({
        x: j,
        y: i,
        type,
        value: type !== 'empty' ? `Node_${i}_${j}` : null,
        tooltip: `${type} cell at (${j}, ${i})`,
      });
    }
  }
  
  return matrix;
}
