import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { parseCodeToStructures } from "@/lib/cppParser";
import { matrixGenerator } from "@/lib/matrixGenerator";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult, DetectedStructure, MatrixCell } from "@shared/schema";

interface AnalysisState {
  currentStep: number;
  totalSteps: number;
  executionSteps: Array<{
    line: number;
    description: string;
    type: string;
  }>;
  matrix: MatrixCell[];
}

export function useCodeAnalysis(fileId?: number) {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    currentStep: 0,
    totalSteps: 0,
    executionSteps: [],
    matrix: [],
  });

  const { toast } = useToast();

  // Fetch existing analysis
  const { data: analysis, isLoading } = useQuery<AnalysisResult>({
    queryKey: ["/api/analysis/file", fileId],
    enabled: !!fileId,
  });

  // Create new analysis
  const analysisMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!fileId) throw new Error("No file selected");
      
      const response = await apiRequest("POST", "/api/analyze-code", {
        fileId,
        content,
      });
      return response.json();
    },
    onSuccess: (result: AnalysisResult) => {
      const structures = result.structures as DetectedStructure[];
      const parsedData = parseCodeToStructures("");
      const matrix = matrixGenerator.generateFromStructures(structures);
      
      setAnalysisState({
        currentStep: 0,
        totalSteps: parsedData.executionSteps.length,
        executionSteps: parsedData.executionSteps,
        matrix,
      });

      toast({
        title: "Analysis completed",
        description: `Found ${structures.length} data structures`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startAnalysis = useCallback(async (content: string, selectedStructures?: string[]) => {
    try {
      // Parse code locally first for immediate feedback
      const parsedData = parseCodeToStructures(content);
      const structures: DetectedStructure[] = parsedData.linkedLists.map(s => ({
        name: s.name,
        type: 'linked_list' as const,
        startLine: s.startLine,
        endLine: s.endLine || s.startLine,
        instances: Math.floor(Math.random() * 50) + 10,
        depth: Math.floor(Math.random() * 5) + 1,
      }));

      // Add nested structures
      parsedData.nested.forEach(s => {
        if (!structures.find(existing => existing.name === s.name)) {
          structures.push({
            name: s.name,
            type: 'nested' as const,
            startLine: s.startLine,
            endLine: s.endLine || s.startLine,
            instances: Math.floor(Math.random() * 30) + 5,
            depth: Math.floor(Math.random() * 7) + 2,
          });
        }
      });

      // Filter structures based on selection if provided
      const targetStructures = selectedStructures && selectedStructures.length > 0 
        ? structures.filter(s => selectedStructures.includes(s.name))
        : structures;

      const matrix = matrixGenerator.generateFromStructures(targetStructures);
      
      setAnalysisState({
        currentStep: 0,
        totalSteps: parsedData.executionSteps.length,
        executionSteps: parsedData.executionSteps,
        matrix,
      });

      // Then send to server for full analysis
      await analysisMutation.mutateAsync(content);
    } catch (error) {
      console.error("Analysis error:", error);
    }
  }, [analysisMutation]);

  const stepForward = useCallback(() => {
    setAnalysisState(prev => {
      if (prev.currentStep >= prev.totalSteps - 1) return prev;
      
      const newStep = prev.currentStep + 1;
      const updatedMatrix = matrixGenerator.updateMatrixForStep(prev.matrix, newStep);
      
      return {
        ...prev,
        currentStep: newStep,
        matrix: updatedMatrix,
      };
    });

    return {
      step: analysisState.currentStep + 1,
      description: analysisState.executionSteps[analysisState.currentStep + 1]?.description,
    };
  }, [analysisState.currentStep, analysisState.executionSteps]);

  const stepBackward = useCallback(() => {
    setAnalysisState(prev => {
      if (prev.currentStep <= 0) return prev;
      
      const newStep = prev.currentStep - 1;
      
      return {
        ...prev,
        currentStep: newStep,
      };
    });

    return {
      step: Math.max(0, analysisState.currentStep - 1),
      description: analysisState.executionSteps[Math.max(0, analysisState.currentStep - 1)]?.description,
    };
  }, [analysisState.currentStep, analysisState.executionSteps]);

  const resetAnalysis = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      currentStep: 0,
    }));
  }, []);

  return {
    analysis: analysis || null,
    isLoading: isLoading || analysisMutation.isPending,
    currentStep: analysisState.currentStep,
    totalSteps: analysisState.totalSteps,
    executionSteps: analysisState.executionSteps,
    matrix: analysisState.matrix,
    startAnalysis,
    stepForward,
    stepBackward,
    resetAnalysis,
  };
}
