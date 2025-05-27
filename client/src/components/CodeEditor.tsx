import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  StepForward, 
  StepBack, 
  RotateCcw,
  Maximize2 
} from "lucide-react";
import type { CppFile, AnalysisResult } from "@shared/schema";

interface CodeEditorProps {
  file: CppFile | null;
  currentStep: number;
  onStepForward: () => void;
  onStepBackward: () => void;
  analysis: AnalysisResult | null;
}

export function CodeEditor({
  file,
  currentStep,
  onStepForward,
  onStepBackward,
  analysis,
}: CodeEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(1);
  const editorRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onStepForward();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, onStepForward]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const formatCode = (content: string) => {
    if (!content) return [];
    
    const lines = content.split('\n');
    return lines.map((line, index) => ({
      number: index + 1,
      content: line,
      isHighlighted: index + 1 === currentLine + currentStep,
    }));
  };

  const syntaxHighlight = (code: string) => {
    // Simple syntax highlighting for C++
    return code
      .replace(/\b(class|struct|int|double|float|bool|char|void|if|else|while|for|return|include|namespace|using|const|static|public|private|protected)\b/g, 
        '<span class="syntax-keyword">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="syntax-string">"$1"</span>')
      .replace(/\/\/.*$/gm, '<span class="syntax-comment">$&</span>')
      .replace(/\b(std|vector|string|map|set|list|queue|stack)\b/g, 
        '<span class="syntax-type">$1</span>');
  };

  const codeLines = file ? formatCode(file.content) : [];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {file?.name || "No file selected"}
          </span>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={onStepBackward}>
              <StepBack className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={togglePlayback}>
              {isPlaying ? (
                <Pause className="h-3 w-3 text-yellow-400" />
              ) : (
                <Play className="h-3 w-3 text-green-400" />
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={onStepForward}>
              <StepForward className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Line {currentLine + currentStep}, Column 1
          </Badge>
          <Button size="sm" variant="ghost">
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 code-editor overflow-auto" ref={editorRef}>
        {!file ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">No file selected</div>
              <div className="text-sm text-gray-500">
                Upload or select a C++ file to begin analysis
              </div>
            </div>
          </div>
        ) : (
          <div className="flex font-mono text-sm leading-6">
            {/* Line Numbers */}
            <div className="bg-gray-800 px-4 py-4 text-gray-500 text-right border-r border-gray-700 select-none min-w-[60px]">
              {codeLines.map((line) => (
                <div
                  key={line.number}
                  className={`${
                    line.isHighlighted 
                      ? 'bg-blue-600 text-white px-1 rounded font-semibold' 
                      : ''
                  }`}
                >
                  {line.number}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 px-4 py-4">
              {codeLines.map((line) => (
                <div
                  key={line.number}
                  className={`min-h-[24px] ${
                    line.isHighlighted 
                      ? 'bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-400 pl-4 step-highlight' 
                      : ''
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(line.content) || '&nbsp;'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={onStepBackward}>
                <StepBack className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={togglePlayback}>
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-yellow-400" />
                ) : (
                  <Play className="h-4 w-4 text-green-400" />
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={onStepForward}>
                <StepForward className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCurrentLine(1)}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-400">
              Step {currentStep} of {analysis ? 127 : 0} • {
                codeLines[currentLine + currentStep - 1]?.content ? 
                `Line ${currentLine + currentStep}: Processing code` : 
                'Ready to analyze'
              }
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Execution: {(currentStep * 0.05).toFixed(2)}s
          </div>
        </div>
      </div>
    </div>
  );
}
