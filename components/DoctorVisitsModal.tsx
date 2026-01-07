import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { DoctorVisit, VISIT_TYPES } from '../types';

interface DoctorVisitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: DoctorVisit[];
  onSave: (visit: DoctorVisit) => Promise<void>;
}

const DoctorVisitsModal: React.FC<DoctorVisitsModalProps> = ({ isOpen, onClose, visits, onSave }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [visitTypes, setVisitTypes] = useState<string[]>([]);
  const [details, setDetails] = useState('');

  // Reset form when opening modal or switching views
  useEffect(() => {
    if (isOpen && view === 'list') {
      resetForm();
    }
  }, [isOpen, view]);

  const resetForm = () => {
    setEditId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setPurpose('');
    setVisitTypes([]);
    setDetails('');
    setIsSubmitting(false);
  };

  const handleEdit = (visit: DoctorVisit) => {
    setEditId(visit.id);
    setDate(visit.date);
    setPurpose(visit.purpose);
    setVisitTypes(visit.visitTypes);
    setDetails(visit.details);
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) return;
    
    setIsSubmitting(true);
    
    const visit: DoctorVisit = {
      id: editId || Date.now().toString(),
      date,
      purpose,
      visitTypes,
      details,
      // aiSummary will be handled by the parent's onSave which calls geminiService
    };

    await onSave(visit);
    
    setIsSubmitting(false);
    setView('list');
  };

  const toggleFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleFormType = (type: string) => {
    setVisitTypes(prev => 
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredVisits = visits
    .filter(v => selectedTypes.length === 0 || v.visitTypes.some(t => selectedTypes.includes(t)))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Doctor's Visits">
      {view === 'list' ? (
        <div className="flex flex-col h-full">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm text-brand-text-secondary font-medium">
               {visits.length} {visits.length === 1 ? 'Entry' : 'Entries'}
            </h3>
            <button 
              onClick={() => { resetForm(); setView('form'); }}
              className="px-3 py-1.5 bg-brand-primary text-white text-sm rounded-md shadow hover:bg-opacity-90 transition"
            >
              + Add Visit
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 overflow-x-auto pb-2 -mx-1 px-1">
             <div className="flex gap-2">
                <button
                    onClick={() => setSelectedTypes([])}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition ${selectedTypes.length === 0 ? 'bg-brand-text-primary text-white border-brand-text-primary' : 'bg-white text-brand-text-secondary border-gray-300'}`}
                >
                    All
                </button>
                {VISIT_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition ${selectedTypes.includes(type) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-text-secondary border-gray-300'}`}
                    >
                        {type}
                    </button>
                ))}
             </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
            {filteredVisits.length > 0 ? (
                filteredVisits.map(visit => (
                    <div key={visit.id} onClick={() => handleEdit(visit)} className="p-4 border rounded-lg hover:border-brand-primary cursor-pointer bg-gray-50 transition">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-brand-text-primary">{visit.date}</span>
                            <div className="flex flex-wrap gap-1 justify-end">
                                {visit.visitTypes.map(t => (
                                    <span key={t} className="px-2 py-0.5 bg-brand-primary-light/30 text-brand-primary text-[10px] rounded-full uppercase tracking-wider font-semibold">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <h4 className="font-medium text-brand-text-primary mb-1">{visit.purpose}</h4>
                        {visit.aiSummary ? (
                            <p className="text-sm text-brand-text-secondary italic bg-white p-2 rounded border border-gray-100 mt-2">
                                ✨ {visit.aiSummary}
                            </p>
                        ) : (
                             <p className="text-sm text-brand-text-secondary line-clamp-2 mt-1">{visit.details}</p>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-brand-text-secondary">
                    No visits found.
                </div>
            )}
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
             <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Date</label>
                    <input 
                        type="date" 
                        required
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white text-brand-text-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Purpose of Visit</label>
                    <input 
                        type="text" 
                        required
                        placeholder="e.g. Knee pain consultation"
                        value={purpose} 
                        onChange={e => setPurpose(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white text-brand-text-primary"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">Visit Types (Select all that apply)</label>
                    <div className="flex flex-wrap gap-2">
                        {VISIT_TYPES.map(type => (
                             <button
                                key={type}
                                type="button"
                                onClick={() => toggleFormType(type)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${visitTypes.includes(type) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-gray-100 text-brand-text-secondary border-transparent'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Details</label>
                    <textarea 
                        required
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        placeholder="Enter full details, doctor's notes, next steps..."
                        className="w-full p-3 border rounded-md min-h-[120px] bg-white text-brand-text-primary"
                    />
                </div>
             </div>
             
             <div className="flex gap-3 pt-4 mt-auto">
                <button 
                    type="button" 
                    onClick={() => setView('list')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-brand-text-secondary rounded-lg hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-opacity-90 transition disabled:opacity-70 flex justify-center items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                             <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                             <span>Summarizing...</span>
                        </>
                    ) : (
                        <span>Save Visit</span>
                    )}
                </button>
             </div>
        </form>
      )}
    </Modal>
  );
};

export default DoctorVisitsModal;
