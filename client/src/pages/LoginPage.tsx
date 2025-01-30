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
    // Check if already authenticated
    if (isAuthenticated) {
      setLocation("/dashboard");
      return;
    }

    // Clear any existing sessions on mount
    sessionStorage.clear();
    localStorage.clear();
  }, [isAuthenticated, setLocation]);

  const handleLogin = async () => {
    try {
      // Show loading toast
      toast({
        title: "Signing in",
        description: "Please wait...",
      });

      // Log attempt configuration
      console.debug("Login attempt:", {
        origin: window.location.origin,
        href: window.location.href
      });

      // Attempt login with popup
      const result = await instance.loginPopup(loginRequest);

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