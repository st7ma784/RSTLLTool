import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Target, 
  List, 
  GitBranch, 
  Database,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff
} from "lucide-react";
import type { DetectedStructure } from "@shared/schema";

interface StructureSelectorProps {
  structures: DetectedStructure[];
  selectedStructures: string[];
  onSelectionChange: (selected: string[]) => void;
  onStartTargetedAnalysis: (structures: string[]) => void;
  isAnalyzing: boolean;
}

export function StructureSelector({
  structures,
  selectedStructures,
  onSelectionChange,
  onStartTargetedAnalysis,
  isAnalyzing,
}: StructureSelectorProps) {
  const [selectAll, setSelectAll] = useState(false);

  const handleStructureToggle = (structureName: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedStructures, structureName]
      : selectedStructures.filter(name => name !== structureName);
    
    onSelectionChange(newSelection);
    setSelectAll(newSelection.length === structures.length);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(structures.map(s => s.name));
    } else {
      onSelectionChange([]);
    }
  };

  const getStructureIcon = (type: string) => {
    switch (type) {
      case 'linked_list': return <List className="h-4 w-4" />;
      case 'nested': return <GitBranch className="h-4 w-4" />;
      case 'simple': return <Database className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getStructureColor = (type: string) => {
    switch (type) {
      case 'linked_list': return 'bg-green-600';
      case 'nested': return 'bg-purple-600';
      case 'simple': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getPriorityScore = (structure: DetectedStructure) => {
    // Calculate priority based on type and complexity
    let score = 0;
    if (structure.type === 'linked_list') score += 10;
    if (structure.type === 'nested') score += 8;
    score += Math.min(structure.instances / 10, 5);
    score += Math.min(structure.depth, 3);
    return Math.round(score);
  };

  const sortedStructures = [...structures].sort((a, b) => {
    const scoreA = getPriorityScore(a);
    const scoreB = getPriorityScore(b);
    return scoreB - scoreA; // Higher priority first
  });

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Structure Selection
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {selectedStructures.length} of {structures.length} selected
          </Badge>
        </div>
        
        {structures.length > 0 && (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-xs text-gray-400 cursor-pointer">
              Select all structures
            </label>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {structures.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Database className="h-8 w-8 mx-auto mb-3 text-gray-500" />
            <p className="text-sm">No data structures detected</p>
            <p className="text-xs text-gray-500 mt-1">
              Upload and analyze C++ code to see structures
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {sortedStructures.map((structure, index) => {
                  const isSelected = selectedStructures.includes(structure.name);
                  const priorityScore = getPriorityScore(structure);
                  
                  return (
                    <div
                      key={structure.name}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-blue-900 bg-opacity-30 border-blue-600' 
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                        }
                      `}
                      onClick={() => handleStructureToggle(structure.name, !isSelected)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent click
                            className="mt-0.5"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStructureIcon(structure.type)}
                              <span className="font-medium text-gray-300 truncate">
                                {structure.name}
                              </span>
                              <Badge className={`text-xs ${getStructureColor(structure.type)}`}>
                                {structure.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-gray-400 space-y-1">
                              <div className="flex items-center space-x-4">
                                <span>{structure.instances} instances</span>
                                <span>{structure.depth} levels deep</span>
                                <span>Lines {structure.startLine}-{structure.endLine}</span>
                              </div>
                              
                              {priorityScore > 7 && (
                                <div className="flex items-center space-x-1 text-yellow-400">
                                  <Target className="h-3 w-3" />
                                  <span>High optimization priority</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            Priority: {priorityScore}
                          </Badge>
                          {isSelected ? (
                            <Eye className="h-4 w-4 text-blue-400" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {selectedStructures.length > 0 && (
              <>
                <Separator className="bg-gray-600" />
                
                <div className="space-y-3">
                  <div className="text-xs text-gray-400">
                    <span className="font-medium">Selected for analysis:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedStructures.map(name => (
                        <Badge key={name} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onStartTargetedAnalysis(selectedStructures)}
                    disabled={isAnalyzing || selectedStructures.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Analyzing Selected...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-2" />
                        Analyze Selected Structures
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}