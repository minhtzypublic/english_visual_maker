import React, { useState } from 'react';
import { Illustration, LessonData, WorksheetType, CrosswordData, CrosswordCell, CrosswordGrid } from '../types';
import Spinner from './Spinner';
import { BackIcon, CheckCircleIcon, ClipboardListIcon, KeyIcon, PencilIcon, PrintIcon, XIcon } from './Icons';

interface IllustrationGridProps {
  illustration: Illustration;
  lessonData: LessonData;
  onBack: () => void;
  worksheets: Partial<Record<WorksheetType, string>>;
  generatingWorksheetTypes: WorksheetType[];
  onGenerateWorksheet: (type: WorksheetType) => void;
  onUpdateWorksheet: (type: WorksheetType, content: string) => void;
}

const ImageCard: React.FC<{ illustration: Illustration }> = ({ illustration }) => {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 flex flex-col">
        <div className="aspect-video w-full bg-slate-100 flex items-center justify-center">
          {illustration.isLoading && <div className="flex flex-col items-center gap-2 text-slate-500"><Spinner size="w-12 h-12" /><span>Generating your visual...</span></div>}
          {illustration.error && <div className="p-4 text-center text-red-500">{illustration.error}</div>}
          {illustration.imageUrl && <img src={illustration.imageUrl} alt={illustration.word} className="w-full h-full object-contain" />}
        </div>
      </div>
    );
};

// --- Worksheet Display Components ---

