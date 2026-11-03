import { GoogleGenAI, Type, Modality } from '@google/genai';
import { WebSocket } from 'ws';

const geminiApiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-4-argon', 'gemini-3.1-flash-lite'];

/**
 * Robust execution with candidate model fallbacks
 */
export async function executeWithFallback<T>(
  fn: (modelName: string) => Promise<T>,
  preferredModel?: string
): Promise<T> {
  const models = [
    preferredModel || PRIMARY_MODEL,
    ...FALLBACK_MODELS.filter(m => m !== (preferredModel || PRIMARY_MODEL))
  ];
  let lastErr: any = null;

  for (const m of models) {
    try {
      return await fn(m);
    } catch (err: any) {
      lastErr = err;
      const msg = err?.message || String(err);
      if (
        msg.includes('404') || 
        msg.includes('NOT_FOUND') || 
        msg.includes('not found') ||
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('overloaded') ||
        msg.includes('Rate exceeded') ||
        msg.includes('rate limit') ||
        msg.includes('Resource has been exhausted')
      ) {
        console.warn(`[Gemini Server] Model ${m} unavailable or rate limited (${msg}), attempting fallback model...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('AI Rate limit or quota exceeded. Please wait 10 seconds and try again.');
}

// 1. Google Search Grounding
export async function handleSearchWithGoogle(query: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Please perform a deep search to answer the following query in ${language}. Combine finding the information and synthesizing it into a beautiful, coherent response.
Query: ${query}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = result.text || 'No results found.';
    let sources: any[] = [];
    try {
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        sources = chunks.map((chunk: any) => chunk.web?.uri).filter(Boolean);
      }
    } catch (e) {
      console.error('Failed to parse sources', e);
    }

    return { answer: text, sources };
  });
}

// 2. Note Summarization
export async function handleSummarizeNote(content: string, language: string = 'English', profession: string = 'Professional') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Summarize the following notes into a concise, readable summary in ${language} for a ${profession}:\n\n${content}`,
      config: {
        systemInstruction: `You are an expert assistant for a ${profession} writing in ${language}. Provide summaries that focus on the core meaning, key takeaways, and action items relevant to their role. Output MUST be in ${language}.`,
      },
    });
    return result.text || 'Could not generate summary.';
  });
}

// 3. Quiz Generation
export async function handleGenerateQuiz(content: string, language: string = 'English', profession: string = 'Professional') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Generate 3 multiple-choice questions or scenarios based on these notes in ${language}:\n\n${content}`,
      config: {
        systemInstruction: `You are an expert evaluator assessing a ${profession}. Create challenging but fair assessment questions/scenarios that test deep understanding. ALL text (questions, options, explanations) MUST be in ${language}.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: 'Must provide exactly 4 options.'
              },
              correctAnswer: { 
                type: Type.INTEGER,
                description: 'Index of the correct option (0-3).'
              },
              explanation: { type: Type.STRING }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation']
          }
        }
      }
    });

    try {
      return JSON.parse(result.text || '[]');
    } catch (e) {
      return [];
    }
  });
}

// 4. Mock Test Generation
export async function handleGenerateMockTest(content: string, language: string = 'English', profession: string = 'Professional') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Generate a comprehensive mock assessment with 10 multiple-choice questions or scenarios based on these notes in ${language}:\n\n${content}`,
      config: {
        systemInstruction: `Create a comprehensive assessment acting as an expert evaluator for a ${profession}. Include questions of varying difficulty. ALL text MUST be in ${language}.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: 'Must provide exactly 4 options.'
              },
              correctAnswer: { 
                type: Type.INTEGER,
                description: 'Index of the correct option (0-3).'
              },
              explanation: { type: Type.STRING }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation']
          }
        }
      }
    });

    try {
      return JSON.parse(result.text || '[]');
    } catch (e) {
      return [];
    }
  });
}

// 5. Spellcheck & Proofreading
export async function handleCheckSpelling(content: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Analyze the following text for spelling and grammatical errors in ${language}. 
Text:
"""
${content}
"""

Return a list of errors. For each error, provide:
1. "original": the exact misspelled word or incorrect phrase from the text.
2. "context": a short snippet (3-5 words) from the text that contains the error, to help locate it uniquely.
3. "suggestions": an array of 1-3 suggested corrections.
4. "explanation": a brief explanation of why it is wrong.`,
      config: {
        systemInstruction: 'You are an expert copyeditor. Return only helpful spelling and grammatical corrections. If there are no errors, return an empty array. Focus on actual errors.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              context: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              explanation: { type: Type.STRING }
            },
            required: ['original', 'context', 'suggestions', 'explanation']
          }
        }
      }
    });

    try {
      return JSON.parse(result.text || '[]');
    } catch (e) {
      return [];
    }
  });
}

// 6. Comprehensive Study Guide
export async function handleGenerateStudyGuide(content: string, language: string = 'English', profession: string = 'Professional') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Transform these notes into a structured, comprehensive brief or guide in ${language} tailored for a ${profession}:\n\n${content}`,
      config: {
        systemInstruction: `You are an elite assistant catering to a ${profession} writing in ${language}. Create a structured brief that includes a high-level summary, a very brief quick summary (1-2 sentences), key terms/decisions, core concepts, learning/project objectives, and next steps/revision tips. ALL content MUST be in ${language}.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            quickSummary: { type: Type.STRING },
            keyTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING }
                },
                required: ['term', 'definition']
              }
            },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['title', 'explanation']
              }
            },
            learningObjectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            revisionTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['summary', 'quickSummary', 'keyTerms', 'concepts', 'learningObjectives', 'revisionTips']
        }
      }
    });

    try {
      return JSON.parse(result.text || '{}');
    } catch (e) {
      return { 
        summary: 'Error generating guide', 
        quickSummary: 'Error generating guide',
        keyTerms: [], 
        concepts: [], 
        learningObjectives: [], 
        revisionTips: [] 
      };
    }
  });
}

// 7. Image OCR & Text Extraction
export async function handleProcessStudyImage(base64Data: string, mimeType: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: `Extract all educational text from this image and provide a clean, structured transcription in ${language}. If there are diagrams, describe them briefly.` }
          ]
        }
      ],
      config: {
        systemInstruction: `You are an expert OCR and tutor. Extract text precisely in ${language}.`
      }
    });
    return result.text || 'Could not extract text from the image.';
  });
}

// 8. YouTube Video Summary
export async function handleProcessStudyYoutube(url: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Summarize the key points from this YouTube video: ${url}. Provide a study guide in ${language}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are an expert at synthesizing information from educational videos. Provide a structured summary in ${language}.`
      }
    });
    return result.text || 'Could not generate summary from the link.';
  });
}

