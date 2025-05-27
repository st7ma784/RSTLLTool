// Simple C++ parser for detecting data structures
// Note: In a real implementation, you'd use tree-sitter-cpp or a similar parser

interface ParsedStructure {
  name: string;
  type: 'struct' | 'class' | 'union';
  startLine: number;
  endLine: number;
  members: ParsedMember[];
  methods: ParsedMethod[];
}

interface ParsedMember {
  name: string;
  type: string;
  isPointer: boolean;
  line: number;
}

interface ParsedMethod {
  name: string;
  returnType: string;
  parameters: string[];
  line: number;
}

export class CppParser {
  private code: string;
  private lines: string[];

  constructor(code: string) {
    this.code = code;
    this.lines = code.split('\n');
  }

  parseStructures(): ParsedStructure[] {
    const structures: ParsedStructure[] = [];
    let currentStructure: Partial<ParsedStructure> | null = null;
    let braceCount = 0;
    let inStructure = false;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      // Detect structure start
      const structMatch = line.match(/^(struct|class|union)\s+(\w+)/);
      if (structMatch && !inStructure) {
        currentStructure = {
          type: structMatch[1] as 'struct' | 'class' | 'union',
          name: structMatch[2],
          startLine: i + 1,
          members: [],
          methods: [],
        };
        inStructure = true;
        braceCount = 0;
      }

      if (inStructure && currentStructure) {
        // Count braces
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // Parse members and methods
        if (braceCount > 0) {
          this.parseMember(line, i + 1, currentStructure);
          this.parseMethod(line, i + 1, currentStructure);
        }

        // Structure end
        if (braceCount === 0 && line.includes('}')) {
          currentStructure.endLine = i + 1;
          structures.push(currentStructure as ParsedStructure);
          currentStructure = null;
          inStructure = false;
        }
      }
    }

    return structures;
  }

  private parseMember(line: string, lineNumber: number, structure: Partial<ParsedStructure>) {
    // Simple member detection (type name;)
    const memberMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_:]*\s*\*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[;=]/);
    if (memberMatch && !line.includes('(')) {
      const member: ParsedMember = {
        type: memberMatch[1].trim(),
        name: memberMatch[2],
        isPointer: memberMatch[1].includes('*'),
        line: lineNumber,
      };
      structure.members!.push(member);
    }
  }

  private parseMethod(line: string, lineNumber: number, structure: Partial<ParsedStructure>) {
    // Simple method detection (returnType methodName(params))
    const methodMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_:]*\s*\*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
    if (methodMatch && !line.includes(';')) {
      const method: ParsedMethod = {
        returnType: methodMatch[1].trim(),
        name: methodMatch[2],
        parameters: methodMatch[3] ? methodMatch[3].split(',').map(p => p.trim()) : [],
        line: lineNumber,
      };
      structure.methods!.push(method);
    }
  }

  detectLinkedLists(): ParsedStructure[] {
    const structures = this.parseStructures();
    return structures.filter(structure => {
      // Check if structure has pointer to itself (typical linked list pattern)
      return structure.members.some(member => 
        member.isPointer && member.type.includes(structure.name)
      );
    });
  }

  detectNestedStructures(): ParsedStructure[] {
    const structures = this.parseStructures();
    return structures.filter(structure => {
      // Check if structure has members that are other structures
      return structure.members.some(member => 
        structures.some(otherStruct => member.type.includes(otherStruct.name))
      );
    });
  }

  generateExecutionSteps(): { line: number; description: string; type: string }[] {
    const steps: { line: number; description: string; type: string }[] = [];
    const structures = this.parseStructures();

    structures.forEach(structure => {
      steps.push({
        line: structure.startLine,
        description: `Define ${structure.type} ${structure.name}`,
        type: 'definition'
      });

      structure.members.forEach(member => {
        steps.push({
          line: member.line,
          description: `Declare member ${member.name} of type ${member.type}`,
          type: 'member'
        });
      });

      structure.methods.forEach(method => {
        steps.push({
          line: method.line,
          description: `Define method ${method.name}`,
          type: 'method'
        });
      });

      if (structure.endLine) {
        steps.push({
          line: structure.endLine,
          description: `End ${structure.type} ${structure.name}`,
          type: 'end'
        });
      }
    });

    return steps.sort((a, b) => a.line - b.line);
  }
}

export function parseCodeToStructures(code: string) {
  const parser = new CppParser(code);
  const allStructures = parser.parseStructures();
  const linkedLists = parser.detectLinkedLists();
  const nestedStructures = parser.detectNestedStructures();

  return {
    all: allStructures,
    linkedLists,
    nested: nestedStructures,
    executionSteps: parser.generateExecutionSteps(),
  };
}
