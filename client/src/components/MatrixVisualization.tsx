import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Download, RotateCcw } from "lucide-react";
import type { MatrixCell, DetectedStructure } from "@shared/schema";

interface MatrixVisualizationProps {
  matrixData: any;
  currentStep: number;
  structures: DetectedStructure[];
}

export function MatrixVisualization({
  matrixData,
  currentStep,
  structures,
}: MatrixVisualizationProps) {
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const matrix = useMemo(() => {
    if (!matrixData || !Array.isArray(matrixData)) {
      // Generate default matrix for demonstration
      const defaultMatrix: MatrixCell[] = [];
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 12; x++) {
          const random = Math.random();
          let type: 'active' | 'dropped' | 'empty' | 'pointer';
          
          if (random < 0.35) type = 'active';
          else if (random < 0.55) type = 'pointer';
          else if (random < 0.75) type = 'dropped';
          else type = 'empty';

          defaultMatrix.push({
            x,
            y,
            type,
            value: type !== 'empty' ? `Node_${y}_${x}` : undefined,
            tooltip: `${type} cell at (${x}, ${y})`,
          });
        }
      }
      return defaultMatrix;
    }
    return matrixData as MatrixCell[];
  }, [matrixData]);

  const getMatrixCellColor = (type: string) => {
    switch (type) {
      case 'active': return 'matrix-active';
      case 'pointer': return 'matrix-pointer';
      case 'dropped': return 'matrix-dropped';
      case 'empty': return 'matrix-empty';
      default: return 'matrix-empty';
    }
  };

  const getMatrixStats = () => {
    const total = matrix.length;
    const active = matrix.filter(cell => cell.type === 'active').length;
    const dropped = matrix.filter(cell => cell.type === 'dropped').length;
    const pointers = matrix.filter(cell => cell.type === 'pointer').length;
    const efficiency = total > 0 ? Math.round(((active + pointers) / total) * 100) : 0;

    return { total, active, dropped, pointers, efficiency };
  };

  const stats = getMatrixStats();

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Visualization Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-300">Matrix Visualization</h3>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={viewMode === '2d' ? 'default' : 'outline'}
              onClick={() => setViewMode('2d')}
            >
              2D View
            </Button>
            <Button
              size="sm"
              variant={viewMode === '3d' ? 'default' : 'outline'}
              onClick={() => setViewMode('3d')}
            >
              3D View
            </Button>
            <Button size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Matrix Visualization */}
      <div className="flex-1 p-4 overflow-auto">
        <Card className="bg-gray-900 border-gray-600 h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-300">
                {structures[0]?.name || 'Data Structure'} Mapping
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {stats.total} cells • {structures.length} structures
              </Badge>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs mt-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 matrix-active rounded"></div>
                <span className="text-gray-400">Active Node</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 matrix-pointer rounded"></div>
                <span className="text-gray-400">Pointer</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 matrix-dropped rounded"></div>
                <span className="text-gray-400">Dropped Node</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 matrix-empty rounded"></div>
                <span className="text-gray-400">Empty Slot</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Matrix Grid */}
            <div className="grid grid-cols-12 gap-1 p-4 bg-gray-800 rounded-lg">
              {matrix.map((cell, index) => (
                <div
                  key={index}
                  className={`
                    matrix-cell w-6 h-6 rounded cursor-pointer
                    ${getMatrixCellColor(cell.type)}
                    ${selectedCell === cell ? 'ring-2 ring-yellow-400' : ''}
                  `}
                  title={cell.tooltip}
                  onClick={() => setSelectedCell(cell)}
                />
              ))}
            </div>

            {/* Selected Cell Info */}
            {selectedCell && (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Selected Cell: ({selectedCell.x}, {selectedCell.y})
                  </h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Type: <span className="text-gray-300">{selectedCell.type}</span></div>
                    {selectedCell.value && (
                      <div>Value: <span className="text-gray-300">{selectedCell.value}</span></div>
                    )}
                    <div>Status: <span className="text-gray-300">{selectedCell.tooltip}</span></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-700">
                <div className="text-lg font-semibold text-green-300">{stats.active}</div>
                <div className="text-xs text-green-400">Active Nodes</div>
              </div>
              <div className="p-3 bg-red-900 bg-opacity-30 rounded-lg border border-red-700">
                <div className="text-lg font-semibold text-red-300">{stats.dropped}</div>
                <div className="text-xs text-red-400">Dropped Nodes</div>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                <div className="text-lg font-semibold text-gray-300">{stats.efficiency}%</div>
                <div className="text-xs text-gray-400">Efficiency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export Matrix
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            Step {currentStep} • Matrix updated in real-time
          </div>
        </div>
      </div>
    </div>
  );
}
