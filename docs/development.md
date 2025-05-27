# Development Guide

This guide covers setting up the development environment, understanding the codebase structure, and contributing to the C++ Data Structure Visualizer.

## Development Setup

### Prerequisites
- Node.js 20 or higher
- Modern web browser
- Text editor with TypeScript support

### Local Development
1. **Clone the repository** or access via Replit
2. **Install dependencies** (automatically handled in Replit)
3. **Start development server**: `npm run dev`
4. **Access application**: http://localhost:5000

### Development Commands
```bash
# Start development server
npm run dev

# Type checking
npx tsc --noEmit

# Format code (if prettier is configured)
npm run format

# Lint code (if eslint is configured)
npm run lint
```

## Project Structure

```
├── client/src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (shadcn)
│   │   ├── FileExplorer.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── MatrixVisualization.tsx
│   │   └── AnalysisResults.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useCodeAnalysis.ts
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   ├── lib/                # Utility libraries
│   │   ├── cppParser.ts    # C++ code parsing logic
│   │   ├── matrixGenerator.ts # Matrix visualization logic
│   │   ├── queryClient.ts  # API client configuration
│   │   └── utils.ts        # Helper functions
│   ├── pages/              # Page components
│   │   ├── analyzer.tsx    # Main application page
│   │   └── not-found.tsx   # 404 page
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles and CSS variables
├── server/
│   ├── index.ts            # Express server setup
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage interface
│   └── vite.ts             # Vite integration
├── shared/
│   └── schema.ts           # Shared TypeScript types
├── docs/                   # Documentation files
└── package.json            # Dependencies and scripts
```

## Key Technologies

### Frontend Stack
- **React 18**: Component-based UI framework
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **Wouter**: Lightweight routing
- **TanStack Query**: Server state management
- **Shadcn/UI**: Pre-built component library

### Backend Stack
- **Express.js**: Web framework
- **TypeScript**: Consistent typing
- **Zod**: Runtime validation
- **Drizzle**: Database schema (types only)

## Code Conventions

### TypeScript Guidelines
```typescript
// Use interfaces for object shapes
interface ComponentProps {
  title: string;
  isVisible: boolean;
}

// Use type for unions and primitives
type Status = 'loading' | 'success' | 'error';

// Use const assertions for readonly data
const CELL_TYPES = ['active', 'dropped', 'empty', 'pointer'] as const;
```

### React Patterns
```typescript
// Use functional components with hooks
export function MyComponent({ prop1, prop2 }: ComponentProps) {
  // State hooks first
  const [state, setState] = useState(initialValue);
  
  // Effect hooks second
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Computed values with useMemo
  const computedValue = useMemo(() => {
    return expensiveCalculation(prop1);
  }, [prop1]);
  
  // Event handlers with useCallback
  const handleClick = useCallback(() => {
    setState(newValue);
  }, []);
  
  return <div>Component JSX</div>;
}
```

### Styling Guidelines
```css
/* Use Tailwind utility classes */
<div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">

/* For complex styles, use CSS variables */
.matrix-cell {
  background-color: hsl(var(--matrix-active));
  transition: all 0.2s ease;
}

/* Use semantic class names for animations */
.step-highlight {
  animation: pulse-highlight 1s ease-in-out;
}
```

## Component Development

### Creating New Components
1. **Create component file** in appropriate directory
2. **Define TypeScript interfaces** for props
3. **Implement component logic** with hooks
4. **Add styling** with Tailwind classes
5. **Export component** for use in other files

### Component Template
```typescript
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface MyComponentProps {
  title: string;
  onAction: (data: string) => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await onAction("example data");
    } finally {
      setIsLoading(false);
    }
  }, [onAction]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">{title}</h3>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Processing..." : "Click Me"}
      </Button>
    </div>
  );
}
```

## API Development

### Adding New Endpoints
1. **Define route** in `server/routes.ts`
2. **Add validation** with Zod schemas
3. **Implement storage methods** in `storage.ts`
4. **Update TypeScript types** in `shared/schema.ts`

### API Route Template
```typescript
// In server/routes.ts
app.post("/api/new-endpoint", async (req, res) => {
  try {
    const validatedData = mySchema.parse(req.body);
    const result = await storage.createSomething(validatedData);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: "Validation failed", error });
  }
});
```

