// Azure Helper Functions
import { ReadableStream } from 'stream/web';

/**
 * Convert a readable stream to a string
 * @param readableStream The readable stream to convert
 */
export async function streamToString(readableStream: ReadableStream | NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) {
    return '';
  }
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = readableStream as NodeJS.ReadableStream;
    
    stream.on('data', (data) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    
    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    
    stream.on('error', reject);
  });
}

/**
 * Format a date for display
 * @param date The date to format
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return d.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Generate a random color in hex format
 */
export function getRandomColor(): string {
  const colors = [
    '#4f46e5', // Indigo
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#10B981', // Emerald
    '#6366F1', // Indigo
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}