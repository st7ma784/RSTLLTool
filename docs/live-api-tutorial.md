# Live API Tutorial: Real-Time Data Structure Visualization

This tutorial shows how to integrate the C++ Data Structure Visualizer's Live API into your C++ applications for real-time visualization of data structure operations.

## Overview

The Live API allows your C++ code to:
- Create data structures remotely in the visualizer
- Add, remove, and update nodes in real-time
- Visualize algorithm execution as it happens
- Track memory usage and optimization opportunities

Perfect for RST/SuperDARN data processing where you want to see how linked lists are being manipulated during runtime.

## Quick Start

### 1. Start the Visualizer
```bash
npm run dev
# Visualizer runs on http://localhost:5000
```

### 2. Include the C++ Client Library
```cpp
#include "integration/cpp_visualizer_client.hpp"
using namespace cpp_visualizer;
```

### 3. Basic Usage Example
```cpp
#include <iostream>
#include "cpp_visualizer_client.hpp"

int main() {
    // Connect to visualizer
    VisualizerClient viz("http://localhost:5000");
    
    if (!viz.isConnected()) {
        std::cerr << "Could not connect to visualizer" << std::endl;
        return 1;
    }
    
    // Create a linked list structure
    viz.createStructure("range_gates", "linked_list", 1, 5);
    
    // Add some nodes
    int node1 = viz.addNode("range_gates", 42.5);  // Add power value
    int node2 = viz.addNode("range_gates", 38.2);
    int node3 = viz.addNode("range_gates", 51.8);
    
    // Simulate processing - remove low quality data
    viz.removeNode("range_gates", node2);  // Drops node with value 38.2
    
    // Update remaining nodes
    viz.updateNode("range_gates", node1, 45.1, {{"quality", "high"}});
    
    std::cout << "Check the visualizer at http://localhost:5000" << std::endl;
    std::cout << "Press Enter to cleanup..." << std::endl;
    std::cin.get();
    
    // Cleanup
    viz.deleteStructure("range_gates");
    
    return 0;
}
```

## API Reference

### Core Methods

#### `createStructure(name, type, depth, initial_size)`
Creates a new data structure for visualization.

**Parameters:**
- `name` (string): Unique identifier for the structure
- `type` (string): "linked_list", "array", "tree", or "graph"
- `depth` (int): Nesting depth for complex structures
- `initial_size` (int): Number of empty nodes to pre-allocate

**Example:**
```cpp
viz.createStructure("beam_data", "linked_list", 2, 10);
```

#### `addNode(structure_name, value, index, metadata)`
Adds a new node to the structure.

**Parameters:**
- `structure_name` (string): Name of the target structure
- `value` (json): Node value (numbers, strings, objects)
- `index` (int, optional): Position to insert (-1 for append)
- `metadata` (map, optional): Additional node information

**Returns:** Node ID for future reference

**Example:**
```cpp
// Add range gate data
json range_data = {
    {"power", 42.5},
    {"velocity", 120.3},
    {"range", 450}
};

int node_id = viz.addNode("range_gates", range_data, -1, {
    {"beam", 7},
    {"timestamp", "2024-01-15T10:30:00Z"}
});
```

#### `removeNode(structure_name, node_id)`
Marks a node as dropped (visualized in red).

**Parameters:**
- `structure_name` (string): Name of the structure
- `node_id` (int): ID of the node to remove

**Example:**
```cpp
// Remove low-quality data
if (power < quality_threshold) {
    viz.removeNode("range_gates", node_id);
}
```

#### `updateNode(structure_name, node_id, value, metadata)`
Updates an existing node's value and metadata.

**Parameters:**
- `structure_name` (string): Name of the structure
- `node_id` (int): Target node ID
- `value` (json): New value for the node
- `metadata` (map, optional): Additional metadata to merge

**Example:**
```cpp
// Update processed data
viz.updateNode("range_gates", node_id, processed_value, {
    {"processed_at", getCurrentTime()},
    {"algorithm", "phase_fitting"}
});
```

## RST/SuperDARN Integration Examples

