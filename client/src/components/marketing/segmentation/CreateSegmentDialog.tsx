import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface CreateSegmentForm {
  name: string;
  description: string;
  criteria: {
    type: string;
    condition: string;
    value: string;
  }[];
}

const defaultForm: CreateSegmentForm = {
  name: "",
  description: "",
  criteria: [{
    type: "demographic",
    condition: "equals",
    value: "",
  }],
};

export function CreateSegmentDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateSegmentForm>(defaultForm);
  const { toast } = useToast();

  const createSegment = useMutation({
    mutationFn: async (data: CreateSegmentForm) => {
      const response = await fetch('/api/marketing/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create segment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Segment Created",
        description: "Your new customer segment has been created successfully.",
      });
      setOpen(false);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast({
        title: "Error Creating Segment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCriteria = () => {
    setForm(prev => ({
      ...prev,
      criteria: [...prev.criteria, { type: "demographic", condition: "equals", value: "" }],
    }));
  };

  const updateCriteria = (index: number, field: keyof typeof form.criteria[0], value: string) => {
    setForm(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const removeCriteria = (index: number) => {
    setForm(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          Create Segment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Customer Segment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Segment Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., High-Value Customers"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your segment..."
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Segment Criteria</Label>
              <Button variant="ghost" size="sm" onClick={addCriteria} className="h-8">
                Add Criteria
              </Button>
            </div>
            {form.criteria.map((criterion, index) => (
              <div key={index} className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={criterion.type}
                    onValueChange={(value) => updateCriteria(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demographic">Demographic</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={criterion.condition}
                    onValueChange={(value) => updateCriteria(index, 'condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={criterion.value}
                    onChange={(e) => updateCriteria(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriteria(index)}
                      className="h-8 w-8"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => createSegment.mutate(form)}
            disabled={createSegment.isPending}
          >
            {createSegment.isPending ? "Creating..." : "Create Segment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
