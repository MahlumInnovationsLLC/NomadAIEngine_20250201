// Interface for Azure AD user from our API
export interface AzureADUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  jobTitle?: string;
  department?: string;
}

// Function to fetch users from our server-side Azure AD API
export interface AzureADError {
  error: string;
  message?: string;
  details?: string;
  code?: string;
}

export async function fetchAzureADUsers(): Promise<AzureADUser[]> {
  try {
    const response = await fetch('/api/azure-ad/users');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as AzureADError;
      console.error('Error fetching users:', errorData);
      
      // Check for specific error types to provide more useful messaging
      if (errorData.code === 'PERMISSION_DENIED') {
        throw new Error('Azure AD permissions are insufficient. This application needs User.Read.All or Directory.Read.All permissions.');
      } else if (errorData.code === 'INVALID_TOKEN') {
        throw new Error('Authentication with Azure AD failed. Please check your credentials.');
      } else if (errorData.message) {
        throw new Error(`Azure AD Error: ${errorData.message}`);
      } else {
        throw new Error(`Failed to fetch Azure AD users: ${response.status}`);
      }
    }
    
    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Error fetching Azure AD users:', error);
    throw error;
  }
}

// Function to fetch a specific user by ID
export async function fetchAzureADUserById(userId: string): Promise<AzureADUser | null> {
  try {
    const response = await fetch(`/api/azure-ad/users/${userId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching user ${userId}:`, errorData);
      return null;
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(`Error fetching Azure AD user ${userId}:`, error);
    return null;
  }
}

// Check if the Azure AD connection is working
export async function checkAzureADConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/azure-ad/test');
    return response.ok;
  } catch (error) {
    console.error('Error checking Azure AD connection:', error);
    return false;
  }
}