// 9. Translate and Define
export async function handleTranslateAndDefine(text: string, targetLanguage: string, context: string = '') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Analyze the text "${text}" for a user speaking ${targetLanguage}.
Context: ${context}

Provide:
1. "translation": the translation of the text into ${targetLanguage}.
2. "definition": a clear definition of the word/phrase in ${targetLanguage}.
3. "type": the part of speech (in ${targetLanguage}).
4. "phonetic": phonetic transcription or pronunciation guide.
5. "examples": 2-3 example sentences using the word, translated if necessary.`,
      config: {
        systemInstruction: `You are a world-class linguist and dictionary. ALL output values MUST be in ${targetLanguage}. Response must be strictly valid JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            definition: { type: Type.STRING },
            type: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['translation', 'definition', 'type', 'phonetic', 'examples']
        }
      }
    });

    try {
      return JSON.parse(result.text || '{}');
    } catch (e) {
      return { translation: text, definition: 'Not found', type: '', phonetic: '', examples: [] };
    }
  });
}

// 10. Dictionary Word Definition
export async function handleDefineWord(word: string, context: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Define the word or phrase "${word}" in the context of:\n"${context}"\n\nProvide the meaning, part of speech, phonetic transcription, and an example sentence in ${language}.`,
      config: {
        systemInstruction: `You are a multilingual dictionary. Provide accurate definitions based on context. Output MUST be in ${language} and formatted as JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            definition: { type: Type.STRING },
            type: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            example: { type: Type.STRING }
          },
          required: ['definition', 'type', 'phonetic', 'example']
        }
      }
    });

    try {
      return JSON.parse(result.text || '{}');
    } catch (e) {
      return { definition: 'Definition not found', type: '', phonetic: '', example: '' };
    }
  });
}

// 11. Project & Homework Generator
export async function handleGenerateProject(
  type: string, 
  subject: string, 
  title: string, 
  command: string, 
  files: Array<{ data: string; mimeType: string }> = [], 
  language: string = 'English', 
  profession: string = 'Professional'
) {
  return executeWithFallback(async (model) => {
    const parts: any[] = [];
    if (files.length > 0) {
      for (const file of files) {
        parts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
      }
    }

    parts.push({ 
      text: `Generate a detailed ${type} about the subject "${subject}" titled "${title}".
Additional instructions/prompt:
${command}

Provide the output formatted appropriately for a ${profession}. Organize it with headings, paragraphs, and lists. Keep it professional. Output MUST be in ${language}.`
    });

    const result = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: `You are an expert acting as an assistant for a ${profession}. Create robust, detailed content that follows the instructions carefully. Write content in ${language}. Use proper markdown.`
      }
    });
    return result.text || 'Could not generate project.';
  });
}

// 12. Extract Tasks
export async function handleExtractTasks(content: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Extract actionable tasks, assignments, or "to-dos" from the following notes. Return them in ${language}.\n\n${content}`,
      config: {
        systemInstruction: 'You are an AI task manager. Identify implicitly or explicitly stated tasks. Assign an appropriate priority.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
            },
            required: ['title', 'priority']
          }
        }
      }
    });
    try { return JSON.parse(result.text || '[]'); } catch (e) { return []; }
  });
}

// 13. Auto Tag Note
export async function handleAutoTagNote(content: string, availableCategories: {id: string, name: string}[], language: string = 'English') {
  return executeWithFallback(async (model) => {
    const cats = availableCategories.map(c => `${c.id} (${c.name})`).join(', ');
    const result = await ai.models.generateContent({
      model,
      contents: `Analyze these notes and provide a concise title, recommend 3 short tags, and select the BEST matching category ID from this list: ${cats}. If none fit well, return 'all'. Notes:\n\n${content}`,
      config: {
        systemInstruction: `You are an AI librarian. Output strictly in ${language} whenever possible, but keep categoryId exactly as provided.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            categoryId: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'categoryId', 'tags']
        }
      }
    });
    try { 
      return JSON.parse(result.text || '{"title":"Untitled","categoryId":"all","tags":[]}'); 
    } catch (e) { 
      return { title: 'Untitled', categoryId: 'all', tags: [] }; 
    }
  });
}

