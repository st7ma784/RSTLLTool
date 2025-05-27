# C++ Integration Guide

This guide covers how to integrate the C++ Data Structure Visualizer into your existing C++ codebase and deployment workflows, including Docker containerization.

## Overview

The visualizer can be integrated into your C++ development workflow in several ways:
- **Development Tool**: Analyze code during development
- **CI/CD Integration**: Automated analysis in build pipelines
- **Documentation Generation**: Create visual documentation of data structures
- **Performance Monitoring**: Track optimization progress over time

## Docker Integration

### Basic Docker Setup

Create a `Dockerfile` for your C++ project that includes the visualizer:

```dockerfile
# Multi-stage build for C++ project with visualizer
FROM node:20-alpine AS visualizer-build

# Build the visualizer
WORKDIR /app/visualizer
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# C++ development environment
FROM gcc:12 AS cpp-dev

# Install Node.js for the visualizer
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Copy visualizer build
COPY --from=visualizer-build /app/visualizer /opt/cpp-visualizer

# Set up C++ development environment
WORKDIR /workspace
RUN apt-get update && apt-get install -y \
    cmake \
    make \
    gdb \
    valgrind \
    clang-format \
    jq \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create analysis script
COPY integration/analyze.sh /usr/local/bin/cpp-analyze
RUN chmod +x /usr/local/bin/cpp-analyze

# Default command starts the visualizer
EXPOSE 5000
CMD ["node", "/opt/cpp-visualizer/server/index.js"]
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  cpp-visualizer:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./src:/workspace/src:ro
      - ./analysis-results:/workspace/results
    environment:
      - NODE_ENV=production
      - ANALYSIS_OUTPUT_DIR=/workspace/results
    networks:
      - cpp-dev

  # Your C++ application
  cpp-app:
    build:
      context: .
      target: cpp-dev
    volumes:
      - ./src:/workspace/src
      - ./build:/workspace/build
    working_dir: /workspace
    command: ["bash", "-c", "while true; do sleep 30; done"]
    networks:
      - cpp-dev

networks:
  cpp-dev:
    driver: bridge
```

### Analysis Script for Docker

Create `integration/analyze.sh`:

```bash
#!/bin/bash
# C++ Code Analysis Script for Docker Integration

set -e

VISUALIZER_URL="${VISUALIZER_URL:-http://localhost:5000}"
SOURCE_DIR="${1:-/workspace/src}"
OUTPUT_DIR="${2:-/workspace/results}"

echo "🔍 Analyzing C++ code in: $SOURCE_DIR"
echo "📊 Results will be saved to: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Find all C++ files
find "$SOURCE_DIR" -name "*.cpp" -o -name "*.hpp" -o -name "*.h" -o -name "*.cc" | while read -r file; do
    echo "📁 Processing: $file"
    
    # Get relative path for naming
    rel_path=$(realpath --relative-to="$SOURCE_DIR" "$file")
    safe_name=$(echo "$rel_path" | tr '/' '_' | tr '.' '_')
    
    # Upload file to visualizer
    response=$(curl -s -X POST "$VISUALIZER_URL/api/files" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$rel_path\",
            \"content\": $(jq -Rs . < "$file"),
            \"size\": $(stat -c%s "$file")
        }")
    
    file_id=$(echo "$response" | jq -r '.id')
    
    if [ "$file_id" != "null" ]; then
        echo "✅ Uploaded: $rel_path (ID: $file_id)"
        
        # Start analysis
        analysis_response=$(curl -s -X POST "$VISUALIZER_URL/api/analyze-code" \
            -H "Content-Type: application/json" \
            -d "{
                \"fileId\": $file_id,
                \"content\": $(jq -Rs . < "$file")
            }")
        
        analysis_id=$(echo "$analysis_response" | jq -r '.id')
        
        if [ "$analysis_id" != "null" ]; then
            echo "📊 Analysis completed: $analysis_id"
            
            # Save results
            echo "$analysis_response" > "$OUTPUT_DIR/${safe_name}_analysis.json"
            
            # Extract matrix data for visualization
            echo "$analysis_response" | jq '.matrix_data' > "$OUTPUT_DIR/${safe_name}_matrix.json"
            
            # Extract structures data
            echo "$analysis_response" | jq '.structures' > "$OUTPUT_DIR/${safe_name}_structures.json"
        else
            echo "❌ Analysis failed for: $rel_path"
        fi
    else
        echo "❌ Upload failed for: $rel_path"
    fi
    
    sleep 1  # Rate limiting
done

echo "🎉 Analysis complete! Results saved to: $OUTPUT_DIR"
```

