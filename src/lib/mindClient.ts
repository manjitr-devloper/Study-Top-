/**
 * MIND 1.0 Client — The Intelligence Behind Study Top
 * Connects Study Top Frontend directly to the centralized MIND 1.0 intelligence engine.
 */

export interface MindNoteRequest {
  sourceType: 'pdf' | 'image' | 'camera' | 'text' | 'youtube' | 'topic' | 'document';
  content?: string;
  imageBase64?: string;
  imageMimeType?: string;
  images?: { base64: string; mimeType: string }[];
  title?: string;
  subject?: string;
  chapter?: string;
  classLevel?: string;
  language?: string;
  explanationLevel?: 'Simple' | 'Standard' | 'Detailed';
  customInstructions?: string;
}

export interface MindGeneratedNote {
  chapterTitle: string;
  topicName: string;
  subject: string;
  language: string;
  introduction: string;
  definitions: { term: string; definition: string }[];
  mainConcepts: { title: string; points: string[] }[];
  pointWiseExplanations: { concept: string; steps: string[] }[];
  importantFacts: string[];
  formulas: { name: string; formula: string; explanation: string }[];
  examples: { title: string; scenario: string; solution: string }[];
  comparisons: { feature: string; itemA: string; itemB: string }[];
  importantDates?: { dateOrEra: string; event: string }[];
  diagramCode?: string;
  diagramDescription?: string;
  examImportantQuestions: string[];
  shortQuestions: { question: string; answer: string }[];
  longQuestions: { question: string; answer: string }[];
  quickRevision: string[];
  chapterSummary: string;
  markdownOutput: string;
  generatedAt: number;
}

export const mindClient = {
  /**
   * Automatically generate complete point-wise study notes
   */
  async generateNotes(params: MindNoteRequest): Promise<MindGeneratedNote> {
    const res = await fetch('/api/mind/generate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `MIND 1.0 generation failed (${res.status})`);
    }

    const data = await res.json();
    return data.note;
  },

  /**
   * Solve academic questions step-by-step
   */
  async solve(params: {
    question: string;
    subject: string;
    classLevel?: string;
    language?: string;
    imageBase64?: string;
    imageMimeType?: string;
  }): Promise<{ solution: string; subject: string; language: string; timestamp: number }> {
    const res = await fetch('/api/mind/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `MIND 1.0 solver failed (${res.status})`);
    }

    return await res.json();
  },

  /**
   * Conversational study assistant
   */
  async chat(params: {
    message: string;
    history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
    contextNote?: string;
    language?: string;
  }): Promise<{ reply: string; timestamp: number }> {
    const res = await fetch('/api/mind/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `MIND 1.0 assistant failed (${res.status})`);
    }

    return await res.json();
  }
};
