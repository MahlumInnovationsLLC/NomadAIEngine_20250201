import { useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiMicrosoftFill } from "react-icons/ri";
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
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async () => {
    try {
      const result = await instance.loginPopup({
        ...loginRequest,
        prompt: "select_account",
      });

      if (result) {
        console.log("Login successful");
        toast({
          title: "Success",
          description: "Successfully signed in",
        });
        setLocation("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.errorMessage || error.message || "Failed to sign in. Please try again.",
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background/95">
      <div className="absolute inset-0 -z-20 bg-white" />
      <ParticleBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your Microsoft account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              size="lg"
              onClick={handleLogin}
            >
              <RiMicrosoftFill className="mr-2 h-5 w-5" />
              Sign in with Microsoft
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}