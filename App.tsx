import React, { useState, useEffect } from 'react';
import { analyzeContent, generateLessonVisual, generatePronunciations, generateWorksheet } from './services/geminiService';
import { ArtStyle, Illustration, LearningLevel, LessonData, View, HistoryItem, WorksheetType, VocabularyItem } from './types';
import { LessonForm } from './components/LessonForm';
import { IllustrationGrid } from './components/IllustrationGrid';
import { BookOpenIcon, HistoryIcon, BackIcon } from './components/Icons';
import { HistoryView } from './components/History';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');
  
  // Form state
  const [topic, setTopic] = useState<string>('');
  const [vocab, setVocab] = useState<string>('');
  const [level, setLevel] = useState<string>(LearningLevel.A1);
  const [style, setStyle] = useState<string>(ArtStyle.Cartoon);
  const [selectedWorksheetTypes, setSelectedWorksheetTypes] = useState<WorksheetType[]>([]);

  // Results state
  const [illustration, setIllustration] = useState<Illustration | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  // Worksheets state
  // Fix: Changed `worksheets` state to be a partial record, allowing it to be an empty object or contain only a subset of worksheet types.
  const [worksheets, setWorksheets] = useState<Partial<Record<WorksheetType, string>>>({});
  const [generatingWorksheetTypes, setGeneratingWorksheetTypes] = useState<WorksheetType[]>([]);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('english-visual-maker-history');
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        // Migration logic for old history items
        const migratedHistory = parsedHistory.map((item: any) => {
          if (item.worksheetContent && item.worksheetType && !item.worksheets) {
            const { worksheetContent, worksheetType, ...rest } = item;
            return {
              ...rest,
              worksheets: { [worksheetType]: worksheetContent },
            };
          }
          if (!item.worksheets) {
            return { ...item, worksheets: {} };
          }
          return item;
        });
        setHistory(migratedHistory as HistoryItem[]);
      }
    } catch (error) {
      console.error("Failed to parse history from localStorage", error);
      localStorage.removeItem('english-visual-maker-history');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vocabularyList = vocab.split(/,|\n/).map(w => w.trim()).filter(Boolean);
    if (!topic || vocabularyList.length === 0) return;

    setIsGenerating(true);
    setView('results');
    setWorksheets({});
    setIllustration({ id: topic, word: `Lesson: ${topic}`, imageUrl: null, isLoading: true, error: null });

    const vocabularyWithIPA = await generatePronunciations(vocabularyList, level);
    const lessonData: LessonData = { topic, vocabulary: vocabularyWithIPA, level, style };
    setCurrentLesson(lessonData);

    const visualPromise = generateLessonVisual(lessonData);

    const worksheetPromises = selectedWorksheetTypes.map(type => 
        generateWorksheet(lessonData, type)
            .then(content => ({ type, content, status: 'fulfilled' as const }))
            .catch(reason => ({ type, reason, status: 'rejected' as const }))
    );

    const visualResult = await visualPromise.catch(e => e);
    const generatedWorksheets = await Promise.all(worksheetPromises);

    let imageUrl: string | undefined;
    if (visualResult instanceof Error) {
        console.error(visualResult);
        setIllustration(prev => prev ? { ...prev, error: 'Failed to generate image. Please try again.', isLoading: false } : null);
    } else {
        imageUrl = visualResult;
        setIllustration(prev => prev ? { ...prev, imageUrl, isLoading: false } : null);
    }

    const newWorksheets: Partial<Record<WorksheetType, string>> = {};
    generatedWorksheets.forEach(result => {
        if (result.status === 'fulfilled') {
            newWorksheets[result.type] = result.content;
        } else {
            console.error(result.reason);
            const error = result.reason as Error;
            newWorksheets[result.type] = `Sorry, there was an error generating the worksheet: ${error.message}\nPlease try again.`;
        }
    });
    setWorksheets(newWorksheets);

    if (imageUrl) {
        const newHistoryItem: HistoryItem = {
            id: new Date().toISOString(),
            imageUrl,
            worksheets: newWorksheets,
            topic: lessonData.topic,
            vocabulary: lessonData.vocabulary,
            level: lessonData.level,
            style: lessonData.style,
        };
        setCurrentHistoryId(newHistoryItem.id);

        setHistory(prevHistory => {
            const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, 50);
            localStorage.setItem('english-visual-maker-history', JSON.stringify(updatedHistory));
            return updatedHistory;
        });
    }

    setIsGenerating(false);
  };
  
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

  const handleAnalyzeImage = async (file: File) => {
      setIsAnalyzing(true);
      setAnalysisError(null);
      try {
          const base64Data = await fileToBase64(file);
          const result = await analyzeContent({ 
              type: 'image', 
              data: base64Data, 
              mimeType: file.type 
          });
          setTopic(result.topic);
          setVocab(result.vocabulary.map(v => v.word).join(',\n'));
      } catch (error) {
          console.error(error);
          setAnalysisError(error instanceof Error ? error.message : 'An unknown error occurred.');
      } finally {
          setIsAnalyzing(false);
      }
  };
  
  const handleAnalyzeText = async (text: string) => {
      setIsAnalyzing(true);
      setAnalysisError(null);
      try {
          const result = await analyzeContent({ type: 'text', data: text });
          setTopic(result.topic);
          setVocab(result.vocabulary.map(v => v.word).join(',\n'));
      // Fix: Added a missing opening brace for the catch block.
      } catch (error) {
          console.error(error);
          setAnalysisError(error instanceof Error ? error.message : 'An unknown error occurred.');
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleGenerateWorksheet = async (selectedWorksheetType: WorksheetType) => {
      if (!currentLesson || worksheets[selectedWorksheetType]) return;
      setGeneratingWorksheetTypes(prev => [...prev, selectedWorksheetType]);
      
      try {
          const content = await generateWorksheet(currentLesson, selectedWorksheetType);
          setWorksheets(prev => ({ ...prev, [selectedWorksheetType]: content }));

          // Update history with the newly generated worksheet
          setHistory(prevHistory => {
            const updatedHistory = prevHistory.map(item => 
              item.id === currentHistoryId 
                ? { ...item, worksheets: { ...(item.worksheets || {}), [selectedWorksheetType]: content } } 
                : item
            );
            localStorage.setItem('english-visual-maker-history', JSON.stringify(updatedHistory));
            return updatedHistory;
          });

      } catch (error) {
          console.error("Failed to generate worksheet", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          setWorksheets(prev => ({...prev, [selectedWorksheetType]: `Sorry, there was an error generating the worksheet: ${errorMessage}\nPlease try again.`}));
      } finally {
          setGeneratingWorksheetTypes(prev => prev.filter(t => t !== selectedWorksheetType));
      }
  };
  
  const handleUpdateWorksheet = (worksheetType: WorksheetType, content: string) => {
      setWorksheets(prev => ({ ...prev, [worksheetType]: content }));

      // Update history with the edited worksheet
      setHistory(prevHistory => {
        const updatedHistory = prevHistory.map(item => 
          item.id === currentHistoryId 
            ? { ...item, worksheets: { ...(item.worksheets || {}), [worksheetType]: content } } 
            : item
        );
        localStorage.setItem('english-visual-maker-history', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
  };

  const handleBackToForm = () => {
    setView('form');
    setIllustration(null);
    setCurrentLesson(null);
    setCurrentHistoryId(null);
    setSelectedWorksheetTypes([]);
    setWorksheets({});
  }

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all generation history? This cannot be undone.")) {
      setHistory([]);
      localStorage.removeItem('english-visual-maker-history');
    }
  }

  const handleViewHistoryItem = (item: HistoryItem) => {
    const { topic, vocabulary, level, style, imageUrl, worksheets, id } = item;
    const lessonData: LessonData = { topic, vocabulary, level, style };
    
    setCurrentLesson(lessonData);
    setIllustration({
      id: topic,
      word: `Lesson: ${topic}`,
      imageUrl,
      isLoading: false,
      error: null
    });
    setWorksheets(worksheets ?? {});
    setCurrentHistoryId(id);
    setView('results');
  };

  const handleReuseHistoryItem = (item: HistoryItem) => {
    setTopic(item.topic);
    setVocab(item.vocabulary.map(v => v.word).join(',\n'));
    setLevel(item.level);
    setStyle(item.style);
    setView('form');
  };

  const handleDeleteHistoryItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item? This cannot be undone.")) {
      setHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(item => item.id !== id);
        localStorage.setItem('english-visual-maker-history', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }
  };


  const renderContent = () => {
    switch (view) {
      case 'results':
        return illustration && currentLesson && (
          <IllustrationGrid
            illustration={illustration}
            onBack={handleBackToForm}
            lessonData={currentLesson}
            worksheets={worksheets}
            generatingWorksheetTypes={generatingWorksheetTypes}
            onGenerateWorksheet={handleGenerateWorksheet}
            onUpdateWorksheet={handleUpdateWorksheet}
          />
        );
      case 'history':
        return (
            <HistoryView 
                history={history}
                onClear={handleClearHistory}
                onBackToForm={handleBackToForm}
                onView={handleViewHistoryItem}
                onReuse={handleReuseHistoryItem}
                onDelete={handleDeleteHistoryItem}
            />
        );
      case 'form':
      default:
        return (
          <LessonForm
            topic={topic}
            setTopic={setTopic}
            vocab={vocab}
            setVocab={setVocab}
            level={level}
            setLevel={setLevel}
            style={style}
            setStyle={setStyle}
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
            onAnalyzeImage={handleAnalyzeImage}
            onAnalyzeText={handleAnalyzeText}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            selectedWorksheetTypes={selectedWorksheetTypes}
            setSelectedWorksheetTypes={setSelectedWorksheetTypes}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm sticky top-0 z-10 no-print">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                     <div className="flex items-center">
                        <BookOpenIcon className="h-8 w-8 text-blue-600"/>
                        <h1 className="text-2xl font-bold text-slate-800 ml-2">English Visual Maker</h1>
                     </div>
                     <button
                        onClick={() => setView(view === 'history' ? 'form' : 'history')}
                        className="flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        aria-label={view === 'history' ? 'Back to form' : 'View history'}
                      >
                       {view === 'history' ? (
                         <>
                           <BackIcon className="w-5 h-5 mr-2" />
                           Back
                         </>
                       ) : (
                         <>
                           <HistoryIcon className="w-5 h-5 mr-2" />
                           History
                         </>
                       )}
                     </button>
                </div>
            </div>
        </header>
        <main className="py-10 px-4 sm:px-6 lg:px-8 print-main">
            {renderContent()}
        </main>
        <footer className="text-center py-4 text-slate-500 text-sm no-print">
            <p>Powered by Google Gemini. Create amazing visuals for your English lessons.</p>
        </footer>
    </div>
  );
};

export default App;
