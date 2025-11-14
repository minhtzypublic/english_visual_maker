
import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { LessonData, VocabularyItem, WorksheetType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

export const generatePronunciations = async (words: string[], level: string): Promise<VocabularyItem[]> => {
  const prompt = `
You are an expert linguist specializing in phonetics for English Language Learners at a ${level} level.
For each word in the following list, provide its International Phonetic Alphabet (IPA) transcription.
- Use the most common, standard American English pronunciation.
- Present the result as a JSON object, where keys are the original words and values are the IPA strings. Do not return markdown.

Word list: ${words.join(', ')}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    return words.map(word => {
      let ipa = result[word] || 'N/A';
      if (ipa !== 'N/A' && ipa.trim()) {
        // clean up potential extra characters from model response e.g. (//ipa//) -> /ipa/
        const coreIpa = ipa.trim().replace(/^\s*\(?\/*/, '').replace(/\/*\)?\s*$/, '');
        ipa = `/${coreIpa}/`;
      }
      return { word, ipa };
    });
  } catch (error) {
    console.error('Error generating pronunciations:', error);
    // Return the original words with a placeholder if the API fails
    return words.map(word => ({ word, ipa: '...' }));
  }
};

export const analyzeContent = async (
  content: { type: 'image', data: string, mimeType: string } | { type: 'text', data: string }
): Promise<{ topic: string, vocabulary: VocabularyItem[] }> => {
  const model = 'gemini-2.5-flash';
  
  const instructionPart = {
    text: `You are an expert assistant for English language teachers.
Analyze the provided content (an image or a piece of text).
Your task is to:
1. Identify a single, clear, and concise lesson topic from the content.
2. Extract a list of 5-10 key vocabulary words that are visually present in the image or central to the text. The words should be simple nouns, verbs, or adjectives.
3. For each word, provide its International Phonetic Alphabet (IPA) transcription in American English.
4. Return the result as a JSON object. Do not return markdown.`
  };

  let parts: Part[];

  if (content.type === 'image') {
    const imagePart = {
      inlineData: {
        data: content.data,
        mimeType: content.mimeType,
      },
    };
    parts = [imagePart, instructionPart];
  } else {
    parts = [{text: content.data}, instructionPart];
  }
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: {
              type: Type.STRING,
              description: "The main topic of the lesson."
            },
            vocabulary: {
              type: Type.ARRAY,
              description: "A list of key vocabulary items, each with a word and its IPA transcription.",
              items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    ipa: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result;

  } catch (error) {
    console.error('Error analyzing content:', error);
    throw new Error("Failed to analyze the content. The AI might not have been able to process it.");
  }
};


export const generateLessonVisual = async (lessonData: LessonData): Promise<string> => {
  const { topic, vocabulary, style, level } = lessonData;

  const vocabString = vocabulary.map(v => v.word).join(', ');

  const prompt = `
Create a single, vibrant, and cohesive illustration that visually represents the English lesson topic of "${topic}".
Core Image Requirements:
Topic & Vocabulary: The image must clearly include and visualize the entire topic (${topic}) and all of the following vocabulary items in detail: ${vocabString}.
Art Style: ${style}.
Level: Designed for English learners at the ${level} level.
Mood: The scene should be bright, cheerful, and easy to understand.
Overall Composition: The overall composition must be suitable for a worksheet or classroom poster.
Visibility Guarantee: All vocabulary items must be clearly visible within the scene.
Exclusion Rules (DO NOT Include):
- DO NOT include the topic title (${topic}) as text in the scene.
- DO NOT include any of the vocabulary words (${vocabString}) as text (written labels) in the scene.
In summary, the illustration must be a visual, text-free, comprehensive, and accessible depiction.`;
  return generateImage(prompt);
};

export const generateWorksheet = async (lessonData: LessonData, worksheetType: WorksheetType): Promise<string> => {
    const { topic, vocabulary, level } = lessonData;
    const vocabStringWithIPA = vocabulary.map(v => `${v.word} (${v.ipa})`).join(', ');
    const vocabString = vocabulary.map(v => v.word).join(', ');
    
    let activityPrompt = '';

    if (worksheetType === WorksheetType.Matching) {
        activityPrompt = `
Generate a matching activity.
1.  List the vocabulary words with their IPA on the left, numbered. Example: 1. Lion (/ˈlaɪən/) ___.
2.  The vocabulary list to use is: ${vocabStringWithIPA}.
3.  On the right, create a list of simple, clear definitions or descriptions for each word, suitable for a ${level} learner. This list should be lettered (A, B, C...). The definitions should not contain the vocabulary words themselves.
4.  The order of the definitions on the right must be randomized so they do not directly correspond to the numbered words on the left.
5.  Provide a space for the answer next to each numbered word (e.g., "1. [Word] (IPA) ___").
6.  Finally, provide a separate answer key at the very bottom under a "--- ANSWER KEY ---" separator.
Format the output cleanly with clear headings for each section.
`;
    } else if (worksheetType === WorksheetType.FillInTheBlanks) {
        activityPrompt = `
Generate a fill-in-the-blanks activity.
1.  List all the vocabulary words with their IPA transcriptions in a "Word Bank" box before the sentences. The list to use is: ${vocabStringWithIPA}.
2.  Create ${vocabulary.length} sentences related to the lesson topic "${topic}".
3.  Each sentence should use exactly one of the vocabulary words from this list: ${vocabString}.
4.  Replace the vocabulary word in each sentence with a blank line (__________).
5.  The sentences should be simple and clear, suitable for a ${level} learner.
6.  Finally, provide a separate answer key at the very bottom under a "--- ANSWER KEY ---" separator, showing the completed sentences.
Format the output cleanly with clear headings for each section.
`;
    } else if (worksheetType === WorksheetType.Crossword) {
        activityPrompt = `
Generate a crossword puzzle activity. Your output must have two parts: a JSON object for the puzzle structure, and a text-based answer key.

Part 1: JSON Object
1.  Generate a JSON object containing the crossword structure.
2.  This JSON object must be enclosed in a single JSON markdown block (\`\`\`json ... \`\`\`).
3.  The JSON object must have two top-level keys: "grid" and "clues".
4.  "grid": A 2D array representing the puzzle. Each cell is either \`null\` (for a black square) or an object like \`{"letter": "C", "number": 1}\` for a lettered square. The number should only be present for the first letter of a word.
5.  "clues": An object with two keys, "across" and "down". Each should be an array of strings, where each string is a clue, e.g., "1. A small, domesticated carnivorous mammal...".

Part 2: Answer Key
1.  After the JSON markdown block, add a separator: "--- ANSWER KEY ---".
2.  Below the separator, provide a list of answers for the "Across" and "Down" clues.

Use the vocabulary words: ${vocabString}. Create simple, clear clues for each word suitable for a ${level} learner.
`;
    } else if (worksheetType === WorksheetType.SentenceOrdering) {
        activityPrompt = `
Generate a sentence ordering (jumbled sentences) activity.
1. For each vocabulary word from the list (${vocabString}), create one unique, simple sentence that uses the word. The sentence should be appropriate for a ${level} learner and related to the topic "${topic}".
2. After creating a sentence, jumble the words. Present the jumbled words for the student to reorder. Use a "/" to separate the jumbled words.
3. Number each jumbled sentence.
4. Provide a separate answer key at the very bottom under a "--- ANSWER KEY ---" separator, showing the correctly ordered sentences.
Format the output cleanly with a clear heading.
Example:
1. cat / the / sleeping / is / .
`;
    }

    const prompt = `
You are an expert English Language Teaching (ELT) assistant. Your task is to create a printable worksheet activity.

Lesson Topic: "${topic}"
Vocabulary: ${vocabStringWithIPA}
Learner Level: ${level}

Activity Type: ${worksheetType}

Instructions:
${activityPrompt}

Please generate the full text for the worksheet activity based on these instructions. The tone should be encouraging and clear for a language learner. Do not include any commentary, just the worksheet content itself.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        // The model sometimes escapes underscores in markdown, remove the backslashes.
        const cleanedText = response.text.replace(/\\_/g, '_');
        return cleanedText;
    } catch (error) {
        console.error('Error generating worksheet:', error);
        throw new Error("Failed to generate the worksheet content.");
    }
};
