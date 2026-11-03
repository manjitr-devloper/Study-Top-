import { QuizQuestion, StudyGuide } from "../types";

async function callServerGemini(action: string, params: any) {
  try {
    const res = await fetch('/api/gemini/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params })
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      if (text.includes('Rate exceeded') || text.includes('rate limit') || text.includes('Rate limit')) {
        throw new Error('AI Rate limit exceeded. Please wait 10 seconds and retry.');
      }
      throw new Error(text.substring(0, 150) || 'Server error or invalid response from AI service.');
    }

    if (!data.success) {
      throw new Error(data.error || data.message || 'Server Gemini API error');
    }
    return data.data;
  } catch (err: any) {
    console.error(`Gemini proxy error [${action}]:`, err?.message || err);
    throw err;
  }
}

export async function searchWithGoogle(query: string, language: string = "English"): Promise<{answer: string, sources: any[]}> {
  return callServerGemini('search', { query, language });
}

export async function summarizeNote(content: string, language: string = "English", profession: string = "Professional"): Promise<string> {
  return callServerGemini('summarize', { content, language, profession });
}

export async function generateQuiz(content: string, language: string = "English", profession: string = "Professional"): Promise<QuizQuestion[]> {
  return callServerGemini('quiz', { content, language, profession });
}

export async function generateMockTest(content: string, language: string = "English", profession: string = "Professional"): Promise<QuizQuestion[]> {
  return callServerGemini('mock_test', { content, language, profession });
}

export interface SpellingIssue {
  original: string;
  context: string;
  suggestions: string[];
  explanation: string;
}

export async function checkSpelling(content: string, language: string = "English"): Promise<SpellingIssue[]> {
  return callServerGemini('check_spelling', { content, language });
}

export async function generateStudyGuide(content: string, language: string = "English", profession: string = "Professional"): Promise<StudyGuide> {
  return callServerGemini('study_guide', { content, language, profession });
}

export async function processStudyImage(imageFile: File, language: string = "English"): Promise<string> {
  const reader = new FileReader();
  const fileData = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(imageFile);
  });
  const base64Data = fileData.split(',')[1];
  const mimeType = imageFile.type;

  return callServerGemini('process_image', { base64Data, mimeType, language });
}

export async function processStudyYoutube(url: string, language: string = "English"): Promise<string> {
  return callServerGemini('process_youtube', { url, language });
}

export async function translateAndDefine(text: string, targetLanguage: string, context: string = ""): Promise<{ definition: string, translation: string, type: string, phonetic: string, examples: string[] }> {
  return callServerGemini('translate_define', { text, targetLanguage, context });
}

export async function defineWord(word: string, context: string, language: string = "English"): Promise<{ definition: string, type: string, phonetic: string, example: string }> {
  return callServerGemini('define_word', { word, context, language });
}

export async function generateProject(type: string, subject: string, title: string, command: string, files: File[] = [], language: string = "English", profession: string = "Professional"): Promise<string> {
  const serializedFiles: Array<{ data: string; mimeType: string }> = [];
  for (const file of files) {
    const reader = new FileReader();
    const fileData = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    const base64Data = fileData.split(',')[1];
    serializedFiles.push({ data: base64Data, mimeType: file.type });
  }

  return callServerGemini('generate_project', { type, subject, title, command, files: serializedFiles, language, profession });
}

export async function extractTasksFromNote(content: string, language: string = "English"): Promise<{title: string, priority: "low" | "medium" | "high"}[]> {
  return callServerGemini('extract_tasks', { content, language });
}

export async function autoTagNote(content: string, availableCategories: {id: string, name: string}[], language: string = "English"): Promise<{title: string, categoryId: string, tags: string[]}> {
  return callServerGemini('auto_tag', { content, availableCategories, language });
}

export async function breakDownTask(taskTitle: string, language: string = "English"): Promise<string[]> {
  return callServerGemini('break_down_task', { taskTitle, language });
}

export async function parseVoiceToTask(audioBlob: Blob, language: string = "English"): Promise<{title: string, dueDate?: string}> {
  const reader = new FileReader();
  const fileData = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(audioBlob);
  });
  const base64Data = fileData.split(',')[1];
  const mimeType = audioBlob.type;

  return callServerGemini('parse_voice_to_task', { base64Data, mimeType, language });
}

export async function executeAiCommand(command: string, history: {role: string, text: string}[], language: string = "English", customPersona: string = "Helpful AI Assistant"): Promise<{ reply: string, actions: any[] }> {
  try {
    return await callServerGemini('execute_ai_command', { command, history, language, customPersona });
  } catch (error: any) {
    return {
      reply: `I heard: "${command}". I am ready to help you create notes, tasks, or study guides!`,
      actions: []
    };
  }
}

export async function generateImageAI(prompt: string): Promise<string> {
  return callServerGemini('generate_image', { prompt });
}

export async function generateNoteTemplate(style: string, topic: string, language: string = "English"): Promise<string> {
  return callServerGemini('note_template', { style, topic, language });
}

export async function generateDiagramCode(prompt: string, type: string = "Flowchart", language: string = "English"): Promise<{ title: string; code: string }> {
  try {
    return await callServerGemini('diagram_code', { prompt, type, language });
  } catch (err) {
    return {
      title: prompt.substring(0, 50),
      code: `flowchart TD\n    A["${prompt.substring(0, 30)}"] --> B["Core Principle"]\n    B --> C["Application & Result"]`
    };
  }
}

