import { DailyLogs, Medication, DoctorVisit } from '../types';

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
};
