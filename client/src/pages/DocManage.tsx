import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingProgress } from "@/components/training/TrainingProgress";
import { useQuery } from "@tanstack/react-query";

interface DocumentStats {
  totalDocuments: number;
  pendingReviews: number;
  activeTrainings: number;
  documentUpdates: number;
}

export default function DocManage() {
  const [, navigate] = useLocation();
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

          <Tabs defaultValue="documents" className="w-full mt-6">
            <TabsList className="w-full justify-start border-b rounded-none pb-px">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="px-4 py-6">
          <TabsContent value="documents" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="file-lines" className="h-5 w-5" />
                  Document Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Access and manage your documents with our advanced document control system. 
                  Upload, edit, and organize your files efficiently.
                </p>
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/documentcontrol")}
                >
                  Go to Document Management
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="folder-tree" className="h-5 w-5" />
                  Document Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Browse and explore your document repository. Search, filter, and access 
                  documents quickly and efficiently.
                </p>
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/documentexplorer")}
                >
                  Go to Document Explorer
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="graduation-cap" className="h-5 w-5" />
                  Training Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Access and complete training modules. Track your progress and stay
                  up-to-date with required training materials.
                </p>
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/training")}
                >
                  View Training Modules
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="certificate" className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  View and manage your earned certifications. Track your learning achievements
                  and professional development.
                </p>
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/certifications")}
                >
                  View Certifications
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </div>
    </AnimateTransition>
  );
}