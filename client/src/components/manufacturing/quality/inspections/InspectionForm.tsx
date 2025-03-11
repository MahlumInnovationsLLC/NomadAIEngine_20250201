import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ClipboardCheck, 
  Calendar as CalendarIcon,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { 
  InspectionTemplate, 
  InspectionField, 
  inspectionInstanceSchema,
  SectionResult,
  InspectionResult,
  InspectionInstance
} from '@/types/manufacturing/templates';
import { useToast } from '@/hooks/use-toast';

interface InspectionFormProps {
  template: InspectionTemplate;
  projectId?: string;
  productionLineId?: string;
  batchNumber?: string;
  serialNumber?: string;
  onComplete?: (inspection: InspectionInstance) => void;
  onCancel?: () => void;
}

export default function InspectionForm({
  template,
  projectId,
  productionLineId,
  batchNumber,
  serialNumber,
  onComplete,
  onCancel
}: InspectionFormProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>(() => {
    // Initialize with empty results for each section
    return template.sections.map(section => ({
      sectionId: section.id,
      results: [],
      notes: '',
      status: 'pending'
    }));
  });

  // Form validation schema
  const inspectionSchema = z.object({
    inspectorName: z.string().min(2, 'Please enter your name'),
    notes: z.string().optional(),
  });

  type InspectionFormValues = z.infer<typeof inspectionSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      inspectorName: '',
      notes: '',
    },
  });

  // Handle individual field updates
  const updateFieldResult = (sectionIndex: number, result: InspectionResult) => {
    setSectionResults(prev => {
      const updated = [...prev];
      const section = { ...updated[sectionIndex] };
      
      // Find if we already have a result for this field
      const existingIndex = section.results.findIndex(r => r.fieldId === result.fieldId);
      
      if (existingIndex >= 0) {
        // Update existing result
        section.results = [
          ...section.results.slice(0, existingIndex),
          result,
          ...section.results.slice(existingIndex + 1)
        ];
      } else {
        // Add new result
        section.results = [...section.results, result];
      }
      
      updated[sectionIndex] = section;
      return updated;
    });
  };

  // Update section notes
  const updateSectionNotes = (sectionIndex: number, notes: string) => {
    setSectionResults(prev => {
      const updated = [...prev];
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        notes
      };
      return updated;
    });
  };

  // Mark section as complete
  const completeSection = (sectionIndex: number) => {
    // Check if all required fields have results
    const section = template.sections[sectionIndex];
    const requiredFields = section.fields.filter(field => field.required);
    const currentResults = sectionResults[sectionIndex].results;
    
    const allRequiredFieldsCompleted = requiredFields.every(field => 
      currentResults.some(result => result.fieldId === field.id)
    );
    
    if (!allRequiredFieldsCompleted) {
      toast({
        title: "Incomplete Section",
        description: "Please complete all required fields before proceeding",
        variant: "destructive"
      });
      return false;
    }
    
    // Mark section as complete
    setSectionResults(prev => {
      const updated = [...prev];
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        status: 'complete',
        completedBy: 'Current User', // Would use actual user info in production
        completedAt: new Date().toISOString()
      };
      return updated;
    });
    
    // Move to next section if available
    if (sectionIndex < template.sections.length - 1) {
      setActiveSection(sectionIndex + 1);
    }
    
    return true;
  };

  // Handle form submission
  const onSubmit = async (data: InspectionFormValues) => {
    // Check that all sections are completed
    const allSectionsCompleted = sectionResults.every(section => section.status === 'complete');
    
    if (!allSectionsCompleted) {
      // Mark the current section as complete before proceeding
      const currentSectionCompleted = completeSection(activeSection);
      
      if (!currentSectionCompleted) {
        return;
      }
      
      // If there are still incomplete sections, show message
      if (!sectionResults.every(section => section.status === 'complete')) {
        toast({
          title: "Incomplete Inspection",
          description: "Please complete all sections before submitting",
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      // Create inspection instance
      const inspection: InspectionInstance = {
        id: uuidv4(),
        templateId: template.id!,
        projectId: projectId,
        productionLineId: productionLineId,
        batchNumber: batchNumber,
        serialNumber: serialNumber,
        status: 'complete',
        sectionResults: sectionResults,
        attachments: [],
        startedBy: data.inspectorName,
        startedAt: new Date().toISOString(),
        completedBy: data.inspectorName,
        completedAt: new Date().toISOString()
      };
      
      // Validate the inspection instance
      inspectionInstanceSchema.parse(inspection);
      
      // In a real implementation, this would send the data to the server
      // await fetch('/api/manufacturing/quality/inspections', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(inspection)
      // });
      
      toast({
        title: "Inspection Completed",
        description: "The inspection has been successfully submitted",
      });
      
      // Call completion handler
      if (onComplete) {
        onComplete(inspection);
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting the inspection",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field status for visual indication
  const getFieldStatus = (sectionIndex: number, fieldId: string): 'incomplete' | 'complete' | 'not-applicable' => {
    const result = sectionResults[sectionIndex].results.find(r => r.fieldId === fieldId);
    
    if (!result) {
      return 'incomplete';
    }
    
    if (result.status === 'n/a') {
      return 'not-applicable';
    }
    
    return 'complete';
  };

  // Render a field based on its type
  const renderField = (field: InspectionField, sectionIndex: number) => {
    const fieldStatus = getFieldStatus(sectionIndex, field.id);
    
    return (
      <div 
        key={field.id} 
        className={`border p-4 rounded-lg mb-4 ${
          fieldStatus === 'complete' ? 'border-green-200 bg-green-50' : 
          fieldStatus === 'not-applicable' ? 'border-gray-200 bg-gray-50' : 
          field.required ? 'border-orange-100' : 'border-gray-100'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <Label className="text-base font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
            )}
          </div>
          <div>
            {fieldStatus === 'complete' && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {fieldStatus === 'not-applicable' && (
              <AlertCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
        
        <div className="mt-3">
          {/* Render different input types based on field type */}
          {field.type === 'text' && (
            <Textarea
              placeholder="Enter text"
              onChange={(e) => updateFieldResult(sectionIndex, {
                fieldId: field.id,
                value: e.target.value,
                timestamp: new Date().toISOString()
              })}
            />
          )}
          
          {field.type === 'number' && (
            <Input
              type="number"
              placeholder="Enter a number"
              onChange={(e) => updateFieldResult(sectionIndex, {
                fieldId: field.id,
                value: parseFloat(e.target.value),
                timestamp: new Date().toISOString()
              })}
            />
          )}
          
          {field.type === 'measurement' && (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Enter measurement"
                step="any"
                onChange={(e) => updateFieldResult(sectionIndex, {
                  fieldId: field.id,
                  value: parseFloat(e.target.value),
                  timestamp: new Date().toISOString()
                })}
                className="flex-1"
              />
              {field.unit && (
                <span className="text-sm font-medium">{field.unit}</span>
              )}
            </div>
          )}
          
          {field.type === 'boolean' && (
            <RadioGroup
              onValueChange={(value) => updateFieldResult(sectionIndex, {
                fieldId: field.id,
                value: value === 'true',
                timestamp: new Date().toISOString()
              })}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${field.id}-yes`} />
                <Label htmlFor={`${field.id}-yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${field.id}-no`} />
                <Label htmlFor={`${field.id}-no`}>No</Label>
              </div>
            </RadioGroup>
          )}
          
          {field.type === 'visual' && (
            <div className="space-y-4">
              <RadioGroup
                onValueChange={(value) => updateFieldResult(sectionIndex, {
                  fieldId: field.id,
                  value: value,
                  status: value as 'pass' | 'fail' | 'n/a',
                  timestamp: new Date().toISOString()
                })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pass" id={`${field.id}-pass`} />
                  <Label htmlFor={`${field.id}-pass`} className="flex items-center">
                    <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                    Pass
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fail" id={`${field.id}-fail`} />
                  <Label htmlFor={`${field.id}-fail`} className="flex items-center">
                    <XCircle className="mr-1 h-4 w-4 text-red-500" />
                    Fail
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="n/a" id={`${field.id}-na`} />
                  <Label htmlFor={`${field.id}-na`}>N/A</Label>
                </div>
              </RadioGroup>
              
              {field.acceptable && field.acceptable.length > 0 && (
                <div className="bg-muted p-2 rounded text-sm">
                  <span className="font-medium">Acceptance Criteria: </span>
                  {field.acceptable.join(', ')}
                </div>
              )}
              
              <Textarea
                placeholder="Additional notes (optional)"
                onChange={(e) => {
                  const existingResult = sectionResults[sectionIndex].results.find(
                    r => r.fieldId === field.id
                  );
                  
                  if (existingResult) {
                    updateFieldResult(sectionIndex, {
                      ...existingResult,
                      notes: e.target.value
                    });
                  }
                }}
              />
            </div>
          )}
          
          {field.type === 'date' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Select date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  onSelect={(date) => date && updateFieldResult(sectionIndex, {
                    fieldId: field.id,
                    value: date.toISOString(),
                    timestamp: new Date().toISOString()
                  })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          
          {field.type === 'select' && field.options && (
            <Select
              onValueChange={(value) => updateFieldResult(sectionIndex, {
                fieldId: field.id,
                value: value,
                timestamp: new Date().toISOString()
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  };

  // Render section navigation
  const renderSectionNavigation = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => setActiveSection(prev => Math.max(0, prev - 1))}
          disabled={activeSection === 0}
        >
          Previous Section
        </Button>
        
        <div className="text-sm font-medium">
          Section {activeSection + 1} of {template.sections.length}
        </div>
        
        <Button
          variant="outline"
          onClick={() => {
            if (completeSection(activeSection)) {
              setActiveSection(prev => Math.min(template.sections.length - 1, prev + 1));
            }
          }}
          disabled={activeSection === template.sections.length - 1}
        >
          Next Section
        </Button>
      </div>
    );
  };

  // Render section tabs
  const renderSectionTabs = () => {
    return (
      <Tabs
        value={activeSection.toString()}
        onValueChange={(value) => setActiveSection(parseInt(value))}
        className="mb-6"
      >
        <TabsList className="flex overflow-x-auto pb-px">
          {template.sections.map((section, index) => (
            <TabsTrigger 
              key={section.id} 
              value={index.toString()}
              className="flex items-center"
            >
              {sectionResults[index].status === 'complete' ? (
                <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-muted text-xs mr-1">
                  {index + 1}
                </span>
              )}
              <span className="truncate max-w-[120px]">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  };

  // Render the current section
  const renderCurrentSection = () => {
    const section = template.sections[activeSection];
    
    if (!section) {
      return <div>Section not found</div>;
    }
    
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
        
        <div className="space-y-1">
          {section.fields.map(field => renderField(field, activeSection))}
        </div>
        
        <div className="mt-6">
          <Label htmlFor={`section-${activeSection}-notes`}>Section Notes</Label>
          <Textarea
            id={`section-${activeSection}-notes`}
            placeholder="Add any additional notes for this section (optional)"
            value={sectionResults[activeSection].notes}
            onChange={(e) => updateSectionNotes(activeSection, e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          <CardDescription>
            {template.description}
            {template.standard && (
              <span className="block mt-1">Standard: {template.standard}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderSectionTabs()}
          {renderSectionNavigation()}
          {renderCurrentSection()}
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Inspection Summary</CardTitle>
          <CardDescription>
            Complete the inspection information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} id="inspection-form" className="space-y-4">
            <div>
              <Label htmlFor="inspectorName">Inspector Name*</Label>
              <Input
                id="inspectorName"
                {...register('inspectorName')}
                className={errors.inspectorName ? 'border-red-500' : ''}
              />
              {errors.inspectorName && (
                <p className="text-red-500 text-sm mt-1">{errors.inspectorName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Enter any additional notes about this inspection (optional)"
                rows={3}
              />
            </div>
            
            <div className="pt-2">
              <Label className="mb-2 block">Attachments</Label>
              <div className="border border-dashed rounded-lg p-6 text-center">
                <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: JPG, PNG, PDF (Max 5MB)
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  <PlusCircle className="mr-1 h-4 w-4" /> Add Files
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="inspection-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Submit Inspection
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}