### Example 1: Range Gate Processing
```cpp
#include "cpp_visualizer_client.hpp"

class RSTProcessor {
    VisualizerClient viz_;
    
public:
    RSTProcessor() : viz_("http://localhost:5000") {
        viz_.createStructure("range_gates", "linked_list", 1, 75);
    }
    
    void processRangeData(const std::vector<RangeGate>& gates) {
        // Visualize initial data
        std::vector<int> node_ids;
        for (const auto& gate : gates) {
            json gate_data = {
                {"power", gate.power},
                {"velocity", gate.velocity},
                {"quality", gate.quality_flag}
            };
            
            int id = viz_.addNode("range_gates", gate_data, -1, {
                {"range_km", gate.range * 0.15},  // Convert to km
                {"beam", gate.beam_number}
            });
            node_ids.push_back(id);
        }
        
        // Stage 1: Quality filtering
        for (size_t i = 0; i < gates.size(); ++i) {
            if (gates[i].quality_flag < QUALITY_THRESHOLD) {
                viz_.removeNode("range_gates", node_ids[i]);
                // Node turns red in visualization
            }
        }
        
        // Stage 2: Velocity processing
        for (size_t i = 0; i < gates.size(); ++i) {
            if (gates[i].quality_flag >= QUALITY_THRESHOLD) {
                double processed_vel = processVelocity(gates[i].velocity);
                viz_.updateNode("range_gates", node_ids[i], 
                    json{{"velocity", processed_vel}}, 
                    {{"stage", "velocity_processed"}});
            }
        }
    }
};
```

### Example 2: Multi-Beam Visualization
```cpp
class BeamProcessor {
    VisualizerClient viz_;
    
public:
    BeamProcessor() : viz_("http://localhost:5000") {}
    
    void processSuperDARNData(const ScanData& scan) {
        // Create separate structures for each beam
        for (int beam = 0; beam < scan.num_beams; ++beam) {
            std::string beam_name = "beam_" + std::to_string(beam);
            viz_.createStructure(beam_name, "linked_list", 1, scan.num_ranges);
            
            // Add range gates for this beam
            for (const auto& gate : scan.beams[beam].gates) {
                viz_.addNode(beam_name, {
                    {"power", gate.power},
                    {"velocity", gate.velocity},
                    {"spectral_width", gate.width}
                }, -1, {
                    {"range", gate.range},
                    {"elevation", scan.beams[beam].elevation}
                });
            }
        }
        
        // Process all beams in parallel (simulated)
        #pragma omp parallel for
        for (int beam = 0; beam < scan.num_beams; ++beam) {
            processBeam(beam);
        }
    }
    
private:
    void processBeam(int beam_num) {
        std::string beam_name = "beam_" + std::to_string(beam_num);
        
        // Get current structure state
        json structure = viz_.getStructure(beam_name);
        
        // Process each active node
        for (const auto& node : structure["nodes"]) {
            if (node["active"]) {
                // Simulate processing time
                std::this_thread::sleep_for(std::chrono::milliseconds(10));
                
                // Update with processed result
                viz_.updateNode(beam_name, node["id"], node["value"], {
                    {"processed", true},
                    {"thread_id", omp_get_thread_num()}
                });
            }
        }
    }
};
```

### Example 3: RAII Managed Structures
```cpp
#include "cpp_visualizer_client.hpp"

void processRadarSweep() {
    VisualizerClient viz;
    
    // Auto-cleanup structures when they go out of scope
    {
        ManagedStructure elevation_scan(viz, "elevation_scan", "array");
        ManagedStructure azimuth_scan(viz, "azimuth_scan", "linked_list");
        
        // Process elevation data
        for (int elev = 0; elev < 16; ++elev) {
            elevation_scan.addNode(processElevation(elev), -1, {
                {"elevation_angle", elev * 3.24}
            });
        }
        
        // Process azimuth data
        for (int az = 0; az < 16; ++az) {
            azimuth_scan.addNode(processAzimuth(az), -1, {
                {"azimuth_angle", az * 22.5}
            });
        }
        
        // Structures automatically deleted when leaving scope
    }
}
```

## Building and Dependencies

