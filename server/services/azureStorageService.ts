import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("Azure Storage Connection string not found");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const memberDataContainer = process.env.AZURE_STORAGE_CONTAINER || "memberdata";

export async function getMemberData() {
  const containerClient = blobServiceClient.getContainerClient(memberDataContainer);
  const blobClient = containerClient.getBlobClient("members.json");
  
  try {
    const downloadResponse = await blobClient.download();
    const members = await streamToJSON(await downloadResponse.blobBody);
    return members;
  } catch (error) {
    console.error("Error fetching member data from Azure:", error);
    return [];
  }
}

async function streamToJSON(readableStream: NodeJS.ReadableStream): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      const jsonString = chunks.join("");
      resolve(JSON.parse(jsonString));
    });
    readableStream.on("error", reject);
  });
}

export async function uploadMemberData(data: any) {
  const containerClient = blobServiceClient.getContainerClient(memberDataContainer);
  const blobClient = containerClient.getBlobClient("members.json");
  
  try {
    await blobClient.upload(JSON.stringify(data), data.length);
    return true;
  } catch (error) {
    console.error("Error uploading member data to Azure:", error);
    return false;
  }
}
