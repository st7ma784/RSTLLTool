#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <functional>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

namespace cpp_visualizer {

using json = nlohmann::json;

/**
 * C++ Client Library for Live Data Structure Visualization
 * 
 * This library allows C++ applications to create and manipulate
 * data structures in the visualizer in real-time.
 */
class VisualizerClient {
public:
    /**
     * Initialize the client with visualizer URL
     * @param base_url URL of the visualizer service (default: http://localhost:5000)
     */
    explicit VisualizerClient(const std::string& base_url = "http://localhost:5000");
    
    ~VisualizerClient();

    /**
     * Create a new data structure for visualization
     * @param name Unique name for the structure
     * @param type Type: "linked_list", "array", "tree", "graph"
     * @param depth Nesting depth for complex structures
     * @param initial_size Initial number of nodes to allocate
     * @return true if successful
     */
    bool createStructure(const std::string& name, 
                        const std::string& type = "linked_list",
                        int depth = 1, 
                        int initial_size = 0);

    /**
     * Add a node to the structure
     * @param structure_name Name of the structure
     * @param value Node value (any JSON-serializable type)
     * @param index Optional position to insert at
     * @param metadata Optional metadata map
     * @return Node ID if successful, -1 if failed
     */
    int addNode(const std::string& structure_name, 
                const json& value, 
                int index = -1,
                const std::map<std::string, json>& metadata = {});

    /**
     * Remove a node from the structure (marks as dropped)
     * @param structure_name Name of the structure
     * @param node_id ID of the node to remove
     * @return true if successful
     */
    bool removeNode(const std::string& structure_name, int node_id);

    /**
     * Update a node's value and metadata
     * @param structure_name Name of the structure
     * @param node_id ID of the node to update
     * @param value New value for the node
     * @param metadata Additional metadata to merge
     * @return true if successful
     */
    bool updateNode(const std::string& structure_name, 
                   int node_id, 
                   const json& value,
                   const std::map<std::string, json>& metadata = {});

    /**
     * Get current structure information
     * @param structure_name Name of the structure
     * @return JSON representation of the structure
     */
    json getStructure(const std::string& structure_name);

    /**
     * Get all structures
     * @return Vector of all structure JSON objects
     */
    std::vector<json> getAllStructures();

    /**
     * Get current matrix visualization
     * @return JSON representation of the matrix
     */
    json getMatrix();

    /**
     * Delete a structure completely
     * @param structure_name Name of the structure to delete
     * @return true if successful
     */
    bool deleteStructure(const std::string& structure_name);

    /**
     * Check if the visualizer service is available
     * @return true if service is reachable
     */
    bool isConnected();

    /**
     * Enable/disable automatic error logging
     */
    void setVerbose(bool verbose) { verbose_ = verbose; }

private:
    std::string base_url_;
    CURL* curl_;
    bool verbose_;

    // HTTP helper methods
    std::string makeRequest(const std::string& method, 
                           const std::string& endpoint, 
                           const json& data = json{});
    
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* data);
    void logError(const std::string& message);
};

/**
 * RAII Wrapper for automatic structure lifecycle management
 */
class ManagedStructure {
public:
    ManagedStructure(VisualizerClient& client, 
                    const std::string& name,
                    const std::string& type = "linked_list",
                    int depth = 1)
        : client_(client), name_(name) {
        client_.createStructure(name, type, depth);
    }

    ~ManagedStructure() {
        client_.deleteStructure(name_);
    }

    // Delegate methods to client
    int addNode(const json& value, int index = -1, 
                const std::map<std::string, json>& metadata = {}) {
        return client_.addNode(name_, value, index, metadata);
    }

    bool removeNode(int node_id) {
        return client_.removeNode(name_, node_id);
    }

    bool updateNode(int node_id, const json& value, 
                   const std::map<std::string, json>& metadata = {}) {
        return client_.updateNode(name_, node_id, value, metadata);
    }

    json getStructure() {
        return client_.getStructure(name_);
    }

    const std::string& getName() const { return name_; }

private:
    VisualizerClient& client_;
    std::string name_;
};

/**
 * Convenience macros for common operations
 */
#define VIZ_CREATE_STRUCTURE(client, name, type) \
    ManagedStructure name(client, #name, type)

#define VIZ_ADD_NODE(structure, value) \
    structure.addNode(value)

#define VIZ_REMOVE_NODE(structure, id) \
    structure.removeNode(id)

#define VIZ_UPDATE_NODE(structure, id, value) \
    structure.updateNode(id, value)

} // namespace cpp_visualizer