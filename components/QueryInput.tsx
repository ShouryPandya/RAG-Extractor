import React from 'react';

interface QueryInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const QueryInput: React.FC<QueryInputProps> = ({ query, onQueryChange, onSearch, isLoading }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSearch();
    }
  };
    
  return (
    <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-lg">
      <h2 className="text-lg font-semibold text-slate-200 mb-3">Your Question</h2>
      <textarea
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., What are the supported output formats for BI Publisher?"
        className="w-full h-24 p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-colors duration-200 resize-none disabled:opacity-50"
        disabled={isLoading}
        aria-label="Your question"
      />
      <button
        onClick={onSearch}
        disabled={isLoading || !query.trim()}
        className="w-full mt-3 px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          'Generate Answer'
        )}
      </button>
    </div>
  );
};