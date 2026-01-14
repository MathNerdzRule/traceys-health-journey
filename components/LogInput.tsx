import React from 'react';
import { LogType } from '../types';

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
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary transition mb-4 bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                aria-label="Weight in pounds"
            />
        );
    }
    return (
        <textarea
            value={currentLog}
            onChange={(e) => setCurrentLog(e.target.value)}
            placeholder={`What ${currentLogType.toLowerCase()} are you logging?`}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary transition mb-4 min-h-[100px] bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
    );
};

export default LogInput;
