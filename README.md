# C++ Data Structure Visualizer

A web-based tool for analyzing C++ code with nested linked-list data structures and visualizing them as 2D matrices to aid in parallel processing refactoring.

## 🎯 Purpose

This tool was specifically designed to help with reengineering RST code that processes SuperDARN data. It addresses the challenge of converting linked-list data structures (which drop items at each processing stage) into large arrays with drop masks to enable parallel processing.

## ✨ Features

- **📁 File Management**: Upload and manage C++ source files
- **🔍 Code Analysis**: Automatic detection of data structures including:
  - Linked lists
  - Nested structures  
  - Memory usage patterns
- **📊 Matrix Visualization**: Interactive 2D matrix representation showing:
  - Active nodes (green)
  - Dropped nodes (red)
  - Pointer references (blue)
  - Empty slots (gray)
- **⚡ Step-by-Step Execution**: Visual code stepping with real-time matrix updates
- **🔧 Optimization Suggestions**: Automated recommendations for:
  - Array-based refactoring
  - Parallel processing implementation
  - Memory optimization
- **💻 Code Generation**: Automatic generation of array mapping code

## 🚀 Quick Start

1. **Upload C++ Files**: Drag and drop or click to upload your C++ source files
2. **Select File**: Choose a file from the project explorer
3. **Start Analysis**: Click "Start Analysis" to begin structure detection
4. **Explore Results**: Use the step controls to walk through code execution
5. **View Suggestions**: Check the analysis results for optimization recommendations

## 🏗️ Architecture

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Wouter** for routing
- **TanStack Query** for data management
- **Lucide Icons** for UI elements

### Backend
- **Express.js** server
- **In-memory storage** for files and analysis results
- **Zod** for data validation
- **Custom C++ parser** for structure detection

### Key Components

#### Code Analysis Engine
- `CppParser`: Parses C++ code to detect structures
- `MatrixGenerator`: Converts structures to 2D matrix representation
- `useCodeAnalysis`: React hook for managing analysis state

#### Visualization
- Interactive matrix grid with hover effects
- Real-time updates during code stepping
- Statistics dashboard showing efficiency metrics

## 📱 User Interface

The application features a dark theme optimized for code analysis with:
- **Left Panel**: File explorer and analysis controls
- **Center Panel**: Code editor with syntax highlighting
- **Right Panel**: Matrix visualization
- **Bottom Panel**: Analysis results and suggestions

## 🔧 Configuration

### Matrix Generation
Configure matrix visualization parameters:
```typescript
const config: MatrixConfig = {
  width: 12,        // Matrix columns
  height: 8,        // Matrix rows
  activeRatio: 0.4, // Ratio of active cells
  droppedRatio: 0.2,// Ratio of dropped cells
  pointerRatio: 0.2 // Ratio of pointer cells
};
```

### Analysis Options
- Memory leak detection
- Drop pattern analysis
- Optimization suggestions
- Array mapping generation

## 📊 Analysis Output

The tool provides several types of analysis:

### Structure Detection
- Identifies linked lists by pointer-to-self patterns
- Detects nested structures
- Calculates depth and instance counts

### Performance Metrics
- Memory usage estimation
- Drop rate analysis
- Parallelization potential assessment

### Code Generation
Automatically generates array-based equivalents:
```cpp
// Convert LinkedList from linked list to array structure
std::vector<LinkedList> linkedlist_array;
std::vector<bool> linkedlist_mask;

// Migration helper function
void convert_linkedlist_to_array() {
    #pragma omp parallel for
    for (size_t i = 0; i < linkedlist_array.size(); ++i) {
        if (linkedlist_mask[i]) {
            process_element(linkedlist_array[i]);
        }
    }
}
```

## 🎨 Customization

### Theme Colors
The application uses a carefully chosen color palette:
- **Active nodes**: Green (#10B981)
- **Dropped nodes**: Red (#EF4444)
- **Pointers**: Blue (#3B82F6)
- **Empty slots**: Gray (#374151)

### Syntax Highlighting
C++ keywords, strings, comments, and types are highlighted for better readability.

## 🔬 Analysis Algorithms

### Structure Detection
1. **Lexical Analysis**: Tokenize C++ source code
2. **Pattern Matching**: Identify struct/class definitions
3. **Pointer Analysis**: Detect self-referencing pointers
4. **Nesting Detection**: Find embedded structures

### Matrix Mapping
1. **Size Calculation**: Estimate matrix dimensions based on structure instances
2. **Cell Assignment**: Map structure elements to matrix positions
3. **Type Classification**: Categorize cells as active, dropped, pointer, or empty
4. **Update Simulation**: Model changes during code execution

## 🚀 Deployment

This application is designed for Replit's deployment system:

1. The project runs automatically on Replit
2. Uses Replit's built-in hosting for web applications
3. Environment variables are managed through Replit's secrets system

## 🤝 Contributing

This tool is specifically designed for RST/SuperDARN data processing workflows. When contributing:

1. Focus on improving C++ parsing accuracy
2. Enhance matrix visualization features
3. Add more optimization suggestions
4. Improve parallel processing recommendations

## 📚 Technical Details

### File Structure
```
├── client/src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and parsers
│   └── pages/         # Application pages
├── server/            # Express backend
├── shared/            # Shared types and schemas
└── docs/             # Documentation
```

### Data Flow
1. **Upload**: Files stored in memory with metadata
2. **Parse**: C++ parser extracts structure information
3. **Analyze**: Matrix generator creates visualization data
4. **Visualize**: React components render interactive matrix
5. **Step**: User controls advance through execution simulation

## 🎯 Use Cases

### Primary: RST Code Refactoring
- Convert linked-list based SuperDARN processing to array-based
- Identify parallelization opportunities
- Optimize memory usage patterns

### Secondary: General C++ Analysis
- Educational tool for understanding data structures
- Code review assistance
- Performance optimization guidance

## 📈 Performance Considerations

- **Client-side parsing** for immediate feedback
- **In-memory storage** for fast file access
- **Optimized matrix rendering** for smooth interactions
- **Lazy evaluation** for large code bases

## 🔍 Limitations

- Basic C++ parsing (for full analysis, consider tree-sitter-cpp)
- Memory-based storage (files lost on restart)
- Limited to structure analysis (no runtime profiling)
- Matrix size constraints for performance

## 📝 License

This project is designed for research and educational purposes in the context of SuperDARN data processing optimization.