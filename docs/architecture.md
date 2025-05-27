# Architecture Overview

This document provides a comprehensive overview of the C++ Data Structure Visualizer's architecture, design decisions, and technical implementation.

## System Architecture

### High-Level Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Analysis      │
│   (React)       │◄──►│   (Express)     │◄──►│   Engine        │
│                 │    │                 │    │                 │
│ • File Upload   │    │ • REST API      │    │ • C++ Parser    │
│ • Code Editor   │    │ • File Storage  │    │ • Matrix Gen    │
│ • Matrix View   │    │ • Analysis API  │    │ • Structure     │
│ • Results UI    │    │ • Data Models   │    │   Detection     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend**
- **React 18** - Component-based UI framework
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first styling framework
- **Wouter** - Lightweight client-side routing
- **TanStack Query** - Server state management
- **Vite** - Fast build tool and development server

**Backend**
- **Express.js** - Web application framework
- **TypeScript** - Consistent language across the stack
- **Zod** - Runtime type validation
- **Drizzle ORM** - Type-safe database operations (schema only)

**Analysis Engine**
- **Custom C++ Parser** - Lexical analysis and structure detection
- **Matrix Generator** - Data structure to 2D matrix conversion
- **Pattern Recognition** - Linked list and nesting detection

## Frontend Architecture

### Component Hierarchy
```
App
├── Router (Wouter)
│   └── Analyzer (Main Page)
│       ├── FileExplorer
│       │   ├── FileUpload
│       │   ├── FileList
│       │   └── AnalysisControls
│       ├── CodeEditor
│       │   ├── SyntaxHighlighter
│       │   ├── StepControls
│       │   └── ExecutionTracker
│       ├── MatrixVisualization
│       │   ├── MatrixGrid
│       │   ├── CellInspector
│       │   └── Statistics
│       └── AnalysisResults
│           ├── ResultsTabs
│           ├── ArrayMapping
│           ├── IssuesList
│           └── Suggestions
```

### State Management

**React Query for Server State**
- File management operations
- Analysis result caching
- Background refetching
- Optimistic updates

**Local State Patterns**
- `useState` for component-specific state
- `useCallback` for event handlers
- `useMemo` for computed values
- Custom hooks for complex logic

### Data Flow
1. **File Upload** → API call → Cache invalidation → UI update
2. **Analysis Start** → Local parsing → Server analysis → Result merge
3. **Code Stepping** → Local state update → Matrix recalculation
4. **Matrix Interaction** → Cell selection → Inspector update

## Backend Architecture

### API Layer Structure
```
routes.ts
├── File Management Routes
│   ├── POST /api/files
│   ├── GET /api/files
│   ├── GET /api/files/:id
│   └── DELETE /api/files/:id
├── Analysis Routes
│   ├── POST /api/analyze-code
│   ├── GET /api/analysis/:id
│   ├── GET /api/analysis/file/:fileId
│   └── PUT /api/analysis/:id
```

### Storage Layer
```typescript
interface IStorage {
  // File operations
  createCppFile(file: InsertCppFile): Promise<CppFile>;
  getCppFile(id: number): Promise<CppFile | undefined>;
  getAllCppFiles(): Promise<CppFile[]>;
  deleteCppFile(id: number): Promise<boolean>;
  
  // Analysis operations
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisResult(id: number): Promise<AnalysisResult | undefined>;
  getAnalysisResultByFileId(fileId: number): Promise<AnalysisResult | undefined>;
  updateAnalysisResult(id: number, result: Partial<InsertAnalysisResult>): Promise<AnalysisResult | undefined>;
}
```

### In-Memory Implementation
- **Map-based storage** for fast lookups
- **Auto-incrementing IDs** for entity management
- **Cascade deletion** for referential integrity
- **Type safety** with TypeScript interfaces

## Analysis Engine Architecture

### C++ Parser Design

**Lexical Analysis**
```typescript
class CppParser {
  private code: string;
  private lines: string[];
  
  parseStructures(): ParsedStructure[]
  detectLinkedLists(): ParsedStructure[]
  detectNestedStructures(): ParsedStructure[]
  generateExecutionSteps(): ExecutionStep[]
}
```

**Pattern Recognition**
- **Structure Detection**: Regex-based pattern matching for struct/class
- **Pointer Analysis**: Identification of self-referencing pointers
- **Nesting Detection**: Cross-referencing structure members
- **Method Parsing**: Function signature extraction

### Matrix Generation

**Conversion Algorithm**
1. **Size Calculation**: Determine matrix dimensions from structure instances
2. **Cell Allocation**: Distribute structures across matrix rows
3. **Type Assignment**: Assign cell types based on structure characteristics
4. **Probability Adjustment**: Weight cell types by structure patterns

