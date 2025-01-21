import type { Configuration } from "@azure/msal-browser";

// MSAL configuration options
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    navigateToLoginRequestUrl: false,
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

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile"],
  prompt: "select_account"
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

// Helper to determine if we're running in Replit
export const isReplitEnv = window.location.hostname.includes('.replit.dev');