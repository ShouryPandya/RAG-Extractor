import React from 'react';
import { HistoryIcon } from './HistoryIcon';

interface SearchHistoryProps {
    history: string[];
    onHistoryClick: (query: string) => void;
    onClearHistory: () => void;
    disabled: boolean;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onHistoryClick, onClearHistory, disabled }) => {
    return (
        <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-slate-400" />
                    Search History
                </h2>
                {history.length > 0 && (
                    <button
                        onClick={onClearHistory}
                        disabled={disabled}
                        className="text-sm text-slate-400 hover:text-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>
            {history.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Your search history will appear here.</p>
            ) : (
                <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    <ul className="space-y-1">
                        {history.map((query, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => onHistoryClick(query)}
                                    disabled={disabled}
                                    className="w-full text-left p-2 rounded text-sm text-slate-300 truncate bg-slate-700/50 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    title={query}
                                >
                                    {query}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};