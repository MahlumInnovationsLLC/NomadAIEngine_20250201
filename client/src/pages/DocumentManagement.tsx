import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModuleSelector } from "@/components/layout/ModuleSelector";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocManage } from "./DocManage";
import { Tree, TreeNode } from "@/components/ui/tree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, Upload, RefreshCw, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface FileItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
}

export function DocumentManagement() {
  const [activeTab, setActiveTab] = useState("docmanagement");
  const [currentPath, setCurrentPath] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const location = useLocation();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

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
        setActiveTab("docmanagement");
      }
    }
  };

  const handleUploadClick = () => {
    console.log("Upload clicked");
  };

  return (
    <div className="container mx-auto">
      <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold mb-4">Document Training & Control</h1>
        <p className="text-muted-foreground mb-4">
          Manage, review, and approve documents with advanced training and workflow control.
        </p>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => navigate("/docmanage/docmanagement")}
              className={`px-6 py-2 text-sm font-medium border ${
                location.pathname.includes("docmanagement")
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-secondary"
              } rounded-l-lg focus:z-10 focus:outline-none`}
            >
              DocManagement
            </button>
            <button
              onClick={() => navigate("/docmanage/training")}
              className={`px-6 py-2 text-sm font-medium border-t border-b border-r ${
                location.pathname.includes("training")
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-secondary"
              } rounded-r-lg focus:z-10 focus:outline-none`}
            >
              Training Module
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="grid grid-cols-[30%_70%] gap-6">
          <Card className="h-[calc(100vh-16rem)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  DocExplorer
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
              <div className="border rounded-lg p-4 overflow-auto h-[calc(100vh-24rem)]">
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

          <div className="h-[calc(100vh-16rem)]">
            <DocManage documentId={selectedDocument} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentManagement;