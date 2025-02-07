import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import FileUpload from "@/components/document/FileUpload";
import { FileExplorer } from "@/components/document/FileExplorer";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingProgress } from "@/components/training/TrainingProgress";

export default function DocumentExplorer() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { isLoading, data: stats } = useQuery({ 
    queryKey: ['/api/documents/list'],
  });

  const { data: trainingModules } = useQuery({ 
    queryKey: ['/api/training/modules'],
  });

  if (isLoading) {
    return (
      <div>
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6">
          <div className="px-4 text-left">
            <h1 className="text-3xl font-bold mb-1">Document Training & Control</h1>
            <p className="text-muted-foreground mb-4">
              Browse and manage documents with advanced training and workflow control.
            </p>
          </div>
        </div>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6">
          <div className="px-4 text-left">
            <h1 className="text-3xl font-bold mb-1">Document Training & Control</h1>
            <p className="text-muted-foreground mb-4">
              Browse and manage documents with advanced training and workflow control.
            </p>
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="file-lines" className="h-5 w-5" />
                  Document Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <FontAwesomeIcon icon="upload" className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
                <FileExplorer />
                {showUploadDialog && (
                  <FileUpload
                    onUpload={async () => {
                      setShowUploadDialog(false);
                    }}
                    onClose={() => setShowUploadDialog(false)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="graduation-cap" className="h-5 w-5" />
                  Training Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainingModules ? (
                  <TrainingProgress modules={trainingModules} />
                ) : (
                  <p className="text-muted-foreground">No training modules available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}