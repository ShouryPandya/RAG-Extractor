import React from 'react';
import type { AppResults } from '../types';
import { SnippetCard } from './SnippetCard';
import { FileIcon } from './icons/FileIcon';
import { WebIcon } from './icons/WebIcon';
import { ClickableText } from './ClickableText';

interface ResultsDisplayProps {
  results: AppResults;
  query: string;
}

const NoResults: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="flex-grow flex items-center justify-center text-center p-6 h-full">
    <div>
      <h3 className="text-xl font-semibold text-slate-300">{title}</h3>
      <p className="text-slate-400 mt-2">{message}</p>
    </div>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, query }) => {
  const { synthesizedSnippets, webSnippets, finalAnswer } = results;

  const hasDocResults = synthesizedSnippets && synthesizedSnippets.length > 0;
  const hasWebResults = webSnippets && webSnippets.length > 0;

  if (!finalAnswer && !hasDocResults && !hasWebResults) {
    return <NoResults title="No Relevant Information Found" message="We couldn't find information matching your query in your documents or on the web." />;
  }

  const handleExportJson = () => {
    const allSources = [...synthesizedSnippets.map(s => s.source), ...webSnippets.map(s => s.source)];
    const uniqueSources = [...new Set(allSources)];

    const exportData = {
      question: query,
      doc_extracts: synthesizedSnippets,
      web_extracts: webSnippets,
      answer: finalAnswer,
      sources: uniqueSources.map(source => ({
        type: /https?:\/\//.test(source) ? 'web' : 'document',
        uri: source,
      }))
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `mastek_ai_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportDocx = () => {
    // Basic HTML escaping
    const escapeHtml = (unsafe: string) => {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    };

    const htmlContent = `
        <html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>Mastek AI Report</title>
        <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; }
            h2 { font-family: Calibri, sans-serif; font-size: 16pt; color: #2F5496; }
            h3 { font-family: Calibri, sans-serif; font-size: 12pt; color: #4472C4; }
            p, li { font-family: Calibri, sans-serif; font-size: 11pt; }
            hr { border: 0; border-top: 1px solid #AAAAAA; }
            ul { list-style-type: disc; margin-left: 20px; }
        </style>
        </head>
        <body>
            <p><strong>Mastek &ndash; Confidential</strong></p>
            <p><em>Report Generated: ${new Date().toLocaleString()}</em></p>
            <br />
            <hr />
            <br />
            <h2>QUESTION:</h2>
            <p>${escapeHtml(query)}</p>
            <br />
            <h2>ANSWER:</h2>
            <p>${finalAnswer.replace(/\n/g, '<br />')}</p>
            ${(hasDocResults || hasWebResults) ? '<br /><hr /><br /><h2>SUPPORTING EXTRACTS:</h2>' : ''}
            ${hasDocResults ? `
                <h3>From Document(s):</h3>
                <ul>
                    ${synthesizedSnippets.map(s => `<li>&quot;${escapeHtml(s.snippet)}&quot;</li>`).join('')}
                </ul>
                <br />
            ` : ''}
            ${hasWebResults ? `
                <h3>From Web:</h3>
                <ul>
                    ${webSnippets.map(s => `<li>&quot;${escapeHtml(s.snippet)}&quot;</li>`).join('')}
                </ul>
            ` : ''}
        </body>
        </html>
    `;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(htmlContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", source);
    downloadAnchorNode.setAttribute("download", `mastek_ai_report_${Date.now()}.doc`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="p-4 md:p-6 flex-grow overflow-y-auto custom-scrollbar">
       <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-200">Generated Report</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleExportJson} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">Export to JSON</button>
            <button onClick={handleExportDocx} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors w-32">
              Export to DOCX
            </button>
          </div>
       </header>

       <div className="space-y-8">
          {/* Final Answer Section */}
          <section>
            <h3 className="text-lg font-semibold text-sky-300 mb-3">Answer</h3>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg whitespace-pre-wrap font-sans text-slate-300">
              <ClickableText text={finalAnswer} />
            </div>
          </section>

          {/* Document Findings Section */}
          {hasDocResults && (
            <section>
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <FileIcon className="w-5 h-5 text-sky-400" />
                Extracts from Documents
              </h3>
              <div className="flex flex-col gap-4">
                {synthesizedSnippets.map((snippet, index) => (
                  <SnippetCard
                    key={`synth-${index}`}
                    snippet={snippet.snippet}
                    source={snippet.source}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* Web Findings Section */}
          {hasWebResults && (
            <section>
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <WebIcon className="w-5 h-5 text-emerald-400" />
                Extracts from Web
              </h3>
              <div className="flex flex-col gap-4">
                {webSnippets.map((snippet, index) => (
                  <SnippetCard
                    key={`web-${index}`}
                    snippet={snippet.snippet}
                    source={snippet.source}
                  />
                ))}
              </div>
            </section>
          )}
       </div>
    </div>
  );
};
