import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import Modal from './Modal';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  onSave: (meds: Medication[]) => void;
  onShare: () => void;
}

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
);


const MedicationModal: React.FC<MedicationModalProps> = ({ isOpen, onClose, medications, onSave, onShare }) => {
  const [currentMeds, setCurrentMeds] = useState<Medication[]>(medications);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [formState, setFormState] = useState({ name: '', dosage: '', frequency: '' });

  useEffect(() => {
    setCurrentMeds(medications);
  }, [medications]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = () => {
    let updatedMeds;
    if (editingMed) {
      updatedMeds = currentMeds.map(med => med.id === editingMed.id ? { ...editingMed, ...formState } : med);
    } else {
      const newMed: Medication = { id: Date.now().toString(), ...formState };
      updatedMeds = [...currentMeds, newMed];
    }
    setCurrentMeds(updatedMeds);
    onSave(updatedMeds);
    setEditingMed(null);
    setFormState({ name: '', dosage: '', frequency: '' });
  };
  
  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setFormState({ name: med.name, dosage: med.dosage, frequency: med.frequency });
  };
  
  const handleDelete = (id: string) => {
    const updatedMeds = currentMeds.filter(med => med.id !== id);
    setCurrentMeds(updatedMeds);
    onSave(updatedMeds);
  };
  
  const cancelEdit = () => {
    setEditingMed(null);
    setFormState({ name: '', dosage: '', frequency: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Medications">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary mb-2">{editingMed ? 'Edit Medication' : 'Add New Medication'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <input type="text" name="name" value={formState.name} onChange={handleInputChange} placeholder="Name" className="p-2 border rounded-md w-full bg-white text-black" />
            <input type="text" name="dosage" value={formState.dosage} onChange={handleInputChange} placeholder="Dosage" className="p-2 border rounded-md w-full bg-white text-black" />
            <input type="text" name="frequency" value={formState.frequency} onChange={handleInputChange} placeholder="Frequency" className="p-2 border rounded-md w-full bg-white text-black" />
          </div>
           <div className="mt-4 flex gap-2">
              <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90 transition">{editingMed ? 'Update' : 'Add'}</button>
              {editingMed && <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300 transition">Cancel</button>}
            </div>
        </div>

        <div className="border-t pt-4">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-lg font-semibold text-brand-text-primary">Current Medications</h3>
             <button
                onClick={onShare}
                className="p-2 text-brand-primary hover:bg-brand-primary-light rounded-full transition-colors"
                aria-label="Share medication list"
                title="Share medication list"
             >
                <ShareIcon />
             </button>
          </div>
          <ul className="space-y-2">
            {currentMeds.map(med => (
              <li key={med.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-bold">{med.name}</p>
                  <p className="text-sm text-brand-text-secondary">{med.dosage} - {med.frequency}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(med)} className="text-brand-primary hover:underline">Edit</button>
                  <button onClick={() => handleDelete(med.id)} className="text-brand-danger hover:underline">Delete</button>
                </div>
              </li>
            ))}
            {currentMeds.length === 0 && <p className="text-brand-text-secondary">No medications added yet.</p>}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default MedicationModal;