// 14. Break Down Task
export async function handleBreakDownTask(taskTitle: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Break down this task into 3-5 smaller, highly actionable sub-tasks in ${language}. Task: ${taskTitle}`,
      config: {
        systemInstruction: 'You are an expert productivity coach. Make sub-tasks clear, direct, and small.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    try { return JSON.parse(result.text || '[]'); } catch (e) { return []; }
  });
}

// 15. Voice Task Parsing
export async function handleParseVoiceToTask(base64Data: string, mimeType: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: `The current date and time is ${new Date().toISOString()}. Listen to this audio and extract a task from it. Respond in ${language}.
Return a JSON object with 'title' (string, a concise task title) and optionally 'dueDate' (ISO string representing the inferred date and time, if mentioned).` }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            dueDate: { type: Type.STRING }
          },
          required: ['title']
        }
      }
    });
    return JSON.parse(result.text || '{}');
  });
}

// 16. AI Agent Command Execution
export async function handleExecuteAiCommand(
  command: string, 
  history: {role: string, text: string}[], 
  language: string = 'English', 
  customPersona: string = 'Helpful AI Assistant'
) {
  return executeWithFallback(async (model) => {
    const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const result = await ai.models.generateContent({
      model,
      contents: `Conversation History:\n${historyText}\n\nUser Command: ${command}\n\nAnalyze the command and decide if you need to create any resources (tasks, notes, events/calendar). Respond to the user natively in ${language}. Your persona is: ${customPersona}`,
      config: {
        systemInstruction: `You are an intelligent agent integrated deeply into the platform. You MUST respond in ${language}. If the user asks you to create something or if their input implies creating an item, generate the necessary action in the 'actions' array.
Valid actions:
- { "type": "create_task", "payload": { "title": string, "description": string, "priority": "low"|"medium"|"high" } }
- { "type": "create_event", "payload": { "title": string, "description": string, "date": string (YYYY-MM-DD), "time": string (HH:MM), "location": string } }
- { "type": "create_note", "payload": { "title": string, "content": string } }
ONLY include actions if the command implies creating them. Don't create actions for general chatting.
Keep your reply text concise and helpful. Return valid JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  payload: { type: Type.OBJECT }
                },
                required: ['type', 'payload']
              }
            }
          },
          required: ['reply', 'actions']
        }
      }
    });

    try {
      return JSON.parse(result.text || '{"reply": "I am ready to help you.", "actions": []}');
    } catch (e) {
      return { reply: result.text || 'I processed your request.', actions: [] };
    }
  });
}

// 17. Server Image Generation (gemini-3.1-flash-lite-image)
export async function handleGenerateImageAI(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1'
      }
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      const base64Data = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${base64Data}`;
    }
  }
  throw new Error('No image data returned by model');
}

// 18. Note Template Generator
export async function handleGenerateNoteTemplate(style: string, topic: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Generate a beautifully structured markdown note template in ${language} about "${topic}" using a "${style}" theme.`,
      config: {
        systemInstruction: 'You are an expert note-taking architect. Return ONLY valid markdown. Use headers, bold text, blockquotes, and lists to create a stunning structure with placeholders and a brief topic introduction.'
      }
    });
    return result.text || `# ${topic}\n\nStart typing here...`;
  });
}

// 19. Diagram Code Generator
export async function handleGenerateDiagramCode(prompt: string, type: string = 'Flowchart', language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `You are an academic diagram architect for Study Top.
Generate a valid, visually clear Mermaid diagram about: "${prompt}".
Diagram Type: ${type}.
Language for text and labels: ${language}.

Strict Output Rules:
1. Return ONLY the raw Mermaid diagram code without markdown fences.
2. Must use valid Mermaid syntax (flowchart TD, graph TD, sequenceDiagram, timeline, or classDiagram).
3. Enclose all node labels with brackets and quotes like ["Label text"] to avoid syntax breakage.`,
      config: {
        systemInstruction: 'You are an expert scientific diagram generator outputting strictly valid Mermaid graph syntax.'
      }
    });

    const rawText = result.text || '';
    const cleanCode = rawText.replace(/```mermaid/g, '').replace(/```/g, '').trim();
    return {
      title: prompt.substring(0, 50),
      code: cleanCode
    };
  });
}

// 20. Chat with Note
export async function handleChatWithNote(
  content: string, 
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[], 
  language: string = 'English', 
  profession: string = 'Professional'
) {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `Here are my notes for context:\n\n${content}\n\nLanguage preference: ${language}` }] },
        { role: 'model', parts: [{ text: `I have received your notes and will respond in ${language}. How can I help?` }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are an expert AI assistant for a ${profession}. Answer questions concisely and clearly in ${language}. Use the notes provided as context. 
If the user asks you to create a task, assignment, action item, or to-do, you MUST embed the action in your response like this: [ACTION: CREATE_TASK(Task title)].`
      }
    });
    return result.text || "I'm sorry, I couldn't process that.";
  });
}

// 21. Point-wise Notes
export async function handleGeneratePointWiseNotes(options: any) {
  return executeWithFallback(async (model) => {
    const { classLevel, board, subject, chapterTitle, language, length, sourceMaterial, useGoogleData } = options;
    const prompt = `Create comprehensive, high-quality, point-wise study notes for:
- Class: ${classLevel}
- Board: ${board}
- Subject: ${subject}
- Chapter / Topic: ${chapterTitle}
- Length Style: ${length}
- Target Language: ${language}

${sourceMaterial ? `Source / Reference Material to convert into point-wise notes:\n"""\n${sourceMaterial}\n"""` : `Generate authentic, curriculum-aligned notes for Class ${classLevel} (${board} board) based on the standard syllabus.`}

STRUCTURE REQUIREMENTS (All in ${language}):
1. Title Banner: "# ${chapterTitle}" with Class ${classLevel} • ${board} • ${subject} subtitle.
2. "## 📌 Chapter Summary": A crisp 2-3 sentence overview of the core idea.
3. "## 🎯 Point-Wise Core Study Notes":
   - Group by major sub-topics with clear subheadings (###).
   - Use numbered points (1., 2., 3.) and bullet points (-).
   - Bold crucial **definitions**, **dates**, **formulas**, **laws**, and **keywords**.
   - Include student-friendly examples where useful.
4. "## 🔑 Key Terms & Meanings": 5-8 essential vocabulary terms with crisp definitions.
5. "## 💡 Important Exam Q&A": 3 to 5 high-yield exam questions with model point-wise answers.
6. "## ⚡ Quick 5-Minute Revision Recap": Quick-recall bullet points for last-minute exam prep.
7. "## 📊 Concept Diagram": Include a valid Mermaid flowchart or mindmap inside a \`\`\`mermaid code block depicting the chapter structure.

Output MUST be entirely in ${language}.`;

    const config: any = {
      systemInstruction: `You are an master teacher and point-wise notes creator for school and college curricula. Output MUST be in ${language}. Include clear headings, bullet points, bold key terms, exam Q&A, and a mermaid diagram.`
    };

    if (useGoogleData) {
      config.tools = [{ googleSearch: {} }];
    }

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config
    });

    const text = result.text || `# ${chapterTitle}\n\nCould not generate notes. Please try again.`;
    let sources: string[] = [];
    try {
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        sources = chunks.map((c: any) => c.web?.uri).filter(Boolean);
      }
    } catch (_) {}

    return { markdown: text, sources };
  });
}

