import React from 'react';
import { Button } from '@/components/ui/button';
import { AdvancedImportDialog } from './dialogs/AdvancedImportDialog';
import { FileUp } from 'lucide-react';

export function AdvancedImportButton() {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    console.log('Advanced Import button clicked');
    setOpen(true);
  };

  return (
    <>
      <Button 
        variant="outline"
        onClick={handleClick}
        className="mr-2 gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
      >
        <FileUp className="w-4 h-4" />
        Advanced Import
      </Button>
      <AdvancedImportDialog
        open={open}
        onOpenChange={(isOpen) => {
          console.log('Dialog state changed:', isOpen);
          setOpen(isOpen);
        }}
      />
    </>
  );
}