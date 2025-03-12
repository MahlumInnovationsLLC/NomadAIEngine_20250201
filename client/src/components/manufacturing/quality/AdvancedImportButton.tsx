import React from 'react';
import { AdvancedImportDialog } from './dialogs/AdvancedImportDialog';

// Component modified to only maintain dialog functionality without visible button
export function AdvancedImportButton() {
  // Create a hidden/disabled version that doesn't show in the UI
  // but preserves all backend functionality for future use
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Dialog component is preserved for backend functionality */}
      <AdvancedImportDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}