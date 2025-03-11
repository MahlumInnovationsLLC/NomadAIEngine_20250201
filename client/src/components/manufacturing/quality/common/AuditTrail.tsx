import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  itemId: string;
  itemType: string;
  details: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    comments?: string;
    reason?: string;
    fields?: string[];
  };
  metadata?: Record<string, any>;
}

interface AuditTrailProps {
  entries: AuditEntry[];
  itemId: string;
  itemType: string;
  statusColors?: Record<string, string>;
  title?: string;
}

export function AuditTrail({
  entries,
  itemId,
  itemType,
  statusColors = {},
  title = "Audit Trail"
}: AuditTrailProps) {
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "status-changes" | "edits" | "comments">("all");

  const filteredEntries = entries.filter(entry => {
    if (activeTab === "all") return true;
    if (activeTab === "status-changes") return entry.action.includes("status") || entry.action.includes("state");
    if (activeTab === "edits") return entry.action.includes("edit") || entry.action.includes("update");
    if (activeTab === "comments") return entry.action.includes("comment") || (entry.details.comments && entry.details.comments.length > 0);
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    if (action.includes("create")) return "plus-circle";
    if (action.includes("edit") || action.includes("update")) return "pen";
    if (action.includes("delete")) return "trash";
    if (action.includes("status") || action.includes("state")) return "arrow-right";
    if (action.includes("comment")) return "comment";
    if (action.includes("approve")) return "check-circle";
    if (action.includes("reject")) return "x-circle";
    if (action.includes("upload")) return "upload";
    if (action.includes("download")) return "download";
    if (action.includes("view")) return "eye";
    return "history";
  };

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "text-green-500";
    if (action.includes("edit") || action.includes("update")) return "text-blue-500";
    if (action.includes("delete")) return "text-red-500";
    if (action.includes("status") || action.includes("state")) return "text-amber-500";
    if (action.includes("approve")) return "text-green-500";
    if (action.includes("reject")) return "text-red-500";
    return "text-gray-500";
  };

  const getActionDescription = (entry: AuditEntry) => {
    const { action, details, userName } = entry;
    
    if (action.includes("create")) {
      return `${userName} created this ${itemType}`;
    }
    
    if (action.includes("status") || action.includes("state")) {
      const fromStatus = details.before?.status || details.before?.state;
      const toStatus = details.after?.status || details.after?.state;
      
      if (fromStatus && toStatus) {
        return `${userName} changed status from "${fromStatus}" to "${toStatus}"`;
      }
      return `${userName} updated status to "${toStatus}"`;
    }
    
    if (action.includes("edit") || action.includes("update")) {
      const fieldCount = details.fields?.length || 0;
      if (fieldCount > 0) {
        const fieldList = details.fields?.join(", ");
        return `${userName} edited ${fieldCount} field${fieldCount !== 1 ? 's' : ''}: ${fieldList}`;
      }
      return `${userName} updated this ${itemType}`;
    }
    
    if (action.includes("comment")) {
      return `${userName} added a comment`;
    }
    
    if (action.includes("approve")) {
      return `${userName} approved this ${itemType}`;
    }
    
    if (action.includes("reject")) {
      return `${userName} rejected this ${itemType}`;
    }
    
    return `${userName} performed action: ${action}`;
  };

  const getStatusBadge = (status: string) => {
    const variant = statusColors[status] || "default";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getFieldChangeDisplay = (field: string, before: any, after: any) => {
    // Handle different data types appropriately
    if (field === "status" || field === "state") {
      return (
        <div className="flex items-center space-x-2">
          {getStatusBadge(before || "none")}
          <FontAwesomeIcon icon="arrow-right" className="h-3 w-3" />
          {getStatusBadge(after || "none")}
        </div>
      );
    }
    
    // Handle dates
    if (field.toLowerCase().includes("date") && (before || after)) {
      const beforeDate = before ? formatDate(before) : "none";
      const afterDate = after ? formatDate(after) : "none";
      return (
        <div className="flex flex-col">
          <div className="text-muted-foreground line-through">{beforeDate}</div>
          <div>{afterDate}</div>
        </div>
      );
    }
    
    // Handle arrays by joining with commas or showing counts
    if (Array.isArray(before) || Array.isArray(after)) {
      const beforeCount = Array.isArray(before) ? before.length : 0;
      const afterCount = Array.isArray(after) ? after.length : 0;
      
      return (
        <div className="flex flex-col">
          <div className="text-muted-foreground line-through">
            {beforeCount} item{beforeCount !== 1 ? 's' : ''}
          </div>
          <div>
            {afterCount} item{afterCount !== 1 ? 's' : ''}
          </div>
        </div>
      );
    }
    
    // Default display for other types
    return (
      <div className="flex flex-col">
        <div className="text-muted-foreground line-through">
          {before !== undefined && before !== null ? String(before) : "none"}
        </div>
        <div>
          {after !== undefined && after !== null ? String(after) : "none"}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Activities</TabsTrigger>
              <TabsTrigger value="status-changes">Status Changes</TabsTrigger>
              <TabsTrigger value="edits">Edits</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[400px] pr-4">
              {filteredEntries.length > 0 ? (
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className={`mr-3 pt-1 ${getActionColor(entry.action)}`}>
                        <FontAwesomeIcon icon={getActionIcon(entry.action)} className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{getActionDescription(entry)}</p>
                          <p className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                        
                        {entry.details.comments && (
                          <div className="mt-1 text-sm border-l-2 pl-2 border-muted-foreground/30 italic">
                            {entry.details.comments}
                          </div>
                        )}
                        
                        {entry.details.reason && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            Reason: {entry.details.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <FontAwesomeIcon icon="history" className="h-10 w-10 mb-2" />
                  <p>No activity found</p>
                </div>
              )}
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedEntry.timestamp)}
                </span>
                <Badge className="capitalize">
                  {selectedEntry.action}
                </Badge>
              </div>
              
              <div className="flex items-start gap-3">
                <div className={`${getActionColor(selectedEntry.action)} p-2 rounded-full bg-muted`}>
                  <FontAwesomeIcon icon={getActionIcon(selectedEntry.action)} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{getActionDescription(selectedEntry)}</h3>
                  {selectedEntry.details.comments && (
                    <p className="mt-1 text-sm italic">
                      "{selectedEntry.details.comments}"
                    </p>
                  )}
                </div>
              </div>

              {selectedEntry.details.reason && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-1">Reason:</h4>
                  <p className="text-sm">{selectedEntry.details.reason}</p>
                </div>
              )}

              {(selectedEntry.details.before || selectedEntry.details.after) && (
                <div>
                  <Separator className="my-2" />
                  <h4 className="text-sm font-medium mb-2">Changes:</h4>
                  
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-3 bg-muted px-4 py-2 font-medium text-sm">
                      <div>Field</div>
                      <div>Before</div>
                      <div>After</div>
                    </div>
                    
                    <div className="divide-y">
                      {selectedEntry.details.fields?.map((field) => {
                        const before = selectedEntry.details.before?.[field];
                        const after = selectedEntry.details.after?.[field];
                        
                        if (before === after) return null;
                        
                        return (
                          <div key={field} className="grid grid-cols-3 px-4 py-2 text-sm">
                            <div className="font-medium">{field}</div>
                            <div className="text-muted-foreground">
                              {before !== undefined && before !== null ? 
                                (typeof before === 'object' ? JSON.stringify(before) : String(before)) : 
                                "—"}
                            </div>
                            <div>
                              {after !== undefined && after !== null ? 
                                (typeof after === 'object' ? JSON.stringify(after) : String(after)) : 
                                "—"}
                            </div>
                          </div>
                        );
                      })}
                      
                      {!selectedEntry.details.fields && selectedEntry.details.before && selectedEntry.details.after && (
                        Object.keys({ ...selectedEntry.details.before, ...selectedEntry.details.after }).map((field) => {
                          const before = selectedEntry.details.before?.[field];
                          const after = selectedEntry.details.after?.[field];
                          
                          if (before === after) return null;
                          
                          return (
                            <div key={field} className="grid grid-cols-3 px-4 py-2 text-sm">
                              <div className="font-medium">{field}</div>
                              <div className="text-muted-foreground">
                                {before !== undefined && before !== null ? 
                                  (typeof before === 'object' ? JSON.stringify(before) : String(before)) : 
                                  "—"}
                              </div>
                              <div>
                                {after !== undefined && after !== null ? 
                                  (typeof after === 'object' ? JSON.stringify(after) : String(after)) : 
                                  "—"}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}