// MSAL configuration options
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin, // This will work for both dev and prod
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: true,
  },
  system: {
    allowNativeBroker: false, // Disable native broker
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
  scopes: ["User.Read", "profile", "openid", "email"]
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

// Helper to determine if we're running in Replit
export const isReplitEnv = window.location.hostname.includes('.replit.dev');