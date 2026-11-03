import React, { useState } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Loader2, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface PracticeTestsViewProps {
  user: any;
  userProfile: any;
}

export const PracticeTestsView: React.FC<PracticeTestsViewProps> = ({ user, userProfile }) => {
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleGenerateTest = async () => {
    setIsLoading(true);
    setQuestions([]);
    setSelectedAnswers({});
    setIsSubmitted(false);

    try {
      const prompt = `Generate a ${difficulty} practice test with ${questionCount} multiple-choice questions on Subject: ${subject}, Topic: ${topic || 'Core Curriculum'}.
Language: ${userProfile?.language || 'English'}.

Output strictly valid JSON in this exact structure without markdown ticks:
{
  "questions": [
    {
      "question": "string",
      "options": ["option 0", "option 1", "option 2", "option 3"],
      "correctAnswer": 0,
      "explanation": "string explaining why this is correct"
    }
  ]
}`;

      const res = await fetch('/api/gemini/generate-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          language: userProfile?.language || 'English'
        })
      });

      const data = await res.json();
      if (data && data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        // Fallback test questions
        setQuestions([
          {
            question: `Which fundamental principle governs ${topic || subject}?`,
            options: ['Conservation of Energy', 'Equilibrium Theorem', 'Foundational Axiom', 'Superposition Principle'],
            correctAnswer: 0,
            explanation: 'The fundamental conservation law governs energy and matter across physical systems.'
          },
          {
            question: `In standard curriculum analysis, what is the most critical factor?`,
            options: ['Initial conditions', 'Boundary values', 'Systematic step-by-step verification', 'Approximation errors'],
            correctAnswer: 2,
            explanation: 'Rigorous methodical verification guarantees accuracy.'
          }
        ]);
      }
    } catch (e) {
      console.error('Failed to generate test', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const score = questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="w-5 h-5 text-teal-200" />
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
            Interactive Assessment
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Practice Tests & Self-Quizzing</h1>
        <p className="text-teal-100 text-sm mt-1">
          Generate customized practice mock tests with detailed explanations and instant score evaluation.
        </p>
      </div>

      {/* Generator Configuration */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English Grammar & Lit</option>
              <option value="Social Science">Social Science / History</option>
              <option value="Computer Science">Computer Science & Coding</option>
              <option value="Hindi">हिंदी व्याकरण</option>
              <option value="General Knowledge">General Knowledge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Topic or Chapter
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Thermodynamics, Quadratic Equations, Tenses..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="easy">Easy (Foundational)</option>
              <option value="medium">Medium (Standard Exam)</option>
              <option value="hard">Hard (Competitive Level)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Questions
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGenerateTest}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Practice Test
          </button>
        </div>
      </div>

      {/* Active Questions Display */}
      {questions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Practice Assessment ({questions.length} Questions)
            </h2>
            {isSubmitted && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm">
                <Award className="w-4 h-4 text-emerald-600" />
                Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </div>
            )}
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => {
              const isAnswered = selectedAnswers[qIdx] !== undefined;
              return (
                <div key={qIdx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      Q{qIdx + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-900">{q.question}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      const isCorrect = q.correctAnswer === optIdx;
                      let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';

                      if (isSubmitted) {
                        if (isCorrect) btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                        else if (isSelected && !isCorrect) btnStyle = 'bg-rose-100 border-rose-300 text-rose-900';
                      } else if (isSelected) {
                        btnStyle = 'bg-teal-600 border-teal-600 text-white font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`p-3 rounded-xl border text-xs text-left transition-all ${btnStyle}`}
                        >
                          <span className="font-mono mr-2 font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {isSubmitted && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 mt-2">
                      <p className="font-semibold text-slate-800">Explanation:</p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGenerateTest}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake / New Test
            </button>

            {!isSubmitted ? (
              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Test & View Results
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateTest}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
              >
                Practice Another Topic <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
