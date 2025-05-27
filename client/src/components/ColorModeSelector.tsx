import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Palette, 
  BarChart3, 
  Thermometer,
  Activity,
  Hash,
  RotateCcw
} from "lucide-react";
import type { MatrixCell } from "@shared/schema";

interface ColorMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'categorical' | 'continuous' | 'discrete';
}

interface ColorModeSelectorProps {
  matrixData: MatrixCell[];
  selectedColorMode: string;
  onColorModeChange: (mode: string) => void;
  colorIntensity: number;
  onIntensityChange: (intensity: number) => void;
  showLegend: boolean;
  onToggleLegend: (show: boolean) => void;
}

export function ColorModeSelector({
  matrixData,
  selectedColorMode,
  onColorModeChange,
  colorIntensity,
  onIntensityChange,
  showLegend,
  onToggleLegend
}: ColorModeSelectorProps) {
  const [customAttribute, setCustomAttribute] = useState<string>("");

  // Detect available attributes from matrix data
  const getAvailableAttributes = () => {
    const attributes = new Set<string>();
    
    matrixData.forEach(cell => {
      if (cell.value && typeof cell.value === 'object') {
        Object.keys(cell.value).forEach(key => {
          if (typeof cell.value[key] === 'number') {
            attributes.add(key);
          }
        });
      }
      
      // Check metadata for additional attributes
      if (cell.tooltip) {
        // Extract numeric values from tooltip
        const matches = cell.tooltip.match(/(\w+):\s*(-?\d+\.?\d*)/g);
        matches?.forEach(match => {
          const [key] = match.split(':');
          if (key) attributes.add(key.trim());
        });
      }
    });
    
    return Array.from(attributes);
  };

  const availableAttributes = getAvailableAttributes();

  const colorModes: ColorMode[] = [
    {
      id: 'type',
      name: 'Node Type',
      description: 'Color by active/dropped/pointer status',
      icon: <BarChart3 className="h-4 w-4" />,
      type: 'categorical'
    },
    {
      id: 'structure',
      name: 'Structure Name',
      description: 'Color by which data structure the node belongs to',
      icon: <Hash className="h-4 w-4" />,
      type: 'categorical'
    },
    {
      id: 'power',
      name: 'Power Level',
      description: 'Color by signal power (dB)',
      icon: <Activity className="h-4 w-4" />,
      type: 'continuous'
    },
    {
      id: 'velocity',
      name: 'Velocity',
      description: 'Color by doppler velocity (m/s)',
      icon: <Thermometer className="h-4 w-4" />,
      type: 'continuous'
    },
    {
      id: 'quality',
      name: 'Quality Score',
      description: 'Color by data quality metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      type: 'continuous'
    },
    {
      id: 'range',
      name: 'Range Distance',
      description: 'Color by range gate distance (km)',
      icon: <Thermometer className="h-4 w-4" />,
      type: 'continuous'
    }
  ];

  // Add dynamic attributes found in data
  availableAttributes.forEach(attr => {
    if (!colorModes.find(mode => mode.id === attr)) {
      colorModes.push({
        id: attr,
        name: attr.charAt(0).toUpperCase() + attr.slice(1),
        description: `Color by ${attr} values`,
        icon: <Activity className="h-4 w-4" />,
        type: 'continuous'
      });
    }
  });

  const selectedMode = colorModes.find(mode => mode.id === selectedColorMode);

  const getValueRange = (attribute: string) => {
    const values: number[] = [];
    
    matrixData.forEach(cell => {
      let value: number | undefined;
      
      if (cell.value && typeof cell.value === 'object' && cell.value[attribute] !== undefined) {
        value = parseFloat(cell.value[attribute]);
      } else if (cell.tooltip) {
        const match = cell.tooltip.match(new RegExp(`${attribute}:\\s*(-?\\d+\\.?\\d*)`));
        if (match) {
          value = parseFloat(match[1]);
        }
      }
      
      if (value !== undefined && !isNaN(value)) {
        values.push(value);
      }
    });
    
    if (values.length === 0) return { min: 0, max: 1 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  const range = selectedMode?.type === 'continuous' ? getValueRange(selectedColorMode) : null;

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
          <Palette className="h-4 w-4 mr-2" />
          Color Coding
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Color Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">Color by:</label>
          <Select value={selectedColorMode} onValueChange={onColorModeChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600">
              <SelectValue placeholder="Select color mode" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {colorModes.map(mode => (
                <SelectItem key={mode.id} value={mode.id} className="text-gray-300">
                  <div className="flex items-center space-x-2">
                    {mode.icon}
                    <div>
                      <div className="font-medium">{mode.name}</div>
                      <div className="text-xs text-gray-400">{mode.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Mode Info */}
        {selectedMode && (
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">{selectedMode.name}</span>
              <Badge variant="outline" className="text-xs">
                {selectedMode.type}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">{selectedMode.description}</p>
            
            {/* Value Range Display */}
            {range && (
              <div className="mt-2 text-xs text-gray-400">
                <span>Range: {range.min.toFixed(2)} → {range.max.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Color Intensity Slider */}
        {selectedMode?.type === 'continuous' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">Color Intensity:</label>
              <span className="text-xs text-gray-300">{colorIntensity}%</span>
            </div>
            <Slider
              value={[colorIntensity]}
              onValueChange={(value) => onIntensityChange(value[0])}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {/* Color Legend Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-400">Show Legend:</label>
          <Switch
            checked={showLegend}
            onCheckedChange={onToggleLegend}
          />
        </div>

        {/* Color Preview/Legend */}
        {showLegend && selectedMode && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Color Scale:</label>
            
            {selectedMode.type === 'categorical' ? (
              // Categorical color legend
              <div className="space-y-1">
                {selectedColorMode === 'type' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-gray-400">Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-xs text-gray-400">Dropped</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-xs text-gray-400">Pointer</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span className="text-xs text-gray-400">Empty</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Continuous color gradient
              <div className="space-y-2">
                <div 
                  className="h-4 rounded"
                  style={{
                    background: 'linear-gradient(to right, #3b82f6, #10b981, #f59e0b, #ef4444)'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                {range && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{range.min.toFixed(1)}</span>
                    <span>{range.max.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onColorModeChange('type');
            onIntensityChange(75);
          }}
          className="w-full"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset to Default
        </Button>
      </CardContent>
    </Card>
  );
}