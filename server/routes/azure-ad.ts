import { Router, Request, Response } from "express";
import fetch from "node-fetch";
import { AuthenticatedRequest } from "../auth-middleware";
import { log } from "../vite";

const router = Router();

// Configuration for Azure AD from environment variables
const tenantId = process.env.NOMAD_AZURE_TENANT_ID || '';
const clientId = process.env.NOMAD_AZURE_CLIENT_ID || '';
const clientSecret = process.env.NOMAD_AZURE_AD_SECRET || '';

log(`Azure AD Configuration - Tenant ID: ${tenantId ? 'configured' : 'missing'}, Client ID: ${clientId ? 'configured' : 'missing'}, Client Secret: ${clientSecret ? 'configured' : 'missing'}`);

// Endpoint to get Azure AD access token
async function getAccessToken(): Promise<string | null> {
  if (!tenantId || !clientId || !clientSecret) {
    console.error('Azure AD credentials are missing');
    return null;
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');
  
  // Debug log for troubleshooting
  console.log('Requesting access token for Microsoft Graph API access');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting access token:', errorText);
      return null;
    }
    
    const data = await response.json() as { 
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    if (!data.access_token) {
      console.error('Access token missing in response');
      return null;
    }

    console.log('Successfully obtained Azure AD access token');
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// Test endpoint for Azure AD connection
router.get('/test', async (req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      log('Failed to get Azure AD access token');
      return res.status(500).json({ error: 'Failed to get Azure AD access token' });
    }
    log('Successfully obtained Azure AD access token');
    res.json({ status: 'success', message: 'Azure AD connection is working' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('Error testing Azure AD connection:', errorMessage);
    res.status(500).json({ 
      error: 'Failed to test Azure AD connection',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Endpoint to get all users from Azure AD
router.get('/users', async (req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to get Azure AD access token' });
    }
    
    const response = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,displayName,givenName,surname,userPrincipalName,mail,jobTitle,department,officeLocation&$top=999', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching users from Azure AD:', JSON.stringify(errorData, null, 2));
      
      // Check for specific permission issues
      if (errorData && typeof errorData === 'object') {
        // Define a type for expected error responses from Azure AD
        type AzureADErrorResponse = {
          error?: {
            code?: string;
            message?: string;
          }
        };
        
        const errorResponse = errorData as AzureADErrorResponse;
        
        if (errorResponse.error?.code === 'Authorization_RequestDenied') {
          log('Azure AD permission error: Authorization_RequestDenied');
          return res.status(response.status).json({ 
            error: 'Failed to fetch users from Azure AD', 
            message: 'The application lacks the necessary permissions to list users.',
            details: 'This service principal needs "User.Read.All" or "Directory.Read.All" permission in the Azure portal.',
            code: 'PERMISSION_DENIED'
          });
        } else if (errorResponse.error?.code === 'InvalidAuthenticationToken') {
          log('Azure AD error: InvalidAuthenticationToken');
          return res.status(response.status).json({ 
            error: 'Failed to fetch users from Azure AD', 
            message: 'The authentication token was invalid or expired.',
            details: 'Check your Azure AD client credentials and permissions.',
            code: 'INVALID_TOKEN'
          });
        } else if (errorResponse.error) {
          log(`Azure AD error: ${errorResponse.error.code || 'Unknown'}`);
          return res.status(response.status).json({ 
            error: 'Failed to fetch users from Azure AD', 
            message: errorResponse.error.message || 'An error occurred when connecting to Microsoft Graph API',
            details: errorResponse.error.code || 'Unknown error code',
            code: 'GRAPH_API_ERROR'
          });
        }
      }
      
      return res.status(response.status).json({ error: 'Failed to fetch users from Azure AD' });
    }
    
    const data = await response.json() as any;
    
    // Transform data to match the format expected by the frontend
    const users = data.value.map((user: any) => ({
      id: user.id,
      firstName: user.givenName || (user.displayName ? user.displayName.split(' ')[0] : ''),
      lastName: user.surname || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : ''),
      email: user.mail || user.userPrincipalName,
      name: user.displayName,
      jobTitle: user.jobTitle || '',
      department: user.department || ''
    }));
    
    res.json(users);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('Error in /azure-ad/users endpoint:', errorMessage);
    res.status(500).json({ 
      error: 'Failed to fetch users from Azure AD',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Endpoint to get a specific user from Azure AD
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to get Azure AD access token' });
    }
    
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}?$select=id,displayName,givenName,surname,userPrincipalName,mail,jobTitle,department,officeLocation`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching user ${userId} from Azure AD:`, errorText);
      return res.status(response.status).json({ error: 'Failed to fetch user from Azure AD' });
    }
    
    const user = await response.json();
    
    // Transform data to match the format expected by the frontend
    const userObj = user as any;
    const transformedUser = {
      id: userObj.id,
      firstName: userObj.givenName || (userObj.displayName ? userObj.displayName.split(' ')[0] : ''),
      lastName: userObj.surname || (userObj.displayName ? userObj.displayName.split(' ').slice(1).join(' ') : ''),
      email: userObj.mail || userObj.userPrincipalName,
      name: userObj.displayName,
      jobTitle: userObj.jobTitle || '',
      department: userObj.department || ''
    };
    
    res.json(transformedUser);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('Error in /azure-ad/users/:id endpoint:', errorMessage);
    res.status(500).json({ 
      error: 'Failed to fetch user from Azure AD',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

export default router;