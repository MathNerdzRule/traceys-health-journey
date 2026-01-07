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
      
      // Attempt to parse the data
      const success = storageService.importAllData(importText.trim());
      
      if (success) {
        setStatus({ type: 'success', message: 'History imported! Refreshing...' });
        setTimeout(() => {
          onImportSuccess();
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        setStatus({ type: 'error', message: 'Invalid format. Make sure you copied the correct data.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Import failed.' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Health History">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Paste the history data you copied from the old site below to transfer your logs and medications.
        </p>

        <section>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste copied data here..."
            className="w-full h-48 p-4 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none text-xs font-mono"
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full mt-4 py-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-opacity-90 shadow-lg transition disabled:bg-gray-300"
          >
            Confirm Import
          </button>
        </section>

        {status.type !== 'idle' && (
          <div className={`p-4 rounded-xl text-sm text-center font-medium ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {status.message}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DataMigrationModal;