// 22. Concept Diagram
export async function handleGenerateConceptDiagram(topic: string, subject: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Generate a valid, visually clear Mermaid diagram (graph TD, flowchart, or mindmap) illustrating the key concepts and relationships for:
Topic: ${topic}
Subject: ${subject}
Language of labels: ${language}

Return ONLY the Mermaid code inside a \`\`\`mermaid ... \`\`\` code block. Keep node labels concise (under 5 words each). Ensure valid Mermaid syntax that renders cleanly.`,
      config: {
        systemInstruction: 'You are an expert diagrams and concept maps architect. Return ONLY valid Mermaid syntax inside a markdown mermaid code block.'
      }
    });

    const raw = result.text || '';
    const match = raw.match(/```mermaid\s*([\s\S]*?)```/) || raw.match(/```\s*([\s\S]*?)```/);
    if (match) {
      return match[1].trim();
    }
    return raw.replace(/```mermaid/g, '').replace(/```/g, '').trim();
  });
}

// 23. Step-by-Step QA Solver
export async function handleSolveQuestionStepByStep(params: any) {
  return executeWithFallback(async (model) => {
    const { question, subject, classLevel, board, language, useGoogleData } = params;
    const prompt = `Solve the following question for a Class ${classLevel} (${board}) student studying ${subject}:
Question:
"""
${question}
"""

Requirements:
- Target Language: ${language}
- Step 1: Given data / Problem breakdown
- Step 2: Formulas, Laws, or Concepts applied
- Step 3: Step-by-step detailed solution with clear calculations and reasoning
- Step 4: Final clear Answer highlighted in bold
- Step 5: Common Student Mistakes to Avoid & Pro Exam Tip

Provide clear, encouraging, error-free guidance in ${language}.`;

    const config: any = {
      systemInstruction: `You are an expert tutor solving exam questions step-by-step with mathematical and conceptual rigor. Output MUST be in ${language}.`
    };

    if (useGoogleData) {
      config.tools = [{ googleSearch: {} }];
    }

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config
    });

    const text = result.text || 'Could not solve the question.';
    let sources: string[] = [];
    try {
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        sources = chunks.map((c: any) => c.web?.uri).filter(Boolean);
      }
    } catch (_) {}

    return { solution: text, sources };
  });
}

// 24. Simplify / Regenerate Section
export async function handleSimplifyOrRegenerateSection(sectionText: string, instruction: string, language: string = 'English') {
  return executeWithFallback(async (model) => {
    const result = await ai.models.generateContent({
      model,
      contents: `Here is a section of study notes:\n"""\n${sectionText}\n"""\n\nInstruction: ${instruction}\nTarget Language: ${language}\n\nRewrite or simplify this section in point-wise format in ${language}.`,
      config: {
        systemInstruction: `You are an expert tutor improving notes. Return only the revised markdown text in ${language}.`
      }
    });
    return result.text || sectionText;
  });
}

