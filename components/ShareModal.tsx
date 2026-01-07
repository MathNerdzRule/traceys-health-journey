import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { DailyLogs, LogEntry, Medication, LogType } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareType: 'medications' | 'history' | null;
  medications?: Medication[];
  allLogs?: DailyLogs;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getPastDateString = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const formatMedicationData = (meds: Medication[]): string => {
  if (!meds || meds.length === 0) return 'No medications to share.';
  let content = 'Medication List\n';
  content += '=========================\n\n';
  meds.forEach(med => {
    content += `- ${med.name}\n`;
    content += `  Dosage: ${med.dosage}\n`;
    content += `  Frequency: ${med.frequency}\n\n`;
  });
  return content;
};

const formatLogHistoryData = (logs: DailyLogs, startDate: string, endDate: string): string => {
  if (!logs) return 'No logs to share.';
  
  const filteredDates = Object.keys(logs)
    .filter(date => date >= startDate && date <= endDate)
    .sort((a, b) => b.localeCompare(a)); // Sort descending

  if (filteredDates.length === 0) {
    return `No log entries found between ${startDate} and ${endDate}.`;
  }
  
  const logOrder = Object.values(LogType);

  let content = `Health Log History\n`;
  content += `From: ${startDate} To: ${endDate}\n`;
  content += '=========================\n\n';

  filteredDates.forEach(dateStr => {
    const date = new Date(dateStr + 'T00:00:00');
    const displayDate = date.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    content += `--- ${displayDate} ---\n\n`;

    const dailyLogs = logs[dateStr];
    const groupedLogs = logOrder
        .map(logType => ({
            type: logType,
            logs: dailyLogs
                .filter(log => log.type === logType)
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
        }))
        .filter(group => group.logs.length > 0);
    
    if (groupedLogs.length === 0) {
        content += 'No entries for this day.\n';
    } else {
        groupedLogs.forEach(group => {
            content += `[${group.type}]\n`;
            group.logs.forEach(log => {
                content += `- (${log.timestamp}) ${log.content}\n`;
            });
            content += '\n';
        });
    }
  });

  return content;
};

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareType, medications, allLogs }) => {
  const [formattedData, setFormattedData] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const [endDate, setEndDate] = useState(getTodayDateString);
  const [startDate, setStartDate] = useState(() => getPastDateString(30));
  
  const title = shareType === 'medications' ? 'Share Medication List' : 'Share Log History';

  useEffect(() => {
    if (!isOpen) {
      setCopySuccess('');
      return;
    }
    if (shareType === 'medications' && medications) {
      setFormattedData(formatMedicationData(medications));
    } else if (shareType === 'history' && allLogs) {
      setFormattedData(formatLogHistoryData(allLogs, startDate, endDate));
    }
  }, [isOpen, shareType, medications, allLogs, startDate, endDate]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formattedData).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('Failed to copy.');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(formattedData);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {shareType === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-brand-text-secondary mb-1">Start Date</label>
              <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate} className="p-2 border rounded-md w-full bg-white text-black" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-brand-text-secondary mb-1">End Date</label>
              <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} max={getTodayDateString()} className="p-2 border rounded-md w-full bg-white text-black" />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="shareContent" className="block text-sm font-medium text-brand-text-secondary mb-1">Content to be shared:</label>
          <textarea
            id="shareContent"
            readOnly
            value={formattedData}
            className="w-full h-64 p-3 border rounded-lg bg-gray-100 text-brand-text-secondary font-mono text-sm"
            aria-label="Content to share"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={handleEmail} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
            Share via Email
          </button>
          <button onClick={handleCopyToClipboard} className="px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-opacity-90 transition flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
            Copy to Clipboard
          </button>
          {copySuccess && <span className="text-brand-secondary font-semibold">{copySuccess}</span>}
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
