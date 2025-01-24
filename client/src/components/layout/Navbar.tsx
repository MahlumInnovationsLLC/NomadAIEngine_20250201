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
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useTheme } from "next-themes";
import { Link } from "wouter";
import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useToast } from "@/hooks/use-toast";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { AzureServicesStatus } from "@/components/azure/AzureServicesStatus";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPresence } from "@/components/ui/UserPresence";
import { NotificationCenter } from "@/components/ui/NotificationCenter";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const { instance } = useMsal();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      toast({
        title: "Signing out",
        description: "Please wait...",
      });

      const accounts = instance.getAllAccounts();

      if (accounts.length === 0) {
        window.location.href = "/login";
        return;
      }

      sessionStorage.clear();
      localStorage.clear();

      await Promise.all(
        accounts.map(account =>
          instance.logoutPopup({
            account,
            postLogoutRedirectUri: window.location.origin + "/login",
            mainWindowRedirectUri: window.location.origin + "/login"
          })
        )
      );

    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
      window.location.href = "/login";
    }
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2 py-2">
            <FontAwesomeIcon 
              icon="home"
              className="h-5 w-5 text-primary"
              aria-label="Home"
            />
            <span className="font-medium">GYM AI Engine</span>
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
            <NavigationMenuItem>
              <Link href="/marketing-control">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Marketing Control
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/member-management">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Member Management
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <UserPresence currentUserId="1" />
          <NotificationCenter />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowStatus(!showStatus)}
          >
            <FontAwesomeIcon icon="cloud" className="h-4 w-4" />
            <span className="sr-only">Azure services status</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <FontAwesomeIcon icon="sun" className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <FontAwesomeIcon icon="moon" className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {isMenuOpen ? (
                  <FontAwesomeIcon icon="xmark" className="h-4 w-4 transition-transform duration-200" />
                ) : (
                  <FontAwesomeIcon icon="bars" className="h-4 w-4 transition-transform duration-200" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setShowSettings(true)}>
                <FontAwesomeIcon icon="cog" className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FontAwesomeIcon icon="share" className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onSelect={handleLogout}
              >
                <FontAwesomeIcon icon="right-from-bracket" className="mr-2 h-4 w-4" />
                Sign out
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