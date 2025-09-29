import React from 'react';
import type { SearchMode } from '../App';

interface SearchModeSelectorProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  disabled: boolean;
}

const modes: { id: SearchMode; label: string; description: string }[] = [
  { id: 'combined', label: 'Smart Combined', description: 'Searches documents and the web.' },
  { id: 'docs', label: 'Internal Docs Only', description: 'Searches only uploaded documents.' },
  { id: 'web', label: 'External Web Only', description: 'Searches only the web.' },
];

export const SearchModeSelector: React.FC<SearchModeSelectorProps> = ({ mode, onModeChange, disabled }) => {
  return (
    <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-lg">
      <h2 className="text-lg font-semibold text-slate-200 mb-3">Search Mode</h2>
      <fieldset className="space-y-3" disabled={disabled} aria-label="Search Mode">
        <legend className="sr-only">Select a search mode</legend>
        {modes.map((option) => (
          <label
            key={option.id}
            htmlFor={option.id}
            className={`flex items-start p-3 rounded-md border transition-all cursor-pointer ${
              mode === option.id
                ? 'bg-sky-900/50 border-sky-600'
                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-700/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              id={option.id}
              name="search-mode"
              value={option.id}
              checked={mode === option.id}
              onChange={() => onModeChange(option.id)}
              className="mt-1 h-4 w-4 text-sky-600 bg-slate-700 border-slate-500 focus:ring-sky-500"
            />
            <div className="ml-3 text-sm">
              <span className={`font-medium ${mode === option.id ? 'text-sky-300' : 'text-slate-300'}`}>
                {option.label}
              </span>
              <p className="text-slate-400">{option.description}</p>
            </div>
          </label>
        ))}
      </fieldset>
    </div>
  );
};