## CMake Integration

### CMakeLists.txt Integration

```cmake
# Add analysis target to your CMakeLists.txt
cmake_minimum_required(VERSION 3.16)
project(YourProject)

# Your existing project configuration...

# Optional: Add custom target for code analysis
find_program(DOCKER_EXECUTABLE docker)
if(DOCKER_EXECUTABLE)
    add_custom_target(analyze-structures
        COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/integration/run-analysis.sh
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        COMMENT "Analyzing C++ data structures"
    )
    
    add_custom_target(analyze-docker
        COMMAND docker-compose up -d cpp-visualizer
        COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/integration/analyze.sh ${CMAKE_CURRENT_SOURCE_DIR}/src
        COMMAND docker-compose down
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        COMMENT "Running structure analysis in Docker"
    )
endif()

# Integration with existing build process
add_custom_command(TARGET your-main-target POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E echo "Build complete. Run 'make analyze-structures' to analyze data structures."
)
```

### CMake Analysis Script

Create `integration/run-analysis.sh`:

```bash
#!/bin/bash
# CMake integration script

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build"
SRC_DIR="${PROJECT_ROOT}/src"

echo "🏗️  C++ Data Structure Analysis"
echo "Project: $(basename "$PROJECT_ROOT")"
echo "Source: $SRC_DIR"

# Start visualizer in background
if ! pgrep -f "cpp-visualizer" > /dev/null; then
    echo "🚀 Starting visualizer..."
    cd "$PROJECT_ROOT"
    nohup npm run dev > /dev/null 2>&1 &
    VISUALIZER_PID=$!
    
    # Wait for startup
    sleep 5
    
    # Ensure cleanup on exit
    trap "kill $VISUALIZER_PID 2>/dev/null" EXIT
fi

# Run analysis
"$PROJECT_ROOT/integration/analyze.sh" "$SRC_DIR" "$BUILD_DIR/analysis"

echo "📊 Analysis results available in: $BUILD_DIR/analysis"
echo "🌐 View results at: http://localhost:5000"
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/cpp-analysis.yml
name: C++ Structure Analysis

on:
  push:
    branches: [ main, develop ]
    paths: ['src/**/*.cpp', 'src/**/*.hpp', 'src/**/*.h']
  pull_request:
    branches: [ main ]
    paths: ['src/**/*.cpp', 'src/**/*.hpp', 'src/**/*.h']

jobs:
  analyze-structures:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start visualizer
      run: |
        npm run dev &
        sleep 10  # Wait for startup
    
    - name: Run structure analysis
      run: |
        chmod +x ./integration/analyze.sh
        ./integration/analyze.sh ./src ./analysis-output
    
    - name: Upload analysis results
      uses: actions/upload-artifact@v4
      with:
        name: structure-analysis-${{ github.sha }}
        path: analysis-output/
        retention-days: 30
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const path = './analysis-output';
          
          if (fs.existsSync(path)) {
            const files = fs.readdirSync(path);
            const structureFiles = files.filter(f => f.endsWith('_structures.json'));
            
            let comment = '## 📊 C++ Structure Analysis Results\n\n';
            comment += `Found ${structureFiles.length} files with data structures.\n\n`;
            
            // Add summary of detected structures
            structureFiles.forEach(file => {
              const content = JSON.parse(fs.readFileSync(`${path}/${file}`, 'utf8'));
              comment += `### ${file.replace('_structures.json', '')}\n`;
              content.forEach(structure => {
                comment += `- **${structure.name}** (${structure.type}): ${structure.instances} instances\n`;
              });
              comment += '\n';
            });
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          }
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_NAME = 'cpp-project-analyzer'
    }
    
    stages {
        stage('Build') {
            steps {
                script {
                    // Build your C++ project
                    sh 'mkdir -p build && cd build && cmake .. && make'
                }
            }
        }
        
        stage('Structure Analysis') {
            steps {
                script {
                    // Run structure analysis
                    sh '''
                        docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .
                        docker run --rm -v $(pwd)/src:/workspace/src:ro \
                                        -v $(pwd)/analysis:/workspace/results \
                                        ${IMAGE_NAME}:${BUILD_NUMBER} \
                                        /usr/local/bin/cpp-analyze
                    '''
                }
            }
            
            post {
                always {
                    // Archive analysis results
                    archiveArtifacts artifacts: 'analysis/**/*.json', allowEmptyArchive: true
                    
                    // Publish results
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: false,
                        keepAll: true,
                        reportDir: 'analysis',
                        reportFiles: '*.json',
                        reportName: 'C++ Structure Analysis'
                    ])
                }
            }
        }
        
        stage('Deploy Analysis Tool') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Deploy visualizer for team access
                    sh '''
                        docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    '''
                }
            }
        }
    }
}
```

## Code Integration Patterns

### Automated Analysis Hooks

#### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Pre-commit hook for structure analysis

echo "🔍 Running C++ structure analysis..."

# Get list of changed C++ files
changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(cpp|hpp|h|cc)$' || true)

if [ -z "$changed_files" ]; then
    echo "No C++ files changed, skipping analysis."
    exit 0
fi

# Ensure visualizer is available
if ! curl -s http://localhost:5000/api/files > /dev/null; then
    echo "⚠️  Visualizer not running. Starting..."
    npm run dev &
    VISUALIZER_PID=$!
    sleep 5
    trap "kill $VISUALIZER_PID 2>/dev/null" EXIT
fi

# Analyze changed files
has_issues=false

for file in $changed_files; do
    if [ -f "$file" ]; then
        echo "📁 Analyzing: $file"
        
        # Quick analysis
        response=$(curl -s -X POST http://localhost:5000/api/files \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$file\",
                \"content\": $(jq -Rs . < "$file"),
                \"size\": $(stat -c%s "$file")
            }")
        
        file_id=$(echo "$response" | jq -r '.id')
        
        if [ "$file_id" != "null" ]; then
            analysis=$(curl -s -X POST http://localhost:5000/api/analyze-code \
                -H "Content-Type: application/json" \
                -d "{
                    \"fileId\": $file_id,
                    \"content\": $(jq -Rs . < "$file")
                }")
            
            # Check for potential issues
            structures=$(echo "$analysis" | jq -r '.structures[].type' 2>/dev/null || echo "")
            
            if echo "$structures" | grep -q "linked_list"; then
                echo "⚠️  Found linked list in $file - consider array optimization"
                has_issues=true
            fi
        fi
    fi
done

if [ "$has_issues" = true ]; then
    echo ""
    echo "💡 Consider running full analysis: make analyze-structures"
    echo "   Or view in browser: http://localhost:5000"
fi

echo "✅ Structure analysis complete"
exit 0
```

