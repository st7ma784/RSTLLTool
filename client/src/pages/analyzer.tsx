import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { MatrixVisualization } from "@/components/MatrixVisualization";
import { AnalysisResults } from "@/components/AnalysisResults";
import { StructureSelector } from "@/components/StructureSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCodeAnalysis } from "@/hooks/useCodeAnalysis";
import { Save, Upload, Settings, ChartGantt } from "lucide-react";
import type { CppFile, DetectedStructure, CodeStep } from "@shared/schema";

export default function Analyzer() {
  const [selectedFile, setSelectedFile] = useState<CppFile | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedStructures, setSelectedStructures] = useState<string[]>([]);

  const { data: files = [] } = useQuery<CppFile[]>({
    queryKey: ["/api/files"],
  });

  const {
    analysis,
    startAnalysis,
    stepForward,
    stepBackward,
    isLoading: analysisLoading,
  } = useCodeAnalysis(selectedFile?.id);

  const handleFileSelect = useCallback((file: CppFile) => {
    setSelectedFile(file);
    setCurrentStep(0);
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    try {
      await startAnalysis(selectedFile.content);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, startAnalysis]);

  const handleTargetedAnalysis = useCallback(async (structureNames: string[]) => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    try {
      await startAnalysis(selectedFile.content, structureNames);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, startAnalysis]);

  const handleStepForward = useCallback(() => {
    const result = stepForward();
    if (result) {
      setCurrentStep(result.step);
    }
  }, [stepForward]);

  const handleStepBackward = useCallback(() => {
    const result = stepBackward();
    if (result) {
      setCurrentStep(result.step);
    }
  }, [stepBackward]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 h-14 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ChartGantt className="text-blue-500 h-5 w-5" />
            <h1 className="text-lg font-semibold">C++ Data Structure Visualizer</h1>
          </div>
          <div className="text-sm text-gray-400">RST Code Analysis Tool</div>
        </div>
        <div className="flex items-center space-x-3">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Code
          </Button>
          <Button size="sm" variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="ghost">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="flex flex-col h-full">
              {/* File Explorer - Upper Section */}
              <div className="flex-1 min-h-0">
                <FileExplorer
                  files={files}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  onStartAnalysis={handleStartAnalysis}
                  isAnalyzing={isAnalyzing || analysisLoading}
                  detectedStructures={analysis?.structures as DetectedStructure[] || []}
                />
              </div>
              
              {/* Structure Selector - Lower Section */}
              {(analysis?.structures as DetectedStructure[] || []).length > 0 && (
                <div className="border-t border-gray-700">
                  <StructureSelector
                    structures={analysis?.structures as DetectedStructure[] || []}
                    selectedStructures={selectedStructures}
                    onSelectionChange={setSelectedStructures}
                    onStartTargetedAnalysis={handleTargetedAnalysis}
                    isAnalyzing={isAnalyzing || analysisLoading}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Content Area */}
          <ResizablePanel defaultSize={75}>
            <div className="flex flex-col h-full">
              {/* Tab Bar */}
              <div className="bg-gray-800 border-b border-gray-700">
                <Tabs defaultValue="code" className="w-full">
                  <TabsList className="bg-transparent border-none h-auto p-0">
                    <TabsTrigger 
                      value="code" 
                      className="bg-gray-700 border-r border-gray-600 rounded-none data-[state=active]:bg-gray-600"
                    >
                      {selectedFile?.name || "No file selected"}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="matrix" 
                      className="bg-transparent border-r border-gray-600 rounded-none data-[state=active]:bg-gray-700"
                    >
                      Matrix View
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Code Editor Panel */}
                <ResizablePanel defaultSize={60}>
                  <CodeEditor
                    file={selectedFile}
                    currentStep={currentStep}
                    onStepForward={handleStepForward}
                    onStepBackward={handleStepBackward}
                    analysis={analysis}
                  />
                </ResizablePanel>

                <ResizableHandle />

                {/* Visualization Panel */}
                <ResizablePanel defaultSize={40}>
                  <MatrixVisualization
                    matrixData={analysis?.matrix_data}
                    currentStep={currentStep}
                    structures={analysis?.structures as DetectedStructure[] || []}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>

              {/* Analysis Results Panel */}
              <div className="h-64 border-t border-gray-700">
                <AnalysisResults 
                  analysis={analysis}
                  structures={analysis?.structures as DetectedStructure[] || []}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
