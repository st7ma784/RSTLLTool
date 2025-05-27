import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileCode, 
  Folder, 
  Play, 
  Search,
  ChartArea,
  Loader2,
  X
} from "lucide-react";
import type { CppFile, DetectedStructure } from "@shared/schema";

interface FileExplorerProps {
  files: CppFile[];
  selectedFile: CppFile | null;
  onFileSelect: (file: CppFile) => void;
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
  detectedStructures: DetectedStructure[];
}

export function FileExplorer({
  files,
  selectedFile,
  onFileSelect,
  onStartAnalysis,
  isAnalyzing,
  detectedStructures,
}: FileExplorerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [analysisOptions, setAnalysisOptions] = useState({
    detectMemoryLeaks: true,
    analyzeDropPatterns: true,
    suggestOptimizations: false,
    generateArrayMappings: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileData = {
        name: file.name,
        content: await file.text(),
        size: file.size,
      };
      return apiRequest("POST", "/api/files", fileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File uploaded successfully",
        description: "File has been added to the project",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => apiRequest("DELETE", `/api/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File deleted",
        description: "File has been removed from the project",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    if (!file.name.match(/\.(cpp|c|h|hpp|cc|cxx)$/i)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a C++ source or header file",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFileUpload);
  };

  const getStructureTypeColor = (type: string) => {
    switch (type) {
      case 'linked_list': return 'bg-green-600';
      case 'nested': return 'bg-purple-600';
      case 'simple': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="w-full bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* File Upload Section */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-300 mb-4">Project Files</h2>
        
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50 bg-opacity-10' 
              : 'border-gray-600 hover:border-blue-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-300 mb-1">Drop C++ files here</p>
          <p className="text-xs text-gray-500">or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".cpp,.c,.h,.hpp,.cc,.cxx"
            onChange={handleFileInputChange}
          />
        </div>

        {/* File List */}
        <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                selectedFile?.id === file.id 
                  ? 'bg-gray-700' 
                  : 'bg-gray-750 hover:bg-gray-700'
              }`}
              onClick={() => onFileSelect(file)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <FileCode className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-gray-300 truncate">
                  {file.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {Math.round(file.size / 1024)}KB
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(file.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Structure Analysis */}
      {detectedStructures.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Detected Structures</h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {detectedStructures.map((structure, index) => (
              <Card key={index} className="bg-gray-750 border-gray-600">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      {structure.name}
                    </span>
                    <Badge className={getStructureTypeColor(structure.type)}>
                      {structure.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {structure.instances} instances • {structure.depth} levels deep
                  </p>
                  <p className="text-xs text-gray-500">
                    Lines {structure.startLine}-{structure.endLine}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Controls */}
      <div className="p-4 flex-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Analysis Options</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={analysisOptions.detectMemoryLeaks}
              onCheckedChange={(checked) =>
                setAnalysisOptions(prev => ({ ...prev, detectMemoryLeaks: !!checked }))
              }
            />
            <span className="text-sm text-gray-300">Detect memory leaks</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={analysisOptions.analyzeDropPatterns}
              onCheckedChange={(checked) =>
                setAnalysisOptions(prev => ({ ...prev, analyzeDropPatterns: !!checked }))
              }
            />
            <span className="text-sm text-gray-300">Analyze drop patterns</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={analysisOptions.suggestOptimizations}
              onCheckedChange={(checked) =>
                setAnalysisOptions(prev => ({ ...prev, suggestOptimizations: !!checked }))
              }
            />
            <span className="text-sm text-gray-300">Suggest optimizations</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={analysisOptions.generateArrayMappings}
              onCheckedChange={(checked) =>
                setAnalysisOptions(prev => ({ ...prev, generateArrayMappings: !!checked }))
              }
            />
            <span className="text-sm text-gray-300">Generate array mappings</span>
          </label>
        </div>

        <Button
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
          onClick={onStartAnalysis}
          disabled={!selectedFile || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
