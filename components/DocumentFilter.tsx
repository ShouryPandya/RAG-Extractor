import React from 'react';

interface DocumentFilterProps {
  documents: File[];
  selectedDocuments: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  disabled: boolean;
}

export const DocumentFilter: React.FC<DocumentFilterProps> = ({ documents, selectedDocuments, onSelectionChange, disabled }) => {
  const handleToggleAll = (select: boolean) => {
    if (select) {
      onSelectionChange(new Set(documents.map(doc => doc.name)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleToggleDocument = (docName: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(docName)) {
      newSelection.delete(docName);
    } else {
      newSelection.add(docName);
    }
    onSelectionChange(newSelection);
  };

  const allSelected = documents.length > 0 && selectedDocuments.size === documents.length;
  const noneSelected = selectedDocuments.size === 0;

  return (
    <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-lg">
      <h2 className="text-lg font-semibold text-slate-200 mb-3">Filter by Document</h2>
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="sr-only">Select documents to include in the search</legend>
        <div className="flex justify-between items-center text-sm mb-2">
          <button
            onClick={() => handleToggleAll(true)}
            disabled={allSelected || disabled}
            className="text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            Select All
          </button>
          <button
            onClick={() => handleToggleAll(false)}
            disabled={noneSelected || disabled}
            className="text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            Deselect All
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar border-t border-slate-700 pt-2">
          <ul className="space-y-1">
            {documents.map(doc => (
              <li key={doc.name}>
                <label className="flex items-center p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.has(doc.name)}
                    onChange={() => handleToggleDocument(doc.name)}
                    className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="ml-3 text-sm text-slate-300 truncate" title={doc.name}>
                    {doc.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </fieldset>
    </div>
  );
};
