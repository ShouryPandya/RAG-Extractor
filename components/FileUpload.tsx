import React, { useCallback } from 'react';
import { FileIcon } from './icons/FileIcon';
import { UploadIcon } from './icons/UploadIcon';
import { PreviewIcon } from './icons/PreviewIcon';
import { formatFileSize } from '../utils';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onClearFiles: () => void;
  isIndexing: boolean;
  onPreview: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange, onClearFiles, isIndexing, onPreview }) => {

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesChange(Array.from(e.dataTransfer.files));
    }
  }, [onFilesChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesChange(Array.from(e.target.files));
      // Reset the input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  return (
    <div 
      className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-lg flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-slate-200">Documents</h2>
        {files.length > 0 && (
          <button
            onClick={onClearFiles}
            disabled={isIndexing}
            className="text-sm text-slate-400 hover:text-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {files.length === 0 && !isIndexing ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-4">
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="hidden"
              id="file-upload"
              disabled={isIndexing}
              accept=".docx,.txt,.md"
            />
            <label htmlFor="file-upload" className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center cursor-pointer">
              <UploadIcon className="w-5 h-5 mr-2" />
              Upload Documents
            </label>
            <p className="text-xs text-slate-500 mt-3">or drag and drop files</p>
            <p className="text-xs text-slate-500 mt-1">Supports: .docx, .txt, .md</p>
        </div>
      ) : (
        <div className="flex-grow">
          <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
            <h3>
              {isIndexing 
                ? 'Processing...' 
                : `${files.length} document${files.length > 1 ? 's' : ''} indexed`
              }
            </h3>
            {isIndexing && (
                <svg className="animate-spin h-4 w-4 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
          </div>
          <div className={`max-h-48 overflow-y-auto pr-2 custom-scrollbar ${isIndexing ? 'opacity-50' : ''}`}>
            <ul className="space-y-1">
            {files.map((file, index) => {
              const isDocx = file.name.toLowerCase().endsWith('.docx');
              return (
                <li key={index} className="flex items-center justify-between bg-slate-700/50 p-2 rounded text-sm text-slate-300 truncate">
                  <div className="flex items-center truncate">
                    <FileIcon className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
                    <span className="truncate" title={file.name}>{file.name}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0 ml-2">
                    {isDocx && (
                      <button 
                        onClick={() => onPreview(file)} 
                        disabled={isIndexing}
                        className="p-1 rounded-full hover:bg-slate-600 transition-colors mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Preview ${file.name}`}
                        title="Preview file"
                      >
                        <PreviewIcon className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                    <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                  </div>
                </li>
              );
            })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};