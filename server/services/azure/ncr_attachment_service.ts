import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING || ""
);

const containerName = "ncr-attachments";
const containerClient = blobServiceClient.getContainerClient(containerName);

export interface UploadNCRAttachmentResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  blobUrl: string;
  uploadedAt: string;
}

export async function initializeNCRAttachmentsContainer() {
  try {
    await containerClient.createIfNotExists({
      access: 'blob'
    });
    console.log("NCR attachments container initialized successfully");
  } catch (error) {
    console.error("Failed to initialize NCR attachments container:", error);
    throw error;
  }
}

export async function uploadNCRAttachment(
  file: Express.Multer.File,
  ncrId: string,
  uploadedBy: string
): Promise<UploadNCRAttachmentResult> {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const blobName = `${ncrId}/${uuidv4()}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });

    const result: UploadNCRAttachmentResult = {
      id: uuidv4(),
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      blobUrl: blockBlobClient.url,
      uploadedAt: new Date().toISOString()
    };

    return result;
  } catch (error) {
    console.error("Failed to upload NCR attachment:", error);
    throw error;
  }
}

export async function deleteNCRAttachment(ncrId: string, attachmentId: string) {
  try {
    const blobName = `${ncrId}/${attachmentId}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error("Failed to delete NCR attachment:", error);
    throw error;
  }
}

// Initialize the container when the service loads
initializeNCRAttachmentsContainer().catch(console.error);