// 25. Smart Study Notes Creator
export async function handleGenerateSmartStudyNotes(options: any) {
  return executeWithFallback(async (model) => {
    const {
      title,
      sourceType,
      textContent,
      files = [],
      youtubeUrl,
      fallbackTranscript,
      style,
      language,
      difficulty,
      format,
      length,
      useGoogleSearch = false
    } = options;

    const parts: any[] = [];
    for (const f of files) {
      if (f.base64Data) {
        parts.push({
          inlineData: {
            data: f.base64Data,
            mimeType: f.mimeType || 'image/jpeg'
          }
        });
      }
    }

    const instructionsText = `You are a master academic educator and notes creator for Study Top.
Generate clear, organized, highly readable study notes in ${language}.

CONFIGURATION SETTINGS:
- Note Style: ${style}
- Target Language: ${language}
- Difficulty Level: ${difficulty}
- Output Format Focus: ${format}
- Content Length: ${length}
${title ? `- Prescribed Topic / Title: "${title}"` : ''}

SOURCE CONTEXT:
${sourceType === 'youtube' ? `YouTube Video URL: ${youtubeUrl || 'N/A'}${fallbackTranscript ? `\nProvided Transcript / Captions:\n"""\n${fallbackTranscript}\n"""` : ''}` : ''}
${textContent ? `Source Text Material:\n"""\n${textContent}\n"""` : ''}
${files.length > 0 ? `Uploaded Media: ${files.length} document/image pages attached. Extract handwritten or printed text precisely.` : ''}

CRITICAL RULES:
1. Preserve the original meaning and important academic facts. Do not invent formulas, historical dates, or citations missing from the source.
2. If text in images/PDF is unreadable or blurry, explicitly mention: "[Unreadable section omitted]".
3. Highlight crucial definitions, dates, formulas, laws, and keywords in **bold**.
4. Output MUST be rendered entirely in ${language}.

STRUCTURE AND SECTIONS TO INCLUDE IN MARKDOWN:
1. "# [Clear Chapter / Subject Title]"
2. "## 📌 Chapter Summary & Key Takeaways" (Crisp, high-yield overview)
3. "## 🎯 Core Concepts & Topic-Wise Notes"
   - Organized by logical sub-headings (### Subtopic)
   - Clear point-wise explanations in simple, accessible language
   - Important definitions, formulas, and real-life examples
   ${format === 'Table Format' ? '- Comprehensive comparison tables and structured tabular matrices' : '- Bullet points and comparison tables where useful'}
   ${format === 'Mind Map Outline' ? '- Hierarchical indented outline representing mind map branches' : ''}
4. "## 💡 Key Facts, Formulas & Quick Revision"
   - Bulleted list of must-memorize facts and formulas
5. "## ❓ Practice Questions & MCQs"
   - 3-4 Multiple Choice Questions with options A, B, C, D and marked correct answer with explanation
   - 2 Conceptual short-answer practice questions with model answers
6. "## 🗂️ Flashcards for Quick Revision"
   - 3-4 Q&A Flashcard pairs formatted as:
     **Q: [Question]**
     *A: [Answer]*`;

    parts.push({ text: instructionsText });

    const config: any = {
      systemInstruction: `You are an elite academic curriculum designer writing in ${language}. Produce authentic, structured study notes matching the chosen difficulty (${difficulty}) and style (${style}). Output valid, beautifully formatted Markdown.`
    };

    if (useGoogleSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const result = await ai.models.generateContent({
      model,
      contents: parts,
      config
    });

    const markdown = result.text || 'Could not generate notes from the provided material.';
    let sources: string[] = [];
    try {
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        sources = chunks.map((c: any) => c.web?.uri).filter(Boolean);
      }
    } catch (_) {}

    let extractedTitle = title || 'Smart Study Notes';
    const headingMatch = markdown.match(/^#\s+(.+)$/m);
    if (headingMatch && headingMatch[1]) {
      extractedTitle = headingMatch[1].replace(/[*#]/g, '').trim();
    }

    return {
      title: extractedTitle,
      markdown,
      sources
    };
  });
}

// 26. Google NotebookLM Audio Overview Script
export async function handleGenerateAudioOverviewScript(sources: { title: string; content: string }[], language: string = 'English') {
  return executeWithFallback(async (model) => {
    const sourcesText = sources.map((s, idx) => `[Source ${idx + 1}: ${s.title}]\n${s.content.slice(0, 4000)}`).join('\n\n---\n\n');
    const prompt = `You are the executive producer behind Google NotebookLM's famous "Audio Overview Deep Dive".
Two intelligent, lively academic hosts (Alex and Sam) are having an educational, conversational podcast episode discussing the user's provided sources.

Rules:
1. Alex is the enthusiastic host who frames the big picture, asks thought-provoking questions, and introduces key analogies.
2. Sam is the analytical co-host who breaks down the specific facts, equations, evidence, and nuance.
3. The conversation must feel authentic, engaging, warm, and highly informative—like a top-tier science or academic podcast.
4. Language MUST be ${language}.
5. Ground everything strictly in the provided sources:

${sourcesText || 'General study material and lecture notes.'}

Format the response strictly as valid JSON with:
{
  "title": "A catchy episode title",
  "summary": "1-2 sentence overview of the discussion",
  "dialogue": [
    { "speaker": "Alex", "text": "..." },
    { "speaker": "Sam", "text": "..." }
  ]
}
Generate 8 to 14 dialogue exchanges.`;

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    try {
      const parsed = JSON.parse(result.text || '{}');
      return {
        title: parsed.title || 'Deep Dive: Source Overview',
        summary: parsed.summary || 'A conversation analyzing the core ideas across your selected sources.',
        dialogue: Array.isArray(parsed.dialogue) ? parsed.dialogue : []
      };
    } catch (e) {
      return {
        title: 'Deep Dive: Source Overview',
        summary: 'Overview of key concepts across sources.',
        dialogue: [
          { speaker: 'Alex', text: "Welcome to today's deep dive! We've been looking over the sources you uploaded to Study Top." },
          { speaker: 'Sam', text: "That's right, Alex. What immediately stands out is how these materials connect core theory with practical examples." }
        ]
      };
    }
  });
}

// 27. NotebookLM Grounded Chat with Citations
export async function handleChatWithNotebookSources(
  query: string, 
  sources: { title: string; content: string }[], 
  history: { role: 'user' | 'model'; content: string }[] = [], 
  language: string = 'English'
) {
  return executeWithFallback(async (model) => {
    const sourcesContext = sources.map((s, idx) => `[[Source ${idx + 1}: ${s.title}]]\n${s.content.slice(0, 5000)}`).join('\n\n');
    const historyContext = history.slice(-6).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n\n');

    const prompt = `You are Study Top's NotebookLM AI Research Assistant.
You are strictly grounded in the following user sources:

${sourcesContext || 'No sources attached yet. Answer clearly based on general academic knowledge.'}

Recent Conversation:
${historyContext}

User Query:
${query}

Instructions:
1. Provide a comprehensive, clear, well-structured answer in ${language}.
2. Use markdown formatting (bolding, lists, code blocks, or LaTeX math $...$ when appropriate).
3. IMPORTANT NOTEBOOKLM CITATION RULE: Whenever you state a key fact, concept, or definition derived from a source, append an inline citation marker like [1], [2], etc., corresponding to the Source number.
4. Keep the tone helpful, scholarly, and articulate.`;

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `You are an expert AI research collaborator in Google NotebookLM style. Always provide accurate citations to sources. Language: ${language}.`
      }
    });

    const responseText = result.text || 'I was unable to find an answer based on the provided sources.';

    const citations: { index: number; sourceTitle: string; quote: string }[] = [];
    const citationMatches = responseText.matchAll(/\[(\d+)\]/g);
    const seenIndexes = new Set<number>();

    for (const match of citationMatches) {
      const idx = parseInt(match[1], 10);
      if (!seenIndexes.has(idx) && idx >= 1 && idx <= sources.length) {
        seenIndexes.add(idx);
        const src = sources[idx - 1];
        citations.push({
          index: idx,
          sourceTitle: src.title,
          quote: src.content.slice(0, 150) + '...'
        });
      }
    }

    return {
      text: responseText,
      citations
    };
  });
}