### Storage Method Template
```typescript
// In server/storage.ts
async createSomething(data: InsertSomething): Promise<Something> {
  const id = this.currentId++;
  const item: Something = { ...data, id };
  this.items.set(id, item);
  return item;
}
```

## Parser Development

### Extending C++ Parser
The parser uses regex-based pattern matching. To add new structure detection:

```typescript
// In client/src/lib/cppParser.ts
detectNewPattern(): ParsedStructure[] {
  const structures = this.parseStructures();
  return structures.filter(structure => {
    // Add your detection logic here
    return structure.members.some(member => 
      // Pattern matching conditions
    );
  });
}
```

### Matrix Generation
To modify how structures are converted to matrices:

```typescript
// In client/src/lib/matrixGenerator.ts
private generateCellForStructure(
  x: number, 
  y: number, 
  structure: DetectedStructure
): MatrixCell {
  // Customize cell generation logic
  const type = this.determineType(structure);
  return {
    x, y, type,
    value: `${structure.name}_${x}_${y}`,
    tooltip: `${structure.name} ${type} at (${x}, ${y})`
  };
}
```

## Testing Guidelines

### Unit Testing (Recommended Setup)
```typescript
// Example test with Jest
import { CppParser } from '../lib/cppParser';

describe('CppParser', () => {
  it('should detect linked list structures', () => {
    const code = `
      struct Node {
        int data;
        Node* next;
      };
    `;
    
    const parser = new CppParser(code);
    const linkedLists = parser.detectLinkedLists();
    
    expect(linkedLists).toHaveLength(1);
    expect(linkedLists[0].name).toBe('Node');
  });
});
```

### Component Testing
```typescript
// Example with React Testing Library
import { render, screen } from '@testing-library/react';
import { FileExplorer } from '../components/FileExplorer';

describe('FileExplorer', () => {
  it('should display upload area', () => {
    render(
      <FileExplorer 
        files={[]} 
        selectedFile={null}
        onFileSelect={() => {}}
        onStartAnalysis={() => {}}
        isAnalyzing={false}
        detectedStructures={[]}
      />
    );
    
    expect(screen.getByText('Drop C++ files here')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Frontend Performance
- **Use React.memo** for expensive components
- **Implement useMemo** for complex calculations
- **Use useCallback** for stable function references
- **Lazy load** heavy components with React.lazy

### Backend Performance
- **Cache parsed results** in memory
- **Stream large files** instead of loading entirely
- **Use connection pooling** for database connections
- **Implement request debouncing** for expensive operations

## Debugging

### Frontend Debugging
```typescript
// Use console.log strategically
console.log('Parser result:', structures);

// Use React DevTools browser extension
// Add breakpoints in browser developer tools

// Use error boundaries for crash protection
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }
}
```

### Backend Debugging
```typescript
// Add logging to API routes
app.post('/api/endpoint', (req, res) => {
  console.log('Request received:', req.body);
  // ... route logic
  console.log('Response sent:', result);
});

// Use debugger statements
debugger; // Pauses execution in Node.js inspector
```

## Contributing Guidelines

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Components have appropriate prop interfaces
- [ ] Error handling is implemented
- [ ] Loading states are shown to users
- [ ] Responsive design works on mobile
- [ ] Accessibility considerations are met

### Git Workflow (if using version control)
1. **Create feature branch**: `git checkout -b feature/new-feature`
2. **Make changes** with clear commit messages
3. **Test thoroughly** before submitting
4. **Update documentation** if needed
5. **Submit pull request** with description

## Deployment

### Replit Deployment
- **Automatic deployment** when changes are made
- **Environment variables** managed through Replit secrets
- **Domain configuration** available in Replit settings

### Production Considerations
- **Environment variables** for configuration
- **Error monitoring** with services like Sentry
- **Performance monitoring** with APM tools
- **Backup strategies** for important data

## Future Enhancements

### Planned Features
- **Enhanced C++ parsing** with tree-sitter
- **3D matrix visualization** with Three.js
- **Real-time collaboration** with WebSockets
- **Database integration** with PostgreSQL

### Extension Points
- **Plugin system** for custom analyzers
- **Export formats** (PDF, SVG, JSON)
- **Integration APIs** for external tools
- **Custom visualization themes**