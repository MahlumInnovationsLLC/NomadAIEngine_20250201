import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    id: "docmanagement",
    label: "DocManagement",
    icon: <Settings className="h-5 w-5" />,
    description: "Document Management"
  },
  {
    id: "training",
    label: "Training Module",
    icon: <Trophy className="h-5 w-5" />,
    description: "View Training Progress"
  }
];

interface ModuleSelectorProps {
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
  className?: string;
}

export function ModuleSelector({ activeModule, onModuleChange, className }: ModuleSelectorProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Card className="bg-background border-0 shadow-none">
        <div className="flex items-center gap-2 py-2 px-4">
          {modules.map((module) => (
            <Button
              key={module.id}
              variant={activeModule === module.id ? "secondary" : "ghost"}
              className={cn(
                "flex items-center gap-2",
                activeModule === module.id && "bg-secondary"
              )}
              onClick={() => onModuleChange(module.id)}
            >
              {module.icon}
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">{module.label}</span>
                <span className="text-xs text-muted-foreground">
                  {module.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}