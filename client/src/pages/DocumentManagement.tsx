import { useState } from "react";
import { Tree, TreeNode } from "@/components/ui/tree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Folder, File, Upload, RefreshCw, FileText } from "lucide-react";
import { DocumentConfig } from "@/components/document/DocumentConfig";
import { ModuleSelector } from "@/components/layout/ModuleSelector";

interface FileItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
}

export default function DocumentManagement() {
  const [activeModule, setActiveModule] = useState("docmanagement");
  const [currentPath, setCurrentPath] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);

  const { data: files = [], isLoading, refetch } = useQuery<FileItem[]>({
    queryKey: ['/api/documents/browse', currentPath],
  });

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
    } else {
      const documentId = parseInt(file.path.split('/').pop()?.split('.')[0] || '0');
      if (documentId > 0) {
        setSelectedDocument(documentId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container">
          <div className="flex h-16 items-center justify-between px-4">
            <div>
              <h1 className="text-2xl font-bold">Document Training & Control</h1>
              <p className="text-sm text-muted-foreground">
                Browse and manage documents with advanced training and workflow control.
              </p>
            </div>
            <ModuleSelector
              activeModule={activeModule}
              onModuleChange={setActiveModule}
            />
          </div>
        </div>
      </header>

      <main className="container py-4">
        <div className="grid grid-cols-[30%_1fr] gap-6">
          <div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Explorer
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button size="sm" onClick={() => console.log("Upload clicked")}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Search documents..."
                    className="w-full"
                  />
                  <div className="border rounded-lg p-4 h-[calc(100vh-16rem)] overflow-y-auto">
                    <Tree>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span className="ml-2">Loading files...</span>
                        </div>
                      ) : files.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No files found in this location.</p>
                          <p className="text-sm">Upload a document or select another folder.</p>
                        </div>
                      ) : (
                        files.map((item) => (
                          <TreeNode
                            key={item.path}
                            id={item.path}
                            label={item.name}
                            icon={item.type === 'folder' ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />}
                            onClick={() => handleFileClick(item)}
                          />
                        ))
                      )}
                    </Tree>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {selectedDocument ? (
              <Card>
                <DocumentConfig documentId={selectedDocument} />
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a document to view details
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}