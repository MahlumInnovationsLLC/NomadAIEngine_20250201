import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error('Azure Storage connection string not found');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const ncrContainerName = "ncr-attachments";
const inspectionContainerName = "inspection-attachments";
let ncrContainerClient: ContainerClient;
let inspectionContainerClient: ContainerClient;

export interface UploadAttachmentResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  blobUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

async function initializeContainer(containerName: string): Promise<ContainerClient> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const createContainerResponse = await containerClient.createIfNotExists({
      access: 'blob'
    });

    if (createContainerResponse.succeeded) {
      console.log(`${containerName} container created successfully`);
    } else {
      console.log(`${containerName} container already exists`);
    }

    await containerClient.getProperties();
    console.log(`Successfully verified ${containerName} container access`);
    return containerClient;
  } catch (error) {
    console.error(`Failed to initialize ${containerName} container:`, error);
    throw new Error(`Failed to initialize ${containerName} container. Please check Azure Storage configuration.`);
  }
}

export async function initializeNCRAttachmentsContainer() {
  ncrContainerClient = await initializeContainer(ncrContainerName);
}

export async function initializeInspectionAttachmentsContainer() {
  inspectionContainerClient = await initializeContainer(inspectionContainerName);
}

async function uploadAttachment(
  file: Express.Multer.File,
  parentId: string,
  uploadedBy: string,
  containerClient: ContainerClient
): Promise<UploadAttachmentResult> {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const uniqueId = uuidv4();
    const blobName = `${parentId}/${uniqueId}.${fileExtension}`;
    console.log('Generated blob name:', blobName);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    console.log('Uploading to blob storage...');

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: 'public, max-age=31536000'
      }
    });

    console.log('Successfully uploaded to blob storage');
    return {
      id: uniqueId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      blobUrl: blockBlobClient.url,
      uploadedAt: new Date().toISOString(),
      uploadedBy
    };
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    throw error;
  }
}

async function deleteAttachment(parentId: string, attachmentId: string, containerClient: ContainerClient): Promise<boolean> {
  try {
    console.log(`Starting deletion process for attachment ${attachmentId} in parent ${parentId}`);
    let blobFound = false;

    // List all blobs in the parent folder
    const blobsIter = containerClient.listBlobsFlat({
      prefix: `${parentId}/`
    });

    for await (const blob of blobsIter) {
      // Extract attachment ID from blob name (format: parentId/attachmentId.extension)
      const blobNameParts = blob.name.split('/');
      if (blobNameParts.length !== 2) continue;

      const blobAttachmentId = blobNameParts[1].split('.')[0];
      console.log(`Checking blob: ${blob.name}, attachmentId: ${blobAttachmentId}`);

      if (blobAttachmentId === attachmentId) {
        console.log(`Found matching blob: ${blob.name}`);
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        await blockBlobClient.delete();
        console.log(`Successfully deleted blob: ${blob.name}`);
        blobFound = true;
        break;
      }
    }

    // If no blob was found, log it but don't throw an error
    if (!blobFound) {
      console.log(`No blob found for attachment ${attachmentId} in parent ${parentId}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    // Return false instead of throwing to handle the error gracefully
    return false;
  }
}

export async function uploadNCRAttachment(
  file: Express.Multer.File,
  ncrId: string,
  uploadedBy: string
): Promise<UploadAttachmentResult> {
  if (!ncrContainerClient) {
    await initializeNCRAttachmentsContainer();
  }
  return uploadAttachment(file, ncrId, uploadedBy, ncrContainerClient);
}

export async function uploadInspectionAttachment(
  file: Express.Multer.File,
  inspectionId: string,
  uploadedBy: string
): Promise<UploadAttachmentResult> {
  if (!inspectionContainerClient) {
    await initializeInspectionAttachmentsContainer();
  }
  return uploadAttachment(file, inspectionId, uploadedBy, inspectionContainerClient);
}

export async function deleteNCRAttachment(ncrId: string, attachmentId: string): Promise<boolean> {
  if (!ncrContainerClient) {
    await initializeNCRAttachmentsContainer();
  }
  return deleteAttachment(ncrId, attachmentId, ncrContainerClient);
}

export async function deleteInspectionAttachment(inspectionId: string, attachmentId: string): Promise<boolean> {
  if (!inspectionContainerClient) {
    await initializeInspectionAttachmentsContainer();
  }
  return deleteAttachment(inspectionId, attachmentId, inspectionContainerClient);
}

// Initialize the containers when the service loads
Promise.all([
  initializeNCRAttachmentsContainer(),
  initializeInspectionAttachmentsContainer()
]).catch(console.error);