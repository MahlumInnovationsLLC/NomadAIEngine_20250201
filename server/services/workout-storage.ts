import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("Azure Storage connection string not found");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerName = "member-workouts";
const containerClient = blobServiceClient.getContainerClient(containerName);

export interface WorkoutLog {
  id: string;
  memberId: number;
  workoutPlanId: string;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  totalCaloriesBurned?: number;
  sets: Array<{
    exerciseId: string;
    setNumber: number;
    weight?: number;
    reps?: number;
    timeToComplete?: number;
    difficultyRating?: number;
    notes?: string;
  }>;
}

export async function createWorkoutLog(memberId: number, workoutPlanId: string): Promise<WorkoutLog> {
  try {
    const workoutLog: WorkoutLog = {
      id: uuidv4(),
      memberId,
      workoutPlanId,
      startTime: new Date(),
      status: 'in_progress',
      sets: []
    };

    const blobName = `${memberId}/workouts/${workoutLog.id}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(
      JSON.stringify(workoutLog),
      JSON.stringify(workoutLog).length
    );

    return workoutLog;
  } catch (error) {
    console.error('Error creating workout log:', error);
    throw new Error('Failed to create workout log in Azure Storage');
  }
}

export async function getWorkoutLog(memberId: number, workoutLogId: string): Promise<WorkoutLog | null> {
  try {
    const blobName = `${memberId}/workouts/${workoutLogId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const downloadResponse = await blockBlobClient.download(0);
    const workoutLog = JSON.parse(await streamToString(downloadResponse.readableStreamBody!));
    
    return workoutLog;
  } catch (error) {
    if ((error as any)?.statusCode === 404) {
      return null;
    }
    console.error('Error getting workout log:', error);
    throw new Error('Failed to get workout log from Azure Storage');
  }
}

export async function updateWorkoutLog(workoutLog: WorkoutLog): Promise<WorkoutLog> {
  try {
    const blobName = `${workoutLog.memberId}/workouts/${workoutLog.id}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(
      JSON.stringify(workoutLog),
      JSON.stringify(workoutLog).length
    );

    return workoutLog;
  } catch (error) {
    console.error('Error updating workout log:', error);
    throw new Error('Failed to update workout log in Azure Storage');
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

// Initialize the container if it doesn't exist
export async function initializeWorkoutStorage() {
  try {
    await containerClient.createIfNotExists({
      access: 'container'
    });
    console.log('Workout storage container initialized');
  } catch (error) {
    console.error('Error initializing workout storage:', error);
    throw error;
  }
}
