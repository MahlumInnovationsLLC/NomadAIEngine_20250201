import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('enableAnimations') !== 'false';
    }
    return true;
  });
  const [enableNotifications, setEnableNotifications] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('enableNotifications') !== 'false';
    }
    return true;
  });
  const [messageDensity, setMessageDensity] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('messageDensity') || 'comfortable';
    }
    return 'comfortable';
  });

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('enableAnimations', enableAnimations.toString());
    localStorage.setItem('enableNotifications', enableNotifications.toString());
    localStorage.setItem('messageDensity', messageDensity);

    // Apply animations setting
    document.documentElement.style.setProperty(
      '--transition-duration',
      enableAnimations ? '300ms' : '0ms'
    );

    // Show confirmation toast
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  }, [enableAnimations, enableNotifications, messageDensity, toast]);

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Appearance</h4>
            <div className="flex flex-col space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="theme-transition"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="theme-transition"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="theme-transition"
                >
                  <Laptop className="h-4 w-4 mr-1" />
                  System
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium leading-none">Interface</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="animations" className="flex flex-col">
                <span>Enable animations</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Smoother transitions between pages and elements
                </span>
              </Label>
              <Switch
                id="animations"
                checked={enableAnimations}
                onCheckedChange={setEnableAnimations}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="density">Message density</Label>
              <Select value={messageDensity} onValueChange={setMessageDensity}>
                <SelectTrigger id="density">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium leading-none">Notifications</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex flex-col">
                <span>Enable notifications</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Receive notifications for new messages and updates
                </span>
              </Label>
              <Switch
                id="notifications"
                checked={enableNotifications}
                onCheckedChange={(checked) => {
                  if (checked && 'Notification' in window) {
                    Notification.requestPermission().then((permission) => {
                      if (permission === 'granted') {
                        setEnableNotifications(true);
                      } else {
                        toast({
                          title: "Permission denied",
                          description: "Please enable notifications in your browser settings.",
                          variant: "destructive",
                        });
                      }
                    });
                  } else {
                    setEnableNotifications(checked);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}