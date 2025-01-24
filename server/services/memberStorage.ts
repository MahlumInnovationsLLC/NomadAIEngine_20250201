import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { members } from "@db/schema";

interface MemberData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: string;
  membershipStatus: 'active' | 'inactive' | 'pending' | 'cancelled';
  joinDate: string;
  lastVisit: string;
  totalVisits: number;
  aiInsightCount: number;
  metrics: {
    attendanceRate: number;
    engagementScore: number;
    lifetimeValue: number;
  };
}

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("Azure Storage connection string not found");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerName = "memberdata";
let containerClient: ContainerClient;

export async function initializeMemberStorage() {
  containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  
  // Initialize test member data
  const testMembers: MemberData[] = [
    {
      id: "1",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      membershipType: "premium",
      membershipStatus: "active",
      joinDate: "2024-10-15",
      lastVisit: "2024-01-23",
      totalVisits: 45,
      aiInsightCount: 12,
      metrics: {
        attendanceRate: 0.85,
        engagementScore: 0.78,
        lifetimeValue: 1200
      }
    },
    {
      id: "2",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      membershipType: "standard",
      membershipStatus: "active",
      joinDate: "2024-11-01",
      lastVisit: "2024-01-24",
      totalVisits: 32,
      aiInsightCount: 8,
      metrics: {
        attendanceRate: 0.92,
        engagementScore: 0.85,
        lifetimeValue: 800
      }
    },
    {
      id: "3",
      firstName: "Steve",
      lastName: "Rogers",
      email: "steve.rogers@example.com",
      membershipType: "premium",
      membershipStatus: "active",
      joinDate: "2024-09-01",
      lastVisit: "2024-01-24",
      totalVisits: 120,
      aiInsightCount: 24,
      metrics: {
        attendanceRate: 0.98,
        engagementScore: 0.95,
        lifetimeValue: 2400
      }
    }
  ];

  for (const member of testMembers) {
    const blobName = `members/${member.id}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(JSON.stringify(member), JSON.stringify(member).length);
  }
}

export async function searchMembers(searchTerm: string = '', filters: any = {}) {
  const memberBlobs = containerClient.listBlobsFlat({ prefix: 'members/' });
  const members: MemberData[] = [];

  for await (const blob of memberBlobs) {
    const blobClient = containerClient.getBlobClient(blob.name);
    const downloadResponse = await blobClient.download();
    const memberData = JSON.parse(await streamToString(downloadResponse.readableStreamBody!));

    const matchesSearch = !searchTerm || 
      `${memberData.firstName} ${memberData.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberData.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMembership = !filters.membershipType || 
      filters.membershipType === 'all' || 
      memberData.membershipType === filters.membershipType;

    const matchesStatus = !filters.status || 
      filters.status === 'all' || 
      memberData.membershipStatus === filters.status;

    if (matchesSearch && matchesMembership && matchesStatus) {
      members.push(memberData);
    }
  }

  return members;
}

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}
