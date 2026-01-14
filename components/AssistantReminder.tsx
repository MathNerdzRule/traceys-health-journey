import React, { useState } from 'react';

interface AssistantReminderProps {
    activeTimers: { id: string; target: number; action: string; medication: string; minutes: number }[];
    isApiKeySet: boolean;
    notificationPermission: NotificationPermission;
    onRequestPermission: () => void;
    onSetReminder: (medication: string, minutes: number, action: string) => Promise<void>;
}

const AssistantReminder: React.FC<AssistantReminderProps> = ({ activeTimers, isApiKeySet, notificationPermission, onRequestPermission, onSetReminder }) => {
    const [remMed, setRemMed] = useState('');
    const [remTime, setRemTime] = useState('30');
    const [remAction, setRemAction] = useState('Eat my meal');
    const [isSettingReminder, setIsSettingReminder] = useState(false);

    const handleSet = async () => {
         if (!remMed.trim() || !remAction.trim()) {
            alert("Please tell the assistant what you took and what you need to do.");
            return;
        }
        setIsSettingReminder(true);
        await onSetReminder(remMed, parseInt(remTime) || 30, remAction);
        setRemMed('');
        setIsSettingReminder(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-2 border-brand-primary/10 relative overflow-hidden bg-gradient-to-br from-white to-brand-primary/5 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 dark:fill-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.959-.44-2.615-1.141l-.547-.547z" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-between gap-2 text-brand-primary dark:text-brand-primary-light">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-brand-primary/10 rounded-lg">✨</span>
                    Assistant Reminder
                </div>
                <div className="flex items-center gap-2">
                    {notificationPermission !== 'granted' && (
                        <button onClick={onRequestPermission} className="text-[10px] px-2 py-1 bg-brand-danger/10 text-brand-danger border border-brand-danger/20 rounded-full hover:bg-brand-danger/20 transition">
                            Enable Notifications 🔔
                        </button>
                    )}
                </div>
            </h2>
            <p className="text-sm text-brand-text-secondary dark:text-gray-400 mb-6">Tracey, use this to set smart medical timers. These work best if you "Add to Home Screen."</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-primary dark:text-brand-primary-light uppercase tracking-widest ml-1">Medication</label>
                    <input value={remMed} onChange={e => setRemMed(e.target.value)} placeholder="e.g. Prucalopride" className="w-full p-3 border-2 border-brand-primary/10 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:border-brand-primary outline-none transition text-sm" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-primary dark:text-brand-primary-light uppercase tracking-widest ml-1">Wait Time (Mins)</label>
                    <input type="number" value={remTime} onChange={e => setRemTime(e.target.value)} className="w-full p-3 border-2 border-brand-primary/10 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:border-brand-primary outline-none transition text-sm" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-primary dark:text-brand-primary-light uppercase tracking-widest ml-1">Next Action</label>
                    <input value={remAction} onChange={e => setRemAction(e.target.value)} placeholder="e.g. Have a small snack" className="w-full p-3 border-2 border-brand-primary/10 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:border-brand-primary outline-none transition text-sm" />
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                    onClick={handleSet} 
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
                                <div key={t.id} className="flex items-center gap-2 bg-brand-secondary/10 text-brand-secondary dark:text-brand-secondary dark:bg-brand-secondary/20 px-4 py-2 rounded-xl text-xs font-bold border border-brand-secondary/20 shadow-sm">
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
    );
};

export default AssistantReminder;
