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
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center py-2">
            <FontAwesomeIcon 
              icon="home"
              className="h-5 w-5 text-primary"
              aria-label="Home"
            />
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
              <Link href="/facility-control">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Facility
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/manufacturing-control">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Manufacturing
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/material-handling">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Material Handling
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
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
              <DropdownMenuItem>
                <FontAwesomeIcon icon="share" className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}