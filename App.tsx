import React, { useState, useCallback, useRef, useEffect } from 'react';
import mammoth from 'mammoth';
import { FileUpload } from './components/FileUpload';
import { QueryInput } from './components/QueryInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { generateAnswerFromDocuments, generateAnswerFromWeb, generateFinalAnswer } from './services/geminiService';
import { RetrievalService } from './services/retrievalService';
import type { AppResults, Snippet } from './types';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SearchModeSelector } from './components/SearchModeSelector';
import { SearchHistory } from './components/icons/SearchHistory';
import { FilePreviewModal } from './components/FilePreviewModal';

interface AlertProps {
  message: string;
  type: 'error' | 'warning';
  onDismiss: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, type, onDismiss }) => {
  const baseClasses = "p-3 rounded-md border flex justify-between items-center text-sm";
  const typeClasses = {
    error: "text-red-400 bg-red-900/50 border-red-700",
    warning: "text-amber-400 bg-amber-900/50 border-amber-700",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-4 p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Dismiss alert">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export type SearchMode = 'combined' | 'docs' | 'web';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<AppResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isIndexing, setIsIndexing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('combined');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [fileToPreview, setFileToPreview] = useState<File | null>(null);

  const retrievalServiceRef = useRef<RetrievalService>(new RetrievalService());

  useEffect(() => {
    try {
        const storedHistory = localStorage.getItem('rag-search-history');
        if (storedHistory) {
            setSearchHistory(JSON.parse(storedHistory));
        }
    } catch (e) {
        console.error("Failed to load search history from localStorage", e);
    }
  }, []);

  const handleSearch = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      setError('Please enter a query.');
      return;
    }
    if (searchMode === 'docs' && files.length === 0) {
        setError('Please upload documents to search in "Internal Docs Only" mode.');
        return;
    }

    // Update and save search history
    const trimmedQuery = queryToSearch.trim();
    const newHistory = [trimmedQuery, ...searchHistory.filter(h => h !== trimmedQuery)].slice(0, 15);
    setSearchHistory(newHistory);
    try {
        localStorage.setItem('rag-search-history', JSON.stringify(newHistory));
    } catch (e) {
        console.error("Failed to save search history to localStorage", e);
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);
    setResults(null);

    try {
      let docSnippets: Snippet[] = [];
      let webSnippets: Snippet[] = [];

      const shouldSearchDocs = (searchMode === 'combined' || searchMode === 'docs') && files.length > 0;
      const shouldSearchWeb = searchMode === 'combined' || searchMode === 'web';

      // --- OPTIMIZATION: Run document and web searches in parallel ---
      const searchPromises: Promise<Snippet[]>[] = [];
      if (shouldSearchDocs) {
        const searchFn = async () => {
            const relevantChunks = await retrievalServiceRef.current.search(queryToSearch, 5);
            return generateAnswerFromDocuments(queryToSearch, relevantChunks);
        };
        searchPromises.push(searchFn());
      }
      if (shouldSearchWeb) {
        searchPromises.push(generateAnswerFromWeb(queryToSearch));
      }

      const searchResults = await Promise.all(searchPromises);
      
      // Assign results based on which searches were run
      if (shouldSearchDocs && shouldSearchWeb) {
        docSnippets = searchResults[0] || [];
        webSnippets = searchResults[1] || [];
      } else if (shouldSearchDocs) {
        docSnippets = searchResults[0] || [];
      } else if (shouldSearchWeb) {
        webSnippets = searchResults[0] || [];
      }
      // --- END OPTIMIZATION ---

      const finalAnswer = await generateFinalAnswer(queryToSearch, docSnippets, webSnippets);
      
      setResults({
        synthesizedSnippets: docSnippets,
        webSnippets: webSnippets,
        finalAnswer: finalAnswer,
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during the search.');
    } finally {
      setIsLoading(false);
    }
  }, [files, searchMode, searchHistory]);

  const processAndIndexFiles = useCallback(async (filesToIndex: File[]) => {
    if (filesToIndex.length === 0) return;

    retrievalServiceRef.current = new RetrievalService();
    setIsIndexing(true);
    setError(null);
    setWarning(null);
    setResults(null); // Clear previous results when new files are added

    try {
        const fileProcessingPromises = filesToIndex.map(async (file) => {
            try {
                let content: string;
                if (file.name.toLowerCase().endsWith('.docx')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    content = result.value;
                } else {
                    // Assuming plain text for other file types like .txt, .md
                    content = await file.text();
                }
                return { name: file.name, content };
            } catch (err) {
                console.error(`Failed to read file "${file.name}":`, err);
                return { name: file.name, content: null }; // Mark as failed
            }
        });
        
        const fileContents = await Promise.all(fileProcessingPromises);
        
        const successfulFiles = fileContents.filter(f => f.content !== null) as { name: string; content: string }[];
        const readFailedFiles = fileContents.filter(f => f.content === null).map(f => f.name);

        const { failedFiles: embeddingFailedFiles } = await retrievalServiceRef.current.processDocuments(successfulFiles);
        
        const allFailedFiles = [...new Set([...readFailedFiles, ...embeddingFailedFiles])];

        if (allFailedFiles.length > 0) {
            const fileNoun = allFailedFiles.length > 1 ? 'files' : 'file';
            setWarning(`Could not process ${allFailedFiles.length} ${fileNoun}: ${allFailedFiles.join(', ')}. They may be corrupted or in an unsupported format.`);
        }

    } catch (err) {
        console.error("File processing error:", err);
        setError(err instanceof Error ? err.message : "A critical error occurred while indexing documents.");
    } finally {
        setIsIndexing(false);
    }
  }, []);
  
  const handleFilesChange = (newFiles: File[]) => {
    const validFiles = Array.from(newFiles);
    let filesToProcess = validFiles;
    if (validFiles.length > 100) {
        setError("You can upload a maximum of 100 documents.");
        filesToProcess = validFiles.slice(0, 100);
    } else {
        setError(null);
    }
    setFiles(filesToProcess);
    processAndIndexFiles(filesToProcess);
  };

  const handleClearFiles = useCallback(() => {
    setFiles([]);
    setResults(null);
    setError(null);
    setWarning(null);
    retrievalServiceRef.current = new RetrievalService();
  }, []);

  const handleHistorySearch = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    try {
        localStorage.removeItem('rag-search-history');
    } catch (e) {
        console.error("Failed to clear search history from localStorage", e);
    }
  };

  const handlePreviewFile = (file: File) => {
    setFileToPreview(file);
  };

  const handleClosePreview = () => {
    setFileToPreview(null);
  };


  return (
    <div className="min-h-screen font-sans text-slate-300 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
          <FileUpload 
            files={files} 
            onFilesChange={handleFilesChange} 
            onClearFiles={handleClearFiles} 
            isIndexing={isIndexing}
            onPreview={handlePreviewFile}
          />
          <SearchModeSelector mode={searchMode} onModeChange={setSearchMode} disabled={isLoading || isIndexing} />
          <QueryInput query={query} onQueryChange={setQuery} onSearch={() => handleSearch(query)} isLoading={isLoading || isIndexing} />
          <SearchHistory 
            history={searchHistory}
            onHistoryClick={handleHistorySearch}
            onClearHistory={handleClearHistory}
            disabled={isLoading || isIndexing}
          />
           {error && <Alert message={error} type="error" onDismiss={() => setError(null)} />}
           {warning && <Alert message={warning} type="warning" onDismiss={() => setWarning(null)} />}
        </aside>
        
        <section className="lg:col-span-8 xl:col-span-9 bg-slate-900/70 backdrop-blur-sm rounded-lg border border-slate-700 shadow-2xl min-h-[calc(100vh-200px)] flex flex-col">
          {isLoading && (
            <div className="flex-grow flex items-center justify-center flex-col">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-slate-400">Generating report...</p>
            </div>
          )}
          {!isLoading && !results && (
             <div className="flex-grow flex items-center justify-center text-center">
              <div className="max-w-md">
                 {isIndexing ? (
                     <>
                        <LoadingSpinner />
                        <p className="mt-4 text-lg text-slate-400">Processing and indexing documents...</p>
                     </>
                 ) : (
                    <>
                        <h2 className="text-2xl font-bold text-slate-200">RAG Extractor</h2>
                        <p className="mt-2 text-slate-400">Upload documents, select a search mode, and ask a question to generate a grounded, business-ready answer.</p>
                    </>
                 )}
              </div>
            </div>
          )}
          {results && <ResultsDisplay results={results} query={query} />}
        </section>
      </main>
      <footer className="text-center py-4 border-t border-slate-800 text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Mastek. All rights reserved.
      </footer>
      <FilePreviewModal
        isOpen={!!fileToPreview}
        file={fileToPreview}
        onClose={handleClosePreview}
      />
    </div>
  );
};

export default App;