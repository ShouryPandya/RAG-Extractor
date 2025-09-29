import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { LoadingSpinner } from './LoadingSpinner';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file }) => {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.name.toLowerCase().endsWith('.docx')) {
      setIsLoading(true);
      setError(null);
      setPreviewContent(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const arrayBuffer = event.target.result as ArrayBuffer;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setPreviewContent(result.value);
            if (result.messages && result.messages.length > 0) {
              console.warn("Mammoth messages:", result.messages);
            }
          } catch (err) {
            console.error("Error converting DOCX to HTML:", err);
            setError("Could not generate a preview for this file. It may be corrupted or in an unsupported format.");
          } finally {
            setIsLoading(false);
          }
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else if (file) {
      setError("Preview is only available for .docx files.");
      setIsLoading(false);
    }
  }, [file]);

  if (!isOpen || !file) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div
        className="bg-slate-900 w-full max-w-3xl h-[90vh] rounded-lg border border-slate-700 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 id="preview-modal-title" className="text-lg font-semibold text-slate-200 truncate pr-4" title={file.name}>
            Preview: {file.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-700 transition-colors"
            aria-label="Close preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-grow p-6 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <LoadingSpinner />
              <p className="mt-4 text-slate-400">Generating preview...</p>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full text-red-400">
              <p>{error}</p>
            </div>
          )}
          {previewContent && (
            // Using a specific class for the preview content styling
            <div className="docx-preview" dangerouslySetInnerHTML={{ __html: previewContent }} />
          )}
        </div>
      </div>
       <style>{`
          .prose {
              color: #d1d5db; /* gray-300 */
          }
          .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
              color: #f1f5f9; /* slate-100 */
          }
          .prose a {
              color: #38bdf8; /* sky-400 */
          }
          .prose strong {
              color: #e2e8f0; /* slate-200 */
          }
          .prose blockquote {
              border-left-color: #475569; /* slate-600 */
              color: #94a3b8; /* slate-400 */
          }
          .prose code {
              color: #f472b6; /* pink-400 */
          }
          .prose ul > li::before {
             background-color: #64748b; /* slate-500 */
          }
          .prose ol > li::before {
             color: #64748b; /* slate-500 */
          }
      `}</style>
    </div>
  );
};