import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedImportButton } from './AdvancedImportButton';

export function QualityControlPanel() {
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [createInspectionDialogOpen, setCreateInspectionDialogOpen] = React.useState(false);

  // Separate ActionButtons into its own component for reusability
  const ActionButtons = React.memo(() => {
    console.log('Rendering ActionButtons component'); // Debug log
    return (
      <div className="flex items-center space-x-2">
        <AdvancedImportButton />
        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
          Import
        </Button>
        <Button onClick={() => setCreateInspectionDialogOpen(true)}>
          New Inspection
        </Button>
      </div>
    );
  });

  const TabHeader = React.memo(({ title }: { title: string }) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium">{title}</h3>
      <ActionButtons />
    </div>
  ));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quality Control</h2>
      </div>

      <Tabs defaultValue="in-process" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="in-process">In-Process</TabsTrigger>
          <TabsTrigger value="final">Final QC</TabsTrigger>
          <TabsTrigger value="executive">Executive Review</TabsTrigger>
          <TabsTrigger value="pdi">PDI</TabsTrigger>
        </TabsList>

        <TabsContent value="in-process">
          <TabHeader title="In-Process Quality Control" />
          {/* Content */}
        </TabsContent>

        <TabsContent value="final">
          <TabHeader title="Final Quality Control" />
          {/* Content */}
        </TabsContent>

        <TabsContent value="executive">
          <TabHeader title="Executive Review" />
          {/* Content */}
        </TabsContent>

        <TabsContent value="pdi">
          <TabHeader title="Pre-Delivery Inspection" />
          {/* Content */}
        </TabsContent>
      </Tabs>
    </div>
  );
}