// 28. Studio Guide Generator
export async function handleGenerateStudioGuide(
  type: 'study-guide' | 'faq' | 'briefing' | 'timeline', 
  sources: { title: string; content: string }[], 
  language: string = 'English'
) {
  return executeWithFallback(async (model) => {
    const sourcesContext = sources.map((s, idx) => `[Source ${idx + 1}: ${s.title}]\n${s.content.slice(0, 5000)}`).join('\n\n');

    let typeDescription = 'a comprehensive Study Guide with Key Concepts, Definitions, Learning Objectives, and Review Questions';
    if (type === 'faq') typeDescription = 'a Frequently Asked Questions (FAQ) guide with the 8 most important questions and detailed answers';
    if (type === 'briefing') typeDescription = 'an Executive Briefing Document with Executive Summary, Background, Key Findings, and Next Steps';
    if (type === 'timeline') typeDescription = 'a Chronological Timeline of events, discoveries, or process steps';

    const prompt = `Create ${typeDescription} in ${language} strictly grounded in the following sources:

${sourcesContext}

Use clean, elegant Markdown formatting with clear headings, bullet points, and high readability.`;

    const result = await ai.models.generateContent({
      model,
      contents: prompt
    });

    const titles: Record<string, string> = {
      'study-guide': 'Comprehensive Study Guide',
      'faq': 'Frequently Asked Questions (FAQ)',
      'briefing': 'Executive Briefing Document',
      'timeline': 'Chronological Timeline & Milestones'
    };

    return {
      title: titles[type] || 'Studio Guide',
      content: result.text || 'Could not generate guide from sources.'
    };
  });
}

// 29. Streaming Content Generation (Server-Side)
export async function* handleGenerateContentStream(contents: any, config?: any) {
  const responseStream = await ai.models.generateContentStream({
    model: PRIMARY_MODEL,
    contents,
    config
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

// 30. WebSocket Live API Session Bridge (gemini-3.8-live)
export async function setupLiveApiSession(clientWs: WebSocket) {
  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        },
        systemInstruction: 'You are Study Top AI, a helpful, patient academic tutor created by Manjit Ranjan.'
      },
      callbacks: {
        onmessage: (message: any) => {
          try {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'audio', audio: audioData }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
            }
          } catch (e) {
            console.error('Error forwarding live message to client:', e);
          }
        }
      }
    });

    clientWs.on('message', (rawData) => {
      try {
        const parsed = JSON.parse(rawData.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({
            text: parsed.text
          });
        }
      } catch (err) {
        console.warn('Failed parsing incoming client audio packet:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        if (session) session.close();
      } catch (_) {}
    });

    clientWs.on('error', () => {
      try {
        if (session) session.close();
      } catch (_) {}
    });

    // Notify client of active connection
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'ready', message: 'Connected to Gemini Live session' }));
    }
  } catch (err: any) {
    console.warn('Gemini Live session connection error:', err?.message || err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Live API connection error' }));
    }
  }
}

// ============================================================================
// 31. ADVANCED AI MATH SOLVER
// ============================================================================
export interface MathSolveRequest {
  question: string;
  images?: string[]; // base64 or data URLs
  gradeLevel?: string;
  language?: string;
  topic?: string;
}

export async function handleSolveMathProblem(req: MathSolveRequest) {
  return executeWithFallback(async (model) => {
    const language = req.language || 'English';
    const gradeLevel = req.gradeLevel || 'Secondary / Higher Secondary';
    const topic = req.topic ? ` (${req.topic})` : '';

    const parts: any[] = [];

    // Attach any images (multimodal)
    if (req.images && req.images.length > 0) {
      for (const img of req.images) {
        let cleanBase64 = img;
        let mimeType = 'image/jpeg';
        if (img.startsWith('data:')) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            cleanBase64 = match[2];
          }
        }
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        });
      }
    }

    const promptText = `You are the Master AI Math Solver of "Study Top", created by Manjit Ranjan (Google Developer).
Your goal is to provide an exceptionally clear, mathematically rigorous, and step-by-step solution to the math problem provided below.

Target Audience Level: ${gradeLevel}${topic}
Target Language: ${language}

User Question/Context:
${req.question || 'Please solve the mathematical problem shown in the attached image(s).'}

Format your solution using clean, elegant Markdown with proper LaTeX math notation ($...$ for inline math and $$...$$ for block equations):

# 🎯 Problem Overview
- Clearly state or transcribe the question accurately (including any diagrams, symbols, or tables).

# 📋 Given Information
- List all known variables, numerical values, and conditions given in the problem.

# 🔍 To Find / Calculate / Prove
- State exactly what needs to be solved or proved.

# 📐 Key Formulas, Theorems & Identities
- Present all formulas, algebraic identities, theorems, or lemmas required.

# 🔢 Step-by-Step Detailed Solution
- Break down every algebraic or calculus step clearly.
- Explain the reasoning behind each step so a student can easily follow without confusion.
- Show substitutions and intermediate arithmetic.

# 🏁 Final Answer
- State the final result clearly inside a prominent box or block (e.g. **Final Answer: ...**).
- Include appropriate units of measurement where applicable.

# 💡 Alternative / Short-cut Method (if applicable)
- Provide a clever trick, graphical intuition, or alternative algebraic route (very useful for competitive exams).

# 🔍 Verification & Sanity Check
- Verify the answer by substitution or dimensional consistency.

# ⚠️ Common Mistakes to Avoid
- Point out 1-2 frequent errors students make on this type of problem.`;

    parts.push({ text: promptText });

    const result = await ai.models.generateContent({
      model,
      contents: parts,
      config: {
        systemInstruction: `You are Study Top's elite AI Mathematics Professor. You solve algebra, calculus, geometry, trigonometry, statistics, probability, matrices, arithmetic, and higher mathematics with 100% mathematical precision and clear pedagogical explanations. Output strictly in ${language}. Use LaTeX for all mathematical expressions.`
      }
    });

    return {
      solution: result.text || 'Unable to generate math solution.',
      gradeLevel,
      language
    };
  });
}

