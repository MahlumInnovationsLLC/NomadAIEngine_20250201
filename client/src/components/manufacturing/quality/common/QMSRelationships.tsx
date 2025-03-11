import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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

interface QMSItem {
  id: string;
  number: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  createdBy?: string;
  [key: string]: any;
}

export interface QMSRelation {
  id: string;
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationshipType: 'parent-child' | 'reference' | 'created-from' | 'linked';
  createdAt: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

interface QMSRelationshipsProps {
  // Current item
  currentItem: QMSItem;
  
  // Related items and relations
  relations: QMSRelation[];
  relatedItems: QMSItem[];
  
  // Available item types
  availableTypes: Array<{
    type: string;
    label: string;
    icon?: string;
    relationLabel?: string;
  }>;
  
  // Handlers
  onCreateRelatedItem: (sourceItem: QMSItem, targetType: string) => void;
  onLinkExistingItem: (sourceItem: QMSItem, targetItem: QMSItem, relationType: string) => Promise<void>;
  onRemoveRelation: (relation: QMSRelation) => Promise<void>;
  onViewRelatedItem: (item: QMSItem) => void;
  
  // Optional props
  title?: string;
  statusColors?: Record<string, string>;
}

export function QMSRelationships({
  currentItem,
  relations,
  relatedItems,
  availableTypes,
  onCreateRelatedItem,
  onLinkExistingItem,
  onRemoveRelation,
  onViewRelatedItem,
  title = "Related Items",
  statusColors = {},
}: QMSRelationshipsProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<QMSRelation | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const handleCreateRelatedItem = (type: string) => {
    setShowCreateDialog(false);
    onCreateRelatedItem(currentItem, type);
  };
  
  const handleRemoveRelation = async () => {
    if (!selectedRelation) return;
    
    try {
      setIsProcessing(true);
      await onRemoveRelation(selectedRelation);
      toast({
        title: "Relationship Removed",
        description: "The relationship has been successfully removed.",
      });
    } catch (error) {
      console.error("Error removing relation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove relationship",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmRemove(false);
      setSelectedRelation(null);
    }
  };

  // Group related items by type
  const groupedItems: Record<string, QMSItem[]> = {};
  
  relatedItems.forEach(item => {
    if (!groupedItems[item.type]) {
      groupedItems[item.type] = [];
    }
    groupedItems[item.type].push(item);
  });

  const getRelationshipLabel = (relation: QMSRelation) => {
    const { relationshipType, sourceId, targetId, sourceType, targetType } = relation;
    
    // Check if this item is the source or target
    const isSource = sourceId === currentItem.id;
    const relatedType = isSource ? targetType : sourceType;
    
    // Find the type info
    const typeInfo = availableTypes.find(t => t.type === relatedType);
    
    switch (relationshipType) {
      case 'parent-child':
        return isSource ? `Parent of ${typeInfo?.label || relatedType}` : `Child of ${typeInfo?.label || relatedType}`;
      case 'created-from':
        return isSource ? `Created from ${typeInfo?.label || relatedType}` : `Used to create ${typeInfo?.label || relatedType}`;
      case 'reference':
        return `Referenced by ${typeInfo?.label || relatedType}`;
      case 'linked':
        return `Linked to ${typeInfo?.label || relatedType}`;
      default:
        return `Related to ${typeInfo?.label || relatedType}`;
    }
  };

  const getRelationIcon = (relation: QMSRelation) => {
    const { relationshipType } = relation;
    
    switch (relationshipType) {
      case 'parent-child':
        return 'sitemap';
      case 'created-from':
        return 'code-branch';
      case 'reference':
        return 'link';
      case 'linked':
        return 'link-simple';
      default:
        return 'arrow-right-arrow-left';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status] || "default";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = availableTypes.find(t => t.type === type);
    return typeInfo?.icon || 'file';
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{title}</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <FontAwesomeIcon icon="link" className="mr-2 h-4 w-4" />
            Create Relationship
          </Button>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedItems).length > 0 ? (
            <Tabs defaultValue={Object.keys(groupedItems)[0]} className="space-y-4">
              <TabsList>
                {Object.keys(groupedItems).map(type => {
                  const typeInfo = availableTypes.find(t => t.type === type);
                  const count = groupedItems[type].length;
                  
                  return (
                    <TabsTrigger key={type} value={type}>
                      {typeInfo?.label || type}
                      <Badge className="ml-2 h-5 px-1.5 bg-primary/15 hover:bg-primary/20">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {Object.entries(groupedItems).map(([type, items]) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {items.map(item => {
                    const relation = relations.find(r => 
                      (r.sourceId === currentItem.id && r.targetId === item.id) ||
                      (r.targetId === currentItem.id && r.sourceId === item.id)
                    );
                    
                    return (
                      <div 
                        key={item.id} 
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onViewRelatedItem(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-muted rounded-full">
                              <FontAwesomeIcon icon={getTypeIcon(item.type)} className="h-4 w-4 text-primary/70" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.number}</h4>
                                <Badge variant={getStatusBadgeVariant(item.status)}>
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="text-sm">{item.title}</p>
                              {relation && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <FontAwesomeIcon icon={getRelationIcon(relation)} className="h-3 w-3 mr-1" />
                                  {getRelationshipLabel(relation)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRelation(relation || null);
                                setShowConfirmRemove(true);
                              }}
                            >
                              <FontAwesomeIcon icon="xmark" className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>Created: {formatDate(item.createdAt)}</span>
                          {item.createdBy && <span>By: {item.createdBy}</span>}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FontAwesomeIcon icon="diagram-project" className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium mb-1">No related items</p>
              <p className="text-sm mb-4">Create relationships to other quality items</p>
              <Button 
                variant="outline"
                onClick={() => setShowCreateDialog(true)}
              >
                <FontAwesomeIcon icon="link" className="mr-2 h-4 w-4" />
                Create Relationship
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Relationship Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Relationship</DialogTitle>
            <DialogDescription>
              Create a new item or link to an existing one
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Create New Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create a new item linked to this {currentItem.type}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {availableTypes.map(typeInfo => (
                      <Button
                        key={typeInfo.type}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleCreateRelatedItem(typeInfo.type)}
                      >
                        <FontAwesomeIcon 
                          icon={typeInfo.icon || 'file'} 
                          className="mr-2 h-4 w-4" 
                        />
                        {typeInfo.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Link Existing Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Link this {currentItem.type} to an existing item
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {availableTypes.map(typeInfo => (
                      <Button
                        key={typeInfo.type}
                        variant="outline"
                        className="justify-start"
                        onClick={() => {
                          setSelectedType(typeInfo.type);
                          // Here you would show a dialog to search for existing items
                          // and then call onLinkExistingItem
                        }}
                      >
                        <FontAwesomeIcon 
                          icon="link" 
                          className="mr-2 h-4 w-4" 
                        />
                        Link {typeInfo.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Relationship Dialog */}
      {selectedRelation && (
        <AlertDialog open={showConfirmRemove} onOpenChange={setShowConfirmRemove}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Relationship</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this relationship? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRemoveRelation}
                disabled={isProcessing}
                className="bg-destructive"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background mr-2"></div>
                ) : (
                  <FontAwesomeIcon icon="trash" className="mr-2 h-4 w-4" />
                )}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}