export async function chatWithNote(content: string, message: string, history: { role: "user" | "model", parts: { text: string }[] }[], language: string = "English", profession: string = "Professional"): Promise<string> {
  return callServerGemini('chat_with_note', { content, message, history, language, profession });
}

export interface PointWiseNotesOptions {
  classLevel: string;
  board: string;
  subject: string;
  chapterTitle: string;
  language: string;
  length: 'Very Short' | 'Short' | 'Detailed' | 'Exam-Ready';
  sourceMaterial?: string;
  useGoogleData?: boolean;
}

export async function generatePointWiseNotes(options: PointWiseNotesOptions): Promise<{ markdown: string; sources?: string[] }> {
  return callServerGemini('point_wise_notes', { options });
}

export async function generateConceptDiagram(topic: string, subject: string, language: string = "English"): Promise<string> {
  return callServerGemini('concept_diagram', { topic, subject, language });
}

export async function solveQuestionStepByStep(params: {
  question: string;
  subject: string;
  classLevel: string;
  board: string;
  language: string;
  useGoogleData?: boolean;
}): Promise<{ solution: string; sources?: string[] }> {
  return callServerGemini('solve_question', params);
}

export async function simplifyOrRegenerateSection(sectionText: string, instruction: string, language: string = "English"): Promise<string> {
  return callServerGemini('simplify_section', { sectionText, instruction, language });
}

export interface SmartNoteOptions {
  title?: string;
  sourceType: 'text' | 'camera' | 'images' | 'pdf' | 'youtube';
  textContent?: string;
  files?: Array<{ base64Data: string; mimeType: string; name?: string }>;
  youtubeUrl?: string;
  fallbackTranscript?: string;
  style: 'Short' | 'Detailed' | 'Exam Preparation' | 'Handwritten-Style Text' | 'Revision Notes';
  language: string;
  difficulty: 'Easy' | 'Standard' | 'Advanced';
  format: 'Point-wise Notes' | 'Q&A' | 'Table Format' | 'Mind Map Outline' | 'Flashcards';
  length: 'Brief' | 'Medium' | 'Comprehensive';
  useGoogleSearch?: boolean;
  signal?: AbortSignal;
}

export async function generateSmartStudyNotes(options: SmartNoteOptions): Promise<{ title: string; markdown: string; sources?: string[] }> {
  return callServerGemini('smart_study_notes', { options });
}

export async function generateAudioOverviewScript(
  sources: { title: string; content: string }[],
  language: string = "English"
): Promise<{ title: string; summary: string; dialogue: { speaker: string; text: string }[] }> {
  return callServerGemini('audio_overview_script', { sources, language });
}

export async function chatWithNotebookSources(
  query: string,
  sources: { title: string; content: string }[],
  history: { role: 'user' | 'model'; content: string }[] = [],
  language: string = "English"
): Promise<{ text: string; citations: { index: number; sourceTitle: string; quote: string }[] }> {
  return callServerGemini('chat_notebook_sources', { query, sources, history, language });
}

export async function generateStudioGuide(
  type: 'study-guide' | 'faq' | 'briefing' | 'timeline',
  sources: { title: string; content: string }[],
  language: string = "English"
): Promise<{ title: string; content: string }> {
  return callServerGemini('studio_guide', { type, sources, language });
}

export async function* handleGenerateContentStream(contents: any, config?: any): AsyncGenerator<string, void, unknown> {
  const res = await fetch('/api/gemini/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, config })
  });

  if (!res.ok || !res.body) {
    throw new Error('Streaming failed on server');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.replace('data: ', '').trim();
        if (jsonStr === '[DONE]') return;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.text) yield parsed.text;
          if (parsed.error) throw new Error(parsed.error);
        } catch (e) {
          // ignore invalid json
        }
      }
    }
  }
}

export async function generateFlashcardsFromNote(content: string, language: string = "English"): Promise<{ front: string; back: string }[]> {
  try {
    const guide = await generateStudyGuide(content, language);
    if (guide.keyTerms && guide.keyTerms.length > 0) {
      return guide.keyTerms.map(kt => ({ front: kt.term, back: kt.definition }));
    }
    if (guide.concepts && guide.concepts.length > 0) {
      return guide.concepts.map(c => ({ front: c.title, back: c.explanation }));
    }
  } catch (err) {
    console.warn("Flashcard AI generation fallback", err);
  }
  
  // Intelligent heuristic extraction from notes: headings, questions, key points
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const cards: { front: string; back: string }[] = [];
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.includes(':') || line.endsWith('?') || line.startsWith('- **')) {
      const front = line.replace(/^[#\-*0-9.]+\s*/, '').replace(/\*\*/g, '').trim();
      const back = lines[i + 1].replace(/^[#\-*0-9.]+\s*/, '').trim();
      if (front.length > 3 && back.length > 3) {
        cards.push({ front, back });
        i++;
      }
    }
    if (cards.length >= 8) break;
  }
  
  return cards.length > 0 ? cards : [
    { front: "Key Takeaway", back: content.substring(0, 160) }
  ];
}