**Matrix Configuration**
```typescript
interface MatrixConfig {
  width: number;        // Default: 12 columns
  height: number;       // Default: 8 rows
  activeRatio: number;  // Default: 40% active cells
  droppedRatio: number; // Default: 20% dropped cells
  pointerRatio: number; // Default: 20% pointer cells
}
```

## Data Models

### Core Entities

**CppFile**
```typescript
interface CppFile {
  id: number;
  name: string;
  content: string;
  size: number;
  uploaded_at: string;
}
```

**DetectedStructure**
```typescript
interface DetectedStructure {
  name: string;
  type: 'linked_list' | 'nested' | 'simple';
  startLine: number;
  endLine: number;
  instances: number;
  depth: number;
}
```

**MatrixCell**
```typescript
interface MatrixCell {
  x: number;
  y: number;
  type: 'active' | 'dropped' | 'empty' | 'pointer';
  value?: any;
  tooltip?: string;
}
```

### Database Schema (Drizzle)
```typescript
export const cppFiles = pgTable("cpp_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  size: integer("size").notNull(),
  uploaded_at: text("uploaded_at").notNull(),
});

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  file_id: integer("file_id").notNull(),
  structures: jsonb("structures").notNull(),
  matrix_data: jsonb("matrix_data"),
  analysis_status: text("analysis_status").notNull(),
  created_at: text("created_at").notNull(),
});
```

## Performance Considerations

### Frontend Optimizations
- **Component Memoization**: React.memo for expensive renders
- **Virtual Scrolling**: For large code files
- **Debounced Updates**: Prevent excessive re-renders
- **Lazy Loading**: Code splitting for better initial load

### Backend Optimizations
- **In-Memory Caching**: Fast data access
- **Streaming Parsing**: Handle large files efficiently
- **Connection Pooling**: Database optimization (when using PostgreSQL)
- **Compression**: Gzip responses for API calls

### Matrix Rendering
- **Canvas Fallback**: For very large matrices
- **Cell Pooling**: Reuse DOM elements
- **Viewport Culling**: Only render visible cells
- **Hardware Acceleration**: CSS transforms for animations

## Security Considerations

### Input Validation
- **File Type Checking**: Restrict to C++ extensions
- **Size Limits**: Prevent memory exhaustion
- **Content Sanitization**: Escape HTML in code display
- **Zod Validation**: Runtime type checking

### Data Protection
- **No Persistent Storage**: Files cleared on restart
- **Input Encoding**: Proper character encoding handling
- **XSS Prevention**: Safe HTML rendering
- **CSRF Protection**: Token-based requests (future)

## Scalability Patterns

### Current Limitations
- **Memory Storage**: Limited by available RAM
- **Single Instance**: No horizontal scaling
- **Synchronous Processing**: No background job queue
- **Client-Side Parsing**: Limited by browser resources

### Future Enhancements
- **Database Integration**: PostgreSQL for persistence
- **Worker Processes**: Background analysis jobs
- **Caching Layer**: Redis for session data
- **Load Balancing**: Multiple application instances

## Development Workflow

### Build Process
1. **TypeScript Compilation**: Type checking and transpilation
2. **Vite Bundling**: Module bundling and optimization
3. **Tailwind Processing**: CSS utility generation
4. **Asset Optimization**: Image and font optimization

### Development Server
- **Hot Module Replacement**: Instant code updates
- **Proxy Configuration**: API forwarding to backend
- **Error Overlay**: Development error display
- **Source Maps**: Debug-friendly stack traces

### Testing Strategy (Recommended)
- **Unit Tests**: Jest for utility functions
- **Component Tests**: React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for full workflows

## Deployment Architecture

### Replit Deployment
- **Single Container**: Frontend and backend in one process
- **Port Management**: Automatic port allocation
- **Environment Variables**: Secure configuration
- **Health Checks**: Automatic restart on failure

### Production Considerations
- **Process Management**: PM2 or similar
- **Reverse Proxy**: Nginx for static assets
- **SSL Termination**: HTTPS certificate management
- **Monitoring**: Application performance monitoring

## Extension Points

### Parser Enhancement
- **Tree-sitter Integration**: More accurate C++ parsing
- **Template Support**: Better template code handling
- **Include Resolution**: Cross-file analysis
- **Preprocessor Handling**: Macro expansion

### Visualization Options
- **3D Matrix View**: WebGL-based rendering
- **Timeline View**: Temporal data structure changes
- **Graph View**: Network-style structure visualization
- **Export Formats**: SVG, PNG, PDF generation

### Analysis Features
- **Performance Profiling**: Runtime behavior simulation
- **Memory Tracking**: Allocation pattern analysis
- **Parallel Simulation**: Multi-threaded execution modeling
- **Optimization Metrics**: Quantitative improvement measurements