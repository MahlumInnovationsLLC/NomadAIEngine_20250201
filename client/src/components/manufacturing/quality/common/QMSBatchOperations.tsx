import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface QMSBatchOperationsProps<T extends { id: string }> {
  items: T[];
  selectedItems: string[]; // IDs of selected items
  onSelectItem: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  batchActions: {
    id: string;
    label: string;
    icon: string;
    action: (ids: string[], data?: any) => Promise<void>;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
    formSchema?: z.ZodSchema<any>;
    renderForm?: (form: any) => React.ReactNode;
    statusTransition?: {
      from: string[];
      to: string;
    };
  }[];
  itemRenderer: (item: T, isSelected: boolean, onSelect: (selected: boolean) => void) => React.ReactNode;
}

export function QMSBatchOperations<T extends { id: string }>({
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  batchActions,
  itemRenderer,
}: QMSBatchOperationsProps<T>) {
  const { toast } = useToast();
  const [actionInProgress, setActionInProgress] = useState(false);
  const [currentAction, setCurrentAction] = useState<typeof batchActions[0] | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);

  const form = useForm({
    resolver: currentAction?.formSchema ? zodResolver(currentAction.formSchema) : undefined,
    defaultValues: {},
  });

  const handleBatchAction = async (actionId: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to perform this action.",
        variant: "destructive",
      });
      return;
    }

    const action = batchActions.find(a => a.id === actionId);
    if (!action) return;

    setCurrentAction(action);

    if (action.requiresConfirmation) {
      setShowConfirmDialog(true);
    } else if (action.formSchema) {
      setShowActionDialog(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: typeof batchActions[0], data?: any) => {
    setActionInProgress(true);
    try {
      await action.action(selectedItems, data);
      toast({
        title: "Success",
        description: `Action "${action.label}" completed successfully on ${selectedItems.length} item(s).`,
      });
      // Reset selected items after successful action
      onSelectAll(false);
    } catch (error) {
      console.error(`Error executing batch action ${action.id}:`, error);
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(false);
      setShowConfirmDialog(false);
      setShowActionDialog(false);
      setCurrentAction(null);
    }
  };

  const handleSubmitForm = async (data: any) => {
    if (currentAction) {
      await executeAction(currentAction, data);
    }
  };

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedItems.length > 0 && selectedItems.length === items.length}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                />
                <Label htmlFor="select-all">
                  {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                </Label>
              </div>
              <div className="flex gap-2">
                {batchActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    disabled={actionInProgress}
                    onClick={() => handleBatchAction(action.id)}
                  >
                    <FontAwesomeIcon icon={action.icon} className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAll(false)}
                  disabled={actionInProgress}
                >
                  <FontAwesomeIcon icon="xmark" className="mr-2 h-4 w-4" />
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center mb-4">
        <Checkbox
          id="select-all-items"
          checked={selectedItems.length > 0 && selectedItems.length === items.length}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        <Label htmlFor="select-all-items" className="ml-2">
          Select All
        </Label>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            {itemRenderer(
              item,
              selectedItems.includes(item.id),
              (selected) => onSelectItem(item.id, selected)
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {currentAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {currentAction?.confirmationMessage || 
                `Are you sure you want to ${currentAction?.label.toLowerCase()} the selected ${selectedItems.length} item(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionInProgress}
              onClick={(e) => {
                e.preventDefault();
                if (currentAction) {
                  executeAction(currentAction);
                }
              }}
            >
              {actionInProgress ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Action Form Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentAction?.label}</DialogTitle>
            <DialogDescription>
              Apply this action to {selectedItems.length} selected item(s)
            </DialogDescription>
          </DialogHeader>

          {currentAction?.formSchema && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
                {currentAction.renderForm ? (
                  currentAction.renderForm(form)
                ) : (
                  <div className="space-y-4">
                    {/* Default form fields if no custom render function provided */}
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a comment about this action"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowActionDialog(false)}
                    disabled={actionInProgress}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionInProgress}>
                    {actionInProgress ? "Processing..." : "Apply"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}