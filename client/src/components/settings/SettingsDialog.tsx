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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

  // Support form state
  const [supportForm, setSupportForm] = useState({
    name: '',
    company: '',
    email: '',
    notes: '',
    attachment: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', supportForm.name);
      formData.append('company', supportForm.company);
      formData.append('email', supportForm.email);
      formData.append('notes', supportForm.notes);
      if (supportForm.attachment) {
        formData.append('attachment', supportForm.attachment);
      }

      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit support ticket');
      }

      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you as soon as possible.",
      });

      // Reset form
      setSupportForm({
        name: '',
        company: '',
        email: '',
        notes: '',
        attachment: null,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="appearance">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="interface">Interface</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
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
                    <FontAwesomeIcon icon="sun" className="h-4 w-4 mr-1" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="theme-transition"
                  >
                    <FontAwesomeIcon icon="moon" className="h-4 w-4 mr-1" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="theme-transition"
                  >
                    <FontAwesomeIcon icon="laptop" className="h-4 w-4 mr-1" />
                    System
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interface" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium leading-none">Support</h4>
              <p className="text-sm text-muted-foreground">
                Need help? Submit a support ticket and we'll get back to you as soon as possible.
              </p>
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={supportForm.name}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Your company"
                    value={supportForm.company}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, company: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={supportForm.email}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe your issue..."
                    value={supportForm.notes}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, notes: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachment (optional)</Label>
                  <Input
                    id="attachment"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSupportForm(prev => ({ ...prev, attachment: file }));
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon="circle-notch" className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon="paper-plane" className="mr-2 h-4 w-4" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}