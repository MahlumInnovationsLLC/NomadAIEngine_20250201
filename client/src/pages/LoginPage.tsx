import { useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiMicrosoftFill } from "react-icons/ri";
import { loginRequest, isReplitEnv } from "@/lib/msal-config";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const BackgroundShapes = () => (
  <div className="fixed inset-0 overflow-hidden -z-10">
    <motion.div
      className="absolute w-[40rem] h-[40rem] bg-primary/5 rounded-full"
      animate={{
        scale: [1, 1.2, 1],
        x: ["-25%", "-15%", "-25%"],
        y: ["-25%", "-35%", "-25%"],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute right-0 bottom-0 w-[35rem] h-[35rem] bg-primary/3 rounded-full"
      animate={{
        scale: [1, 1.1, 1],
        x: ["25%", "15%", "25%"],
        y: ["25%", "15%", "25%"],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute left-1/2 top-1/2 w-[45rem] h-[45rem] bg-primary/2 rounded-full"
      animate={{
        scale: [1, 1.3, 1],
        x: ["-50%", "-45%", "-50%"],
        y: ["-50%", "-55%", "-50%"],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>
);

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
      // In Replit dev environment, always use popup to avoid iframe issues
      if (isReplitEnv) {
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
      } else {
        // In production, we can use redirect
        await instance.loginRedirect(loginRequest);
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background">
      <BackgroundShapes />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-background/95">
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