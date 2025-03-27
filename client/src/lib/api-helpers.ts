/**
 * API Helper Functions
 */

/**
 * Handles GET requests with standard error handling
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API call failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Handles POST requests with standard error handling
 */
export async function apiPost<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API call failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Handles PUT requests with standard error handling
 */
export async function apiPut<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API call failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Handles DELETE requests with standard error handling
 */
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API call failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch Production Lines from the API
 */
export async function fetchProductionLines(): Promise<any[]> {
  return apiGet('/api/manufacturing/production-lines');
}

/**
 * Fetch Projects from the API
 */
export async function fetchProjects(): Promise<any[]> {
  return apiGet('/api/manufacturing/projects');
}