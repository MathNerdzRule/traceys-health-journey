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

const getTodayDateString = () => new Date().toISOString().split('T')[0];

interface LogInputProps {
    currentLogType: LogType;
    currentLog: string;
    setCurrentLog: (value: string) => void;
    currentWeight: string;
    setCurrentWeight: (value: string) => void;
}

const LogInput: React.FC<LogInputProps> = ({ currentLogType, currentLog, setCurrentLog, currentWeight, setCurrentWeight }) => {
    if (currentLogType === LogType.Weight) {
        return (
             <input
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="Enter weight in lbs"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary transition mb-4 bg-white text-black"
                aria-label="Weight in pounds"
            />
        );
    }
    return (
        <textarea
            value={currentLog}
            onChange={(e) => setCurrentLog(e.target.value)}
            placeholder={`What ${currentLogType.toLowerCase()} are you logging?`}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary transition mb-4 min-h-[100px] bg-white text-black"
        />
    );
};

const LogTypeIcon: React.FC<{ type: LogType }> = ({ type }) => {
    const icons = {
        [LogType.Food]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-2a4 4 0 014-4h10a4 4 0 014 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11V9a4 4 0 014-4h10a4 4 0 014 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21v-4" /></svg>,
        [LogType.Symptom]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        [LogType.Medication]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.875 12.375h8.25" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7.875v8.25" /><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z" clipRule="evenodd" /></svg>,
        [LogType.Weight]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v-3m0 3h3m-3 0l-3-3m10.293-2.293a8 8 0 10-11.314 11.314 8 8 0 0011.314-11.314z" /></svg>,
        [LogType.Journal]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm-2.5 6.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm2.5 0a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm2.5-6.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm-2.5 12.5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0-6.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" /><path d="M19.5 7.5v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h9a3 3 0 013 3z" /></svg>,
    };
    const colors = {
        [LogType.Food]: 'bg-brand-secondary/20 text-brand-secondary',
        [LogType.Symptom]: 'bg-brand-danger/20 text-brand-danger',
        [LogType.Medication]: 'bg-brand-primary/20 text-brand-primary',
        [LogType.Weight]: 'bg-brand-accent/20 text-brand-accent',
        [LogType.Journal]: 'bg-purple-500/20 text-purple-600',
    };
    return <div className={`p-2 rounded-full ${colors[type]}`}>{icons[type]}</div>;
};

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
    const [suggestionsError, setSuggestionsError] = useState('');

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
    const [remMed, setRemMed] = useState('');
    const [remTime, setRemTime] = useState('30');
    const [remAction, setRemAction] = useState('Eat my meal');
    const [isSettingReminder, setIsSettingReminder] = useState(false);
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
                             // Attempt to show the banner
                             if ('serviceWorker' in navigator) {
                                 navigator.serviceWorker.ready.then(reg => {
                                     reg.showNotification("Health Assistant", { 
                                        body: message,
                                        icon: '/vite.svg',
                                        badge: '/vite.svg',
                                        tag: e.id,
                                        requireInteraction: true,
                                        vibrate: [200, 100, 200]
                                     }).catch(() => {
                                        // Fallback to basic notification if SW fails
                                        new Notification("Health Assistant", { body: message, icon: '/vite.svg' });
                                     });
                                 });
                             } else {
                                 new Notification("Health Assistant", { body: message, icon: '/vite.svg' });
                             }
                        } else {
                            // ONLY alert if they haven't enabled notifications
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

    const handleSetAssistantReminder = async () => {
        if (!remMed.trim() || !remAction.trim()) {
            alert("Please tell the assistant what you took and what you need to do.");
            return;
        }

        if (Notification.permission !== "granted") {
            await Notification.requestPermission();
        }

        setIsSettingReminder(true);
        
        // Instant local creation for reliability (bypassing AI latency as requested)
        setTimeout(() => {
            const minutes = parseInt(remTime) || 30;
            const delayMs = minutes * 60 * 1000;
            const target = Date.now() + delayMs;
            const timerId = Date.now().toString();
            const medication = remMed || 'Medication';
            const action = remAction || 'Next Step';
            const minutesVal = minutes;
            
            setActiveTimers(prev => [...prev, { id: timerId, target, action, medication, minutes: minutesVal }]);
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    const worker = registration.active || registration.installing || registration.waiting;
                    if (worker) {
                        worker.postMessage({
                            type: 'SCHEDULE_NOTIFICATION',
                            title: "Health Assistant",
                            body: `Tracey, you took ${medication} ${minutesVal} minutes ago and now it's time to ${action}`,
                            delayMs: delayMs,
                            tag: timerId
                        });
                    }
                });
            }
            
            setRemMed('');
            console.log(`✅ SUCCESS: Local reminder set for ${action} in ${minutes} minutes.`);
            setIsSettingReminder(false);
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
    
    const logOrder = Object.values(LogType);
    const groupedLogs = logOrder
        .map(logType => ({
            type: logType,
            logs: selectedDateLogs
                .filter(log => log.type === logType)
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
        }))
        .filter(group => group.logs.length > 0);
    
    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="min-h-screen text-brand-text-primary p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-brand-text-primary">Tracey's Health Journey</h1>
                    <p className="text-brand-text-secondary mt-1">A daily companion for managing health and gastroparesis.</p>
                    <div className="mt-6 flex flex-wrap items-center gap-2">
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
                </header>
                
                <div className="bg-brand-surface p-4 rounded-xl shadow-md mb-8 flex flex-wrap items-center justify-center gap-4">
                    <button onClick={handlePreviousDay} className="px-4 py-2 bg-brand-primary-light text-brand-text-primary rounded-lg shadow hover:bg-brand-primary/50 transition">&larr; Previous Day</button>
                    <input type="date" value={selectedDate} onChange={handleDateChange} max={today} className="p-2 border rounded-lg text-center bg-white text-black" aria-label="Select a date" />
                    <button onClick={handleNextDay} disabled={selectedDate >= today} className="px-4 py-2 bg-brand-primary-light text-brand-text-primary rounded-lg shadow hover:bg-brand-primary/50 transition disabled:bg-gray-200">Next Day &rarr;</button>
                </div>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 space-y-8">
                        
                        {/* Gemini Assistant Smart Reminder Section */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-brand-primary/10 relative overflow-hidden bg-gradient-to-br from-white to-brand-primary/5">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.959-.44-2.615-1.141l-.547-.547z" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2 flex items-center justify-between gap-2 text-brand-primary">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-brand-primary/10 rounded-lg">✨</span>
                                    Assistant Reminder
                                </div>
                                <div className="flex items-center gap-2">
                                    {notificationPermission !== 'granted' && (
                                        <button onClick={requestNotificationPermission} className="text-[10px] px-2 py-1 bg-brand-danger/10 text-brand-danger border border-brand-danger/20 rounded-full hover:bg-brand-danger/20 transition">
                                            Enable Notifications 🔔
                                        </button>
                                    )}
                                </div>
                            </h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Tracey, use this to set smart medical timers. These work best if you "Add to Home Screen."</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest ml-1">Medication</label>
                                    <input value={remMed} onChange={e => setRemMed(e.target.value)} placeholder="e.g. Prucalopride" className="w-full p-3 border-2 border-brand-primary/10 rounded-xl bg-white focus:border-brand-primary outline-none transition text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest ml-1">Wait Time (Mins)</label>
                                    <input type="number" value={remTime} onChange={e => setRemTime(e.target.value)} className="w-full p-3 border-2 border-brand-primary/10 rounded-xl bg-white focus:border-brand-primary outline-none transition text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest ml-1">Next Action</label>
                                    <input value={remAction} onChange={e => setRemAction(e.target.value)} placeholder="e.g. Have a small snack" className="w-full p-3 border-2 border-brand-primary/10 rounded-xl bg-white focus:border-brand-primary outline-none transition text-sm" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button 
                                    onClick={handleSetAssistantReminder} 
                                    disabled={isSettingReminder || !isApiKeySet} 
                                    className="w-full sm:w-auto px-8 py-3 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-3 font-bold"
                                >
                                    {isSettingReminder ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                            <span>Creating Reminder...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                                            Set Assistant Reminder
                                        </>
                                    )}
                                </button>

                                {activeTimers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left duration-300">
                                        {activeTimers.map(t => {
                                            const remaining = Math.max(0, Math.ceil((t.target - Date.now()) / 60000));
                                            return (
                                                <div key={t.id} className="flex items-center gap-2 bg-brand-secondary/10 text-brand-secondary px-4 py-2 rounded-xl text-xs font-bold border border-brand-secondary/20 shadow-sm">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-secondary"></span>
                                                    </span>
                                                    {t.action} in {remaining}m
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Log Entry Section */}
                        <fieldset disabled={isFutureDate} className="bg-brand-surface p-6 rounded-xl shadow-md">
                             <legend className="text-2xl font-semibold mb-4 px-2">{`Add Entry for ${selectedDate === today ? 'Today' : displayDate}`}</legend>
                            {isFutureDate ? (
                                <p className="text-brand-text-secondary text-center p-8">Logs are only for today or the past.</p>
                            ) : (
                            <>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(Object.values(LogType)).map((key) => (
                                        <button key={key} onClick={() => setCurrentLogType(key)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${currentLogType === key ? 'bg-brand-primary text-white shadow' : 'bg-gray-100 text-brand-text-secondary'}`}>{key}</button>
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

                        {/* Logs List */}
                        <div className="bg-brand-surface p-6 rounded-xl shadow-md">
                            <h2 className="text-2xl font-semibold mb-4">{selectedDate === today ? "Today's Log" : `Log for ${displayDate}`}</h2>
                            <div className="space-y-4">
                                {groupedLogs.length > 0 ? (
                                    groupedLogs.map(group => (
                                        <div key={group.type}>
                                            <h3 className="text-lg font-bold text-brand-text-primary mb-2 capitalize">{group.type}</h3>
                                            <ul className="space-y-3">
                                                {group.logs.map(log => (
                                                    <li key={log.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-shrink-0 pt-1"><LogTypeIcon type={log.type} /></div>
                                                        <div className="flex-grow cursor-pointer" onClick={() => handleEditLogStart(log)}>
                                                            <p className="text-brand-text-secondary whitespace-pre-wrap">{log.content}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{log.timestamp}</p>
                                                        </div>
                                                        <button onClick={() => handleDeleteLog(log.id)} className="text-gray-400 hover:text-brand-danger transition ml-auto"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))
                                ) : <p className="text-brand-text-secondary">No entries recorded yet.</p>}
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-8">
                        <div className="bg-brand-surface p-6 rounded-xl shadow-md sticky top-8">
                             <h2 className="text-2xl font-semibold mb-4">Daily Suggestions</h2>
                            {isLoadingSuggestions ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div> : suggestions ? (
                                <div className="space-y-6">
                                    <div><h3 className="text-lg font-bold text-brand-secondary mb-2">🍽️ Food Ideas</h3><p className="text-brand-text-secondary whitespace-pre-line">{suggestions.food}</p></div>
                                    <div className="border-t pt-4"><h3 className="text-lg font-bold text-brand-accent mb-2">🏃‍♀️ Exercise Ideas</h3><p className="text-brand-text-secondary whitespace-pre-line">{suggestions.exercise}</p></div>
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