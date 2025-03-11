import React from 'react';
import { InspectionTemplate, InspectionField } from '@/types/manufacturing/templates';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  Download, 
  Printer, 
  CalendarClock, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export interface TemplatePreviewProps {
  template: InspectionTemplate;
  onBack: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onStartInspection?: (template: InspectionTemplate) => void;
}

export function TemplatePreview({
  template,
  onBack,
  onEdit,
  onDuplicate,
  onDownload,
  onPrint,
  onStartInspection
}: TemplatePreviewProps) {
  // Get total number of fields
  const totalFields = template.sections.reduce(
    (total, section) => total + section.fields.length, 
    0
  );
  
  // Render field details based on type
  const renderFieldSpecifics = (field: InspectionField) => {
    switch (field.type) {
      case 'select':
      case 'multi-select':
        return (
          <div className="ml-6 mt-1">
            <p className="text-sm text-muted-foreground">Options:</p>
            <ul className="list-disc pl-5 text-sm">
              {field.options?.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
        );
        
      case 'visual':
        return (
          <div className="ml-6 mt-1">
            <p className="text-sm text-muted-foreground">Acceptance Criteria:</p>
            <ul className="list-disc pl-5 text-sm">
              {field.acceptable?.map((criterion, index) => (
                <li key={index}>{criterion}</li>
              ))}
            </ul>
          </div>
        );
        
      case 'number':
        return (
          <div className="ml-6 mt-1 text-sm">
            {field.unit && <p>Unit: {field.unit}</p>}
            {(field.min !== undefined || field.max !== undefined) && (
              <p>
                Range: 
                {field.min !== undefined ? ` Min: ${field.min}` : ''}
                {field.max !== undefined ? ` Max: ${field.max}` : ''}
              </p>
            )}
          </div>
        );
        
      case 'measurement':
        return (
          <div className="ml-6 mt-1 text-sm">
            {field.unit && <p>Unit: {field.unit}</p>}
            {field.nominalValue !== undefined && (
              <p>Nominal Value: {field.nominalValue}</p>
            )}
            {field.tolerance && (
              <p>
                Tolerance: +{field.tolerance.upper} / -{field.tolerance.lower}
              </p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onPrint} className="flex items-center">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={onDownload} className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={onDuplicate} className="flex items-center">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button onClick={onEdit} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
          {onStartInspection && template.isActive && (
            <Button 
              onClick={() => onStartInspection(template)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Start Inspection
            </Button>
          )}
        </div>
      </div>
      
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline">{template.category}</Badge>
              <Badge variant={template.isActive ? "success" : "secondary"}>
                {template.isActive ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 h-3 w-3" />
                    Inactive
                  </>
                )}
              </Badge>
              <div className="text-sm text-muted-foreground flex items-center">
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Created: {formatDate(template.createdAt)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Updated: {formatDate(template.updatedAt)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant="outline" className="mb-1">Version {template.version}</Badge>
            {template.standard && (
              <span className="text-sm">
                Standard: <Badge variant="outline">{template.standard}</Badge>
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {template.sections.length} sections, {totalFields} fields
            </span>
          </div>
        </div>
        
        {template.description && (
          <div className="mt-4 text-muted-foreground">
            <p>{template.description}</p>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Sections</TabsTrigger>
          {template.sections.map((section, index) => (
            <TabsTrigger key={section.id || index} value={`section-${index}`}>
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-6 py-4">
          {template.sections.map((section, sectionIndex) => (
            <Card key={section.id || sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{section.title}</span>
                  <Badge variant="outline">{section.fields.length} Fields</Badge>
                </CardTitle>
                {section.description && (
                  <CardDescription>{section.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {section.fields.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No fields in this section
                  </p>
                ) : (
                  <div className="space-y-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.id || fieldIndex} className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{field.label}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge>{field.type}</Badge>
                              {field.required && (
                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {field.instructions && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {field.instructions}
                          </p>
                        )}
                        
                        {renderFieldSpecifics(field)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {template.sections.map((section, sectionIndex) => (
          <TabsContent 
            key={section.id || sectionIndex} 
            value={`section-${sectionIndex}`}
            className="space-y-6 py-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{section.title}</span>
                  <Badge variant="outline">{section.fields.length} Fields</Badge>
                </CardTitle>
                {section.description && (
                  <CardDescription>{section.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {section.fields.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No fields in this section
                  </p>
                ) : (
                  <div className="space-y-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.id || fieldIndex} className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{field.label}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge>{field.type}</Badge>
                              {field.required && (
                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {field.instructions && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {field.instructions}
                          </p>
                        )}
                        
                        {renderFieldSpecifics(field)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="border rounded-md p-4 bg-muted/20">
              <h4 className="font-medium mb-2">Section Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order</p>
                  <p>{section.order}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Display Condition</p>
                  <p>{section.displayCondition || 'None'}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}