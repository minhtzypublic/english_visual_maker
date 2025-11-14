
import React, { useRef, useState } from 'react';
import { ArtStyle, LearningLevel, WorksheetType } from '../types';
import { DocumentTextIcon, ImageIcon, MagicWandIcon } from './Icons';
import Spinner from './Spinner';

interface LessonFormProps {
  topic: string;
  setTopic: (topic: string) => void;
  vocab: string;
  setVocab: (vocab: string) => void;
  level: string;
  setLevel: (level: string) => void;
  style: string;
  setStyle: (style: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
  onAnalyzeImage: (file: File) => void;
  onAnalyzeText: (text: string) => void;
  isAnalyzing: boolean;
  analysisError: string | null;
  selectedWorksheetTypes: WorksheetType[];
  setSelectedWorksheetTypes: (types: WorksheetType[]) => void;
}

export const LessonForm: React.FC<LessonFormProps> = ({
  topic,
  setTopic,
  vocab,
  setVocab,
  level,
  setLevel,
  style,
  setStyle,
  onSubmit,
  isGenerating,
  onAnalyzeImage,
  onAnalyzeText,
  isAnalyzing,
  analysisError,
  selectedWorksheetTypes,
  setSelectedWorksheetTypes,
}) => {
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [activeAnalyzer, setActiveAnalyzer] = useState<'text' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAnalyzeImage(file);
    }
     // Reset the input so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleAnalyzeTextClick = () => {
    if (textToAnalyze.trim()) {
        onAnalyzeText(textToAnalyze);
    }
  }
  
  const handleWorksheetTypeToggle = (type: WorksheetType) => {
    const newSelection = selectedWorksheetTypes.includes(type)
      ? selectedWorksheetTypes.filter(t => t !== type)
      : [...selectedWorksheetTypes, type];
    setSelectedWorksheetTypes(newSelection);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-8 border border-slate-200">
        <div className="space-y-4 p-6 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <MagicWandIcon className="w-5 h-5 mr-2 text-blue-500" />
                Auto-fill from Content
            </h3>
            <p className="text-sm text-slate-600">
                Let AI suggest a topic and vocabulary list from your own materials.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-100 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-wait transition-colors"
                    aria-label="Analyze from image"
                >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Analyze Image
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                <button
                    type="button"
                    onClick={() => setActiveAnalyzer(activeAnalyzer === 'text' ? null : 'text')}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-100 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-wait transition-colors"
                    aria-label="Analyze from text"
                    aria-expanded={activeAnalyzer === 'text'}
                >
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Analyze Text
                </button>
            </div>
            {activeAnalyzer === 'text' && (
                <div className="space-y-2 pt-2">
                    <textarea
                        id="text-analyzer-input"
                        rows={5}
                        value={textToAnalyze}
                        onChange={(e) => setTextToAnalyze(e.target.value)}
                        className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                        placeholder="Paste a story or any text here..."
                    />
                    <button
                        type="button"
                        onClick={handleAnalyzeTextClick}
                        disabled={isAnalyzing || !textToAnalyze.trim()}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isAnalyzing ? <Spinner size="w-5 h-5"/> : 'Analyze Text'}
                    </button>
                </div>
            )}
            {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 text-slate-600 pt-2">
                    <Spinner size="w-5 h-5" />
                    <span>Analyzing content...</span>
                </div>
            )}
            {analysisError && (
                <p className="text-sm text-red-600 text-center">{analysisError}</p>
            )}
        </div>
        
        <div className="border-t border-slate-200 my-8"></div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">Lesson Topic</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            placeholder="e.g., Animals, Food, Weather"
            required
          />
        </div>

        <div>
          <label htmlFor="vocabulary" className="block text-sm font-medium text-slate-700 mb-1">Vocabulary List</label>
          <textarea
            id="vocabulary"
            rows={4}
            value={vocab}
            onChange={(e) => setVocab(e.target.value)}
            className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            placeholder="Enter words, one per line or separated by commas (e.g., lion, river, rainy)"
            required
          />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Learning Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.values(LearningLevel).map(l => (
                <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={`text-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${level === l ? 'bg-blue-600 border-blue-600 text-white shadow' : 'bg-white border-slate-300 hover:bg-slate-100'}`}
                >
                    {l.split(' - ')[0]} <span className="hidden sm:inline">- {l.split(' - ')[1]}</span>
                </button>
                ))}
            </div>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Art Style</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {Object.values(ArtStyle).map(s => (
                <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`text-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${style === s ? 'bg-blue-600 border-blue-600 text-white shadow' : 'bg-white border-slate-300 hover:bg-slate-100'}`}
                >
                    {s}
                </button>
                ))}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Optional: Generate Worksheet(s)</label>
            <p className="text-sm text-slate-500 mb-3">You can also generate worksheet activities along with your visual.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(WorksheetType).map(type => (
                <button
                    key={type}
                    type="button"
                    onClick={() => handleWorksheetTypeToggle(type)}
                    className={`text-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedWorksheetTypes.includes(type) ? 'bg-blue-600 border-blue-600 text-white shadow' : 'bg-white border-slate-300 hover:bg-slate-100'}`}
                >
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                </button>
                ))}
            </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isGenerating || isAnalyzing}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                 {selectedWorksheetTypes.length > 0 ? 'Generating Visual & Worksheets...' : 'Generating Visual...'}
              </>
            ) : (
              <>
                <MagicWandIcon className="w-5 h-5 mr-2" />
                 Generate Visual {selectedWorksheetTypes.length > 0 && `& ${selectedWorksheetTypes.length} Worksheet${selectedWorksheetTypes.length > 1 ? 's' : ''}`}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
