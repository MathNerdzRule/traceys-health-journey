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
      
      // Support multiple variations of reports
      const medsToken = text.includes('CURRENT ACTIVE MEDICATIONS') ? 'CURRENT ACTIVE MEDICATIONS' : 'Medication List';
      const logsToken = text.includes('DAILY LOG HISTORY') ? 'DAILY LOG HISTORY' : 'Health Log History';

      if (!text.includes(medsToken) && !text.includes(logsToken)) return false;

      if (text.includes(medsToken)) {
        const afterMeds = text.split(medsToken)[1];
        const medsBlock = afterMeds.split('=========================')[1]?.split('DAILY LOG HISTORY')[0]?.split('Health Log History')[0] || '';
        const lines = medsBlock.split('\n');
        let currentMed: any = null;
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('- ')) {
            if (currentMed) meds.push(currentMed);
            currentMed = { id: Math.random().toString(36).substr(2, 9), name: trimmed.substring(2).trim(), dosage: '', frequency: '' };
          } else if (trimmed.includes('Dosage: ')) {
            if (currentMed) currentMed.dosage = trimmed.split('Dosage: ')[1].trim();
          } else if (trimmed.includes('Frequency: ')) {
            if (currentMed) currentMed.frequency = trimmed.split('Frequency: ')[1].trim();
          }
        });
        if (currentMed) meds.push(currentMed);
        if (meds.length > 0) storageService.saveMedications(meds);
      }

      if (text.includes(logsToken)) {
        const daySections = text.split(/--- (.*?) ---/g);
        for (let i = 1; i < daySections.length; i += 2) {
          const displayDate = daySections[i].trim();
          const content = daySections[i+1];
          
          const date = new Date(displayDate);
          if (isNaN(date.getTime())) continue;
          const dateStr = date.toISOString().split('T')[0];
          
          const dailyEntries: LogEntry[] = [];
          const typeGroups = content.split(/\[(.*?)\]/g);
          
          for (let j = 1; j < typeGroups.length; j += 2) {
            const type = typeGroups[j].trim() as LogType;
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
        if (Object.keys(logs).length > 0) {
            const currentLogs = storageService.getLogs();
            storageService.saveLogs({ ...currentLogs, ...logs });
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to parse share text:', err);
      return false;
    }
  }
};
