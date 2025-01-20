import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, GraduationCap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

export default function DocManage() {
  const [, navigate] = useLocation();

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Document Training & Control</h1>
          <p className="text-muted-foreground mb-4">
            Manage your documents and track training progress in one centralized platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="group hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
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
                onClick={() => navigate("/docmanage/docmanagement")}
              >
                Go to Document Management
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Track your training progress, complete modules, and earn certifications.
                Stay up-to-date with your learning journey.
              </p>
              <Button 
                className="w-full flex items-center justify-between"
                onClick={() => navigate("/docmanage/training")}
              >
                Go to Training Progress
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimateTransition>
  );
}