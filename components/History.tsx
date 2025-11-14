
import React from 'react';
import { HistoryItem } from '../types';
import { BackIcon, ClipboardListIcon, DuplicateIcon, EyeIcon, TrashIcon } from './Icons';

interface HistoryProps {
  history: HistoryItem[];
  onClear: () => void;
  onBackToForm: () => void;
  onView: (item: HistoryItem) => void;
  onReuse: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
};

export const HistoryView: React.FC<HistoryProps> = ({ history, onClear, onBackToForm, onView, onReuse, onDelete }) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Generation History</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToForm}
            className="flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <BackIcon className="w-5 h-5 mr-2" />
            Back to Form
          </button>
          {history.length > 0 && (
             <button
              onClick={onClear}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-700">No history yet!</h3>
          <p className="text-slate-500 mt-2">Create a new visual to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 flex flex-col group">
              <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                <img src={item.imageUrl} alt={item.topic} className="w-full h-full object-contain transition-transform duration-300" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onView(item)}
                      title="View Details"
                      className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white text-slate-800 rounded-lg text-sm font-semibold transition-all duration-200 transform-gpu opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View
                    </button>
                     <button 
                      onClick={() => onReuse(item)}
                      title="Reuse Settings"
                      className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white text-slate-800 rounded-lg text-sm font-semibold transition-all duration-200 transform-gpu opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      style={{ transitionDelay: '50ms' }}
                    >
                      <DuplicateIcon className="w-4 h-4" />
                      Reuse
                    </button>
                     <button 
                      onClick={() => onDelete(item.id)}
                      title="Delete Item"
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-all duration-200 transform-gpu opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      style={{ transitionDelay: '100ms' }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                 <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800 capitalize mb-1">{item.topic}</h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap pt-1">{formatDate(item.id)}</span>
                 </div>
                 <p className="text-sm text-slate-500 mt-1 line-clamp-2" title={item.vocabulary.map(v => `${v.word} /${v.ipa}/`).join(', ')}>
                   {item.vocabulary.map(v => v.word).join(', ')}
                 </p>
                 <div className="mt-4 pt-4 border-t border-slate-200 flex-grow-0">
                    <div className="flex justify-between items-center text-xs text-slate-600 gap-2">
                        <span className="font-semibold px-2 py-1 bg-slate-200 rounded">{item.level.split(' - ')[0]}</span>
                        <span className="font-semibold px-2 py-1 bg-slate-200 rounded">{item.style}</span>
                        {item.worksheets && Object.keys(item.worksheets).length > 0 && (
                            <span className="font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded flex items-center">
                                <ClipboardListIcon className="w-3 h-3 mr-1" />
                                {Object.keys(item.worksheets).length} Worksheet{Object.keys(item.worksheets).length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
