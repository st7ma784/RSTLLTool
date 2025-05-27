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

  // Live Data Structure Manipulation API
  // Create a new data structure
  app.post("/api/live/structure", async (req, res) => {
    try {
      const { name, type, depth = 1, initialSize = 10 } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }

      const structure = await storage.createLiveStructure({
        name,
        type,
        depth: Math.max(1, depth),
        nodes: [],
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
      });

      // Initialize with empty nodes if specified
      if (initialSize > 0) {
        for (let i = 0; i < initialSize; i++) {
          structure.nodes.push({
            id: i,
            value: null,
            active: false,
            next: type === 'linked_list' ? (i < initialSize - 1 ? i + 1 : null) : null,
            metadata: {},
          });
        }
        await storage.updateLiveStructure(structure.id, structure);
      }

      res.json(structure);
    } catch (error) {
      res.status(500).json({ message: "Failed to create structure", error });
    }
  });

  // Get all live structures
  app.get("/api/live/structures", async (req, res) => {
    try {
      const structures = await storage.getAllLiveStructures();
      res.json(structures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch structures", error });
    }
  });

  // Get specific structure
  app.get("/api/live/structure/:name", async (req, res) => {
    try {
      const structure = await storage.getLiveStructureByName(req.params.name);
      if (!structure) {
        return res.status(404).json({ message: "Structure not found" });
      }
      res.json(structure);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch structure", error });
    }
  });

  // Add node to structure
  app.post("/api/live/structure/:name/node", async (req, res) => {
    try {
      const { value, index, metadata = {} } = req.body;
      const structure = await storage.getLiveStructureByName(req.params.name);
      
      if (!structure) {
        return res.status(404).json({ message: "Structure not found" });
      }

      const nodeId = structure.nodes.length > 0 ? Math.max(...structure.nodes.map(n => n.id)) + 1 : 0;
      const newNode = {
        id: nodeId,
        value: value,
        active: true,
        next: null,
        metadata: metadata,
      };

      if (index !== undefined && index >= 0 && index <= structure.nodes.length) {
        structure.nodes.splice(index, 0, newNode);
        // Update next pointers for linked list
        if (structure.type === 'linked_list') {
          updateLinkedListPointers(structure.nodes);
        }
      } else {
        structure.nodes.push(newNode);
        // For linked list, link the previous last node to this one
        if (structure.type === 'linked_list' && structure.nodes.length > 1) {
          structure.nodes[structure.nodes.length - 2].next = nodeId;
        }
      }

      structure.last_modified = new Date().toISOString();
      await storage.updateLiveStructure(structure.id, structure);

      res.json({ node: newNode, structure });
    } catch (error) {
      res.status(500).json({ message: "Failed to add node", error });
    }
  });

  // Remove node from structure
  app.delete("/api/live/structure/:name/node/:nodeId", async (req, res) => {
    try {
      const nodeId = parseInt(req.params.nodeId);
      const structure = await storage.getLiveStructureByName(req.params.name);
      
      if (!structure) {
        return res.status(404).json({ message: "Structure not found" });
      }

      const nodeIndex = structure.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        return res.status(404).json({ message: "Node not found" });
      }

      // Mark as inactive instead of actual removal for visualization
      structure.nodes[nodeIndex].active = false;
      structure.nodes[nodeIndex].metadata.dropped_at = new Date().toISOString();

      // Update linked list pointers if needed
      if (structure.type === 'linked_list') {
        updateLinkedListPointers(structure.nodes.filter(n => n.active));
      }

      structure.last_modified = new Date().toISOString();
      await storage.updateLiveStructure(structure.id, structure);

      res.json({ message: "Node marked as inactive", structure });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove node", error });
    }
  });

  // Update node in structure
  app.put("/api/live/structure/:name/node/:nodeId", async (req, res) => {
    try {
      const nodeId = parseInt(req.params.nodeId);
      const { value, metadata = {} } = req.body;
      const structure = await storage.getLiveStructureByName(req.params.name);
      
      if (!structure) {
        return res.status(404).json({ message: "Structure not found" });
      }

      const node = structure.nodes.find(n => n.id === nodeId);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }

      if (value !== undefined) node.value = value;
      node.metadata = { ...node.metadata, ...metadata };
      node.metadata.last_updated = new Date().toISOString();

      structure.last_modified = new Date().toISOString();
      await storage.updateLiveStructure(structure.id, structure);

      res.json({ node, structure });
    } catch (error) {
      res.status(500).json({ message: "Failed to update node", error });
    }
  });

  // Get live matrix visualization for all structures
  app.get("/api/live/matrix", async (req, res) => {
    try {
      const structures = await storage.getAllLiveStructures();
      const matrix = generateLiveMatrix(structures);
      res.json(matrix);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate live matrix", error });
    }
  });

  // Clear/reset a structure
  app.delete("/api/live/structure/:name", async (req, res) => {
    try {
      const deleted = await storage.deleteLiveStructure(req.params.name);
      if (!deleted) {
        return res.status(404).json({ message: "Structure not found" });
      }
      res.json({ message: "Structure deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete structure", error });
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

// Helper functions for live data structures
function updateLinkedListPointers(nodes: any[]) {
  for (let i = 0; i < nodes.length; i++) {
    if (i < nodes.length - 1) {
      nodes[i].next = nodes[i + 1].id;
    } else {
      nodes[i].next = null;
    }
  }
}

function generateLiveMatrix(structures: any[]) {
  const matrix = [];
  const gridWidth = 12;
  const gridHeight = 8;
  
  // Initialize empty matrix
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      matrix.push({
        x,
        y,
        type: 'empty',
        value: null,
        tooltip: `Empty cell at (${x}, ${y})`,
        structureName: null,
        nodeId: null,
      });
    }
  }
  
  // Place structures in matrix
  let currentY = 0;
  structures.forEach((structure) => {
    const activeNodes = structure.nodes.filter((n: any) => n.active);
    const droppedNodes = structure.nodes.filter((n: any) => !n.active);
    
    // Place active nodes
    activeNodes.forEach((node: any, index: number) => {
      const x = index % gridWidth;
      const y = currentY + Math.floor(index / gridWidth);
      
      if (y < gridHeight) {
        const matrixIndex = y * gridWidth + x;
        if (matrixIndex < matrix.length) {
          matrix[matrixIndex] = {
            x,
            y,
            type: 'active',
            value: node.value !== null ? node.value : `${structure.name}_${node.id}`,
            tooltip: `${structure.name} node ${node.id} (active)`,
            structureName: structure.name,
            nodeId: node.id,
          };
        }
      }
    });
    
    // Place dropped nodes
    droppedNodes.forEach((node: any, index: number) => {
      const totalActiveNodes = activeNodes.length;
      const x = (totalActiveNodes + index) % gridWidth;
      const y = currentY + Math.floor((totalActiveNodes + index) / gridWidth);
      
      if (y < gridHeight) {
        const matrixIndex = y * gridWidth + x;
        if (matrixIndex < matrix.length) {
          matrix[matrixIndex] = {
            x,
            y,
            type: 'dropped',
            value: node.value !== null ? node.value : `${structure.name}_${node.id}`,
            tooltip: `${structure.name} node ${node.id} (dropped)`,
            structureName: structure.name,
            nodeId: node.id,
          };
        }
      }
    });
    
    // Move to next row for next structure
    const totalNodes = structure.nodes.length;
    currentY += Math.ceil(totalNodes / gridWidth);
  });
  
  return matrix;
}
