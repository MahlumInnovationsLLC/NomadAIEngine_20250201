import { Configuration, PublicClientApplication, BrowserCacheLocation } from "@azure/msal-browser";

// MSAL configuration adjusted for SPA client type
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_NOMAD_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_NOMAD_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true, // Changed to true to ensure proper navigation
  },
  cache: {
    cacheLocation: "sessionStorage" as BrowserCacheLocation, // Changed to sessionStorage for better SPA compatibility
    storeAuthStateInCookie: false, // Changed to false for better SPA compatibility
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 60000,
    iframeHashTimeout: 10000, // Increased from 6000 to avoid timeouts
    loadFrameTimeout: 10000, // Increased from 0 to avoid timeouts
    loggerOptions: {
      loggerCallback: (level: any, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            break;
          case 1:
            console.warn(message);
            break;
          case 2:
            console.info(message);
            break;
          case 3:
            console.debug(message);
            break;
          default:
            console.log(message);
            break;
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3
    }
  }
};

// Create and export the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Add scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
  // Remove prompt for more seamless login experience
  // prompt: "select_account",  
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};