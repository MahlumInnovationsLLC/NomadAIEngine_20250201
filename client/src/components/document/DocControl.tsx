import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Shield, History, Eye, Lock, FileCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface DocumentVersion {
  id: number;
  version: string;
  status: 'draft' | 'review' | 'released';
  createdAt: string;
  createdBy: string;
}

interface DocumentPermission {
  role: string;
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
}

interface DocControlProps {
  documentId: number | null;
}

export function DocControl({ documentId }: DocControlProps) {
  const [isAdmin] = useState(true); // TODO: Replace with actual admin check
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const { data: versions } = useQuery<DocumentVersion[]>({
    queryKey: ['/api/documents/versions', documentId],
    enabled: !!documentId,
  });

  const { data: permissions } = useQuery<DocumentPermission[]>({
    queryKey: ['/api/documents/permissions', documentId],
    enabled: !!documentId && isAdmin,
  });

  if (!documentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCheck className="h-5 w-5 mr-2" />
            DocControl
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Select a document to view its controls
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileCheck className="h-5 w-5 mr-2" />
            DocControl
          </div>
          {isAdmin && (
            <Badge variant="secondary">Admin Access</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <History className="h-4 w-4 mr-2" />
              Version Control
            </h3>
            <div className="space-y-2">
              {versions?.slice(0, showVersionHistory ? undefined : 3).map((version) => (
                <div key={version.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Badge variant={
                      version.status === 'released' ? 'default' :
                        version.status === 'review' ? 'secondary' : 'outline'
                    }>
                      {version.status}
                    </Badge>
                    <span className="ml-2">{version.version}</span>
                  </div>
                  <span className="text-muted-foreground">{new Date(version.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {versions && versions.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                >
                  {showVersionHistory ? 'Show Less' : 'Show More'}
                </Button>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Permission Control
              </h3>
              <div className="space-y-4">
                {permissions?.map((permission) => (
                  <div key={permission.role} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{permission.role}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {permission.canView && <span className="flex items-center"><Eye className="h-3 w-3 mr-1" />View</span>}
                        {permission.canEdit && <span className="flex items-center"><Lock className="h-3 w-3 mr-1" />Edit</span>}
                        {permission.canApprove && <span className="flex items-center"><FileCheck className="h-3 w-3 mr-1" />Approve</span>}
                      </div>
                    </div>
                    <Switch
                      checked={permission.canView}
                      aria-label={`Toggle ${permission.role} access`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}