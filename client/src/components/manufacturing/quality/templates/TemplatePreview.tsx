import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InspectionTemplate, InspectionField } from '@/types/manufacturing/templates';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface TemplatePreviewProps {
  template: InspectionTemplate;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  if (!template) {
    return <div>No template selected</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{template.name}</span>
          <Badge variant="outline">{template.category}</Badge>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {template.description}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {template.sections?.map((section, index) => (
          <div key={section.id || index} className="space-y-3">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}

            <div className="space-y-2">
              {section.fields?.map((field: InspectionField, fieldIndex) => (
                <div key={field.id || fieldIndex} className="rounded-md border p-3">
                  <div className="flex justify-between">
                    <div className="font-medium">{field.label}</div>
                    <Badge>{field.type}</Badge>
                  </div>
                  {field.description && (
                    <div className="text-sm text-muted-foreground mt-1">{field.description}</div>
                  )}
                  {field.required && (
                    <Badge variant="outline" className="mt-2">Required</Badge>
                  )}
                  
                  {/* Display field-specific attributes based on type */}
                  {field.type === 'measurement' && field.unit && (
                    <div className="text-sm mt-2">
                      Unit: {field.unit}
                      {field.min !== undefined && field.max !== undefined && (
                        <span> | Range: {field.min} - {field.max}</span>
                      )}
                    </div>
                  )}
                  
                  {field.type === 'select' && field.options && (
                    <div className="text-sm mt-2">
                      Options: {field.options.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {index < template.sections.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}