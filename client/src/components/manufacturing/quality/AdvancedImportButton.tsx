import React from 'react';
import { AdvancedImportDialog } from './dialogs/AdvancedImportDialog';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@/components/ui/font-awesome-icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdvancedImportButtonProps {
  inspectionType?: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
}

export function AdvancedImportButton({ inspectionType }: AdvancedImportButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2" 
              onClick={() => setOpen(true)}
            >
              <FontAwesomeIcon icon="file-import" className="mr-2 h-4 w-4" />
              OCR Scan
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Scan PDFs and images for quality issues using AI-powered OCR</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AdvancedImportDialog
        open={open}
        onOpenChange={setOpen}
        inspectionType={inspectionType}
      />
    </>
  );
}