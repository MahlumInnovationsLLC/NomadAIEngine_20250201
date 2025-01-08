import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    id: "documents",
    label: "Documents",
    icon: <FileText className="h-5 w-5" />,
    description: "Browse and manage documents"
  },
  {
    id: "docmanagement",
    label: "DocManagement",
    icon: <Settings className="h-5 w-5" />,
    description: "Configure workflows and approvals"
  },
  {
    id: "training",
    label: "Training Module",
    icon: <Trophy className="h-5 w-5" />,
    description: "View training progress and achievements"
  }
];

interface ModuleSelectorProps {
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
}

export function ModuleSelector({ activeModule, onModuleChange }: ModuleSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="p-2 bg-card">
      <div className="flex flex-col space-y-2">
        {modules.map((module) => (
          <Button
            key={module.id}
            variant={activeModule === module.id ? "secondary" : "ghost"}
            className={cn(
              "justify-start space-x-2",
              activeModule === module.id && "bg-secondary"
            )}
            onClick={() => onModuleChange(module.id)}
          >
            {module.icon}
            {isExpanded && (
              <div className="flex flex-col items-start">
                <span>{module.label}</span>
                <span className="text-xs text-muted-foreground">
                  {module.description}
                </span>
              </div>
            )}
          </Button>
        ))}
      </div>
    </Card>
  );
}
