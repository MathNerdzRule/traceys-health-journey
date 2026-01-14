import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import React, { useState, useEffect, useRef } from 'react';
import { LogType, LogEntry, DailyLogs, Medication, DoctorVisit } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import MedicationModal from './components/MedicationModal';
import CorrelationModal from './components/CorrelationModal';
import ShareModal from './components/ShareModal';
import DoctorVisitsModal from './components/DoctorVisitsModal';
import DataMigrationModal from './components/DataMigrationModal';
import LogInput from './components/LogInput';
import DailyLogList from './components/DailyLogList';
import AssistantReminder from './components/AssistantReminder';
import ThemeSwitcher from './components/ThemeSwitcher';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
    const [allLogs, setAllLogs] = useState<DailyLogs>(() => storageService.getLogs());
    const [medications, setMedications] = useState<Medication[]>(() => storageService.getMedications());
    const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>(() => storageService.getDoctorVisits());

    const [currentLog, setCurrentLog] = useState('');
    const [currentWeight, setCurrentWeight] = useState('');
    const [currentLogType, setCurrentLogType] = useState<LogType>(LogType.Food);
    
    const [selectedDate, setSelectedDate] = useState(getTodayDateString);

    const [suggestions, setSuggestions] = useState<{ food: string; exercise: string } | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

    const [isMedModalOpen, setIsMedModalOpen] = useState(false);
    const [isCorrelationModalOpen, setIsCorrelationModalOpen] = useState(false);
    const [isDoctorVisitsModalOpen, setIsDoctorVisitsModalOpen] = useState(false);
    const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
    
    // Mobile Export Detection
    const isExportMode = window.location.search.includes('export=true');

    const copyMobileData = () => {
        const data = storageService.exportAllData();
        navigator.clipboard.writeText(data);
        alert("Data copied! Now go back to the NEW app and paste it.");
    };

    if (isExportMode) {
        return (
            <div className="min-h-screen bg-brand-primary p-8 flex flex-col items-center justify-center text-center text-white">
                <h1 className="text-3xl font-bold mb-4">Export Tracey's Data</h1>
                <p className="mb-8 opacity-90">Tap the button below to copy all your health history from this old version.</p>
                <button 
                    onClick={copyMobileData}
                    className="w-full max-w-xs py-4 bg-white text-brand-primary rounded-2xl font-black shadow-2xl active:scale-95 transition-transform text-lg"
                >
                    📋 COPY MY DATA
                </button>
                <p className="mt-8 text-xs opacity-70">After tapping, open the new app and paste the data into the Transfer section.</p>
            </div>
        );
    }
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editingLogContent, setEditingLogContent] = useState('');

    const [isApiKeySet] = useState(!!process.env.GEMINI_API_KEY);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareModalType, setShareModalType] = useState<'medications' | 'history' | null>(null);

    // Reminder States
    const [activeTimers, setActiveTimers] = useState<{ id: string; target: number; action: string; medication: string; minutes: number }[]>(() => {
        const saved = localStorage.getItem('active_health_timers');
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return parsed.filter((t: any) => t.target > Date.now());
    });
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    useEffect(() => {
        localStorage.setItem('active_health_timers', JSON.stringify(activeTimers));
    }, [activeTimers]);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    const today = getTodayDateString();
    const selectedDateLogs = allLogs[selectedDate] || [];
    const isFutureDate = selectedDate > today;

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                const result = await geminiService.getDailySuggestions();
                setSuggestions(result);
            } catch (error) {
                setSuggestions(null);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };
        if (isApiKeySet) fetchSuggestions();
    }, [isApiKeySet]);

    // UI-only Timer refresh logic + Foreground Notification Fallback
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setActiveTimers(prev => {
                const expired = prev.filter(t => t.target <= now);
                if (expired.length > 0) {
                    expired.forEach(e => {
                        const message = `Tracey, you took ${e.medication || 'your meds'} ${e.minutes || 'some'} minutes ago and now it's time to ${e.action}`;
                        
                        if (Notification.permission === "granted") {
                             if ('serviceWorker' in navigator) {
                                 navigator.serviceWorker.ready.then(reg => {
                                     reg.showNotification("Health Assistant", { 
                                        body: message,
                                        icon: '/vite.svg',
                                        badge: '/vite.svg',
                                        tag: e.id,
                                        requireInteraction: true
                                     }).catch(() => {
                                        new Notification("Health Assistant", { body: message, icon: '/vite.svg' });
                                     });
                                 }).catch(() => {
                                     new Notification("Health Assistant", { body: message, icon: '/vite.svg' });
                                 });
                             } else {
                                 new Notification("Health Assistant", { body: message, icon: '/vite.svg' });
                             }
                        } else {
                            try {
                                alert(`⏰ REMINDER: ${message}`);
                            } catch (e) {}
                        }
                    });
                    return prev.filter(t => t.target > now);
                }
                return prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSetAssistantReminder = async (medication: string, minutes: number, action: string) => {
        // Instant local creation for reliability (bypassing AI latency as requested)
        setTimeout(() => {
            const delayMs = minutes * 60 * 1000;
            const target = Date.now() + delayMs;
            const timerId = Date.now().toString();
            
            setActiveTimers(prev => [...prev, { id: timerId, target, action, medication, minutes }]);
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    const worker = registration.active || registration.installing || registration.waiting;
                    if (worker) {
                        worker.postMessage({
                            type: 'SCHEDULE_NOTIFICATION',
                            title: "Health Assistant",
                            body: `Tracey, you took ${medication} ${minutes} minutes ago and now it's time to ${action}`,
                            delayMs: delayMs,
                            tag: timerId
                        });
                    }
                });
            }
            
            console.log(`✅ SUCCESS: Local reminder set for ${action} in ${minutes} minutes.`);
        }, 300); // Tiny delay for UI feel
    };

    const adjustDate = (dateString: string, days: number): string => {
        const date = new Date(dateString);
        date.setUTCHours(12, 0, 0, 0);
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().split('T')[0];
    };

    const handlePreviousDay = () => setSelectedDate(prevDate => adjustDate(prevDate, -1));
    const handleNextDay = () => {
        const nextDay = adjustDate(selectedDate, 1);
        if (nextDay <= today) setSelectedDate(nextDay);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (newDate <= today) setSelectedDate(newDate);
    };

    const handleAddLog = () => {
        let content = '';
        if (currentLogType === LogType.Weight) {
            if (currentWeight.trim() === '' || isNaN(Number(currentWeight)) || Number(currentWeight) <= 0) {
                alert('Please enter a valid weight.');
                return;
            }
            content = `${currentWeight} lbs`;
        } else {
            if (currentLog.trim() === '') return;
            content = currentLog;
        }

        const newLog: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            type: currentLogType,
            content: content,
        };

        const updatedLogsForDate = [...selectedDateLogs, newLog];
        const updatedAllLogs = { ...allLogs, [selectedDate]: updatedLogsForDate };
        setAllLogs(updatedAllLogs);
        storageService.saveLogs(updatedAllLogs);
        setCurrentLog('');
        setCurrentWeight('');
    };

    const handleDeleteLog = (id: string) => {
        const updatedLogsForDate = selectedDateLogs.filter(log => log.id !== id);
        const updatedAllLogs = { ...allLogs, [selectedDate]: updatedLogsForDate };
        setAllLogs(updatedAllLogs);
        storageService.saveLogs(updatedAllLogs);
    }
    
    const handleSaveMedications = (meds: Medication[]) => {
        setMedications(meds);
        storageService.saveMedications(meds);
    };

    const handleSaveDoctorVisit = async (visit: DoctorVisit) => {
        let summary = visit.aiSummary;
        if (visit.details && isApiKeySet) {
             const existing = doctorVisits.find(v => v.id === visit.id);
             if (!existing || existing.details !== visit.details) {
                 summary = await geminiService.summarizeDoctorVisit(visit.details);
             }
        }
        const updatedVisit = { ...visit, aiSummary: summary };
        const existingIndex = doctorVisits.findIndex(v => v.id === visit.id);
        let updatedVisits;
        if (existingIndex >= 0) {
            updatedVisits = [...doctorVisits];
            updatedVisits[existingIndex] = updatedVisit;
        } else {
            updatedVisits = [...doctorVisits, updatedVisit];
        }
        setDoctorVisits(updatedVisits);
        storageService.saveDoctorVisits(updatedVisits);
    };

    const handleAnalyzeSymptoms = async () => {
        setIsCorrelationModalOpen(true);
        if (!isApiKeySet) {
            setAnalysisResult('AI features require an API key.');
            setIsAnalyzing(false);
            return;
        }
        setIsAnalyzing(true);
        try {
            const result = await geminiService.getSymptomCorrelation(allLogs);
            setAnalysisResult(result);
        } catch (error: any) {
            setAnalysisResult('Error during analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleEditLogStart = (log: LogEntry) => {
        setEditingLogId(log.id);
        setEditingLogContent(log.type === LogType.Weight ? log.content.replace(/\s*lbs/i, '') : log.content);
    };

    const handleEditLogCancel = () => {
        setEditingLogId(null);
        setEditingLogContent('');
    };

    const handleUpdateLog = () => {
        if (!editingLogId) return;
        const updatedLogsForDate = selectedDateLogs.map(log => {
            if (log.id === editingLogId) {
                let newContent = editingLogContent.trim();
                if (log.type === LogType.Weight) {
                    if (newContent === '' || isNaN(Number(newContent)) || Number(newContent) <= 0) return log;
                    newContent = `${newContent} lbs`;
                }
                return { ...log, content: newContent || log.content };
            }
            return log;
        });
        const updatedAllLogs = { ...allLogs, [selectedDate]: updatedLogsForDate };
        setAllLogs(updatedAllLogs);
        storageService.saveLogs(updatedAllLogs);
        handleEditLogCancel();
    };

    const handleOpenShareModal = (type: 'medications' | 'history') => {
      setShareModalType(type);
      setIsShareModalOpen(true);
      if (type === 'medications') setIsMedModalOpen(false);
    };

    const handleCloseShareModal = () => {
      setIsShareModalOpen(false);
      setTimeout(() => setShareModalType(null), 300);
    };
    
    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="min-h-screen text-brand-text-primary dark:text-gray-100 p-4 md:p-8 bg-slate-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-brand-text-primary dark:text-white">Tracey's Health Journey</h1>
                        <p className="text-brand-text-secondary dark:text-gray-400 mt-1">A daily companion for managing health and gastroparesis.</p>
                    </div>
                    <ThemeSwitcher />
                </header>

                <div className="mt-2 mb-8 flex flex-wrap items-center gap-2">
                    <button onClick={() => setIsMedModalOpen(true)} className="px-3 py-2 bg-brand-primary text-white rounded-lg shadow-sm hover:bg-opacity-90 transition flex items-center gap-1.5 text-sm font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a5 5 0 015 5v6a5 5 0 01-10 0V7a5 5 0 015-5z" />
                            <path fillRule="evenodd" d="M10 4a3 3 0 00-3 3v6a3 3 0 006 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        Meds
                    </button>
                    <button onClick={() => setIsDoctorVisitsModalOpen(true)} className="px-3 py-2 bg-purple-500 text-white rounded-lg shadow-sm hover:bg-opacity-90 transition flex items-center gap-1.5 text-sm font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01" />
                        </svg>
                        Appt
                    </button>
                    <button onClick={handleAnalyzeSymptoms} disabled={!isApiKeySet} className="px-3 py-2 bg-brand-accent text-white rounded-lg shadow-sm hover:bg-opacity-90 transition disabled:bg-gray-400 flex items-center gap-1.5 text-sm font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        Analyze
                    </button>
                    <button onClick={() => handleOpenShareModal('history')} className="px-3 py-2 bg-gray-600 text-white rounded-lg shadow-sm hover:bg-opacity-90 transition flex items-center gap-1.5 text-sm font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                        Share
                    </button>
                </div>
                
                <div className="bg-brand-surface dark:bg-gray-800 p-4 rounded-xl shadow-md mb-8 flex flex-wrap items-center justify-center gap-4 transition-colors duration-200">
                    <button onClick={handlePreviousDay} className="px-4 py-2 bg-brand-primary-light text-brand-text-primary rounded-lg shadow hover:bg-brand-primary/50 transition">&larr; Previous Day</button>
                    <input type="date" value={selectedDate} onChange={handleDateChange} max={today} className="p-2 border rounded-lg text-center bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-black" aria-label="Select a date" />
                    <button onClick={handleNextDay} disabled={selectedDate >= today} className="px-4 py-2 bg-brand-primary-light text-brand-text-primary rounded-lg shadow hover:bg-brand-primary/50 transition disabled:bg-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-500">Next Day &rarr;</button>
                </div>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 space-y-8">
                        
                        <AssistantReminder 
                            activeTimers={activeTimers}
                            isApiKeySet={isApiKeySet}
                            notificationPermission={notificationPermission}
                            onRequestPermission={requestNotificationPermission}
                            onSetReminder={handleSetAssistantReminder}
                        />

                        {/* Log Entry Section */}
                        <fieldset disabled={isFutureDate} className="bg-brand-surface dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors duration-200">
                             <legend className="text-2xl font-semibold mb-4 px-2 dark:text-white">{`Add Entry for ${selectedDate === today ? 'Today' : displayDate}`}</legend>
                            {isFutureDate ? (
                                <p className="text-brand-text-secondary dark:text-gray-400 text-center p-8">Logs are only for today or the past.</p>
                            ) : (
                            <>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(Object.values(LogType)).map((key) => (
                                        <button key={key} onClick={() => setCurrentLogType(key)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${currentLogType === key ? 'bg-brand-primary text-white shadow' : 'bg-gray-100 text-brand-text-secondary dark:bg-gray-700 dark:text-gray-300'}`}>{key}</button>
                                    ))}
                                </div>
                                <LogInput currentLogType={currentLogType} currentLog={currentLog} setCurrentLog={setCurrentLog} currentWeight={currentWeight} setCurrentWeight={setCurrentWeight} />
                                <button onClick={handleAddLog} className="px-6 py-2 bg-brand-secondary text-white rounded-lg shadow hover:bg-opacity-90 transition flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Entry
                                </button>
                            </>
                            )}
                        </fieldset>

                        <DailyLogList 
                            logs={selectedDateLogs}
                            selectedDate={selectedDate}
                            today={today}
                            onEdit={handleEditLogStart}
                            onDelete={handleDeleteLog}
                        />

                        {/* Edit Log Modal/Overlay (Inline for now) */}
                         {editingLogId && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
                                    <h3 className="text-lg font-bold mb-4 dark:text-white">Edit Entry</h3>
                                     <textarea
                                        value={editingLogContent}
                                        onChange={(e) => setEditingLogContent(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary transition mb-4 min-h-[100px] bg-white text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={handleEditLogCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg">Cancel</button>
                                        <button onClick={handleUpdateLog} className="px-4 py-2 bg-brand-primary text-white rounded-lg">Save</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-8">
                        <div className="bg-brand-surface dark:bg-gray-800 p-6 rounded-xl shadow-md sticky top-8 transition-colors duration-200">
                             <h2 className="text-2xl font-semibold mb-4 dark:text-white">Daily Suggestions</h2>
                            {isLoadingSuggestions ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div> : suggestions ? (
                                <div className="space-y-6">
                                    <div><h3 className="text-lg font-bold text-brand-secondary mb-2">🍽️ Food Ideas</h3><p className="text-brand-text-secondary dark:text-gray-300 whitespace-pre-line">{suggestions.food}</p></div>
                                    <div className="border-t pt-4 dark:border-gray-700"><h3 className="text-lg font-bold text-brand-accent mb-2">🏃‍♀️ Exercise Ideas</h3><p className="text-brand-text-secondary dark:text-gray-300 whitespace-pre-line">{suggestions.exercise}</p></div>
                                </div>
                            ) : <p className="text-brand-danger">Suggestions unavailable.</p>}
                        </div>
                    </aside>
                </main>
            </div>

            <MedicationModal isOpen={isMedModalOpen} onClose={() => setIsMedModalOpen(false)} medications={medications} onSave={handleSaveMedications} onShare={() => handleOpenShareModal('medications')} />
            <DoctorVisitsModal isOpen={isDoctorVisitsModalOpen} onClose={() => setIsDoctorVisitsModalOpen(false)} visits={doctorVisits} onSave={handleSaveDoctorVisit} />
            <CorrelationModal isOpen={isCorrelationModalOpen} onClose={() => setIsCorrelationModalOpen(false)} isLoading={isAnalyzing} analysisResult={analysisResult} />
            <ShareModal isOpen={isShareModalOpen} onClose={handleCloseShareModal} shareType={shareModalType} medications={medications} allLogs={allLogs} onImportClick={() => setIsMigrationModalOpen(true)} />
            <DataMigrationModal isOpen={isMigrationModalOpen} onClose={() => setIsMigrationModalOpen(false)} onImportSuccess={() => setAllLogs(storageService.getLogs())} />
        </div>
    );
};

export default App;