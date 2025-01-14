import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Settings, Share2, LogOut, MoonIcon, SunIcon, Cloud } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useToast } from "@/hooks/use-toast";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { AzureServicesStatus } from "@/components/azure/AzureServicesStatus";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPresence } from "@/components/ui/UserPresence";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">GYM AI Engine</span>
          </Link>
        </div>

        <NavigationMenu className="flex-1">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/dashboard">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/chat">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Chat
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/docmanage">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Document Training & Control
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/club-control">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Club Control
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <UserPresence currentUserId="1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowStatus(!showStatus)}
          >
            <Cloud className="h-4 w-4" />
            <span className="sr-only">Azure services status</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {isMenuOpen ? (
                  <X className="h-4 w-4 transition-transform duration-200" />
                ) : (
                  <Menu className="h-4 w-4 transition-transform duration-200" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setShowSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onSelect={async () => {
                  const { toast } = useToast();
                  try {
                    await instance.logoutPopup();
                    window.location.href = '/login';
                  } catch (error) {
                    console.error('Logout error:', error);
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to log out. Please try again."
                    });
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Azure Services Status</DialogTitle>
          </DialogHeader>
          <AzureServicesStatus />
        </DialogContent>
      </Dialog>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </header>
  );
}