// ============================================================================
// 32. COMPREHENSIVE MULTI-SUBJECT AI SOLVER
// ============================================================================
export interface SubjectSolveRequest {
  subject: string; // 'Science' | 'English' | 'Social Science' | 'Computer Science' | 'Hindi' | 'Sanskrit' | 'Accountancy' | 'Economics' | 'General Knowledge' | etc.
  topic?: string;
  question: string;
  images?: string[];
  gradeLevel?: string;
  language?: string;
  solutionType?: 'detailed' | 'quick' | 'exam_pointwise' | 'conceptual';
}

export async function handleSolveSubjectProblem(req: SubjectSolveRequest) {
  return executeWithFallback(async (model) => {
    const subject = req.subject || 'General Studies';
    const language = req.language || 'English';
    const gradeLevel = req.gradeLevel || 'Standard';
    const solutionType = req.solutionType || 'detailed';

    const parts: any[] = [];

    if (req.images && req.images.length > 0) {
      for (const img of req.images) {
        let cleanBase64 = img;
        let mimeType = 'image/jpeg';
        if (img.startsWith('data:')) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            cleanBase64 = match[2];
          }
        }
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        });
      }
    }

    let subjectInstructions = '';
    if (subject.toLowerCase().includes('science')) {
      subjectInstructions = `Include:
1. Core Scientific Principle or Law
2. Balanced Chemical Equations or Physical Laws / Formulas (with LaTeX)
3. Step-by-step scientific explanation or numerical working
4. Biological diagrams description or physical significance
5. Real-world application & key exam points.`;
    } else if (subject.toLowerCase().includes('english')) {
      subjectInstructions = `Include:
1. Direct, well-crafted answer adhering to standard literary and linguistic conventions
2. Grammar rules / Syntactic breakdown / Vocabulary enhancement (meanings & synonyms)
3. Literary devices, themes, or tone analysis where applicable
4. Model answer format (suitable for board exams or essays).`;
    } else if (subject.toLowerCase().includes('social') || subject.toLowerCase().includes('history') || subject.toLowerCase().includes('geography') || subject.toLowerCase().includes('civics') || subject.toLowerCase().includes('political')) {
      subjectInstructions = `Include:
1. Historical / Geographic / Political Context
2. Chronological sequence of events or geographical causes
3. Clear, point-wise breakdown (optimal for high-scoring exam answers)
4. Key dates, personalities, treaties, or constitutional articles
5. Long-term significance and contemporary relevance.`;
    } else if (subject.toLowerCase().includes('computer') || subject.toLowerCase().includes('code') || subject.toLowerCase().includes('it')) {
      subjectInstructions = `Include:
1. Problem analysis and algorithmic logic
2. Clean, fully-commented, robust code snippet (specifying language e.g. Python, Java, C++, JS)
3. Time and Space Complexity ($O(n)$, etc.)
4. Step-by-step dry run with example input/output
5. Edge cases and best practices.`;
    } else if (subject.toLowerCase().includes('hindi') || subject.toLowerCase().includes('sanskrit')) {
      subjectInstructions = `उत्तर हिंदी/संस्कृत में ही दें:
1. प्रश्न का सटीक एवं प्रामाणिक उत्तर
2. संदर्भ एवं प्रसंग (यदि पद्य/गद्य से संबंधित हो)
3. सरल हिंदी/संस्कृत व्याख्या एवं भावार्थ
4. व्याकरण संबंधी विश्लेषण (संधि, समास, प्रत्यय, उपसर्ग, धातु रूप, शब्द रूप)
5. मुख्य संदेश व परीक्षा उपयोगी बिंदु।`;
    } else if (subject.toLowerCase().includes('account') || subject.toLowerCase().includes('commerce') || subject.toLowerCase().includes('business') || subject.toLowerCase().includes('economic')) {
      subjectInstructions = `Include:
1. Relevant Accounting Standard, Principle, or Economic Law
2. Journal Entries, T-Accounts, Balance Sheet/Income Statement formats or Economic graphs
3. Step-by-step numerical calculation with neat markdown tables
4. Working notes and clear conclusion.`;
    } else {
      subjectInstructions = `Provide a comprehensive, authoritative, point-wise explanation with definitions, examples, and examination highlights.`;
    }

    const promptText = `You are Study Top's Multi-Subject Expert Educator, created by Manjit Ranjan (Google Developer).
Subject: ${subject}
Topic: ${req.topic || 'General'}
Grade Level: ${gradeLevel}
Language: ${language}
Format Style: ${solutionType}

User Question:
${req.question || 'Please provide a comprehensive answer to the problem in the attached document/image.'}

Subject Guidelines:
${subjectInstructions}

Output format:
Use clean Markdown with bold headings, neat bullet points, callout boxes for crucial rules, and LaTeX for math/science notation. Make it engaging, easy to memorize, and 100% accurate.`;

    parts.push({ text: promptText });

    const result = await ai.models.generateContent({
      model,
      contents: parts,
      config: {
        systemInstruction: `You are Study Top's elite educator in ${subject}. You provide flawless, comprehensive, well-structured academic answers in ${language}.`
      }
    });

    return {
      solution: result.text || 'Unable to solve question.',
      subject,
      language
    };
  });
}

