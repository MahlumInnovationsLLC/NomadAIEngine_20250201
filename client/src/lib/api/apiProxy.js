/**
 * API Proxy - A simple wrapper for fetch that adds error handling and base URL configuration
 */

// Use location.origin for API requests, which will use the same host and port as the client
// This ensures we don't have hardcoded ports and works with any hosting configuration
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

class ApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Make a GET request
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - The response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Make a POST request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - The response data
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - The response data
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - The response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Make a request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - The fetch options
   * @returns {Promise<any>} - The response data
   */
  async request(endpoint, options = {}) {
    try {
      const url = this.getFullUrl(endpoint);
      console.log(`[API] Making ${options.method || 'GET'} request to ${url}`);
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
      });

      // Check if the response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Error: ${response.status} ${response.statusText} - ${errorText}`);
        
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText || 'No response body'}`);
      }

      // Check if the response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('[API] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get the full URL for an endpoint
   * @param {string} endpoint - The API endpoint
   * @returns {string} - The full URL
   */
  getFullUrl(endpoint) {
    // Make sure endpoint starts with a slash
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    return `${this.baseUrl}${endpoint}`;
  }
}

// Create a singleton instance
const api = new ApiClient();

export default api;