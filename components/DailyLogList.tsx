import React from 'react';
import { LogEntry, LogType } from '../types';
import LogTypeIcon from './LogTypeIcon';

interface DailyLogListProps {
    logs: LogEntry[];
    selectedDate: string;
    today: string;
    onEdit: (log: LogEntry) => void;
    onDelete: (id: string) => void;
}

const DailyLogList: React.FC<DailyLogListProps> = ({ logs, selectedDate, today, onEdit, onDelete }) => {
    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const logOrder = Object.values(LogType);
    const groupedLogs = logOrder
        .map(logType => ({
            type: logType,
            logs: logs
                .filter(log => log.type === logType)
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
        }))
        .filter(group => group.logs.length > 0);

    return (
        <div className="bg-brand-surface p-6 rounded-xl shadow-md dark:bg-gray-800 dark:text-white transition-colors duration-200">
            <h2 className="text-2xl font-semibold mb-4">{selectedDate === today ? "Today's Log" : `Log for ${displayDate}`}</h2>
            <div className="space-y-4">
                {groupedLogs.length > 0 ? (
                    groupedLogs.map(group => (
                        <div key={group.type}>
                            <h3 className="text-lg font-bold text-brand-text-primary dark:text-gray-200 mb-2 capitalize">{group.type}</h3>
                            <ul className="space-y-3">
                                {group.logs.map(log => (
                                    <li key={log.id} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                                        <div className="flex-shrink-0 pt-1"><LogTypeIcon type={log.type} /></div>
                                        <div className="flex-grow cursor-pointer" onClick={() => onEdit(log)}>
                                            <p className="text-brand-text-secondary dark:text-gray-300 whitespace-pre-wrap">{log.content}</p>
                                            <p className="text-xs text-brand-text-secondary/60 dark:text-gray-400 mt-1">{log.timestamp}</p>
                                        </div>
                                        <button onClick={() => onDelete(log.id)} className="text-gray-400 hover:text-brand-danger transition ml-auto"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : <p className="text-brand-text-secondary dark:text-gray-400">No entries recorded yet.</p>}
            </div>
        </div>
    );
};

export default DailyLogList;