// ============================================================================
// 33. UNIVERSAL DOCUMENT & MULTI-QUESTION DETECTOR ("Ask from Image / PDF")
// ============================================================================
export interface DocumentDetectRequest {
  imageOrPdfBase64: string;
  mimeType?: string;
  language?: string;
  selectedQuestionIndex?: number; // if -1, solve all or summarize questions
}

export async function handleDetectAndSolveDocument(req: DocumentDetectRequest) {
  return executeWithFallback(async (model) => {
    const language = req.language || 'English';
    let cleanBase64 = req.imageOrPdfBase64;
    let mimeType = req.mimeType || 'image/jpeg';

    if (cleanBase64.startsWith('data:')) {
      const match = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      }
    }

    const promptText = `Analyze the uploaded document or textbook page image.
Target Language: ${language}
${req.selectedQuestionIndex !== undefined && req.selectedQuestionIndex >= 0 ? `Target Question Number: ${req.selectedQuestionIndex + 1}` : 'Perform full analysis:'}

1. Detect the Academic Subject (Mathematics, Physics, Chemistry, Biology, Social Science, English, Computer Science, Hindi, Sanskrit, etc.).
2. Extract all distinct questions detected on the page with their question numbers.
3. If a specific question is targeted, solve that question thoroughly with full step-by-step working.
4. If no specific question was targeted, provide:
   - A list of all identified questions (Question 1, Question 2, etc.)
   - Complete step-by-step solutions for each question.
   - Key formulas, rules, and final answers highlighted.

Format with clear Markdown sections, LaTeX equations, and high readability.`;

    const result = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        },
        { text: promptText }
      ],
      config: {
        systemInstruction: `You are Study Top's Universal OCR & Document Academic Solver, created by Manjit Ranjan. Accurately transcribe questions from handwritten or printed textbook pages and provide structured academic solutions in ${language}.`
      }
    });

    return {
      result: result.text || 'Unable to analyze document.',
      language
    };
  });
}

// ============================================================================
// 34. AI TUTOR & LEARNING MENTOR
// ============================================================================
export interface TutorChatRequest {
  message: string;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
  subject?: string;
  level?: 'very_easy' | 'beginner' | 'intermediate' | 'advanced' | 'exam_prep';
  hintMode?: boolean;
  language?: string;
}

export async function handleTutorChat(req: TutorChatRequest) {
  return executeWithFallback(async (model) => {
    const language = req.language || 'English';
    const level = req.level || 'intermediate';
    const subject = req.subject || 'General Academic';
    const hintMode = !!req.hintMode;

    const levelDescriptions = {
      very_easy: 'Explain like I am in Middle School (Grade 6-8). Use everyday analogies, cheerful examples, simple vocabulary, and avoid intimidating jargon.',
      beginner: 'Secondary School (Grade 9-10). Clear concepts, fundamental principles, foundational examples.',
      intermediate: 'Higher Secondary (Grade 11-12 / CBSE / ICSE / State Board). Rigorous explanations, proper technical terminology, formulas, and derivations.',
      advanced: 'University / Undergraduate / Engineering / Medical level. In-depth analysis, mathematical proofs, underlying theory, and research-backed perspective.',
      exam_prep: 'Competitive Examination Mode (JEE, NEET, UPSC, SSC, Olympiads). High-yield facts, shortcut techniques, trick traps to avoid, and time-management tips.'
    };

    const hintPrompt = hintMode
      ? `IMPORTANT - HINT MODE IS ACTIVE:
Do NOT give the direct final answer right away! Instead, act as a master Socratic teacher:
1. Praise the student for asking.
2. Provide a gentle, thought-provoking Hint #1 that guides their thinking.
3. Ask a leading question that helps them take the next step on their own.
4. If they respond again and are still stuck, provide Hint #2, and only give the full solution if they explicitly surrender or get it right!`
      : `Provide a complete, lucid, and engaging pedagogical explanation with examples and clear summaries.`;

    const systemInstruction = `You are "Study Top AI Tutor", an inspiring, patient, and knowledgeable school teacher and academic mentor created by Manjit Ranjan (Google Developer).
Subject: ${subject}
Language: ${language}
Pedagogical Level: ${levelDescriptions[level]}

Teaching Philosophy:
${hintPrompt}

Always maintain a warm, motivating tone. Encourage curiosity. Format your replies with neat headings, bullet points, and LaTeX for math/formulas ($...$). Conclude with a quick 1-question check to verify their understanding.`;

    const contents: any[] = [];
    if (req.history && req.history.length > 0) {
      for (const h of req.history) {
        contents.push({
          role: h.role,
          parts: h.parts
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: req.message }]
    });

    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction
      }
    });

    return {
      reply: result.text || 'I am thinking... Please ask your question again.',
      level,
      hintMode,
      language
    };
  });
}

