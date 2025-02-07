import { BlobServiceClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const DOCUMENTS_CONTAINER = "nomadaidatacontainer";
const TRAINING_CONTAINER = "training-data";

export const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

export async function initializeBlobContainers() {
  try {
    // Get container clients
    const documentsContainer = blobServiceClient.getContainerClient(DOCUMENTS_CONTAINER);
    const trainingContainer = blobServiceClient.getContainerClient(TRAINING_CONTAINER);

    // Create containers if they don't exist
    await documentsContainer.createIfNotExists();
    await trainingContainer.createIfNotExists();

    console.log("Successfully initialized blob storage containers");
    return { documentsContainer, trainingContainer };
  } catch (error) {
    console.error("Error initializing blob storage containers:", error);
    throw error;
  }
}

export async function uploadTrainingData(userId: string, moduleId: string, data: any) {
  const container = blobServiceClient.getContainerClient(TRAINING_CONTAINER);
  const blobName = `${userId}/${moduleId}/progress.json`;
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  await blockBlobClient.upload(JSON.stringify(data), JSON.stringify(data).length);
  return blobName;
}

export async function getTrainingData(userId: string, moduleId: string) {
  const container = blobServiceClient.getContainerClient(TRAINING_CONTAINER);
  const blobName = `${userId}/${moduleId}/progress.json`;
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  try {
    const downloadResponse = await blockBlobClient.download();
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
    return JSON.parse(downloaded.toString());
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}