#### Makefile Integration

```makefile
# Add to your existing Makefile

.PHONY: analyze analyze-clean analyze-report

# Analysis targets
analyze: analyze-clean
	@echo "🔍 Starting C++ structure analysis..."
	@mkdir -p analysis
	@./integration/analyze.sh src analysis
	@echo "📊 Analysis complete. View results: http://localhost:5000"

analyze-clean:
	@rm -rf analysis/*.json

analyze-report: analyze
	@echo "📋 Structure Analysis Report"
	@echo "=========================="
	@for file in analysis/*_structures.json; do \
		echo ""; \
		echo "File: $$(basename $$file _structures.json)"; \
		echo "Structures:"; \
		cat $$file | jq -r '.[] | "  - \(.name) (\(.type)): \(.instances) instances"'; \
	done

# Integration with existing targets
$(TARGET): $(OBJECTS) analyze-report
	$(CC) $(OBJECTS) -o $@ $(LDFLAGS)
	@echo "💡 Run 'make analyze' for detailed structure analysis"
```

## Development Workflow Integration

### VS Code Integration

Create `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Analyze C++ Structures",
            "type": "shell",
            "command": "./integration/analyze.sh",
            "args": ["${workspaceFolder}/src", "${workspaceFolder}/analysis"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": false
            },
            "problemMatcher": []
        },
        {
            "label": "Start Structure Visualizer",
            "type": "shell",
            "command": "npm",
            "args": ["run", "dev"],
            "isBackground": true,
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "never",
                "focus": false,
                "panel": "shared"
            }
        }
    ]
}
```