const parseFillInTheBlanks = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    let wordBank: string[] = [];
    const sentences: string[] = [];
    let wordBankTitle = 'Word Bank';
    let sentencesTitle = 'Complete the Sentences';

    let currentSection = 'intro';

    for (const line of lines) {
        if (/word bank/i.test(line)) {
            currentSection = 'wordbank';
            wordBankTitle = line.trim().replace(/[*_#]/g, '');
            continue;
        }
        if (/^\d+\.\s/.test(line) || /sentences/i.test(line)) {
            currentSection = 'sentences';
            if (/sentences/i.test(line)) {
                sentencesTitle = line.trim().replace(/[*_#]/g, '');
                continue;
            }
        }
        
        if (currentSection === 'wordbank') {
            wordBank.push(...line.split(',').map(w => w.trim()).filter(Boolean));
        } else if (currentSection === 'sentences') {
            sentences.push(line);
        }
    }
    
    wordBank = wordBank.join(', ').replace(/[-\|\*]/g, '').split(',').map(w => w.trim()).filter(Boolean);

    return (
        <div className="space-y-8 font-serif">
            {wordBank.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3 print:text-black">{wordBankTitle}</h3>
                    <div className="border border-slate-300 rounded-lg p-4 flex flex-wrap gap-x-4 gap-y-2 bg-slate-50 print:bg-gray-100 print:border-gray-400">
                        {wordBank.map((word, i) => (
                            <span key={i} className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-slate-800 font-medium print:border-gray-400 print:text-black text-base">
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {sentences.length > 0 && (
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 print:text-black">{sentencesTitle}</h3>
                    <ol className="space-y-5 text-lg leading-relaxed">
                        {sentences.map((sentence, i) => (
                            <li key={i} className="flex items-start">
                                <span className="mr-3 font-medium text-slate-600 print:text-black">{i + 1}.</span>
                                <span className="print:text-black">{sentence.replace(/^\d+\.\s/, '')}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};

const parseMatching = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const words: { number: string, text: string }[] = [];
    const definitions: { letter: string, text: string }[] = [];
    let heading = 'Match the Word to its Definition';

    for (const line of lines) {
        const wordMatch = line.match(/^(\d+)\.\s+(.*?)(?:\s+___)?$/);
        const definitionMatch = line.match(/^([A-Z])\.\s+(.*)$/);

        if (wordMatch) {
            words.push({ number: wordMatch[1], text: wordMatch[2].trim() });
        } else if (definitionMatch) {
            definitions.push({ letter: definitionMatch[1], text: definitionMatch[2].trim() });
        } else if (words.length === 0 && definitions.length === 0 && line.trim()) {
            heading = line.trim().replace(/[*_#]/g, '');
        }
    }

    return (
        <div className="space-y-6 font-serif">
            <h3 className="text-xl font-bold text-slate-800 mb-4 print:text-black">{heading}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <ol className="space-y-4 text-lg">
                    {words.map(word => (
                        <li key={word.number} className="flex items-center">
                            <span className="font-semibold mr-3 print:text-black">{word.number}. {word.text}</span>
                            <span className="border-b-2 border-slate-500 w-20 print:border-black"></span>
                        </li>
                    ))}
                </ol>
                <ul className="space-y-4 text-lg">
                    {definitions.map(def => (
                         <li key={def.letter} className="flex items-start">
                            <span className="font-semibold mr-3 print:text-black">{def.letter}.</span>
                            <span className="print:text-black leading-snug">{def.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const CrosswordGridDisplay: React.FC<{ grid: CrosswordGrid }> = ({ grid }) => {
    const numCols = grid[0]?.length || 0;
    if (numCols === 0) return null;

    return (
        <div className="bg-slate-200 p-1 sm:p-2 border-4 border-slate-300 w-full max-w-lg mx-auto crossword-grid-container">
            <div 
                className="grid gap-px bg-slate-400" 
                style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
            >
                {grid.map((row, rowIndex) => 
                    row.map((cell, colIndex) => {
                        if (cell === null) {
                            return <div key={`${rowIndex}-${colIndex}`} className="bg-slate-900 aspect-square" />;
                        }
                        return (
                            <div key={`${rowIndex}-${colIndex}`} className="bg-white aspect-square relative text-slate-800 uppercase flex items-center justify-center font-bold text-lg sm:text-xl">
                                {cell.number ? <span className="absolute top-0 left-0.5 text-[10px] sm:text-xs font-medium text-slate-600">{cell.number}</span> : null}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const parseCrossword = (content: string) => {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch?.[1]) {
        return <div className="text-red-600">Error: Could not parse crossword data from AI response. Please try generating it again.</div>;
    }

    let data: CrosswordData;
    try {
        data = JSON.parse(jsonMatch[1]);
    } catch (error) {
        return <div className="text-red-600">Error: Invalid crossword data format. Please try generating it again.</div>;
    }

    return (
        <div className="space-y-8 font-serif">
            <CrosswordGridDisplay grid={data.grid} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base">
                {data.clues.across.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-bold text-xl text-slate-800 print:text-black">Across</h4>
                        <ul className="list-none space-y-2 text-lg">
                            {data.clues.across.map((clue, i) => <li key={`across-${i}`} className="print:text-black leading-snug">{clue}</li>)}
                        </ul>
                    </div>
                )}
                {data.clues.down.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-bold text-xl text-slate-800 print:text-black">Down</h4>
                        <ul className="list-none space-y-2 text-lg">
                            {data.clues.down.map((clue, i) => <li key={`down-${i}`} className="print:text-black leading-snug">{clue}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

const parseSentenceOrdering = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const sentences: string[] = [];
    let heading = 'Sentence Ordering';
    let headingCaptured = false;

    for (const line of lines) {
        if (/^\d+\./.test(line.trim())) {
            sentences.push(line.trim());
            headingCaptured = true;
        } else if (!headingCaptured && line.trim()) {
            heading = line.trim().replace(/[*_#]/g, '');
        }
    }

    return (
        <div className="space-y-6 font-serif">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 print:text-black">{heading}</h3>
                <p className="text-slate-600 mt-1 text-lg print:text-black">Unscramble the words to form correct sentences.</p>
            </div>
            <ol className="space-y-8 text-lg leading-relaxed pt-4">
                {sentences.map((sentence, i) => (
                    <li key={i} className="space-y-3">
                        <div className="flex items-start gap-4">
                            <span className="font-bold text-slate-500 print:text-black pt-3">{i + 1}.</span>
                            <p className="text-slate-800 bg-slate-100 border border-dashed border-slate-300 rounded-lg p-4 w-full print:bg-gray-100 print:border-gray-400">
                                {sentence.replace(/^\d+\.\s/, '')}
                            </p>
                        </div>
                        <div className="ml-10 border-b-2 border-slate-400 h-2 print:border-black"></div>
                    </li>
                ))}
            </ol>
        </div>
    );
};

const WorksheetDisplay: React.FC<{ content: string; type: WorksheetType; }> = ({ content, type }) => {
    if (type === WorksheetType.FillInTheBlanks) return parseFillInTheBlanks(content);
    if (type === WorksheetType.Matching) return parseMatching(content);
    if (type === WorksheetType.Crossword) return parseCrossword(content);
    if (type === WorksheetType.SentenceOrdering) return parseSentenceOrdering(content);
    return <div className="text-slate-800 whitespace-pre-wrap font-serif">{content}</div>;
};


const AnswerKeyDisplay: React.FC<{ answerKeyContent: string }> = ({ answerKeyContent }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mt-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="no-print flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-expanded={isOpen}
            >
                <KeyIcon className="w-4 h-4" />
                {isOpen ? 'Hide' : 'Show'} Answer Key
            </button>
            <div className={`printable-answer-key ${!isOpen && 'hidden print:block'}`}>
                <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4 border-t border-slate-300 pt-6">Answer Key</h3>
                <pre className="text-base text-slate-700 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap font-serif">{answerKeyContent.trim()}</pre>
            </div>
        </div>
    )
}

const EditableWorksheetCard: React.FC<{
    type: WorksheetType;
    content: string;
    onUpdate: (content: string) => void;
}> = ({ type, content, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content);

    const [mainContent, answerKeyContent] = content.split('--- ANSWER KEY ---');

    const handleSave = () => {
        onUpdate(editedContent);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedContent(content);
        setIsEditing(false);
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 printable-worksheet">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-2xl font-bold text-slate-800">{type.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <div className="no-print">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={handleCancel} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                                <XIcon className="w-4 h-4" /> Cancel
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                                <CheckCircleIcon className="w-4 h-4" /> Save
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="worksheet-content pt-6 border-t border-slate-200">
                {isEditing ? (
                    <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={20} className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm" aria-label={`Edit ${type} worksheet`} />
                ) : (
                    <>
                        <WorksheetDisplay content={mainContent} type={type} />
                        {answerKeyContent && answerKeyContent.trim() && <AnswerKeyDisplay answerKeyContent={answerKeyContent} />}
                    </>
                )}
            </div>
        </div>
    );
};


export const IllustrationGrid: React.FC<IllustrationGridProps> = ({ 
  illustration, 
  lessonData,
  onBack, 
  worksheets,
  generatingWorksheetTypes,
  onGenerateWorksheet,
  onUpdateWorksheet
}) => {
  const handlePrint = () => {
    window.print();
  };
  
  const hasGeneratedWorksheets = Object.values(worksheets).some(content => content);

  return (
    <div className="w-full max-w-4xl mx-auto print-container">
        <style>{`
        @media print {
          body { 
            background-color: #fff !important; 
            font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; 
          }
          .no-print { display: none !important; }
          
          /* Reset layout constraints from the screen view */
          .print-main { 
            padding: 0 !important; 
            margin: 0 !important;
          }
          .print-container { 
            max-width: none !important; 
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .printable-area { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
            width: 100% !important;
          }
          
          /* Ensure consistent spacing between printable sections */
          .printable-area > * {
             margin-top: 2rem !important;
          }
          .printable-area > :first-child {
             margin-top: 0 !important;
          }

          /* Style printable sections */
          .printable-main, .printable-vocab, .printable-worksheet {
             page-break-inside: avoid;
             box-shadow: none !important;
             border: 1px solid #ddd !important;
             border-radius: 0 !important;
          }
          
          .worksheet-content {
            overflow-wrap: break-word;
          }

          /* Remove max-width from crossword grid */
          .crossword-grid-container {
             max-width: 100% !important;
          }
          
          /* Handle answer key printing */
           .printable-answer-key {
             page-break-before: always;
             display: block !important;
          }

          /* Hide elements that should not be printed and fix others */
          textarea { display: none; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
        <div className="no-print flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800">Your Lesson Visual</h2>
            <button onClick={onBack} className="flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <BackIcon className="w-5 h-5 mr-2" />
                Generate Another
            </button>
        </div>
      
      <div className="printable-area space-y-10">
        <div className="printable-main bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="mb-4">
              <ImageCard illustration={illustration} />
          </div>
          {illustration.imageUrl && (
              <div className="text-center no-print">
                   <a href={illustration.imageUrl} download={`${illustration.word.replace(/ /g, '_')}.png`} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      Download Image
                  </a>
              </div>
          )}
        </div>

        {illustration.imageUrl && (
        <>
            <div className="printable-vocab bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Vocabulary & Pronunciation</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-base">
                    {lessonData.vocabulary.map((item) => (
                        <li key={item.word} className="flex items-baseline p-2 bg-slate-50 rounded-md">
                            <span className="font-semibold text-slate-800 capitalize">{item.word}</span>
                            <span className="text-slate-500 ml-2 font-mono text-sm">{item.ipa}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="no-print text-center">
              <h3 className="text-2xl font-bold text-slate-800">Generate a Worksheet</h3>
              <p className="text-slate-600 mt-1">Create printable activities to accompany your visual.</p>
            </div>

            <div className="no-print bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(WorksheetType).map(type => {
                    const isGenerated = !!worksheets[type];
                    const isGenerating = generatingWorksheetTypes.includes(type);
                    return (
                      <button key={type} type="button" onClick={() => { if (!isGenerated && !isGenerating) onGenerateWorksheet(type); }} disabled={isGenerating || isGenerated} className={`flex items-center justify-center text-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-wait ${isGenerated ? 'bg-emerald-50 border-emerald-300 text-emerald-800 disabled:opacity-80 disabled:cursor-default' : 'bg-white border-slate-300 hover:bg-slate-100'}`}>
                        {isGenerating ? <Spinner size="w-5 h-5"/> : isGenerated ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ClipboardListIcon className="w-5 h-5 mr-2" />}
                        {isGenerating ? 'Generating...' : isGenerated ? 'Generated' : type.replace(/([A-Z])/g, ' $1').trim()}
                      </button>
                    );
                  })}
                </div>
            </div>
            
            {hasGeneratedWorksheets && (
            <div className="space-y-8">
              <div className="flex justify-between items-center no-print">
                <h3 className="text-2xl font-bold text-slate-800">Generated Worksheets</h3>
                   <button onClick={handlePrint} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      <PrintIcon className="w-5 h-5 mr-2" />
                      Print All Materials
                  </button>
              </div>

              {Object.entries(worksheets)
                .filter(([, content]) => content)
                .map(([type, content]) => (
                  <EditableWorksheetCard key={type} type={type as WorksheetType} content={content!} onUpdate={(newContent) => onUpdateWorksheet(type as WorksheetType, newContent)} />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};
