import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, generateUUID } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Upload, X } from "lucide-react";
import {
  MRB,
  MRBSchema,
  MRBTask,
  MRBNote,
  defaultMRBTask,
  defaultMRBNote
} from "@/types/manufacturing/mrb";
import { useQuery } from "@tanstack/react-query";
import {Label} from "@/components/ui/label";

interface MRBDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: MRB;
  onSuccess: (savedMRB: MRB) => void;
}

interface PendingNCR {
  id: string;
  number: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  area: string;
  status: string;
  containmentActions?: Array<{
    action: string;
    assignedTo: string;
    dueDate: string;
  }>;
  projectNumber?: string;
  assignedToMrb: {
    id: string;
    number: string;
    status: string;
  } | null;
}

export function MRBDialog({ open, onOpenChange, initialData, onSuccess }: MRBDialogProps) {
  const [selectedNCRs, setSelectedNCRs] = useState<{[key: string]: { ncr: PendingNCR, notes: string }}>({});
  const [activeTab, setActiveTab] = useState("ncrs");
  const [tasks, setTasks] = useState<MRBTask[]>(initialData?.tasks || []);
  const [notes, setNotes] = useState<MRBNote[]>(initialData?.notes || []);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>(initialData?.attachments || []);
  const isEditing = !!initialData;

  const { data: pendingNCRs = [], isLoading } = useQuery<PendingNCR[]>({
    queryKey: ['/api/manufacturing/quality/ncrs', { status: 'pending_disposition' }],
    enabled: !isEditing,
  });

  const form = useForm<MRB>({
    resolver: zodResolver(MRBSchema),
    defaultValues: initialData || {
      id: generateUUID(),
      number: `MRB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      title: "",
      description: "",
      type: "material",
      severity: "minor",
      status: "pending_review",
      partNumber: "",
      quantity: 0,
      unit: "pcs",
      location: "",
      disposition: {
        decision: "use_as_is",
        justification: "",
        approvedBy: [],
      },
      attachments: [],
      tasks: [],
      notes: [],
      collaborators: [],
      history: [],
      createdBy: "current-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedNCRs: []
    },
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/manufacturing/quality/mrb/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload attachments');
      }

      const uploadedFiles = await response.json();
      setUploadedAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading attachments:', error);
    }
  };

  const addCollaborator = (userId: string, role: 'reviewer' | 'approver' | 'contributor') => {
    const updatedForm = { ...form.getValues() };
    updatedForm.collaborators = [
      ...(updatedForm.collaborators || []),
      {
        userId,
        role,
        addedAt: new Date().toISOString()
      }
    ];
    form.reset(updatedForm);
  };

  const removeCollaborator = (userId: string) => {
    const updatedForm = { ...form.getValues() };
    updatedForm.collaborators = updatedForm.collaborators.filter(c => c.userId !== userId);
    form.reset(updatedForm);
  };

  const addTask = () => {
    setTasks([...tasks, { ...defaultMRBTask, id: generateUUID() }]);
  };

  const updateTask = (index: number, updates: Partial<MRBTask>) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], ...updates };
    setTasks(updatedTasks);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const addNote = () => {
    setNotes([...notes, { ...defaultMRBNote, id: generateUUID() }]);
  };

  const updateNote = (index: number, updates: Partial<MRBNote>) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = { ...updatedNotes[index], ...updates };
    setNotes(updatedNotes);
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const toggleNCRSelection = (ncr: PendingNCR) => {
    if (ncr.assignedToMrb) return;

    setSelectedNCRs(prev => {
      const newSelection = { ...prev };
      if (newSelection[ncr.id]) {
        delete newSelection[ncr.id];
      } else {
        newSelection[ncr.id] = { ncr, notes: '' };
      }
      return newSelection;
    });
  };

  const updateNCRNotes = (ncrId: string, notes: string) => {
    setSelectedNCRs(prev => ({
      ...prev,
      [ncrId]: { ...prev[ncrId], notes }
    }));
  };

  const onSubmit = async (data: MRB) => {
    try {
      const submitData = {
        ...data,
        tasks,
        notes,
        attachments: uploadedAttachments,
        linkedNCRs: Object.entries(selectedNCRs).map(([id, { notes }]) => ({
          ncrId: id,
          dispositionNotes: notes
        }))
      };

      const url = isEditing
        ? `/api/manufacturing/quality/mrb/${data.id}`
        : '/api/manufacturing/quality/mrb';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to save MRB');
      }

      const savedMRB = await response.json();
      onSuccess(savedMRB);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving MRB:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create New"} Material Review Board</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="ncrs">NCRs</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-1 mt-4">
                <TabsContent value="ncrs" className="mt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <p>Loading NCRs...</p>
                    </div>
                  ) : pendingNCRs.length === 0 ? (
                    <div className="flex items-center justify-center p-4">
                      <p>No pending NCRs found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {pendingNCRs.map((ncr) => (
                        <Card key={ncr.id} className={cn(
                          "border-2 relative",
                          ncr.assignedToMrb ? "opacity-50 cursor-not-allowed border-muted" :
                            selectedNCRs[ncr.id] ? "border-primary" : "border-border hover:border-border/80"
                        )}>
                          {ncr.assignedToMrb && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                              <div className="transform -rotate-45 text-gray-400 text-xl font-bold whitespace-nowrap px-6 py-3 bg-background/90 shadow-sm border rounded">
                                Already in MRB {ncr.assignedToMrb.number}
                              </div>
                            </div>
                          )}
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={!!selectedNCRs[ncr.id]}
                                  onCheckedChange={() => toggleNCRSelection(ncr)}
                                  disabled={!!ncr.assignedToMrb}
                                  className={ncr.assignedToMrb ? "cursor-not-allowed" : ""}
                                />
                                <div className={ncr.assignedToMrb ? "pointer-events-none" : ""}>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{ncr.title}</h4>
                                    <Badge>{ncr.number}</Badge>
                                    <Badge variant={ncr.severity === "critical" ? "destructive" : "secondary"}>
                                      {ncr.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{ncr.description}</p>
                                  <p className="text-sm text-muted-foreground mt-1">Area: {ncr.area}</p>
                                  {ncr.containmentActions && ncr.containmentActions.length > 0 && (
                                    <div className="mt-2">
                                      <h5 className="text-sm font-medium">Containment Actions:</h5>
                                      <ul className="list-disc list-inside">
                                        {ncr.containmentActions.map((action, idx) => (
                                          <li key={idx} className="text-sm text-muted-foreground">
                                            {action.action} - Assigned to: {action.assignedTo}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {selectedNCRs[ncr.id] && (
                              <div className="mt-4">
                                <FormItem>
                                  <FormLabel>Initial Notes</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      value={selectedNCRs[ncr.id].notes}
                                      onChange={(e) => updateNCRNotes(ncr.id, e.target.value)}
                                      placeholder="Add any initial notes for this NCR..."
                                    />
                                  </FormControl>
                                </FormItem>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTask}
                      className="w-full"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                    {tasks.map((task, index) => (
                      <Card key={task.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Task {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                value={task.title}
                                onChange={(e) => updateTask(index, { title: e.target.value })}
                                placeholder="Task title"
                              />
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                value={task.description}
                                onChange={(e) => updateTask(index, { description: e.target.value })}
                                placeholder="Task description"
                              />
                            </FormControl>
                          </FormItem>
                          <div className="grid grid-cols-3 gap-4">
                            <FormItem>
                              <FormLabel>Assigned To</FormLabel>
                              <FormControl>
                                <Input
                                  value={task.assignedTo}
                                  onChange={(e) => updateTask(index, { assignedTo: e.target.value })}
                                  placeholder="Assignee"
                                />
                              </FormControl>
                            </FormItem>
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select
                                value={task.priority}
                                onValueChange={(value) => updateTask(index, { priority: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !task.dueDate && "text-muted-foreground"
                                      )}
                                    >
                                      {task.dueDate ? (
                                        format(new Date(task.dueDate), "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                    onSelect={(date) =>
                                      updateTask(index, {
                                        dueDate: date ? date.toISOString() : task.dueDate,
                                      })
                                    }
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addNote}
                      className="w-full"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                    {notes.map((note, index) => (
                      <Card key={note.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Note {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNote(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                value={note.title}
                                onChange={(e) => updateNote(index, { title: e.target.value })}
                                placeholder="Note title"
                              />
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                value={note.content}
                                onChange={(e) => updateNote(index, { content: e.target.value })}
                                placeholder="Note content"
                              />
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              value={note.category}
                              onValueChange={(value) => updateNote(index, { category: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="quality">Quality</SelectItem>
                                <SelectItem value="disposition">Disposition</SelectItem>
                                <SelectItem value="engineering">Engineering</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="collaborators" className="mt-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <FormItem>
                            <FormLabel>User ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter user ID" />
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reviewer">Reviewer</SelectItem>
                                <SelectItem value="approver">Approver</SelectItem>
                                <SelectItem value="contributor">Contributor</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                          <Button type="button" className="self-end">
                            Add Collaborator
                          </Button>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Current Collaborators</h4>
                          {form.getValues().collaborators?.map((collaborator) => (
                            <div key={collaborator.userId} className="flex items-center justify-between py-2">
                              <div>
                                <span className="font-medium">{collaborator.userId}</span>
                                <Badge className="ml-2">{collaborator.role}</Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCollaborator(collaborator.userId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="attachments" className="mt-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                          <Label htmlFor="mrb-attachments">Upload Files</Label>
                          <Input
                            id="mrb-attachments"
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />
                        </div>

                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Uploaded Attachments</h4>
                          <div className="space-y-2">
                            {uploadedAttachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center justify-between py-2 px-3 border rounded-md">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{attachment.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({Math.round(attachment.size / 1024)}KB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setUploadedAttachments(uploadedAttachments.filter(a => a.id !== attachment.id));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={Object.keys(selectedNCRs).length === 0}
              >
                {isEditing ? "Update" : "Create"} MRB
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}