#include "cpp_visualizer_client.hpp"
#include <iostream>
#include <sstream>

namespace cpp_visualizer {

VisualizerClient::VisualizerClient(const std::string& base_url) 
    : base_url_(base_url), curl_(nullptr), verbose_(false) {
    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl_ = curl_easy_init();
    
    if (curl_) {
        curl_easy_setopt(curl_, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl_, CURLOPT_TIMEOUT, 10L);
        curl_easy_setopt(curl_, CURLOPT_CONNECTTIMEOUT, 5L);
    }
}

VisualizerClient::~VisualizerClient() {
    if (curl_) {
        curl_easy_cleanup(curl_);
    }
    curl_global_cleanup();
}

bool VisualizerClient::createStructure(const std::string& name, 
                                      const std::string& type,
                                      int depth, 
                                      int initial_size) {
    json data = {
        {"name", name},
        {"type", type},
        {"depth", depth},
        {"initialSize", initial_size}
    };
    
    std::string response = makeRequest("POST", "/api/live/structure", data);
    return !response.empty() && response.find("\"id\"") != std::string::npos;
}

int VisualizerClient::addNode(const std::string& structure_name, 
                             const json& value, 
                             int index,
                             const std::map<std::string, json>& metadata) {
    json data = {
        {"value", value},
        {"metadata", metadata}
    };
    
    if (index >= 0) {
        data["index"] = index;
    }
    
    std::string endpoint = "/api/live/structure/" + structure_name + "/node";
    std::string response = makeRequest("POST", endpoint, data);
    
    try {
        json result = json::parse(response);
        if (result.contains("node") && result["node"].contains("id")) {
            return result["node"]["id"];
        }
    } catch (const std::exception& e) {
        logError("Failed to parse addNode response: " + std::string(e.what()));
    }
    
    return -1;
}

bool VisualizerClient::removeNode(const std::string& structure_name, int node_id) {
    std::string endpoint = "/api/live/structure/" + structure_name + "/node/" + std::to_string(node_id);
    std::string response = makeRequest("DELETE", endpoint);
    return !response.empty() && response.find("error") == std::string::npos;
}

bool VisualizerClient::updateNode(const std::string& structure_name, 
                                 int node_id, 
                                 const json& value,
                                 const std::map<std::string, json>& metadata) {
    json data = {
        {"value", value},
        {"metadata", metadata}
    };
    
    std::string endpoint = "/api/live/structure/" + structure_name + "/node/" + std::to_string(node_id);
    std::string response = makeRequest("PUT", endpoint, data);
    return !response.empty() && response.find("error") == std::string::npos;
}

json VisualizerClient::getStructure(const std::string& structure_name) {
    std::string endpoint = "/api/live/structure/" + structure_name;
    std::string response = makeRequest("GET", endpoint);
    
    try {
        return json::parse(response);
    } catch (const std::exception& e) {
        logError("Failed to parse getStructure response: " + std::string(e.what()));
        return json{};
    }
}

std::vector<json> VisualizerClient::getAllStructures() {
    std::string response = makeRequest("GET", "/api/live/structures");
    
    try {
        json result = json::parse(response);
        if (result.is_array()) {
            return result;
        }
    } catch (const std::exception& e) {
        logError("Failed to parse getAllStructures response: " + std::string(e.what()));
    }
    
    return {};
}

json VisualizerClient::getMatrix() {
    std::string response = makeRequest("GET", "/api/live/matrix");
    
    try {
        return json::parse(response);
    } catch (const std::exception& e) {
        logError("Failed to parse getMatrix response: " + std::string(e.what()));
        return json{};
    }
}

bool VisualizerClient::deleteStructure(const std::string& structure_name) {
    std::string endpoint = "/api/live/structure/" + structure_name;
    std::string response = makeRequest("DELETE", endpoint);
    return !response.empty() && response.find("error") == std::string::npos;
}

bool VisualizerClient::isConnected() {
    std::string response = makeRequest("GET", "/api/live/structures");
    return !response.empty();
}

std::string VisualizerClient::makeRequest(const std::string& method, 
                                         const std::string& endpoint, 
                                         const json& data) {
    if (!curl_) {
        logError("CURL not initialized");
        return "";
    }
    
    std::string url = base_url_ + endpoint;
    std::string response_data;
    std::string json_string;
    
    curl_easy_setopt(curl_, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl_, CURLOPT_WRITEDATA, &response_data);
    
    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    
    if (method == "POST" || method == "PUT") {
        json_string = data.dump();
        curl_easy_setopt(curl_, CURLOPT_POSTFIELDS, json_string.c_str());
        
        if (method == "POST") {
            curl_easy_setopt(curl_, CURLOPT_POST, 1L);
        } else {
            curl_easy_setopt(curl_, CURLOPT_CUSTOMREQUEST, "PUT");
        }
    } else if (method == "DELETE") {
        curl_easy_setopt(curl_, CURLOPT_CUSTOMREQUEST, "DELETE");
    } else {
        curl_easy_setopt(curl_, CURLOPT_HTTPGET, 1L);
    }
    
    curl_easy_setopt(curl_, CURLOPT_HTTPHEADER, headers);
    
    CURLcode res = curl_easy_perform(curl_);
    
    curl_slist_free_all(headers);
    
    if (res != CURLE_OK) {
        logError("CURL request failed: " + std::string(curl_easy_strerror(res)));
        return "";
    }
    
    return response_data;
}

size_t VisualizerClient::WriteCallback(void* contents, size_t size, size_t nmemb, std::string* data) {
    size_t total_size = size * nmemb;
    data->append(static_cast<char*>(contents), total_size);
    return total_size;
}

void VisualizerClient::logError(const std::string& message) {
    if (verbose_) {
        std::cerr << "[VisualizerClient] " << message << std::endl;
    }
}

} // namespace cpp_visualizer