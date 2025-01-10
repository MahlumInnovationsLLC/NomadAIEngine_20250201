import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
}

export function ModuleSelector({ activeModule, onModuleChange }: ModuleSelectorProps) {
  const [isExpanded] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-2 bg-card">
        <div className="flex flex-col space-y-2">
          {modules.map((module) => (
            <motion.div
              key={module.id}
              initial={false}
              animate={{ 
                scale: hoveredId === module.id ? 1.02 : 1,
                backgroundColor: activeModule === module.id ? "var(--secondary)" : "transparent"
              }}
              transition={{ duration: 0.2 }}
              onHoverStart={() => setHoveredId(module.id)}
              onHoverEnd={() => setHoveredId(null)}
            >
              <Button
                variant={activeModule === module.id ? "secondary" : "ghost"}
                className={cn(
                  "justify-start space-x-2 w-full transition-all duration-200",
                  activeModule === module.id && "bg-secondary",
                  hoveredId === module.id && "shadow-sm"
                )}
                onClick={() => onModuleChange(module.id)}
              >
                <motion.div
                  animate={{ 
                    rotate: hoveredId === module.id ? [0, -10, 10, -5, 5, 0] : 0 
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {module.icon}
                </motion.div>
                {isExpanded && (
                  <motion.div 
                    className="flex flex-col items-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span>{module.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {module.description}
                    </span>
                  </motion.div>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}