// MSAL configuration options
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: "https://b2d8f6d5-6488-45ab-8c44-fa4cb6ffba06-00-ep0mbg0f5oj2.janeway.replit.dev",
    postLogoutRedirectUri: "https://b2d8f6d5-6488-45ab-8c44-fa4cb6ffba06-00-ep0mbg0f5oj2.janeway.replit.dev",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    asyncPopups: false
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