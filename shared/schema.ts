import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cppFiles = pgTable("cpp_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  size: integer("size").notNull(),
  uploaded_at: text("uploaded_at").notNull(),
});

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  file_id: integer("file_id").notNull(),
  structures: jsonb("structures").notNull(),
  matrix_data: jsonb("matrix_data"),
  analysis_status: text("analysis_status").notNull(),
  created_at: text("created_at").notNull(),
});

export const insertCppFileSchema = createInsertSchema(cppFiles).omit({
  id: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
});

export type InsertCppFile = z.infer<typeof insertCppFileSchema>;
export type CppFile = typeof cppFiles.$inferSelect;

export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
export type AnalysisResult = typeof analysisResults.$inferSelect;

// Frontend-specific types
export interface DetectedStructure {
  name: string;
  type: 'linked_list' | 'nested' | 'simple';
  startLine: number;
  endLine: number;
  instances: number;
  depth: number;
}

export interface MatrixCell {
  x: number;
  y: number;
  type: 'active' | 'dropped' | 'empty' | 'pointer';
  value?: any;
  tooltip?: string;
}

export interface CodeStep {
  line: number;
  column: number;
  description: string;
  matrixChanges?: MatrixCell[];
}
