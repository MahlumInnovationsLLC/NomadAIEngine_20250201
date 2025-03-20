/**
 * Utility functions for API calls that handle Vite development server quirks
 */

/**
 * Makes a fetch request that handles both JSON and HTML responses from the server.
 * This is a workaround for the development server sometimes returning HTML instead of JSON.
 */
export async function safeFetch<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  // Make the fetch request
  const response = await fetch(url, options);
  
  // Check the content type
  const contentType = response.headers.get('content-type');
  
  // If it's not JSON or the response is not ok, handle specially
  if (!contentType?.includes('application/json')) {
    console.warn(`Response from ${url} is not JSON (${contentType})`);
    
    // Read the response as text first
    const text = await response.text();
    
    // If this is HTML (likely from Vite dev server), try to extract JSON
    if (contentType?.includes('text/html')) {
      console.warn('Received HTML instead of JSON, attempting direct API call workaround');
      
      // Create a new URL with a timestamp to bypass caching
      const bypassUrl = new URL(url, window.location.origin);
      bypassUrl.searchParams.append('_t', Date.now().toString());
      
      // Make another fetch with headers that force JSON
      const bypassResponse = await fetch(bypassUrl.toString(), {
        ...options,
        headers: {
          ...options?.headers,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // Some servers check for this
        }
      });
      
      if (bypassResponse.ok) {
        try {
          return await bypassResponse.json();
        } catch (e) {
          console.error('Failed to parse JSON from bypass request', e);
        }
      }
    }
    
    // If we get here, we couldn't get JSON - throw with details
    const errorMessage = `Expected JSON response but got ${contentType}`;
    console.error(errorMessage, text.substring(0, 500));
    throw new Error(errorMessage);
  }
  
  // For JSON responses, check if the response is ok
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 
      `API request failed with status ${response.status}`
    );
  }
  
  // Otherwise parse and return the JSON
  return await response.json();
}

/**
 * GET request helper using safeFetch
 */
export async function apiGet<T>(url: string): Promise<T> {
  return safeFetch<T>(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  });
}

/**
 * POST request helper using safeFetch
 */
export async function apiPost<T>(url: string, data?: any): Promise<T> {
  return safeFetch<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper using safeFetch
 */
export async function apiPatch<T>(url: string, data?: any): Promise<T> {
  return safeFetch<T>(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper using safeFetch
 */
export async function apiPut<T>(url: string, data?: any): Promise<T> {
  return safeFetch<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper using safeFetch
 */
export async function apiDelete<T>(url: string): Promise<T> {
  return safeFetch<T>(url, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    }
  });
}