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
    health: {
      weight: number[];
      bodyFat: number[];
      heartRate: number[];
      bloodPressure: { systolic: number[]; diastolic: number[]; };
      measurements: {
        chest: number[];
        waist: number[];
        hips: number[];
        biceps: number[];
        thighs: number[];
      };
      dates: string[];
    };
    workouts: {
      type: string;
      date: string;
      duration: number;
      intensity: number;
      exercises: Array<{
        name: string;
        sets: number;
        reps: number;
        weight: number;
      }>;
    }[];
    nutrition: {
      plans: Array<{
        date: string;
        meals: Array<{
          type: string;
          foods: Array<{
            name: string;
            portion: string;
            calories: number;
          }>;
        }>;
      }>;
      preferences: string[];
      restrictions: string[];
    };
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      earnedDate: string;
      type: string;
    }>;
    milestones: Array<{
      id: string;
      name: string;
      target: number;
      current: number;
      unit: string;
      deadline: string;
    }>;
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
        lifetimeValue: 1200,
        health: {
          weight: [185, 183, 180, 178],
          bodyFat: [22, 21, 20, 19],
          heartRate: [72, 70, 68, 65],
          bloodPressure: {
            systolic: [125, 122, 120, 118],
            diastolic: [82, 80, 78, 75]
          },
          measurements: {
            chest: [42, 41.5, 41, 40.5],
            waist: [34, 33, 32, 31],
            hips: [40, 39, 38, 37],
            biceps: [15, 15.2, 15.5, 15.8],
            thighs: [23, 23.5, 24, 24.2]
          },
          dates: [
            "2023-10-15",
            "2023-11-15",
            "2023-12-15",
            "2024-01-15"
          ]
        },
        workouts: [
          {
            type: "strength",
            date: "2024-01-23",
            duration: 60,
            intensity: 8,
            exercises: [
              {
                name: "Bench Press",
                sets: 4,
                reps: 10,
                weight: 185
              },
              {
                name: "Squats",
                sets: 4,
                reps: 12,
                weight: 225
              }
            ]
          }
        ],
        nutrition: {
          plans: [
            {
              date: "2024-01-23",
              meals: [
                {
                  type: "breakfast",
                  foods: [
                    {
                      name: "Oatmeal",
                      portion: "1 cup",
                      calories: 300
                    }
                  ]
                }
              ]
            }
          ],
          preferences: ["High Protein", "Low Carb"],
          restrictions: ["Lactose Intolerant"]
        },
        achievements: [
          {
            id: "1",
            name: "Weight Loss Warrior",
            description: "Lost 10 pounds",
            earnedDate: "2024-01-15",
            type: "fitness"
          }
        ],
        milestones: [
          {
            id: "1",
            name: "Weight Goal",
            target: 175,
            current: 178,
            unit: "lbs",
            deadline: "2024-03-01"
          }
        ]
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
        lifetimeValue: 800,
        health: { weight: [], bodyFat: [], heartRate: [], bloodPressure: { systolic: [], diastolic: [] }, measurements: { chest: [], waist: [], hips: [], biceps: [], thighs: [] }, dates: [] },
        workouts: [],
        nutrition: { plans: [], preferences: [], restrictions: [] },
        achievements: [],
        milestones: []
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
        lifetimeValue: 2400,
        health: { weight: [], bodyFat: [], heartRate: [], bloodPressure: { systolic: [], diastolic: [] }, measurements: { chest: [], waist: [], hips: [], biceps: [], thighs: [] }, dates: [] },
        workouts: [],
        nutrition: { plans: [], preferences: [], restrictions: [] },
        achievements: [],
        milestones: []
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

export async function updateMemberData(memberId: string, updates: Partial<MemberData>) {
  const blobName = `members/${memberId}.json`;
  const blobClient = containerClient.getBlobClient(blobName);

  try {
    // Get current data
    const downloadResponse = await blobClient.download();
    const currentData = JSON.parse(await streamToString(downloadResponse.readableStreamBody!));

    // Merge updates with current data
    const updatedData = {
      ...currentData,
      ...updates,
      metrics: {
        ...currentData.metrics,
        ...updates.metrics
      }
    };

    // Upload updated data
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(JSON.stringify(updatedData), JSON.stringify(updatedData).length);

    return updatedData;
  } catch (error) {
    console.error(`Error updating member data for ID ${memberId}:`, error);
    throw new Error('Failed to update member data');
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}