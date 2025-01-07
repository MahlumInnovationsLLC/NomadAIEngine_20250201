import { useState } from "react";
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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [messageDensity, setMessageDensity] = useState<string>("comfortable");

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
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
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
                  Receive notifications for new messages
                </span>
              </Label>
              <Switch
                id="notifications"
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
