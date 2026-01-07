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

  const handleImport = () => {
    try {
      if (!importText.trim()) return;
      const success = storageService.importAllData(importText);
      if (success) {
        setStatus({ type: 'success', message: 'Data imported! Refreshing...' });
        setTimeout(() => {
          onImportSuccess();
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        setStatus({ type: 'error', message: 'Invalid data. Try copying it again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Import failed.' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Data from Old Site">
      <div className="space-y-6">
        <section className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <h3 className="font-bold text-orange-800 mb-2">Step 1: Get data from the OLD site</h3>
          <p className="text-sm text-orange-700 mb-4">
            Since your phone keeps data separate for different sites, you'll need to open your old site with this special link:
          </p>
          <div className="p-3 bg-white border rounded border-orange-200 text-[10px] font-mono break-all mb-4 select-all">
            https://tracey-s-health-journey-xxxx.us-west1.run.app/?export=true
          </div>
          <p className="text-[10px] text-orange-600 italic">
            Instructions: Open your old site, add <b>?export=true</b> to the end of the URL, tap the big "Copy" button that appears, then come back here.
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
