import { Tree, TreeNode } from "@/components/ui/tree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Folder, File, Upload, RefreshCw, FileText, Trophy } from "lucide-react";
import { useState } from "react";
import { DocumentConfig } from "@/components/document/DocumentConfig";
import { ModuleSelector } from "@/components/layout/ModuleSelector";

interface FileItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
}

export function DocumentManagement() {
  const [activeModule, setActiveModule] = useState("documents");
  const [currentPath, setCurrentPath] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);

  const { data: files = [], isLoading, refetch } = useQuery<FileItem[]>({
    queryKey: [`/api/documents/browse?path=${currentPath}`],
  });

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
    } else {
      const documentId = parseInt(file.path.split('/').pop()?.split('.')[0] || '0');
      if (documentId > 0) {
        setSelectedDocument(documentId);
        setActiveModule("docmanagement");
      }
    }
  };

  const handleUploadClick = () => {
    // TODO: Implement file upload dialog
    console.log("Upload clicked");
  };

  const renderContent = () => {
    switch (activeModule) {
      case "documents":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Document Explorer
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={handleUploadClick}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Input
                  placeholder="Search documents..."
                  className="max-w-sm"
                />
              </div>
              <div className="border rounded-lg p-4">
                <Tree>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="ml-2">Loading files...</span>
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
                  {!isLoading && files.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No files found in this location.</p>
                      <p className="text-sm">Upload a document or select another folder.</p>
                    </div>
                  )}
                </Tree>
              </div>
            </CardContent>
          </Card>
        );
      case "docmanagement":
        return selectedDocument && <DocumentConfig documentId={selectedDocument} />;
      case "training":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-6 text-center">
                  <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Document Management Specialist</h3>
                  <p className="text-muted-foreground">Level 3 Certification</p>
                </div>
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">Recent Achievements</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm">
                          <span className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                          Completed Advanced Workflow Training
                        </li>
                        <li className="flex items-center text-sm">
                          <span className="w-4 h-4 rounded-full bg-blue-500 mr-2" />
                          Reviewed 50+ Documents
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground">
          Manage, review, and approve documents with version control and workflow management.
        </p>
      </div>

      <div className="grid grid-cols-[240px,1fr] gap-6">
        <ModuleSelector
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />
        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default DocumentManagement;