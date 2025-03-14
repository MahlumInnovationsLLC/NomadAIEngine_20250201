import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NCR, Attachment } from '@/types/manufacturing/ncr';
import { NCRDetailsDialog } from '../dialogs/NCRDetailsDialog';
import { NCRAttachmentGallery } from '../common/NCRAttachmentGallery';
import { EnhancedMilestoneTracker } from '../common/EnhancedMilestoneTracker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/pro-light-svg-icons';

// Sample attachments for demo purposes
const sampleAttachments: Attachment[] = [
  {
    id: '1',
    fileName: 'inspection-report.pdf',
    fileSize: 1024 * 1024 * 2.1, // 2.1 MB
    fileType: 'application/pdf',
    blobUrl: '/placeholder-pdf.pdf',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'John Smith'
  },
  {
    id: '2',
    fileName: 'defect-image.jpg',
    fileSize: 1024 * 512, // 512 KB
    fileType: 'image/jpeg',
    blobUrl: 'https://placehold.co/600x400/png',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'John Smith'
  },
  {
    id: '3',
    fileName: 'test-data.xlsx',
    fileSize: 1024 * 985, // 985 KB
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    blobUrl: '/placeholder-excel.xlsx',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'John Smith'
  }
];

// Sample NCR for demo purposes
const sampleNCR: NCR = {
  id: 'NCR-2023-001',
  number: 'NCR-2023-001',
  title: 'Material Dimension Non-Conformance',
  description: 'Received aluminum sheets exceed the specified thickness tolerance of 0.125" ± 0.005". Measured thickness ranges from 0.132" to 0.138".',
  type: 'material',
  severity: 'major',
  status: 'under_review',
  area: 'Receiving',
  lotNumber: 'ALU-202309-056',
  quantityAffected: 150,
  reportedBy: 'Jane Doe',
  reportedDate: new Date().toISOString(),
  disposition: {
    decision: 'use_as_is',
    justification: 'Engineering review determined that the increased thickness does not affect the final assembly or performance.',
    conditions: 'Requires special marking to identify non-standard material.',
    approvedBy: [
      {
        approver: 'Mark Johnson',
        date: new Date().toISOString(),
        comment: 'Approved with conditions noted.'
      }
    ]
  },
  attachments: sampleAttachments,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function DemoNCRPage() {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentNCR, setCurrentNCR] = useState<NCR>(sampleNCR);

  const handleDeleteAttachment = async (attachmentId: string) => {
    console.log(`Deleting attachment ${attachmentId}`);
    // In a real app, this would be an API call
    const updatedAttachments = currentNCR.attachments?.filter(a => a.id !== attachmentId) || [];
    setCurrentNCR({
      ...currentNCR,
      attachments: updatedAttachments
    });
    return true;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">NCR System Enhancements Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Milestone Tracker</CardTitle>
            <CardDescription>
              Visual progress tracking for NCRs with status indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedMilestoneTracker 
              item={currentNCR}
              type="ncr"
              showLabels={true}
              showBlinker={true}
            />
            
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium">Progress Bar</h4>
                  <p className="text-sm text-muted-foreground">Shows overall completion percentage with colored indicators</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium">Blinking Indicator</h4>
                  <p className="text-sm text-muted-foreground">Red blinking dot indicates current stage</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Attachment Gallery</CardTitle>
            <CardDescription>
              Preview and manage attachments directly in the interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NCRAttachmentGallery 
              attachments={currentNCR.attachments || []}
              onDeleteAttachment={handleDeleteAttachment}
              readonly={false}
              title="Documentation and Evidence"
            />
            
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium">Preview Support</h4>
                  <p className="text-sm text-muted-foreground">Directly preview PDFs, images, and other file types</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium">File Management</h4>
                  <p className="text-sm text-muted-foreground">View and delete attachments with visual indicators</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Complete Integration</CardTitle>
          <CardDescription>
            View the complete NCR Details Dialog with all enhancements
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button 
            size="lg"
            onClick={() => setShowDetailsDialog(true)}
          >
            Open NCR Details Dialog
          </Button>
        </CardContent>
      </Card>
      
      {/* NCR Details Dialog */}
      {showDetailsDialog && (
        <NCRDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          ncr={currentNCR}
        />
      )}
    </div>
  );
}