import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

import { 
  CheckCircle2, 
  Clipboard, 
  Grip, 
  GripVertical, 
  MoreVertical, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Copy
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  InspectionTemplate,
  InspectionSection,
  InspectionField,
  inspectionTemplateSchema
} from '../../../../types/manufacturing/templates';

interface TemplateFormProps {
  initialValues?: InspectionTemplate;
  onSubmit: (data: InspectionTemplate) => void;
  onCancel: () => void;
}

const defaultField: InspectionField = {
  id: '',
  type: 'text',
  label: '',
  required: false
};

const defaultSection: InspectionSection = {
  id: '',
  title: '',
  fields: [{ ...defaultField, id: uuidv4() }]
};

const defaultTemplate: InspectionTemplate = {
  name: '',
  type: 'standard',
  category: 'fabrication',
  description: '',
  isActive: true,
  sections: [{ ...defaultSection, id: uuidv4() }],
  version: 1
};

export function TemplateForm({ initialValues, onSubmit, onCancel }: TemplateFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isDeleteSectionDialogOpen, setIsDeleteSectionDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [isDeleteFieldDialogOpen, setIsDeleteFieldDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<{ sectionIndex: number; fieldIndex: number } | null>(null);

  const form = useForm<InspectionTemplate>({
    resolver: zodResolver(inspectionTemplateSchema),
    defaultValues: initialValues || defaultTemplate,
  });

  const { fields: sections, append: appendSection, remove: removeSection, move: moveSection, update: updateSection } = 
    useFieldArray({
      control: form.control,
      name: "sections"
    });

  // Handle form submission
  const handleSubmit = (data: InspectionTemplate) => {
    onSubmit(data);
  };

  // Add a new section
  const addSection = () => {
    appendSection({
      ...defaultSection,
      id: uuidv4(),
      title: `Section ${sections.length + 1}`
    });
  };

  // Delete section confirmation
  const confirmDeleteSection = (index: number) => {
    setSectionToDelete(index);
    setIsDeleteSectionDialogOpen(true);
  };

  // Delete section
  const deleteSection = () => {
    if (sectionToDelete !== null) {
      removeSection(sectionToDelete);
      setIsDeleteSectionDialogOpen(false);
      setSectionToDelete(null);
    }
  };

  // Move section up
  const moveSectionUp = (index: number) => {
    if (index > 0) {
      moveSection(index, index - 1);
    }
  };

  // Move section down
  const moveSectionDown = (index: number) => {
    if (index < sections.length - 1) {
      moveSection(index, index + 1);
    }
  };

  // Duplicate section
  const duplicateSection = (index: number) => {
    const section = sections[index];
    const newSection = {
      ...section,
      id: uuidv4(),
      title: `${section.title} (Copy)`,
      fields: section.fields.map(field => ({
        ...field,
        id: uuidv4()
      }))
    };
    appendSection(newSection);
  };

  // Add field to section
  const addField = (sectionIndex: number) => {
    const sectionFields = form.getValues(`sections.${sectionIndex}.fields`) || [];
    const updatedFields = [
      ...sectionFields,
      {
        ...defaultField,
        id: uuidv4(),
        label: `Field ${sectionFields.length + 1}`
      }
    ];
    form.setValue(`sections.${sectionIndex}.fields`, updatedFields, { shouldValidate: true });
  };

  // Delete field confirmation
  const confirmDeleteField = (sectionIndex: number, fieldIndex: number) => {
    setFieldToDelete({ sectionIndex, fieldIndex });
    setIsDeleteFieldDialogOpen(true);
  };

  // Delete field
  const deleteField = () => {
    if (fieldToDelete !== null) {
      const { sectionIndex, fieldIndex } = fieldToDelete;
      const fields = form.getValues(`sections.${sectionIndex}.fields`);
      const updatedFields = [...fields];
      updatedFields.splice(fieldIndex, 1);
      form.setValue(`sections.${sectionIndex}.fields`, updatedFields, { shouldValidate: true });
      setIsDeleteFieldDialogOpen(false);
      setFieldToDelete(null);
    }
  };

  // Move field up
  const moveFieldUp = (sectionIndex: number, fieldIndex: number) => {
    if (fieldIndex > 0) {
      const fields = form.getValues(`sections.${sectionIndex}.fields`);
      const updatedFields = [...fields];
      const temp = updatedFields[fieldIndex];
      updatedFields[fieldIndex] = updatedFields[fieldIndex - 1];
      updatedFields[fieldIndex - 1] = temp;
      form.setValue(`sections.${sectionIndex}.fields`, updatedFields, { shouldValidate: true });
    }
  };

  // Move field down
  const moveFieldDown = (sectionIndex: number, fieldIndex: number) => {
    const fields = form.getValues(`sections.${sectionIndex}.fields`);
    if (fieldIndex < fields.length - 1) {
      const updatedFields = [...fields];
      const temp = updatedFields[fieldIndex];
      updatedFields[fieldIndex] = updatedFields[fieldIndex + 1];
      updatedFields[fieldIndex + 1] = temp;
      form.setValue(`sections.${sectionIndex}.fields`, updatedFields, { shouldValidate: true });
    }
  };

  // Duplicate field
  const duplicateField = (sectionIndex: number, fieldIndex: number) => {
    const fields = form.getValues(`sections.${sectionIndex}.fields`);
    const field = fields[fieldIndex];
    const newField = {
      ...field,
      id: uuidv4(),
      label: `${field.label} (Copy)`
    };
    const updatedFields = [...fields];
    updatedFields.splice(fieldIndex + 1, 0, newField);
    form.setValue(`sections.${sectionIndex}.fields`, updatedFields, { shouldValidate: true });
  };

  // Handle drag and drop
  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    
    // If dropped outside of droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // If dragging sections
    if (type === 'section') {
      moveSection(source.index, destination.index);
      return;
    }

    // If dragging fields within the same section
    if (source.droppableId === destination.droppableId) {
      const sectionIndex = parseInt(source.droppableId.split('-')[1]);
      const fields = form.getValues(`sections.${sectionIndex}.fields`);
      const updatedFields = [...fields];
      const [removedField] = updatedFields.splice(source.index, 1);
      updatedFields.splice(destination.index, 0, removedField);
      form.setValue(`sections.${sectionIndex}.fields`, updatedFields, { shouldValidate: true });
      return;
    }

    // If dragging fields between different sections
    const sourceSectionIndex = parseInt(source.droppableId.split('-')[1]);
    const destSectionIndex = parseInt(destination.droppableId.split('-')[1]);
    
    const sourceFields = form.getValues(`sections.${sourceSectionIndex}.fields`);
    const destFields = form.getValues(`sections.${destSectionIndex}.fields`);
    
    const updatedSourceFields = [...sourceFields];
    const updatedDestFields = [...destFields];
    
    const [removedField] = updatedSourceFields.splice(source.index, 1);
    updatedDestFields.splice(destination.index, 0, removedField);
    
    form.setValue(`sections.${sourceSectionIndex}.fields`, updatedSourceFields, { shouldValidate: true });
    form.setValue(`sections.${destSectionIndex}.fields`, updatedDestFields, { shouldValidate: true });
  };

  // Get template category options
  const categoryOptions = [
    'fabrication',
    'assembly',
    'paint',
    'mechanical',
    'electrical',
    'it',
    'final',
    'receiving',
    'quality'
  ];

  // Get template type options
  const typeOptions = [
    'standard',
    'custom',
    'regulatory',
    'iso9001',
    'production',
    'service'
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="sections">Template Sections</TabsTrigger>
          </TabsList>

          {/* General Information Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name will appear in template lists and search results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The template type helps categorize inspection templates
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category} className="capitalize">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The manufacturing area this template is used for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Inactive templates are not available for new inspections
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter template description" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about when and how to use this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <div className="flex justify-end">
              <Button type="button" onClick={addSection}>
                <Plus className="mr-2 h-4 w-4" /> Add Section
              </Button>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections" type="section">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-6"
                  >
                    {sections.map((section, sectionIndex) => (
                      <Draggable
                        key={section.id}
                        draggableId={`section-${section.id}`}
                        index={sectionIndex}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors"
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                  </div>
                                  <CardTitle className="text-lg">
                                    <FormField
                                      control={form.control}
                                      name={`sections.${sectionIndex}.title`}
                                      render={({ field }) => (
                                        <FormItem className="mb-0">
                                          <FormControl>
                                            <Input 
                                              placeholder="Section Title" 
                                              {...field} 
                                              className="font-semibold"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {form.watch(`sections.${sectionIndex}.fields`)?.length || 0} fields
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => moveSectionUp(sectionIndex)}>
                                        <MoveUp className="mr-2 h-4 w-4" />
                                        Move Up
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => moveSectionDown(sectionIndex)}>
                                        <MoveDown className="mr-2 h-4 w-4" />
                                        Move Down
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => duplicateSection(sectionIndex)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => confirmDeleteSection(sectionIndex)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                              <FormField
                                control={form.control}
                                name={`sections.${sectionIndex}.description`}
                                render={({ field }) => (
                                  <FormItem className="mb-4">
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Section description (optional)" 
                                        {...field} 
                                        className="text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-semibold">Fields</h4>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => addField(sectionIndex)}
                                  >
                                    <Plus className="mr-1 h-3 w-3" /> Add Field
                                  </Button>
                                </div>

                                <Droppable 
                                  droppableId={`fields-${sectionIndex}`} 
                                  type="field"
                                >
                                  {(provided) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className="space-y-4"
                                    >
                                      {form.watch(`sections.${sectionIndex}.fields`)?.map((field, fieldIndex) => (
                                        <Draggable
                                          key={field.id || `field-${sectionIndex}-${fieldIndex}`}
                                          draggableId={`field-${field.id || `${sectionIndex}-${fieldIndex}`}`}
                                          index={fieldIndex}
                                        >
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className="border rounded-md p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
                                            >
                                              <div className="flex items-start gap-2">
                                                <div 
                                                  {...provided.dragHandleProps}
                                                  className="pt-2"
                                                >
                                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                      control={form.control}
                                                      name={`sections.${sectionIndex}.fields.${fieldIndex}.label`}
                                                      render={({ field }) => (
                                                        <FormItem>
                                                          <FormLabel className="text-xs">Field Label</FormLabel>
                                                          <FormControl>
                                                            <Input placeholder="Field label" {...field} />
                                                          </FormControl>
                                                          <FormMessage />
                                                        </FormItem>
                                                      )}
                                                    />

                                                    <FormField
                                                      control={form.control}
                                                      name={`sections.${sectionIndex}.fields.${fieldIndex}.type`}
                                                      render={({ field }) => (
                                                        <FormItem>
                                                          <FormLabel className="text-xs">Field Type</FormLabel>
                                                          <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                          >
                                                            <FormControl>
                                                              <SelectTrigger>
                                                                <SelectValue placeholder="Select field type" />
                                                              </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                              <SelectItem value="text">Text</SelectItem>
                                                              <SelectItem value="number">Number</SelectItem>
                                                              <SelectItem value="boolean">Yes/No</SelectItem>
                                                              <SelectItem value="date">Date</SelectItem>
                                                              <SelectItem value="measurement">Measurement</SelectItem>
                                                              <SelectItem value="visual">Visual Inspection</SelectItem>
                                                              <SelectItem value="select">Select (Dropdown)</SelectItem>
                                                            </SelectContent>
                                                          </Select>
                                                          <FormMessage />
                                                        </FormItem>
                                                      )}
                                                    />
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                      control={form.control}
                                                      name={`sections.${sectionIndex}.fields.${fieldIndex}.required`}
                                                      render={({ field }) => (
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                          <FormControl>
                                                            <Switch
                                                              checked={field.value}
                                                              onCheckedChange={field.onChange}
                                                            />
                                                          </FormControl>
                                                          <FormLabel>Required Field</FormLabel>
                                                          <FormMessage />
                                                        </FormItem>
                                                      )}
                                                    />

                                                    <div className="flex justify-end items-center gap-2">
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => moveFieldUp(sectionIndex, fieldIndex)}
                                                      >
                                                        <MoveUp className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => moveFieldDown(sectionIndex, fieldIndex)}
                                                      >
                                                        <MoveDown className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => duplicateField(sectionIndex, fieldIndex)}
                                                      >
                                                        <Copy className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => confirmDeleteField(sectionIndex, fieldIndex)}
                                                        className="text-red-600"
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  </div>

                                                  <FormField
                                                    control={form.control}
                                                    name={`sections.${sectionIndex}.fields.${fieldIndex}.description`}
                                                    render={({ field }) => (
                                                      <FormItem>
                                                        <FormLabel className="text-xs">Description</FormLabel>
                                                        <FormControl>
                                                          <Textarea
                                                            placeholder="Field description (optional)"
                                                            className="min-h-[60px]"
                                                            {...field}
                                                          />
                                                        </FormControl>
                                                        <FormMessage />
                                                      </FormItem>
                                                    )}
                                                  />

                                                  {/* Conditional fields based on field type */}
                                                  {form.watch(`sections.${sectionIndex}.fields.${fieldIndex}.type`) === 'select' && (
                                                    <FormField
                                                      control={form.control}
                                                      name={`sections.${sectionIndex}.fields.${fieldIndex}.options`}
                                                      render={({ field }) => (
                                                        <FormItem>
                                                          <FormLabel className="text-xs">Options (one per line)</FormLabel>
                                                          <FormControl>
                                                            <Textarea
                                                              placeholder="Enter options (one per line)"
                                                              className="min-h-[80px]"
                                                              value={field.value?.join('\n') || ''}
                                                              onChange={(e) => {
                                                                const values = e.target.value.split('\n').filter(Boolean);
                                                                field.onChange(values);
                                                              }}
                                                            />
                                                          </FormControl>
                                                          <FormDescription className="text-xs">
                                                            Each line will be a selectable option
                                                          </FormDescription>
                                                          <FormMessage />
                                                        </FormItem>
                                                      )}
                                                    />
                                                  )}

                                                  {(form.watch(`sections.${sectionIndex}.fields.${fieldIndex}.type`) === 'number' || 
                                                    form.watch(`sections.${sectionIndex}.fields.${fieldIndex}.type`) === 'measurement') && (
                                                    <div className="grid grid-cols-3 gap-4">
                                                      {form.watch(`sections.${sectionIndex}.fields.${fieldIndex}.type`) === 'measurement' && (
                                                        <FormField
                                                          control={form.control}
                                                          name={`sections.${sectionIndex}.fields.${fieldIndex}.unit`}
                                                          render={({ field }) => (
                                                            <FormItem>
                                                              <FormLabel className="text-xs">Unit</FormLabel>
                                                              <FormControl>
                                                                <Input placeholder="e.g. mm, kg" {...field} />
                                                              </FormControl>
                                                              <FormMessage />
                                                            </FormItem>
                                                          )}
                                                        />
                                                      )}
                                                      <FormField
                                                        control={form.control}
                                                        name={`sections.${sectionIndex}.fields.${fieldIndex}.min`}
                                                        render={({ field }) => (
                                                          <FormItem>
                                                            <FormLabel className="text-xs">Minimum Value</FormLabel>
                                                            <FormControl>
                                                              <Input 
                                                                type="number" 
                                                                placeholder="Min" 
                                                                {...field}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                              />
                                                            </FormControl>
                                                            <FormMessage />
                                                          </FormItem>
                                                        )}
                                                      />
                                                      <FormField
                                                        control={form.control}
                                                        name={`sections.${sectionIndex}.fields.${fieldIndex}.max`}
                                                        render={({ field }) => (
                                                          <FormItem>
                                                            <FormLabel className="text-xs">Maximum Value</FormLabel>
                                                            <FormControl>
                                                              <Input 
                                                                type="number" 
                                                                placeholder="Max" 
                                                                {...field}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                              />
                                                            </FormControl>
                                                            <FormMessage />
                                                          </FormItem>
                                                        )}
                                                      />
                                                    </div>
                                                  )}

                                                  {form.watch(`sections.${sectionIndex}.fields.${fieldIndex}.type`) === 'visual' && (
                                                    <FormField
                                                      control={form.control}
                                                      name={`sections.${sectionIndex}.fields.${fieldIndex}.acceptable`}
                                                      render={({ field }) => (
                                                        <FormItem>
                                                          <FormLabel className="text-xs">
                                                            Acceptable Conditions (one per line)
                                                          </FormLabel>
                                                          <FormControl>
                                                            <Textarea
                                                              placeholder="Enter acceptable conditions (one per line)"
                                                              className="min-h-[80px]"
                                                              value={field.value?.join('\n') || ''}
                                                              onChange={(e) => {
                                                                const values = e.target.value.split('\n').filter(Boolean);
                                                                field.onChange(values);
                                                              }}
                                                            />
                                                          </FormControl>
                                                          <FormDescription className="text-xs">
                                                            List the conditions that would be considered acceptable
                                                          </FormDescription>
                                                          <FormMessage />
                                                        </FormItem>
                                                      )}
                                                    />
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                      {/* Add field button within the droppable */}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-dashed"
                                        onClick={() => addField(sectionIndex)}
                                      >
                                        <Plus className="mr-1 h-3 w-3" /> Add Field
                                      </Button>
                                    </div>
                                  )}
                                </Droppable>
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialValues ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>

      {/* Delete Section Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteSectionDialogOpen} 
        onOpenChange={setIsDeleteSectionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All fields within this section will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteSection}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Field Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteFieldDialogOpen} 
        onOpenChange={setIsDeleteFieldDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this field?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteField}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}