import { BlobServiceClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const DOCUMENTS_CONTAINER = "nomadaidatacontainer";
const TRAINING_CONTAINER = "training-data";

export const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

// Mock training data for initialization
const mockTrainingData = {
  completionRates: {
    completed: 45,
    inProgress: 30,
    notStarted: 25,
  },
  weeklyProgress: [
    { week: 'Week 1', completions: 5, avgScore: 85 },
    { week: 'Week 2', completions: 8, avgScore: 88 },
    { week: 'Week 3', completions: 12, avgScore: 92 },
    { week: 'Week 4', completions: 15, avgScore: 90 },
  ],
  performanceMetrics: {
    averageScore: 85,
    totalTime: 2400,
    completionRate: 75,
    streak: 7,
    totalPoints: 1250
  },
  skillBreakdown: [
    { skill: 'Safety', level: 85, progress: 85 },
    { skill: 'Technical', level: 75, progress: 75 },
    { skill: 'Compliance', level: 90, progress: 90 },
    { skill: 'Leadership', level: 65, progress: 65 },
    { skill: 'Communication', level: 80, progress: 80 },
  ],
  achievements: [
    {
      name: 'Fast Learner',
      earned: true,
      progress: 100,
      description: 'Complete 5 modules in a week',
      icon: 'bolt'
    },
    {
      name: 'Safety Expert',
      earned: false,
      progress: 75,
      description: 'Complete all safety modules',
      icon: 'shield'
    },
    {
      name: 'Team Leader',
      earned: false,
      progress: 40,
      description: 'Complete leadership training track',
      icon: 'users'
    }
  ],
  learningPath: {
    currentLevel: 4,
    xpToNextLevel: 1000,
    totalXP: 750,
    recentMilestones: [
      {
        title: 'Completed Safety Fundamentals',
        date: '2025-02-01'
      },
      {
        title: 'Earned Technical Specialist Badge',
        date: '2025-02-03'
      },
      {
        title: 'Started Leadership Training',
        date: '2025-02-05'
      }
    ]
  }
};

export async function initializeBlobContainers() {
  try {
    // Get container clients
    const documentsContainer = blobServiceClient.getContainerClient(DOCUMENTS_CONTAINER);
    const trainingContainer = blobServiceClient.getContainerClient(TRAINING_CONTAINER);

    // Create containers if they don't exist
    await documentsContainer.createIfNotExists();
    await trainingContainer.createIfNotExists();

    // Initialize mock data for demo purposes
    const mockDataBlobClient = trainingContainer.getBlockBlobClient('demo-user/analytics/data.json');
    await mockDataBlobClient.upload(
      JSON.stringify(mockTrainingData),
      JSON.stringify(mockTrainingData).length,
      {
        blobHTTPHeaders: { blobContentType: 'application/json' }
      }
    );

    console.log("Successfully initialized blob storage containers with mock data");
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

  await blockBlobClient.upload(JSON.stringify(data), JSON.stringify(data).length, {
    blobHTTPHeaders: { blobContentType: 'application/json' }
  });
  return blobName;
}

export async function getTrainingData(userId: string, moduleId: string) {
  const container = blobServiceClient.getContainerClient(TRAINING_CONTAINER);
  const blobName = `${userId}/${moduleId}/progress.json`;

  // For demo purposes, if no user-specific data exists, return mock data
  if (userId === 'demo-user' || !userId) {
    const mockDataBlobClient = container.getBlockBlobClient('demo-user/analytics/data.json');
    try {
      const downloadResponse = await mockDataBlobClient.download();
      const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
      return JSON.parse(downloaded.toString());
    } catch (error) {
      console.error("Error fetching mock data:", error);
      return null;
    }
  }

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