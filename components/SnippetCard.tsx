
import React from 'react';
import { FileIcon } from './icons/FileIcon';
import { WebIcon } from './icons/WebIcon';

interface SnippetCardProps {
  snippet: string;
  source: string;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({ snippet, source }) => {
  const isWeb = /https?:\/\//.test(source);
  
  const borderColor = isWeb ? 'border-emerald-500/30' : 'border-sky-500/30';
  const iconBgColor = isWeb ? 'bg-emerald-500/10' : 'bg-sky-500/10';
  const iconTextColor = isWeb ? 'text-emerald-400' : 'text-sky-400';

  return (
    <div className={`bg-slate-800 rounded-lg border ${borderColor} shadow-sm transition-all hover:shadow-lg hover:border-slate-600`}>
      <div className="p-4">
        <blockquote className="text-slate-300 italic border-l-4 border-slate-600 pl-4">
          "{snippet}"
        </blockquote>
      </div>
      <div className="border-t border-slate-700 px-4 py-2">
        <div className="flex items-center text-sm text-slate-400">
          <div className={`mr-2 p-1 rounded-full ${iconBgColor}`}>
            {isWeb ? <WebIcon className={`w-4 h-4 ${iconTextColor}`} /> : <FileIcon className={`w-4 h-4 ${iconTextColor}`} />}
          </div>
          <span className="font-semibold mr-1">Source:</span>
          {isWeb ? (
            <a 
              href={source} 
              target="_blank" 
              rel="noopener noreferrer"
              className="truncate text-sky-400 hover:underline"
              title={source}
            >
              {source}
            </a>
          ) : (
            <span className="truncate" title={source}>{source}</span>
          )}
        </div>
      </div>
    </div>
  );
};