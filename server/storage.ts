import { cppFiles, analysisResults, type CppFile, type InsertCppFile, type AnalysisResult, type InsertAnalysisResult } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private cppFiles: Map<number, CppFile>;
  private analysisResults: Map<number, AnalysisResult>;
  private currentFileId: number;
  private currentAnalysisId: number;

  constructor() {
    this.cppFiles = new Map();
    this.analysisResults = new Map();
    this.currentFileId = 1;
    this.currentAnalysisId = 1;
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
}

export const storage = new MemStorage();
