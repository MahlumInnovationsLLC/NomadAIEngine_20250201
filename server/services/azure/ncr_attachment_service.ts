import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error('Azure Storage connection string not found');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerName = "ncr-attachments";
let containerClient: ContainerClient;

export interface UploadNCRAttachmentResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  blobUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export async function initializeNCRAttachmentsContainer() {
  try {
    containerClient = blobServiceClient.getContainerClient(containerName);
    const createContainerResponse = await containerClient.createIfNotExists({
      access: 'blob'
    });

    if (createContainerResponse.succeeded) {
      console.log("NCR attachments container created successfully");
    } else {
      console.log("NCR attachments container already exists");
    }

    // Test container access
    await containerClient.getProperties();
    console.log("Successfully verified NCR attachments container access");
  } catch (error) {
    console.error("Failed to initialize NCR attachments container:", error);
    throw new Error('Failed to initialize NCR attachments container. Please check Azure Storage configuration.');
  }
}

export async function uploadNCRAttachment(
  file: Express.Multer.File,
  ncrId: string,
  uploadedBy: string
): Promise<UploadNCRAttachmentResult> {
  if (!containerClient) {
    await initializeNCRAttachmentsContainer();
  }

  try {
    const fileExtension = file.originalname.split('.').pop();
    const uniqueId = uuidv4();
    const blobName = `${ncrId}/${uniqueId}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: 'public, max-age=31536000'
      }
    });

    const result: UploadNCRAttachmentResult = {
      id: uniqueId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      blobUrl: blockBlobClient.url,
      uploadedAt: new Date().toISOString(),
      uploadedBy
    };

    return result;
  } catch (error) {
    console.error("Failed to upload NCR attachment:", error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload NCR attachment');
  }
}

export async function deleteNCRAttachment(ncrId: string, attachmentId: string): Promise<void> {
  if (!containerClient) {
    await initializeNCRAttachmentsContainer();
  }

  try {
    const blobsIter = containerClient.listBlobsFlat({
      prefix: `${ncrId}/`
    });

    for await (const blob of blobsIter) {
      if (blob.name.includes(attachmentId)) {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        await blockBlobClient.delete();
        console.log(`Successfully deleted blob: ${blob.name}`);
        return;
      }
    }

    throw new Error('Attachment not found');
  } catch (error) {
    console.error("Failed to delete NCR attachment:", error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete NCR attachment');
  }
}

// Initialize the container when the service loads
initializeNCRAttachmentsContainer().catch(console.error);