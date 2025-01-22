import { useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { DocumentViewer } from "./DocumentViewer";

export function DocManagement() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <FileExplorer onSelectDocument={setSelectedDocument} />
      {selectedDocument && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isEditing ? "View Mode" : "Edit Mode"}
            </button>
          </div>
          <DocumentViewer
            documentId={selectedDocument}
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
}

export default DocManagement;
