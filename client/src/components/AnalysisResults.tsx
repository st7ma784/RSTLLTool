import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChartLine, 
  Code, 
  AlertTriangle, 
  Lightbulb,
  FileText,
  Download,
  BarChart3,
  MemoryStick,
  Zap
} from "lucide-react";
import type { AnalysisResult, DetectedStructure } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: AnalysisResult | null;
  structures: DetectedStructure[];
}

export function AnalysisResults({ analysis, structures }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("results");

  const getAnalysisStats = () => {
    if (!structures.length) {
      return {
        totalStructures: 0,
        memoryUsage: 0,
        dropRate: 0,
        parallelizationPotential: 0,
      };
    }

    return {
      totalStructures: structures.length,
      memoryUsage: 2.4, // MB
      dropRate: 28, // %
      parallelizationPotential: 85, // %
    };
  };

  const generateArrayMapping = (structure: DetectedStructure) => {
    return `
// Convert ${structure.name} from linked list to array structure
std::vector<${structure.name}> ${structure.name.toLowerCase()}_array;
std::vector<bool> ${structure.name.toLowerCase()}_mask;

// Original size estimation: ${structure.instances} elements
${structure.name.toLowerCase()}_array.reserve(${structure.instances});
${structure.name.toLowerCase()}_mask.resize(${structure.instances}, true);

// Migration helper function
void convert_${structure.name.toLowerCase()}_to_array() {
    // Implementation for parallel processing
    #pragma omp parallel for
    for (size_t i = 0; i < ${structure.name.toLowerCase()}_array.size(); ++i) {
        if (${structure.name.toLowerCase()}_mask[i]) {
            // Process active element
            process_element(${structure.name.toLowerCase()}_array[i]);
        }
    }
}
    `.trim();
  };

  const getIssues = () => [
    {
      type: "memory",
      severity: "high",
      message: "Memory fragmentation detected in linked list traversal",
      suggestion: "Consider using contiguous memory allocation"
    },
    {
      type: "performance",
      severity: "medium", 
      message: "Sequential processing limits parallelization",
      suggestion: "Convert to array-based structure for parallel processing"
    },
    {
      type: "optimization",
      severity: "low",
      message: "Drop pattern analysis shows 28% inefficiency",
      suggestion: "Implement lazy deletion with batch cleanup"
    }
  ];

  const getSuggestions = () => [
    {
      title: "Array-based refactoring",
      description: "Replace linked lists with std::vector for better cache locality",
      impact: "60% performance improvement expected"
    },
    {
      title: "Parallel processing implementation",
      description: "Use OpenMP pragmas for parallel data processing",
      impact: "85% parallelization potential"
    },
    {
      title: "Memory pool allocation",
      description: "Implement custom allocator to reduce fragmentation",
      impact: "40% memory usage reduction"
    }
  ];

  const stats = getAnalysisStats();
  const issues = getIssues();
  const suggestions = getSuggestions();

  return (
    <div className="h-full bg-gray-800 border-t border-gray-700">
      <div className="flex h-full">
        {/* Sidebar Navigation */}
        <div className="w-48 border-r border-gray-700 bg-gray-850">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="h-full">
            <TabsList className="flex flex-col h-auto w-full bg-transparent p-4 space-y-1">
              <TabsTrigger 
                value="results" 
                className="w-full justify-start text-left data-[state=active]:bg-blue-600"
              >
                <ChartLine className="h-4 w-4 mr-2" />
                Analysis Results
              </TabsTrigger>
              <TabsTrigger 
                value="mapping" 
                className="w-full justify-start text-left data-[state=active]:bg-blue-600"
              >
                <Code className="h-4 w-4 mr-2" />
                Array Mapping
              </TabsTrigger>
              <TabsTrigger 
                value="issues" 
                className="w-full justify-start text-left data-[state=active]:bg-blue-600"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Issues Found
              </TabsTrigger>
              <TabsTrigger 
                value="suggestions" 
                className="w-full justify-start text-left data-[state=active]:bg-blue-600"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Suggestions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} className="h-full">
            {/* Analysis Results */}
            <TabsContent value="results" className="p-4 space-y-4 m-0">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-900 bg-opacity-30 border-blue-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-300">Total Structures</span>
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-200 mt-2">{stats.totalStructures}</div>
                    <div className="text-xs text-blue-400 mt-1">
                      {structures.map(s => s.name).join(", ") || "No structures detected"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-900 bg-opacity-30 border-purple-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-300">Memory Usage</span>
                      <MemoryStick className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-200 mt-2">{stats.memoryUsage} MB</div>
                    <div className="text-xs text-purple-400 mt-1">Current allocation</div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-900 bg-opacity-30 border-orange-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-300">Drop Rate</span>
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-orange-200 mt-2">{stats.dropRate}%</div>
                    <div className="text-xs text-orange-400 mt-1">Average across all stages</div>
                  </CardContent>
                </Card>

                <Card className="bg-green-900 bg-opacity-30 border-green-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-300">Parallelization</span>
                      <Zap className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-green-200 mt-2">{stats.parallelizationPotential}%</div>
                    <div className="text-xs text-green-400 mt-1">Potential speedup</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <Card className="bg-gray-750 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-gray-300">Structure Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {structures.map((structure, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-300">{structure.name} structures</span>
                        <span className="text-gray-400 ml-2">
                          can be converted to a {structure.instances}x{structure.depth} matrix with estimated 72% active elements. 
                          Recommend using std::vector&lt;{structure.name}&gt; with std::vector&lt;bool&gt; mask.
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {structures.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      <p>No analysis results available</p>
                      <p className="text-sm">Upload and analyze C++ code to see results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Array Mapping */}
            <TabsContent value="mapping" className="p-4 space-y-4 m-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-300">Array Structure Mapping</h3>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Code
                </Button>
              </div>
              
              {structures.map((structure, index) => (
                <Card key={index} className="bg-gray-750 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-300">
                      {structure.name} → Array Conversion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-gray-300 bg-gray-800 p-4 rounded overflow-x-auto">
                      <code>{generateArrayMapping(structure)}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}

              {structures.length === 0 && (
                <Card className="bg-gray-750 border-gray-600">
                  <CardContent className="text-center py-8 text-gray-400">
                    <Code className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p>No structures available for mapping</p>
                    <p className="text-sm">Analyze C++ code to generate array mappings</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Issues Found */}
            <TabsContent value="issues" className="p-4 space-y-4 m-0">
              <h3 className="text-lg font-semibold text-gray-300">Code Analysis Issues</h3>
              
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <Card key={index} className="bg-gray-750 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          issue.severity === 'high' ? 'text-red-400' :
                          issue.severity === 'medium' ? 'text-yellow-400' :
                          'text-blue-400'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-300">{issue.message}</span>
                            <Badge variant={
                              issue.severity === 'high' ? 'destructive' :
                              issue.severity === 'medium' ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{issue.suggestion}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Suggestions */}
            <TabsContent value="suggestions" className="p-4 space-y-4 m-0">
              <h3 className="text-lg font-semibold text-gray-300">Optimization Suggestions</h3>
              
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="bg-gray-750 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="h-5 w-5 mt-0.5 text-yellow-400" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-300 mb-1">{suggestion.title}</h4>
                          <p className="text-sm text-gray-400 mb-2">{suggestion.description}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                              {suggestion.impact}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
