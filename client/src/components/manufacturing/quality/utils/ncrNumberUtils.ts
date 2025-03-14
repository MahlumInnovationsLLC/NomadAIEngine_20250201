/**
 * Generates an NCR number based on date, time, and department information
 * Format: [DEPT]-YYYYMMDD-HHMM-XXX where:
 * - [DEPT] is the department code (RCV, FAB, PNT, PRD, IQC, FQC, EXC, PDI)
 * - YYYYMMDD is the date
 * - HHMM is the time
 * - XXX is a sequential number that can be replaced with a unique identifier
 */
export function generateNCRNumber(department: string, sequentialNumber: number = 1): string {
  const departmentMap: Record<string, string> = {
    'Receiving': 'RCV',
    'FAB': 'FAB',
    'Paint': 'PNT',
    'Production': 'PRD',
    'In-Process QC': 'IQC',
    'Final QC': 'FQC',
    'Exec Review': 'EXC',
    'PDI': 'PDI',
    // Default to QC if department is not in the list
    'default': 'QC'
  };

  // Get current date and time
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  // Get department code
  const departmentCode = departmentMap[department] || departmentMap.default;

  // Format sequential number to be 3 digits
  const sequenceStr = String(sequentialNumber).padStart(3, '0');

  // Create NCR number in the format DEPT-YYYYMMDD-HHMM-XXX
  return `${departmentCode}-${year}${month}${day}-${hours}${minutes}-${sequenceStr}`;
}

/**
 * Parses an NCR number to extract its components
 */
export function parseNCRNumber(ncrNumber: string): {
  department: string;
  date: string;
  time: string;
  sequence: string;
} | null {
  // Regex to match the NCR number format
  const regex = /^([A-Z]{2,3})-(\d{8})-(\d{4})-(\d{3})$/;
  const match = ncrNumber.match(regex);

  if (!match) {
    return null;
  }

  return {
    department: match[1],
    date: match[2],
    time: match[3],
    sequence: match[4]
  };
}