export enum LogType {
  Food = 'Food',
  Symptom = 'Symptom',
  Medication = 'Medication',
  Weight = 'Weight',
  Journal = 'Journal',
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  content: string;
}

export interface DailyLogs {
  [date: string]: LogEntry[];
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface DoctorVisit {
  id: string;
  date: string;
  purpose: string;
  details: string;
  visitTypes: string[];
  aiSummary?: string;
}

export const VISIT_TYPES = [
  'Follow-up',
  'Check-up',
  'X-ray',
  'Surgery',
  'Lab Work',
  'Specialist',
  'Emergency',
  'Physical Therapy',
  'Other'
];
