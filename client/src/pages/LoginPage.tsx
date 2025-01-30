import { useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { loginRequest } from "@/lib/msal-config";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

export default function LoginPage() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Debug logging for environment variables and URLs
    console.debug("Login Environment:", {
      clientId: !!import.meta.env.VITE_NOMAD_AZURE_CLIENT_ID,
      tenantId: !!import.meta.env.VITE_NOMAD_AZURE_TENANT_ID,
      origin: window.location.origin,
      href: window.location.href,
      pathname: window.location.pathname,
      fullUrl: `${window.location.origin}${window.location.pathname}`
    });

    // Check if Azure AD configuration is present
    if (!import.meta.env.VITE_NOMAD_AZURE_CLIENT_ID || !import.meta.env.VITE_NOMAD_AZURE_TENANT_ID) {
      console.error("Azure AD configuration missing", {
        clientIdExists: !!import.meta.env.VITE_NOMAD_AZURE_CLIENT_ID,
        tenantIdExists: !!import.meta.env.VITE_NOMAD_AZURE_TENANT_ID
      });
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Azure AD authentication is not properly configured. Please contact support.",
      });
      return;
    }

    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation, toast]);

  const handleLogin = async () => {
    try {
      // Show loading toast
      toast({
        title: "Signing in",
        description: "Please wait...",
      });

      // Clear any existing sessions
      sessionStorage.clear();
      localStorage.clear();

      // Log configuration for debugging
      console.debug("Login attempt configuration:", {
        clientId: import.meta.env.VITE_NOMAD_AZURE_CLIENT_ID ? "Set" : "Not set",
        tenantId: import.meta.env.VITE_NOMAD_AZURE_TENANT_ID ? "Set" : "Not set",
        redirectUri: window.location.origin,
        loginRequest: {
          ...loginRequest,
          redirectUri: window.location.origin,
        }
      });

      // Attempt login with popup
      const result = await instance.loginPopup({
        ...loginRequest,
        redirectUri: window.location.origin,
      });

      if (result) {
        console.debug("Login successful:", { 
          account: result.account?.username,
          tenantId: result.account?.tenantId
        });
        setLocation("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to sign in. Please try again.",
      });
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden">
      <ParticleBackground className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 w-full h-full bg-background/90 dark:bg-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-card/95 dark:bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>
              Sign in with your Microsoft account to access the manufacturing portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              size="lg"
              onClick={handleLogin}
            >
              <FontAwesomeIcon icon="windows" className="mr-2 h-5 w-5" />
              Sign in with Microsoft
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}