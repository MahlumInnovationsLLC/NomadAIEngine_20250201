import React from 'react';
import { FileExplorer } from '@/components/document/FileExplorer';
import { SearchInterface } from '@/components/document/SearchInterface';

export default function DocumentExplorer() {
  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground">
          Browse and manage documents, configure training modules, and control document workflows.
        </p>
      </div>

      <div className="mb-8">
        <SearchInterface />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FileExplorer />
      </div>
    </div>
  );
}