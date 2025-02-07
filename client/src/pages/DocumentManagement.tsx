import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocManage } from "@/components/document/DocManage";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { useQuery } from "@tanstack/react-query";

interface DocumentStats {
  totalDocuments: number;
  pendingReviews: number;
  activeTrainings: number;
  documentUpdates: number;
}

export default function DocumentManagement() {
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);

  const { data: stats } = useQuery<DocumentStats>({
    queryKey: ['/api/documents/stats'],
    refetchInterval: 30000,
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Document Training & Control</h1>
          <p className="text-muted-foreground mb-4">
            Manage, review, and approve documents with advanced training and workflow control
          </p>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                    <h3 className="text-2xl font-bold">{stats?.totalDocuments || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="file-lines" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                    <h3 className="text-2xl font-bold">{stats?.pendingReviews || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="clock" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Trainings</p>
                    <h3 className="text-2xl font-bold">{stats?.activeTrainings || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="graduation-cap" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recent Updates</p>
                    <h3 className="text-2xl font-bold">{stats?.documentUpdates || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="refresh" className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="grid grid-cols-[30%_70%] gap-6">
            <Card className="h-[calc(100vh-16rem)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FontAwesomeIcon icon="file-lines" className="mr-2 h-5 w-5" />
                  DocExplorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileExplorer onSelectDocument={(id) => setSelectedDocument(Number(id))} />
              </CardContent>
            </Card>

            <div className="h-[calc(100vh-16rem)]">
              <DocManage documentId={selectedDocument} />
            </div>
          </div>
        </div>
      </div>
    </AnimateTransition>
  );
}