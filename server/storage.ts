import { cppFiles, analysisResults, type CppFile, type InsertCppFile, type AnalysisResult, type InsertAnalysisResult } from "@shared/schema";

// Live structure types
export interface LiveNode {
  id: number;
  value: any;
  active: boolean;
  next: number | null;
  metadata: Record<string, any>;
}

export interface LiveStructure {
  id: number;
  name: string;
  type: 'linked_list' | 'array' | 'tree' | 'graph';
  depth: number;
  nodes: LiveNode[];
  created_at: string;
  last_modified: string;
}

export interface InsertLiveStructure {
  name: string;
  type: 'linked_list' | 'array' | 'tree' | 'graph';
  depth: number;
  nodes: LiveNode[];
  created_at: string;
  last_modified: string;
}

export interface IStorage {
  // C++ Files
  createCppFile(file: InsertCppFile): Promise<CppFile>;
  getCppFile(id: number): Promise<CppFile | undefined>;
  getAllCppFiles(): Promise<CppFile[]>;
  deleteCppFile(id: number): Promise<boolean>;

  // Analysis Results
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisResult(id: number): Promise<AnalysisResult | undefined>;
  getAnalysisResultByFileId(fileId: number): Promise<AnalysisResult | undefined>;
  updateAnalysisResult(id: number, result: Partial<InsertAnalysisResult>): Promise<AnalysisResult | undefined>;

  // Live Data Structures
  createLiveStructure(structure: InsertLiveStructure): Promise<LiveStructure>;
  getLiveStructure(id: number): Promise<LiveStructure | undefined>;
  getLiveStructureByName(name: string): Promise<LiveStructure | undefined>;
  getAllLiveStructures(): Promise<LiveStructure[]>;
  updateLiveStructure(id: number, structure: Partial<LiveStructure>): Promise<LiveStructure | undefined>;
  deleteLiveStructure(name: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private cppFiles: Map<number, CppFile>;
  private analysisResults: Map<number, AnalysisResult>;
  private liveStructures: Map<number, LiveStructure>;
  private liveStructuresByName: Map<string, LiveStructure>;
  private currentFileId: number;
  private currentAnalysisId: number;
  private currentLiveStructureId: number;

  constructor() {
    this.cppFiles = new Map();
    this.analysisResults = new Map();
    this.liveStructures = new Map();
    this.liveStructuresByName = new Map();
    this.currentFileId = 1;
    this.currentAnalysisId = 1;
    this.currentLiveStructureId = 1;
  }

  async createCppFile(insertFile: InsertCppFile): Promise<CppFile> {
    const id = this.currentFileId++;
    const file: CppFile = { ...insertFile, id };
    this.cppFiles.set(id, file);
    return file;
  }

  async getCppFile(id: number): Promise<CppFile | undefined> {
    return this.cppFiles.get(id);
  }

  async getAllCppFiles(): Promise<CppFile[]> {
    return Array.from(this.cppFiles.values());
  }

  async deleteCppFile(id: number): Promise<boolean> {
    const deleted = this.cppFiles.delete(id);
    // Also delete associated analysis results
    for (const [analysisId, result] of this.analysisResults.entries()) {
      if (result.file_id === id) {
        this.analysisResults.delete(analysisId);
      }
    }
    return deleted;
  }

  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const id = this.currentAnalysisId++;
    const result: AnalysisResult = { ...insertResult, id };
    this.analysisResults.set(id, result);
    return result;
  }

  async getAnalysisResult(id: number): Promise<AnalysisResult | undefined> {
    return this.analysisResults.get(id);
  }

  async getAnalysisResultByFileId(fileId: number): Promise<AnalysisResult | undefined> {
    return Array.from(this.analysisResults.values()).find(
      (result) => result.file_id === fileId
    );
  }

  async updateAnalysisResult(id: number, updateData: Partial<InsertAnalysisResult>): Promise<AnalysisResult | undefined> {
    const existing = this.analysisResults.get(id);
    if (!existing) return undefined;

    const updated: AnalysisResult = { ...existing, ...updateData };
    this.analysisResults.set(id, updated);
    return updated;
  }

  // Live Data Structure Methods
  async createLiveStructure(insertStructure: InsertLiveStructure): Promise<LiveStructure> {
    const id = this.currentLiveStructureId++;
    const structure: LiveStructure = { ...insertStructure, id };
    this.liveStructures.set(id, structure);
    this.liveStructuresByName.set(structure.name, structure);
    return structure;
  }

  async getLiveStructure(id: number): Promise<LiveStructure | undefined> {
    return this.liveStructures.get(id);
  }

  async getLiveStructureByName(name: string): Promise<LiveStructure | undefined> {
    return this.liveStructuresByName.get(name);
  }

  async getAllLiveStructures(): Promise<LiveStructure[]> {
    return Array.from(this.liveStructures.values());
  }

  async updateLiveStructure(id: number, updateData: Partial<LiveStructure>): Promise<LiveStructure | undefined> {
    const existing = this.liveStructures.get(id);
    if (!existing) return undefined;

    const updated: LiveStructure = { ...existing, ...updateData };
    this.liveStructures.set(id, updated);
    this.liveStructuresByName.set(updated.name, updated);
    return updated;
  }

  async deleteLiveStructure(name: string): Promise<boolean> {
    const structure = this.liveStructuresByName.get(name);
    if (!structure) return false;

    this.liveStructures.delete(structure.id);
    this.liveStructuresByName.delete(name);
    return true;
  }
}

export const storage = new MemStorage();
