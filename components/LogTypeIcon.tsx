import React from 'react';
import { LogType } from '../types';

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

export default LogTypeIcon;
