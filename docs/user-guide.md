# User Guide

This comprehensive guide covers all features of the C++ Data Structure Visualizer and how to use them effectively for analyzing and optimizing your code.

## Interface Overview

The application is divided into four main areas:

### 1. File Explorer (Left Panel)
- **File Upload Area**: Drag and drop C++ files or click to browse
- **Project Files List**: Shows all uploaded files with size information
- **Detected Structures**: Displays found data structures after analysis
- **Analysis Options**: Configure what the analysis should focus on

### 2. Code Editor (Center Panel)
- **Syntax Highlighting**: Color-coded C++ keywords, strings, and comments
- **Line Numbers**: Easy navigation through your code
- **Step Highlighting**: Current execution line highlighted in blue
- **Playback Controls**: Step through code execution manually or automatically

### 3. Matrix Visualization (Right Panel)
- **Interactive Grid**: 2D representation of your data structures
- **Cell Types**: Different colors for active, dropped, pointer, and empty cells
- **Statistics**: Real-time efficiency and utilization metrics
- **Cell Inspector**: Click any cell to see detailed information

### 4. Analysis Results (Bottom Panel)
- **Results Tab**: Summary statistics and detected structures
- **Array Mapping Tab**: Generated code for array conversion
- **Issues Tab**: Identified problems and inefficiencies
- **Suggestions Tab**: Optimization recommendations

## Detailed Feature Guide

### File Management

#### Uploading Files
1. **Drag and Drop**: Simply drag C++ files onto the upload area
2. **Click to Browse**: Click the upload area to open file selector
3. **Multiple Selection**: Upload multiple files at once
4. **Supported Formats**: .cpp, .c, .h, .hpp, .cc, .cxx

#### File Operations
- **Select**: Click any file to load it in the editor
- **Delete**: Use the X button to remove files
- **View Details**: File size shown in badges

### Code Analysis

#### Starting Analysis
1. Select a file from the project explorer
2. Configure analysis options:
   - **Detect Memory Leaks**: Find potential memory management issues
   - **Analyze Drop Patterns**: Identify where data is discarded
   - **Suggest Optimizations**: Generate improvement recommendations
   - **Generate Array Mappings**: Create array conversion code
3. Click "Start Analysis" button

#### Understanding Results
The analysis identifies several types of structures:

**Linked Lists**
- Structures with self-referencing pointers
- Typical pattern: `struct Node { Data data; Node* next; }`
- Shown in green badges

**Nested Structures**
- Structures containing other structures
- Complex hierarchical data organization
- Shown in purple badges

**Simple Structures**
- Basic data containers without complex relationships
- Shown in blue badges

### Matrix Visualization

#### Reading the Matrix
The 2D matrix represents your data structures in memory:

- **Green Cells (Active)**: Currently used data nodes
- **Red Cells (Dropped)**: Nodes marked for deletion or dropped
- **Blue Cells (Pointer)**: Memory addresses pointing to other locations
- **Gray Cells (Empty)**: Unused memory slots

#### Interactive Features
- **Hover Effects**: Cells scale up when you hover over them
- **Click to Inspect**: Click any cell to see detailed information
- **Real-time Updates**: Matrix changes as you step through code
- **Statistics Display**: Live efficiency and utilization percentages

#### Matrix Statistics
- **Total Cells**: Overall matrix size
- **Active Nodes**: Currently used data elements
- **Dropped Nodes**: Elements marked for removal
- **Efficiency**: Percentage of useful data vs. total allocated space

### Code Stepping

#### Manual Stepping
- **Step Forward**: Advance to next execution point
- **Step Backward**: Return to previous execution point
- **Reset**: Return to beginning of execution

#### Automatic Playback
- **Play Button**: Start automatic stepping (1 second intervals)
- **Pause Button**: Stop automatic playback
- **Speed Control**: Currently fixed at 1 second per step

#### Execution Information
- **Current Line**: Highlighted in the code editor
- **Step Counter**: Shows current step out of total steps
- **Execution Time**: Simulated execution duration
- **Description**: What's happening at the current step

### Analysis Results

#### Results Tab
**Structure Statistics**
- Total number of detected structures
- Memory usage estimation
- Drop rate percentage
- Parallelization potential

**Detailed Analysis**
- Individual structure breakdowns
- Instance counts and depth measurements
- Recommendations for each structure type

#### Array Mapping Tab
**Generated Code**
- Complete C++ code for array conversion
- Includes vector declarations and mask arrays
- OpenMP parallel processing templates
- Migration helper functions

**Code Features**
- Memory pre-allocation with reserve()
- Boolean masks for tracking active elements
- Parallel for loops with #pragma omp
- Element processing templates

#### Issues Tab
**Issue Categories**
- **Memory Issues**: Fragmentation, leaks, inefficient allocation
- **Performance Issues**: Sequential processing bottlenecks
- **Optimization Issues**: Suboptimal algorithms or data structures

**Issue Details**
- Severity levels (High, Medium, Low)
- Detailed problem descriptions
- Specific suggestions for resolution

#### Suggestions Tab
**Optimization Recommendations**
- **Array-based Refactoring**: Convert linked lists to vectors
- **Parallel Processing**: Implement OpenMP for multi-threading
- **Memory Pooling**: Custom allocators for better performance

**Impact Estimates**
- Expected performance improvements
- Memory usage reductions
- Parallelization potential percentages

## Advanced Features

### Customizing Matrix Display
- **2D View**: Standard grid representation
- **3D View**: Enhanced depth visualization (coming soon)
- **Export Matrix**: Save matrix data for external analysis

### Code Export
- **Download Generated Code**: Save array mapping code to files
- **Export Analysis Results**: Save statistics and recommendations
- **Matrix Data Export**: Export visualization data

### Performance Optimization

#### Best Practices
1. **Start Small**: Begin with smaller files to understand the interface
2. **Focus on Structures**: Ensure your code has clear struct/class definitions
3. **Use Step Controls**: Walk through execution to understand data flow
4. **Review Suggestions**: Pay attention to optimization recommendations

#### Troubleshooting Performance
- **Large Files**: May take longer to parse and analyze
- **Complex Templates**: May not be fully understood by the parser
- **Memory Constraints**: Very large matrices may impact browser performance

## Tips for RST/SuperDARN Development

### Typical Workflow
1. **Upload existing RST code** with linked-list structures
2. **Analyze data flow** to understand current processing pipeline
3. **Identify drop patterns** where data is discarded
4. **Generate array mappings** for parallel processing
5. **Implement OpenMP code** using provided templates

### Common Patterns
- **Range Processing**: Convert range-gate linked lists to arrays
- **Beam Processing**: Parallelize beam data processing
- **Time Series**: Optimize temporal data structures

### Migration Strategy
1. **Preserve Original Logic**: Keep the same processing steps
2. **Replace Deletions with Masks**: Use boolean arrays instead of removing nodes
3. **Add Parallel Pragmas**: Insert OpenMP directives for parallel sections
4. **Batch Operations**: Group similar operations for better cache performance