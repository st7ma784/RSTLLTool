# API Reference

This document provides complete API documentation for the C++ Data Structure Visualizer backend services.

## Base URL

All API endpoints are relative to your application's base URL:
```
https://your-app.replit.app/api
```

## File Management API

### Upload File
Upload a C++ source file for analysis.

**Endpoint:** `POST /api/files`

**Request Body:**
```json
{
  "name": "example.cpp",
  "content": "/* C++ source code */",
  "size": 1024
}
```

**Response:**
```json
{
  "id": 1,
  "name": "example.cpp",
  "content": "/* C++ source code */",
  "size": 1024,
  "uploaded_at": "2024-01-15T10:30:00Z"
}
```

### Get All Files
Retrieve list of all uploaded files.

**Endpoint:** `GET /api/files`

**Response:**
```json
[
  {
    "id": 1,
    "name": "example.cpp",
    "content": "/* C++ source code */",
    "size": 1024,
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
]
```

### Get File by ID
Retrieve a specific file by its ID.

**Endpoint:** `GET /api/files/:id`

**Response:**
```json
{
  "id": 1,
  "name": "example.cpp",
  "content": "/* C++ source code */",
  "size": 1024,
  "uploaded_at": "2024-01-15T10:30:00Z"
}
```

### Delete File
Remove a file from the system.

**Endpoint:** `DELETE /api/files/:id`

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

## Analysis API

### Start Code Analysis
Analyze C++ code for data structures and generate matrix visualization.

**Endpoint:** `POST /api/analyze-code`

**Request Body:**
```json
{
  "fileId": 1,
  "content": "/* C++ source code */"
}
```

**Response:**
```json
{
  "id": 1,
  "file_id": 1,
  "structures": [
    {
      "name": "LinkedList",
      "type": "linked_list",
      "startLine": 5,
      "endLine": 15,
      "instances": 25,
      "depth": 3
    }
  ],
  "matrix_data": [
    {
      "x": 0,
      "y": 0,
      "type": "active",
      "value": "Node_0_0",
      "tooltip": "Active node at (0, 0)"
    }
  ],
  "analysis_status": "completed",
  "created_at": "2024-01-15T10:35:00Z"
}
```

### Get Analysis Result
Retrieve analysis results by analysis ID.

**Endpoint:** `GET /api/analysis/:id`

**Response:** Same as analysis creation response.

### Get Analysis by File ID
Retrieve analysis results for a specific file.

**Endpoint:** `GET /api/analysis/file/:fileId`

**Response:** Same as analysis creation response.

### Update Analysis
Update existing analysis results.

**Endpoint:** `PUT /api/analysis/:id`

**Request Body:** Partial analysis object
**Response:** Updated analysis object

## Data Types

### CppFile
```typescript
interface CppFile {
  id: number;
  name: string;
  content: string;
  size: number;
  uploaded_at: string;
}
```

### DetectedStructure
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

### MatrixCell
```typescript
interface MatrixCell {
  x: number;
  y: number;
  type: 'active' | 'dropped' | 'empty' | 'pointer';
  value?: any;
  tooltip?: string;
}
```

### AnalysisResult
```typescript
interface AnalysisResult {
  id: number;
  file_id: number;
  structures: DetectedStructure[];
  matrix_data: MatrixCell[];
  analysis_status: string;
  created_at: string;
}
```

## Error Responses

### Validation Error
```json
{
  "message": "Invalid file data",
  "error": {
    "issues": [
      {
        "path": ["name"],
        "message": "String must contain at least 1 character(s)"
      }
    ]
  }
}
```

### Not Found Error
```json
{
  "message": "File not found"
}
```

### Server Error
```json
{
  "message": "Failed to analyze code",
  "error": "Internal server error details"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing:
- Maximum file size limits (recommended: 1MB)
- Maximum number of files per session
- Analysis request throttling

## Authentication

The current implementation uses in-memory storage without authentication. For production use, consider adding:
- JWT-based authentication
- User session management
- File access controls

## Client Integration

### JavaScript/TypeScript Example
```typescript
// Upload a file
const uploadFile = async (file: File) => {
  const formData = {
    name: file.name,
    content: await file.text(),
    size: file.size
  };

  const response = await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  return response.json();
};

// Start analysis
const analyzeCode = async (fileId: number, content: string) => {
  const response = await fetch('/api/analyze-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, content })
  });

  return response.json();
};
```

### cURL Examples
```bash
# Upload file
curl -X POST http://localhost:5000/api/files \
  -H "Content-Type: application/json" \
  -d '{"name": "test.cpp", "content": "int main(){}", "size": 12}'

# Get all files
curl http://localhost:5000/api/files

# Start analysis
curl -X POST http://localhost:5000/api/analyze-code \
  -H "Content-Type: application/json" \
  -d '{"fileId": 1, "content": "struct Node { int data; Node* next; };"}'
```

## WebSocket API (Future Enhancement)

The application could be extended with WebSocket support for real-time analysis updates:

```typescript
// Proposed WebSocket events
interface AnalysisEvents {
  'analysis:start': { fileId: number };
  'analysis:progress': { step: number, total: number };
  'analysis:complete': AnalysisResult;
  'analysis:error': { message: string };
}
```

## SDK Development

For easier integration, consider developing SDKs:

### Python SDK Example
```python
class CppAnalyzer:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def upload_file(self, filepath: str) -> dict:
        with open(filepath, 'r') as f:
            content = f.read()
        
        data = {
            'name': os.path.basename(filepath),
            'content': content,
            'size': len(content)
        }
        
        response = requests.post(f'{self.base_url}/api/files', json=data)
        return response.json()
    
    def analyze_code(self, file_id: int, content: str) -> dict:
        data = {'fileId': file_id, 'content': content}
        response = requests.post(f'{self.base_url}/api/analyze-code', json=data)
        return response.json()
```