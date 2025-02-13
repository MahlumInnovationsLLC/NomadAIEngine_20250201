import React from 'react';
import { Button } from '@/components/ui/button';
import { AdvancedImportDialog } from './dialogs/AdvancedImportDialog';

export function AdvancedImportButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button 
        variant="outline"
        onClick={() => setOpen(true)}
        className="mr-2"
      >
        Advanced Import
      </Button>
      <AdvancedImportDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
