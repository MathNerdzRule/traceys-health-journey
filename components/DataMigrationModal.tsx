import React, { useState } from 'react';
import Modal from './Modal';
import { storageService } from '../services/storageService';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const DataMigrationModal: React.FC<DataMigrationModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const extractorCode = `
const data = {
  logs: JSON.parse(localStorage.getItem('gpJourneyLogs') || '{}'),
  medications: JSON.parse(localStorage.getItem('gpJourneyMeds') || '[]'),
  doctorVisits: JSON.parse(localStorage.getItem('gpJourneyDocVisits') || '[]')
};
console.log(JSON.stringify(data));
copy(JSON.stringify(data));
alert('Data copied to clipboard! Paste it into the new app.');
  `.trim();

  const handleImport = () => {
    try {
      if (!importText.trim()) return;
      const success = storageService.importAllData(importText);
      if (success) {
        setStatus({ type: 'success', message: 'Data imported successfully! The page will refresh.' });
        setTimeout(() => {
          onImportSuccess();
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        setStatus({ type: 'error', message: 'Invalid data format. Please try again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Import failed. Make sure you copied the correct text.' });
    }
  };

  const copyExtractor = () => {
    navigator.clipboard.writeText(extractorCode);
    alert('Extractor code copied! Run this in the console of your OLD site.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Data from Old Site">
      <div className="space-y-6">
        <section className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2">Step 1: Get data from old site</h3>
          <p className="text-sm text-blue-700 mb-4">
            Since your browser keeps data separate for different websites, you'll need to run a small command on the old site to "extract" your data.
          </p>
          <button 
            onClick={copyExtractor}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Copy Extractor Code
          </button>
          <p className="text-[10px] mt-2 text-blue-500 italic">
            Instructions: Go to your old site, right-click anywhere, select "Inspect", go to the "Console" tab, paste this code, and hit Enter.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-gray-800 mb-2">Step 2: Paste data here</h3>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste the data code here..."
            className="w-full h-32 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full mt-4 py-3 bg-brand-secondary text-white rounded-lg font-bold hover:bg-opacity-90 transition disabled:bg-gray-300"
          >
            Import Data
          </button>
        </section>

        {status.type !== 'idle' && (
          <div className={`p-3 rounded-lg text-sm text-center ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {status.message}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DataMigrationModal;
