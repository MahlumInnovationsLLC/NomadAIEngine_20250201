import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MRB, MRBSchema } from "@/types/manufacturing/mrb";
import { useQuery } from "@tanstack/react-query";

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
}

export function MRBDialog({ open, onOpenChange, initialData, onSuccess }: MRBDialogProps) {
  const [activeTab, setActiveTab] = useState("ncrs");
  const [selectedNCRs, setSelectedNCRs] = useState<{[key: string]: { ncr: PendingNCR, notes: string }}>({});
  const isEditing = !!initialData;

  const { data: pendingNCRs = [] } = useQuery<PendingNCR[]>({
    queryKey: ['/api/manufacturing/quality/ncrs', { status: 'pending_disposition' }],
    enabled: !isEditing,
  });

  const form = useForm<MRB>({
    resolver: zodResolver(MRBSchema),
    defaultValues: initialData || {
      id: crypto.randomUUID(),
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
      nonconformance: {
        description: "",
        detectedBy: "",
        detectedDate: new Date().toISOString(),
        defectType: "",
      },
      disposition: {
        decision: "use_as_is",
        justification: "",
        approvedBy: [],
      },
      attachments: [],
      history: [],
      createdBy: "current-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedNCRs: [] // Added linkedNCRs to defaultValues
    },
  });

  const toggleNCRSelection = (ncr: PendingNCR) => {
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
          <DialogTitle>
            {isEditing ? 'Edit MRB Record' : 'Create New MRB Record'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1">
            <ScrollArea className="flex-1 px-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="ncrs">Select NCRs</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="nonconformance">Nonconformance</TabsTrigger>
                  <TabsTrigger value="disposition">Disposition</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="costs">Cost Impact</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>

                <TabsContent value="ncrs" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4">
                    {pendingNCRs.map((ncr) => (
                      <Card key={ncr.id} className={`border-2 ${selectedNCRs[ncr.id] ? 'border-primary' : 'border-transparent'}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <Checkbox
                                checked={!!selectedNCRs[ncr.id]}
                                onCheckedChange={() => toggleNCRSelection(ncr)}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{ncr.title}</h4>
                                  <Badge>{ncr.number}</Badge>
                                  <Badge variant={ncr.severity === 'critical' ? 'destructive' : 'secondary'}>
                                    {ncr.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{ncr.description}</p>
                                <p className="text-sm text-muted-foreground mt-1">Area: {ncr.area}</p>
                              </div>
                            </div>
                          </div>
                          {selectedNCRs[ncr.id] && (
                            <div className="mt-4">
                              <FormItem>
                                <FormLabel>Disposition Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    value={selectedNCRs[ncr.id].notes}
                                    onChange={(e) => updateNCRNotes(ncr.id, e.target.value)}
                                    placeholder="Add notes specific to this NCR's disposition..."
                                  />
                                </FormControl>
                              </FormItem>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter MRB title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="partNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Part Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter part number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Add more form fields for basic details */}
                </TabsContent>

                <TabsContent value="nonconformance" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Nonconformance Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nonconformance.description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe the nonconformance"
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Add more nonconformance fields */}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="disposition" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Disposition Decision</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="disposition.decision"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Decision</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select disposition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="use_as_is">Use As Is</SelectItem>
                                <SelectItem value="rework">Rework</SelectItem>
                                <SelectItem value="repair">Repair</SelectItem>
                                <SelectItem value="return_to_supplier">Return to Supplier</SelectItem>
                                <SelectItem value="scrap">Scrap</SelectItem>
                                <SelectItem value="deviate">Deviate</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Add more disposition fields */}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  {/* Add actions content */}
                </TabsContent>
                <TabsContent value="costs" className="space-y-4 mt-4">
                  {/* Add costs content */}
                </TabsContent>
                <TabsContent value="attachments" className="space-y-4 mt-4">
                  {/* Add attachments content */}
                </TabsContent>
              </Tabs>
            </ScrollArea>

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
                disabled={!isEditing && Object.keys(selectedNCRs).length === 0}
              >
                {isEditing ? 'Update MRB' : 'Create MRB'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}