### CLion Integration

Create external tool in CLion (`File > Settings > Tools > External Tools`):

```
Name: Analyze Data Structures
Program: $ProjectFileDir$/integration/analyze.sh
Arguments: $ProjectFileDir$/src $ProjectFileDir$/analysis
Working Directory: $ProjectFileDir$
```

## RST/SuperDARN Specific Examples

### Typical RST Code Pattern

```cpp
// Before: Linked list with dropping
struct RangeGate {
    double power;
    double velocity;
    int quality_flag;
    RangeGate* next;
};

class RSTProcessor {
    RangeGate* range_list;
    
    void process_stage1() {
        RangeGate* current = range_list;
        while (current) {
            if (current->quality_flag < THRESHOLD) {
                // Drop this range gate
                remove_gate(current);
            }
            current = current->next;
        }
    }
};
```

### After: Array-based with mask

Generated code from the visualizer:

```cpp
// After: Array-based with drop mask
struct RangeGate {
    double power;
    double velocity;
    int quality_flag;
};

class RSTProcessor {
    std::vector<RangeGate> range_array;
    std::vector<bool> range_mask;
    
    void process_stage1() {
        #pragma omp parallel for
        for (size_t i = 0; i < range_array.size(); ++i) {
            if (range_mask[i] && range_array[i].quality_flag < THRESHOLD) {
                range_mask[i] = false;  // Mark as dropped
            }
        }
    }
    
    // Parallel beam processing
    void process_beams() {
        #pragma omp parallel for
        for (int beam = 0; beam < num_beams; ++beam) {
            process_beam_data(beam);
        }
    }
};
```

## Production Deployment

### Kubernetes Deployment

```yaml
# k8s/cpp-visualizer.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpp-visualizer
  labels:
    app: cpp-visualizer
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cpp-visualizer
  template:
    metadata:
      labels:
        app: cpp-visualizer
    spec:
      containers:
      - name: visualizer
        image: your-registry/cpp-visualizer:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: analysis-storage
          mountPath: /workspace/results
      volumes:
      - name: analysis-storage
        persistentVolumeClaim:
          claimName: analysis-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: cpp-visualizer-service
spec:
  selector:
    app: cpp-visualizer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: analysis-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Environment-Specific Configuration

```bash
# config/production.env
NODE_ENV=production
PORT=5000
ANALYSIS_RETENTION_DAYS=30
MAX_FILE_SIZE=10485760
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# config/development.env
NODE_ENV=development
PORT=5000
DEBUG=true
ANALYSIS_RETENTION_DAYS=7
MAX_FILE_SIZE=1048576
```

## Quick Start Commands

### Docker Quick Start
```bash
# 1. Build and start the visualizer
docker-compose up -d cpp-visualizer

# 2. Analyze your C++ code
./integration/analyze.sh ./src ./analysis

# 3. View results in browser
open http://localhost:5000
```

### Local Development
```bash
# 1. Start the visualizer
npm run dev

# 2. Run analysis on your code
make analyze-structures

# 3. View results
open http://localhost:5000
```

### CI Integration
```bash
# Add to your CI script
npm ci
npm run dev &
sleep 10
./integration/analyze.sh ./src ./ci-analysis
```

This integration guide provides complete setup instructions for incorporating the C++ Data Structure Visualizer into any development workflow, from local development to production Kubernetes deployments.