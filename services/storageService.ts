import { DailyLogs, Medication, DoctorVisit, LogEntry, LogType } from '../types';

const LOGS_KEY = 'gpJourneyLogs';
const MEDS_KEY = 'gpJourneyMeds';
const DOC_VISITS_KEY = 'gpJourneyDocVisits';

export const storageService = {
  getLogs: (): DailyLogs => {
    try {
      const logs = localStorage.getItem(LOGS_KEY);
      return logs ? JSON.parse(logs) : {};
    } catch (error) {
      console.error('Error parsing logs from localStorage', error);
      return {};
    }
  },

  saveLogs: (logs: DailyLogs): void => {
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving logs to localStorage', error);
    }
  },

  getMedications: (): Medication[] => {
    try {
      const meds = localStorage.getItem(MEDS_KEY);
      return meds ? JSON.parse(meds) : [];
    } catch (error) {
      console.error('Error parsing medications from localStorage', error);
      return [];
    }
  },

  saveMedications: (meds: Medication[]): void => {
    try {
      localStorage.setItem(MEDS_KEY, JSON.stringify(meds));
    } catch (error) {
      console.error('Error saving medications to localStorage', error);
    }
  },

  getDoctorVisits: (): DoctorVisit[] => {
    try {
      const visits = localStorage.getItem(DOC_VISITS_KEY);
      return visits ? JSON.parse(visits) : [];
    } catch (error) {
      console.error('Error parsing doctor visits from localStorage', error);
      return [];
    }
  },

  saveDoctorVisits: (visits: DoctorVisit[]): void => {
    try {
      localStorage.setItem(DOC_VISITS_KEY, JSON.stringify(visits));
    } catch (error) {
      console.error('Error saving doctor visits to localStorage', error);
    }
  },

  exportAllData: (): string => {
    const data = {
      logs: storageService.getLogs(),
      medications: storageService.getMedications(),
      doctorVisits: storageService.getDoctorVisits(),
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data);
  },

  importAllData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.logs) storageService.saveLogs(data.logs);
      if (data.medications) storageService.saveMedications(data.medications);
      if (data.doctorVisits) storageService.saveDoctorVisits(data.doctorVisits);
      return true;
    } catch (error) {
      // If direct JSON fails, try parsing 'Share History' text format
      return storageService.importFromShareText(jsonData);
    }
  },

  importFromShareText: (text: string): boolean => {
    try {
      const logs: DailyLogs = {};
      const meds: Medication[] = [];
      
      // Basic check if it's our format
      if (!text.includes('Health Log History') && !text.includes('Medication List')) return false;

      if (text.includes('Medication List')) {
        const lines = text.split('\n');
        let currentMed: any = null;
        lines.forEach(line => {
          if (line.startsWith('- ')) {
            if (currentMed) meds.push(currentMed);
            currentMed = { id: Date.now().toString() + Math.random(), name: line.substring(2).trim(), dosage: '', frequency: '' };
          } else if (line.includes('Dosage: ')) {
            if (currentMed) currentMed.dosage = line.split('Dosage: ')[1].trim();
          } else if (line.includes('Frequency: ')) {
            if (currentMed) currentMed.frequency = line.split('Frequency: ')[1].trim();
          }
        });
        if (currentMed) meds.push(currentMed);
        if (meds.length > 0) storageService.saveMedications(meds);
      }

      if (text.includes('Health Log History')) {
        const daySections = text.split(/--- (.*?) ---/g);
        // [0] is header, [1] is first date display string, [2] is content for [1], etc.
        for (let i = 1; i < daySections.length; i += 2) {
          const displayDate = daySections[i];
          const content = daySections[i+1];
          
          // Convert "Monday, January 6, 2026" back to "2026-01-06"
          const date = new Date(displayDate);
          if (isNaN(date.getTime())) continue;
          const dateStr = date.toISOString().split('T')[0];
          
          const dailyEntries: LogEntry[] = [];
          const typeGroups = content.split(/\[(.*?)\]/g);
          
          for (let j = 1; j < typeGroups.length; j += 2) {
            const type = typeGroups[j] as LogType;
            const entriesText = typeGroups[j+1];
            const entries = entriesText.split('\n- ');
            
            entries.forEach(entry => {
              const match = entry.match(/\((.*?)\)\s(.*)/);
              if (match) {
                dailyEntries.push({
                  id: Math.random().toString(36).substr(2, 9),
                  timestamp: match[1],
                  type: type,
                  content: match[2].trim()
                });
              }
            });
          }
          if (dailyEntries.length > 0) {
            logs[dateStr] = dailyEntries;
          }
        }
        if (Object.keys(logs).length > 0) storageService.saveLogs(logs);
      }
      return true;
    } catch (err) {
      console.error('Failed to parse share text:', err);
      return false;
    }
  }
};
