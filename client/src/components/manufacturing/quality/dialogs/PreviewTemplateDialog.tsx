import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QualityFormTemplate } from "@/types/manufacturing";
import { Badge } from "@/components/ui/badge";

interface PreviewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QualityFormTemplate;
}

export function PreviewTemplateDialog({
  open,
  onOpenChange,
  template,
}: PreviewTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Version {template.version}</Badge>
            <Badge variant="outline">{template.type}</Badge>
            {template.isActive && <Badge className="bg-green-500">Active</Badge>}
          </div>

          <p className="text-muted-foreground">{template.description}</p>

          {template.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.fields?.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Type: {field.type}
                        {field.validation && (
                          <span className="ml-2">
                            (Min: {field.validation.min}, Max: {field.validation.max})
                          </span>
                        )}
                      </div>
                      {field.options && (
                        <div className="flex gap-2 flex-wrap">
                          {field.options.map((option) => (
                            <Badge key={option} variant="outline">{option}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
