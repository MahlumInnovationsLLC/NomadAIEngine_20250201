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
    // Check if already authenticated and redirect
    if (isAuthenticated) {
      console.debug("User is already authenticated, redirecting to dashboard");
      setLocation("/dashboard");
      return;
    }

    // Check for redirect response on initial load
    const checkForRedirectResponse = async () => {
      try {
        console.log("Checking for redirect response on LoginPage load");
        
        // Make sure MSAL is initialized first
        await instance.initialize();
        
        // Now it's safe to handle redirect and other MSAL operations
        const response = await instance.handleRedirectPromise();
        
        if (response) {
          console.log("Found redirect response on page load:", response);
          // We have a successful login response from a redirect
          const account = response.account;
          if (account) {
            instance.setActiveAccount(account);
            
            console.log("Setting active account and redirecting to dashboard");
            setTimeout(() => setLocation("/dashboard"), 500);
          }
        } else {
          console.log("No redirect response found, checking for cached accounts");
          // Check if we already have accounts in cache
          const accounts = instance.getAllAccounts();
          if (accounts.length > 0) {
            // User is already signed in
            console.log("Found cached account:", accounts[0].username);
            instance.setActiveAccount(accounts[0]);
            setLocation("/dashboard");
          } else {
            console.log("No accounts found, user needs to login");
          }
        }
      } catch (error) {
        console.error("Error handling redirect:", error);
      }
    };
    
    checkForRedirectResponse();
  }, [isAuthenticated, setLocation, instance]);

  const handleLogin = async () => {
    try {
      // Make sure MSAL is initialized first
      await instance.initialize();
      
      // Check for and handle any redirect response first
      // This is critical for SPA authentication flow
      const redirectResponse = await instance.handleRedirectPromise();
      if (redirectResponse) {
        console.debug("Redirect response received:", redirectResponse);
        setLocation("/dashboard");
        return;
      }

      // Attempt to get users directly
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        // User is already logged in - set active account and redirect
        instance.setActiveAccount(accounts[0]);
        setLocation("/dashboard");
        return;
      }

      // Show loading toast
      toast({
        title: "Signing in",
        description: "Redirecting to Microsoft login...",
      });

      // Log attempt configuration
      console.debug("Login attempt:", {
        origin: window.location.origin,
        href: window.location.href,
        pathname: window.location.pathname
      });

      // Instead of popup, use redirect (more reliable for SPA authentication)
      await instance.loginRedirect({
        ...loginRequest,
        redirectUri: window.location.origin
      });
      
      // The page will redirect to Microsoft login and then back to this page
      console.log("Login redirect initiated");
      
    } catch (error: any) {
      console.error("Login error:", error);

      // Extract detailed error information for debugging
      const errorDetails = {
        errorCode: error.errorCode,
        errorMessage: error.errorMessage,
        subError: error.subError || '',
        name: error.name,
        errorNo: error.errorNo,
        correlationId: error.correlationId
      };
      console.error("Error details:", errorDetails);

      // Show user-friendly error message
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please try refreshing the page and signing in again. " + 
                    (error.errorMessage || "Failed to sign in."),
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
              <FontAwesomeIcon icon="user-tie" className="mr-2 h-5 w-5" />
              Sign in with Microsoft
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}