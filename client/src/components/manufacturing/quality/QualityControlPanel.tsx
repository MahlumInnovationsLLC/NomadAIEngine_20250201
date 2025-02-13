import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedImportButton } from './AdvancedImportButton';

export function QualityControlPanel() {
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [createInspectionDialogOpen, setCreateInspectionDialogOpen] = React.useState(false);

  const ActionButtons = () => (
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Final Quality Control</h2>
        <ActionButtons />
      </div>

      <Tabs defaultValue="in-process" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="in-process">In-Process</TabsTrigger>
          <TabsTrigger value="final">Final QC</TabsTrigger>
          <TabsTrigger value="executive">Executive Review</TabsTrigger>
          <TabsTrigger value="pdi">PDI</TabsTrigger>
        </TabsList>

        <TabsContent value="in-process" className="mt-4">
          <div className="space-y-4">
            {/* In-Process content */}
          </div>
        </TabsContent>

        <TabsContent value="final" className="mt-4">
          <div className="space-y-4">
            {/* Final QC content */}
          </div>
        </TabsContent>

        <TabsContent value="executive" className="mt-4">
          <div className="space-y-4">
            {/* Executive Review content */}
          </div>
        </TabsContent>

        <TabsContent value="pdi" className="mt-4">
          <div className="space-y-4">
            {/* PDI content */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}