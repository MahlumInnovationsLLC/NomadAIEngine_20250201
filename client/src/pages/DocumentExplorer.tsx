import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/document/FileUpload";
import { FileExplorer } from "@/components/document/FileExplorer";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSkeleton, SkeletonCard } from "@/components/ui/skeleton-loader";
import { motion, AnimatePresence } from "framer-motion";

export default function DocumentExplorer() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { isLoading } = useQuery({ 
    queryKey: ['/api/documents/list'],
  });

  if (isLoading) {
    return (
      <div>
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6">
          <div className="px-4">
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
          <div className="px-4">
            <h1 className="text-3xl font-bold mb-1">Document Training & Control</h1>
            <p className="text-muted-foreground mb-4">
              Browse and manage documents with advanced training and workflow control.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Explorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}