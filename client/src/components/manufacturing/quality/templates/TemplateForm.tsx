import React, { useState, useCallback } from 'react';
import { 
  FieldType, 
  InspectionField, 
  InspectionSection, 
  InspectionTemplate 
} from '@/types/manufacturing/templates';
import { 
  createNewField, 
  createNewSection, 
  hasOptions, 
  hasAcceptanceCriteria, 
  hasUnits,
  hasTolerance 
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash, 
  Plus, 
  MoveVertical, 
  Copy, 
  Save, 
  X, 
  FileText, 
  Loader2,
  Grip,
  Info
} from 'lucide-react';

export interface TemplateFormProps {
  initialTemplate: InspectionTemplate;
  onSave: (template: InspectionTemplate) => void;
  onCancel: () => void;
  isCreating?: boolean;
  validationErrors?: string[];
  showValidationAlert?: boolean;
}

export function TemplateForm({
  initialTemplate,
  onSave,
  onCancel,
  isCreating = false,
  validationErrors = [],
  showValidationAlert = false
}: TemplateFormProps) {
  const [template, setTemplate] = useState<InspectionTemplate>(initialTemplate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle template metadata changes
  const handleTemplateChange = (
    field: keyof InspectionTemplate, 
    value: string | number | boolean
  ) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle adding a new section
  const handleAddSection = () => {
    const order = template.sections.length > 0 
      ? Math.max(...template.sections.map(s => s.order)) + 1 
      : 1;
    
    const newSection = createNewSection(order);
    
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };
  
  // Handle section changes
  const handleSectionChange = (
    sectionIndex: number, 
    field: keyof InspectionSection, 
    value: string | number | boolean
  ) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        [field]: value
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle removing a section
  const handleRemoveSection = (sectionIndex: number) => {
    setTemplate(prev => {
      const updatedSections = prev.sections.filter((_, index) => index !== sectionIndex);
      
      // Re-order the remaining sections if needed
      const reorderedSections = updatedSections.map((section, index) => ({
        ...section,
        order: index + 1
      }));
      
      return {
        ...prev,
        sections: reorderedSections
      };
    });
  };
  
  // Handle duplicating a section
  const handleDuplicateSection = (sectionIndex: number) => {
    setTemplate(prev => {
      const sectionToDuplicate = prev.sections[sectionIndex];
      const nextOrder = Math.max(...prev.sections.map(s => s.order)) + 1;
      
      // Create a deep copy with new IDs
      const duplicatedSection: InspectionSection = {
        ...sectionToDuplicate,
        id: crypto.randomUUID(),
        title: `${sectionToDuplicate.title} (Copy)`,
        order: nextOrder,
        fields: sectionToDuplicate.fields.map(field => ({
          ...field,
          id: crypto.randomUUID()
        }))
      };
      
      // Insert the duplicated section after the original
      const updatedSections = [...prev.sections];
      updatedSections.splice(sectionIndex + 1, 0, duplicatedSection);
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle section reordering
  const handleMoveSection = (sectionIndex: number, direction: 'up' | 'down') => {
    setTemplate(prev => {
      if (
        (direction === 'up' && sectionIndex === 0) || 
        (direction === 'down' && sectionIndex === prev.sections.length - 1)
      ) {
        return prev; // Can't move further in this direction
      }
      
      const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
      const updatedSections = [...prev.sections];
      
      // Swap orders
      const tempOrder = updatedSections[sectionIndex].order;
      updatedSections[sectionIndex].order = updatedSections[targetIndex].order;
      updatedSections[targetIndex].order = tempOrder;
      
      // Swap positions in array
      [updatedSections[sectionIndex], updatedSections[targetIndex]] = 
        [updatedSections[targetIndex], updatedSections[sectionIndex]];
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle adding a field to a section
  const handleAddField = (sectionIndex: number, type: FieldType) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const newField = createNewField(type);
      
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        fields: [...updatedSections[sectionIndex].fields, newField]
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle field changes
  const handleFieldChange = (
    sectionIndex: number,
    fieldIndex: number,
    field: keyof InspectionField,
    value: any
  ) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const updatedFields = [...updatedSections[sectionIndex].fields];
      
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        [field]: value
      };
      
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        fields: updatedFields
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle removing a field
  const handleRemoveField = (sectionIndex: number, fieldIndex: number) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const updatedFields = updatedSections[sectionIndex].fields.filter((_, index) => index !== fieldIndex);
      
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        fields: updatedFields
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle duplicating a field
  const handleDuplicateField = (sectionIndex: number, fieldIndex: number) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const fieldToDuplicate = updatedSections[sectionIndex].fields[fieldIndex];
      
      // Create a deep copy with a new ID
      const duplicatedField: InspectionField = {
        ...fieldToDuplicate,
        id: crypto.randomUUID(),
        label: `${fieldToDuplicate.label} (Copy)`
      };
      
      // Insert the duplicated field after the original
      const updatedFields = [...updatedSections[sectionIndex].fields];
      updatedFields.splice(fieldIndex + 1, 0, duplicatedField);
      
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        fields: updatedFields
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle moving a field within a section
  const handleMoveField = (
    sectionIndex: number, 
    fieldIndex: number, 
    direction: 'up' | 'down'
  ) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const section = updatedSections[sectionIndex];
      
      if (
        (direction === 'up' && fieldIndex === 0) || 
        (direction === 'down' && fieldIndex === section.fields.length - 1)
      ) {
        return prev; // Can't move further in this direction
      }
      
      const updatedFields = [...section.fields];
      const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
      
      // Swap positions in array
      [updatedFields[fieldIndex], updatedFields[targetIndex]] = 
        [updatedFields[targetIndex], updatedFields[fieldIndex]];
      
      updatedSections[sectionIndex] = {
        ...section,
        fields: updatedFields
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle adding an option to a select/multi-select field
  const handleAddOption = (sectionIndex: number, fieldIndex: number, option: string) => {
    if (!option.trim()) return;
    
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const field = updatedSections[sectionIndex].fields[fieldIndex];
      
      if (!field.options) {
        field.options = [];
      }
      
      const updatedField = {
        ...field,
        options: [...field.options, option.trim()]
      };
      
      updatedSections[sectionIndex].fields[fieldIndex] = updatedField;
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle removing an option from a select/multi-select field
  const handleRemoveOption = (sectionIndex: number, fieldIndex: number, optionIndex: number) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const field = updatedSections[sectionIndex].fields[fieldIndex];
      
      if (!field.options) return prev;
      
      const updatedOptions = field.options.filter((_, index) => index !== optionIndex);
      
      updatedSections[sectionIndex].fields[fieldIndex] = {
        ...field,
        options: updatedOptions
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle adding an acceptance criterion to a visual field
  const handleAddAcceptanceCriterion = (
    sectionIndex: number, 
    fieldIndex: number, 
    criterion: string
  ) => {
    if (!criterion.trim()) return;
    
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const field = updatedSections[sectionIndex].fields[fieldIndex];
      
      if (!field.acceptable) {
        field.acceptable = [];
      }
      
      const updatedField = {
        ...field,
        acceptable: [...field.acceptable, criterion.trim()]
      };
      
      updatedSections[sectionIndex].fields[fieldIndex] = updatedField;
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle removing an acceptance criterion from a visual field
  const handleRemoveAcceptanceCriterion = (
    sectionIndex: number, 
    fieldIndex: number, 
    criterionIndex: number
  ) => {
    setTemplate(prev => {
      const updatedSections = [...prev.sections];
      const field = updatedSections[sectionIndex].fields[fieldIndex];
      
      if (!field.acceptable) return prev;
      
      const updatedCriteria = field.acceptable.filter((_, index) => index !== criterionIndex);
      
      updatedSections[sectionIndex].fields[fieldIndex] = {
        ...field,
        acceptable: updatedCriteria
      };
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };
  
  // Handle drag-and-drop reordering of sections
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, type } = result;
    
    if (source.index === destination.index) return;
    
    // Handle section reordering
    if (type === 'section') {
      setTemplate(prev => {
        const updatedSections = [...prev.sections];
        const [removed] = updatedSections.splice(source.index, 1);
        updatedSections.splice(destination.index, 0, removed);
        
        // Update order property of all sections
        return {
          ...prev,
          sections: updatedSections.map((section, index) => ({
            ...section,
            order: index + 1
          }))
        };
      });
    } 
    // Handle field reordering within a section
    else if (type.startsWith('fields-')) {
      const sectionIndex = parseInt(type.replace('fields-', ''));
      
      setTemplate(prev => {
        const updatedSections = [...prev.sections];
        const updatedFields = [...updatedSections[sectionIndex].fields];
        
        const [removed] = updatedFields.splice(source.index, 1);
        updatedFields.splice(destination.index, 0, removed);
        
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          fields: updatedFields
        };
        
        return {
          ...prev,
          sections: updatedSections
        };
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(template);
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render the form
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {isCreating ? 'Create New Template' : 'Edit Template'}
        </h2>
        <div className="flex items-center space-x-2">
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Validation errors alert */}
      {showValidationAlert && validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Template metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>
            Basic information about the inspection template
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                value={template.name}
                onChange={(e) => handleTemplateChange('name', e.target.value)}
                placeholder="Enter template name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-category"
                value={template.category}
                onChange={(e) => handleTemplateChange('category', e.target.value)}
                placeholder="E.g., Manufacturing, Assembly, Quality"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-standard">Standard Reference</Label>
              <Input
                id="template-standard"
                value={template.standard || ''}
                onChange={(e) => handleTemplateChange('standard', e.target.value)}
                placeholder="E.g., ISO 9001:2015, Section 8.3.4"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-version">Version</Label>
              <Input
                id="template-version"
                type="number"
                min="1"
                value={template.version}
                onChange={(e) => handleTemplateChange('version', parseInt(e.target.value))}
                disabled={isCreating}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={template.description || ''}
              onChange={(e) => handleTemplateChange('description', e.target.value)}
              placeholder="Provide a detailed description of this template's purpose and usage"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch
                id="template-active"
                checked={template.isActive}
                onCheckedChange={(checked) => handleTemplateChange('isActive', checked)}
              />
              <Label htmlFor="template-active">Active</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Active templates are available for use in inspections</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sections and Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sections</h3>
          <Button 
            type="button" 
            onClick={handleAddSection}
            variant="outline"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
        
        {template.sections.length === 0 ? (
          <Card className="bg-muted/40">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Sections Added Yet</h3>
              <p className="text-muted-foreground text-center mt-1 mb-4">
                Sections help organize your inspection fields into logical groups
              </p>
              <Button
                type="button"
                onClick={handleAddSection}
                variant="secondary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Section
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections" type="section">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {template.sections.map((section, sectionIndex) => (
                    <Draggable
                      key={section.id}
                      draggableId={section.id}
                      index={sectionIndex}
                    >
                      {(provided) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border-l-4 border-l-primary/70"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center">
                              <div 
                                {...provided.dragHandleProps}
                                className="p-1 mr-2 cursor-move rounded-md hover:bg-muted"
                              >
                                <Grip className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center">
                                  <Badge className="mr-2 bg-primary/10 hover:bg-primary/20 text-primary">
                                    Section {section.order}
                                  </Badge>
                                  <Input
                                    value={section.title}
                                    onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                                    placeholder="Section Title"
                                    className="text-lg font-semibold border-none w-auto flex-grow"
                                  />
                                </div>
                                <Input 
                                  value={section.description || ''}
                                  onChange={(e) => handleSectionChange(sectionIndex, 'description', e.target.value)}
                                  placeholder="Section description (optional)"
                                  className="border-none text-sm text-muted-foreground mt-1 w-full"
                                />
                              </div>
                              <div className="flex items-center space-x-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDuplicateSection(sectionIndex)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Duplicate Section</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveSection(sectionIndex)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove Section</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Droppable 
                              droppableId={`fields-${sectionIndex}`} 
                              type={`fields-${sectionIndex}`}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="space-y-3"
                                >
                                  {section.fields.length > 0 ? (
                                    section.fields.map((field, fieldIndex) => (
                                      <Draggable
                                        key={field.id}
                                        draggableId={field.id}
                                        index={fieldIndex}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="border rounded-md p-3 bg-background"
                                          >
                                            <div className="flex items-start">
                                              <div 
                                                {...provided.dragHandleProps}
                                                className="p-1 mr-2 mt-1 cursor-move rounded-md hover:bg-muted"
                                              >
                                                <Grip className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                              <div className="flex-grow space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                  <div className="space-y-1">
                                                    <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-label`}>
                                                      Field Label <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                      id={`field-${sectionIndex}-${fieldIndex}-label`}
                                                      value={field.label}
                                                      onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'label', e.target.value)}
                                                      placeholder="Label"
                                                      required
                                                    />
                                                  </div>
                                                  
                                                  <div className="space-y-1">
                                                    <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-type`}>Type</Label>
                                                    <Select
                                                      value={field.type}
                                                      onValueChange={(value) => {
                                                        // Create a new field with the new type to ensure proper defaults
                                                        const newField = createNewField(value as FieldType);
                                                        handleFieldChange(sectionIndex, fieldIndex, 'type', value);
                                                        
                                                        // Set appropriate defaults for the field type
                                                        if (hasOptions(value as FieldType)) {
                                                          handleFieldChange(sectionIndex, fieldIndex, 'options', newField.options);
                                                        }
                                                        
                                                        if (hasAcceptanceCriteria(value as FieldType)) {
                                                          handleFieldChange(sectionIndex, fieldIndex, 'acceptable', newField.acceptable);
                                                        }
                                                      }}
                                                    >
                                                      <SelectTrigger id={`field-${sectionIndex}-${fieldIndex}-type`}>
                                                        <SelectValue placeholder="Select Type" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectGroup>
                                                          <SelectLabel>Basic Types</SelectLabel>
                                                          <SelectItem value="text">Text</SelectItem>
                                                          <SelectItem value="number">Number</SelectItem>
                                                          <SelectItem value="boolean">Yes/No</SelectItem>
                                                          <SelectItem value="date">Date</SelectItem>
                                                        </SelectGroup>
                                                        <SelectGroup>
                                                          <SelectLabel>Advanced Types</SelectLabel>
                                                          <SelectItem value="select">Single Select</SelectItem>
                                                          <SelectItem value="multi-select">Multi Select</SelectItem>
                                                          <SelectItem value="measurement">Measurement</SelectItem>
                                                          <SelectItem value="visual">Visual Inspection</SelectItem>
                                                          <SelectItem value="image">Image Upload</SelectItem>
                                                        </SelectGroup>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                  
                                                  <div className="flex items-center space-x-2">
                                                    <div className="flex items-center space-x-2 mt-6">
                                                      <Switch
                                                        id={`field-${sectionIndex}-${fieldIndex}-required`}
                                                        checked={field.required}
                                                        onCheckedChange={(checked) => handleFieldChange(sectionIndex, fieldIndex, 'required', checked)}
                                                      />
                                                      <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-required`}>
                                                        Required
                                                      </Label>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                  <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-description`}>
                                                    Description
                                                  </Label>
                                                  <Textarea
                                                    id={`field-${sectionIndex}-${fieldIndex}-description`}
                                                    value={field.description || ''}
                                                    onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'description', e.target.value)}
                                                    placeholder="Field description"
                                                    rows={1}
                                                  />
                                                </div>
                                                
                                                <div className="space-y-1">
                                                  <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-instructions`}>
                                                    Instructions
                                                  </Label>
                                                  <Textarea
                                                    id={`field-${sectionIndex}-${fieldIndex}-instructions`}
                                                    value={field.instructions || ''}
                                                    onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'instructions', e.target.value)}
                                                    placeholder="Instructions for inspectors"
                                                    rows={1}
                                                  />
                                                </div>
                                                
                                                {/* Render type-specific fields */}
                                                {(field.type === 'number' || field.type === 'measurement') && (
                                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                      <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-unit`}>
                                                        Unit
                                                      </Label>
                                                      <Input
                                                        id={`field-${sectionIndex}-${fieldIndex}-unit`}
                                                        value={field.unit || ''}
                                                        onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'unit', e.target.value)}
                                                        placeholder="E.g., mm, kg, °C"
                                                      />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                      <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-min`}>
                                                        Minimum Value
                                                      </Label>
                                                      <Input
                                                        id={`field-${sectionIndex}-${fieldIndex}-min`}
                                                        type="number"
                                                        value={field.min ?? ''}
                                                        onChange={(e) => handleFieldChange(
                                                          sectionIndex, 
                                                          fieldIndex, 
                                                          'min', 
                                                          e.target.value ? parseFloat(e.target.value) : undefined
                                                        )}
                                                        placeholder="Minimum"
                                                      />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                      <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-max`}>
                                                        Maximum Value
                                                      </Label>
                                                      <Input
                                                        id={`field-${sectionIndex}-${fieldIndex}-max`}
                                                        type="number"
                                                        value={field.max ?? ''}
                                                        onChange={(e) => handleFieldChange(
                                                          sectionIndex, 
                                                          fieldIndex, 
                                                          'max', 
                                                          e.target.value ? parseFloat(e.target.value) : undefined
                                                        )}
                                                        placeholder="Maximum"
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {field.type === 'measurement' && (
                                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                      <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-nominal`}>
                                                        Nominal Value
                                                      </Label>
                                                      <Input
                                                        id={`field-${sectionIndex}-${fieldIndex}-nominal`}
                                                        type="number"
                                                        value={field.nominalValue ?? ''}
                                                        onChange={(e) => handleFieldChange(
                                                          sectionIndex, 
                                                          fieldIndex, 
                                                          'nominalValue', 
                                                          e.target.value ? parseFloat(e.target.value) : undefined
                                                        )}
                                                        placeholder="Target value"
                                                      />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                      <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-tolerance-upper`}>
                                                        Upper Tolerance (+)
                                                      </Label>
                                                      <Input
                                                        id={`field-${sectionIndex}-${fieldIndex}-tolerance-upper`}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={field.tolerance?.upper ?? ''}
                                                        onChange={(e) => {
                                                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                                          const currentTolerance = field.tolerance || { upper: 0, lower: 0 };
                                                          handleFieldChange(
                                                            sectionIndex, 
                                                            fieldIndex, 
                                                            'tolerance', 
                                                            { ...currentTolerance, upper: value ?? 0 }
                                                          );
                                                        }}
                                                        placeholder="Upper tolerance"
                                                      />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                      <Label htmlFor={`field-${sectionIndex}-${fieldIndex}-tolerance-lower`}>
                                                        Lower Tolerance (-)
                                                      </Label>
                                                      <Input
                                                        id={`field-${sectionIndex}-${fieldIndex}-tolerance-lower`}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={field.tolerance?.lower ?? ''}
                                                        onChange={(e) => {
                                                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                                          const currentTolerance = field.tolerance || { upper: 0, lower: 0 };
                                                          handleFieldChange(
                                                            sectionIndex, 
                                                            fieldIndex, 
                                                            'tolerance', 
                                                            { ...currentTolerance, lower: value ?? 0 }
                                                          );
                                                        }}
                                                        placeholder="Lower tolerance"
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {(field.type === 'select' || field.type === 'multi-select') && (
                                                  <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                      <Label>Options</Label>
                                                      <div className="flex items-center space-x-2">
                                                        <Input
                                                          id={`field-${sectionIndex}-${fieldIndex}-new-option`}
                                                          placeholder="Add new option"
                                                          className="w-60"
                                                          onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                              e.preventDefault();
                                                              const input = e.currentTarget;
                                                              handleAddOption(sectionIndex, fieldIndex, input.value);
                                                              input.value = '';
                                                            }
                                                          }}
                                                        />
                                                        <Button
                                                          type="button"
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => {
                                                            const input = document.getElementById(`field-${sectionIndex}-${fieldIndex}-new-option`) as HTMLInputElement;
                                                            handleAddOption(sectionIndex, fieldIndex, input.value);
                                                            input.value = '';
                                                          }}
                                                        >
                                                          <Plus className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                    
                                                    <ScrollArea className="h-32 rounded-md border">
                                                      <div className="p-2">
                                                        {field.options && field.options.length > 0 ? (
                                                          <div className="space-y-1">
                                                            {field.options.map((option, optionIndex) => (
                                                              <div 
                                                                key={optionIndex}
                                                                className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                                                              >
                                                                <span>{option}</span>
                                                                <Button
                                                                  type="button"
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  onClick={() => handleRemoveOption(sectionIndex, fieldIndex, optionIndex)}
                                                                >
                                                                  <Trash className="h-4 w-4" />
                                                                </Button>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        ) : (
                                                          <div className="flex items-center justify-center h-full text-muted-foreground py-4">
                                                            No options added yet
                                                          </div>
                                                        )}
                                                      </div>
                                                    </ScrollArea>
                                                  </div>
                                                )}
                                                
                                                {field.type === 'visual' && (
                                                  <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                      <Label>Acceptance Criteria</Label>
                                                      <div className="flex items-center space-x-2">
                                                        <Input
                                                          id={`field-${sectionIndex}-${fieldIndex}-new-criterion`}
                                                          placeholder="Add acceptance criterion"
                                                          className="w-60"
                                                          onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                              e.preventDefault();
                                                              const input = e.currentTarget;
                                                              handleAddAcceptanceCriterion(sectionIndex, fieldIndex, input.value);
                                                              input.value = '';
                                                            }
                                                          }}
                                                        />
                                                        <Button
                                                          type="button"
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => {
                                                            const input = document.getElementById(`field-${sectionIndex}-${fieldIndex}-new-criterion`) as HTMLInputElement;
                                                            handleAddAcceptanceCriterion(sectionIndex, fieldIndex, input.value);
                                                            input.value = '';
                                                          }}
                                                        >
                                                          <Plus className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                    
                                                    <ScrollArea className="h-32 rounded-md border">
                                                      <div className="p-2">
                                                        {field.acceptable && field.acceptable.length > 0 ? (
                                                          <div className="space-y-1">
                                                            {field.acceptable.map((criterion, criterionIndex) => (
                                                              <div 
                                                                key={criterionIndex}
                                                                className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                                                              >
                                                                <span>{criterion}</span>
                                                                <Button
                                                                  type="button"
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  onClick={() => handleRemoveAcceptanceCriterion(sectionIndex, fieldIndex, criterionIndex)}
                                                                >
                                                                  <Trash className="h-4 w-4" />
                                                                </Button>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        ) : (
                                                          <div className="flex items-center justify-center h-full text-muted-foreground py-4">
                                                            No acceptance criteria added yet
                                                          </div>
                                                        )}
                                                      </div>
                                                    </ScrollArea>
                                                  </div>
                                                )}
                                              </div>
                                              
                                              <div className="flex flex-col items-center space-y-1 ml-2">
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveField(sectionIndex, fieldIndex, 'up')}
                                                        disabled={fieldIndex === 0}
                                                      >
                                                        <ChevronUp className="h-4 w-4" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>Move Up</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                                
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDuplicateField(sectionIndex, fieldIndex)}
                                                      >
                                                        <Copy className="h-4 w-4" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>Duplicate Field</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                                
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveField(sectionIndex, fieldIndex)}
                                                      >
                                                        <Trash className="h-4 w-4" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>Remove Field</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                                
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveField(sectionIndex, fieldIndex, 'down')}
                                                        disabled={fieldIndex === section.fields.length - 1}
                                                      >
                                                        <ChevronDown className="h-4 w-4" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>Move Down</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))
                                  ) : (
                                    <div className="text-center p-4 bg-muted/40 rounded-md">
                                      <p className="text-muted-foreground">
                                        No fields added to this section yet
                                      </p>
                                    </div>
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                            
                            {/* Add field controls */}
                            <div className="mt-4 flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                {section.fields.length} field{section.fields.length !== 1 ? 's' : ''} in this section
                              </p>
                              <Select
                                onValueChange={(value) => handleAddField(sectionIndex, value as FieldType)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Add Field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Basic Types</SelectLabel>
                                    <SelectItem value="text">Add Text Field</SelectItem>
                                    <SelectItem value="number">Add Number Field</SelectItem>
                                    <SelectItem value="boolean">Add Yes/No Field</SelectItem>
                                    <SelectItem value="date">Add Date Field</SelectItem>
                                  </SelectGroup>
                                  <SelectGroup>
                                    <SelectLabel>Advanced Types</SelectLabel>
                                    <SelectItem value="select">Add Single Select</SelectItem>
                                    <SelectItem value="multi-select">Add Multi Select</SelectItem>
                                    <SelectItem value="measurement">Add Measurement</SelectItem>
                                    <SelectItem value="visual">Add Visual Inspection</SelectItem>
                                    <SelectItem value="image">Add Image Upload</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </>
          )}
        </Button>
      </div>
    </form>
  );
}