### CMakeLists.txt Integration
```cmake
# Find required packages
find_package(PkgConfig REQUIRED)
find_package(nlohmann_json REQUIRED)

pkg_check_modules(CURL REQUIRED libcurl)

# Add the visualizer client
add_library(cpp_visualizer_client
    integration/cpp_visualizer_client.cpp
)

target_include_directories(cpp_visualizer_client PUBLIC
    integration/
    ${CURL_INCLUDE_DIRS}
)

target_link_libraries(cpp_visualizer_client
    ${CURL_LIBRARIES}
    nlohmann_json::nlohmann_json
)

# Link to your application
target_link_libraries(your_app
    cpp_visualizer_client
)
```

### Installing Dependencies

**Ubuntu/Debian:**
```bash
sudo apt install libcurl4-openssl-dev nlohmann-json3-dev
```

**CentOS/RHEL:**
```bash
sudo yum install libcurl-devel nlohmann-json-devel
```

**macOS:**
```bash
brew install curl nlohmann-json
```

### Docker Integration
```dockerfile
FROM gcc:12

# Install dependencies
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    nlohmann-json3-dev \
    cmake

# Copy visualizer client
COPY integration/ /opt/cpp-visualizer-client/
```

## Advanced Usage

### Batch Operations
```cpp
// Process multiple operations efficiently
std::vector<json> batch_data = {
    {{"power", 42.1}, {"vel", 120.3}},
    {{"power", 38.5}, {"vel", 115.7}},
    {{"power", 45.2}, {"vel", 128.1}}
};

std::vector<int> node_ids;
for (const auto& data : batch_data) {
    node_ids.push_back(viz.addNode("batch_structure", data));
}

// Batch remove low-quality data
for (size_t i = 0; i < batch_data.size(); ++i) {
    if (batch_data[i]["power"] < 40.0) {
        viz.removeNode("batch_structure", node_ids[i]);
    }
}
```

### Error Handling
```cpp
VisualizerClient viz;
viz.setVerbose(true);  // Enable error logging

if (!viz.isConnected()) {
    std::cerr << "Visualizer not available - running in offline mode" << std::endl;
    // Continue processing without visualization
    return;
}

// Robust node creation
int node_id = viz.addNode("structure", data);
if (node_id == -1) {
    std::cerr << "Failed to add node - check visualizer connection" << std::endl;
}
```

### Performance Monitoring
```cpp
auto start = std::chrono::high_resolution_clock::now();

// Create and populate structure
viz.createStructure("performance_test", "linked_list", 1, 1000);

for (int i = 0; i < 1000; ++i) {
    viz.addNode("performance_test", i);
}

auto end = std::chrono::high_resolution_clock::now();
auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

std::cout << "Created 1000 nodes in " << duration.count() << "ms" << std::endl;
```

## Troubleshooting

### Common Issues

**Connection Failed:**
```cpp
if (!viz.isConnected()) {
    // Check if visualizer is running
    // Verify URL is correct
    // Check firewall settings
}
```

**Slow Performance:**
- Use batch operations when possible
- Consider async updates for non-critical visualizations
- Limit update frequency for real-time data

**Memory Issues:**
- Clean up structures when no longer needed
- Use ManagedStructure for automatic cleanup
- Monitor structure sizes with `getAllStructures()`

### Best Practices

1. **Structure Naming:** Use descriptive names that indicate data type and purpose
2. **Error Handling:** Always check return values and connection status
3. **Resource Management:** Clean up structures when processing is complete
4. **Performance:** Batch operations when processing large datasets
5. **Debugging:** Enable verbose mode during development

## Integration with Existing Code

### Minimal Integration
```cpp
// Add to existing RST processing function
void processRangeGates(std::vector<RangeGate>& gates) {
    #ifdef ENABLE_VISUALIZATION
    static VisualizerClient viz;
    static bool viz_initialized = false;
    
    if (!viz_initialized && viz.isConnected()) {
        viz.createStructure("live_processing", "linked_list");
        viz_initialized = true;
    }
    #endif
    
    // Your existing processing code...
    for (auto& gate : gates) {
        processGate(gate);
        
        #ifdef ENABLE_VISUALIZATION
        if (viz_initialized) {
            viz.addNode("live_processing", gate.power);
        }
        #endif
    }
}
```

This live API integration allows you to see exactly how your RST code manipulates data structures in real-time, making it much easier to identify optimization opportunities and understand the parallel processing potential of your algorithms!