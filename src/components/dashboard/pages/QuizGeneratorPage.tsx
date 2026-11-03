import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  Clock, 
  Award, 
  RotateCw, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Play,
  ArrowRight
} from 'lucide-react';
import { generateQuiz } from '../../../lib/gemini';
import { QuizQuestion } from '../../../types';

export const QuizGeneratorPage: React.FC<{ language?: string }> = ({
  language = 'English'
}) => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionType, setQuestionType] = useState('MCQ');
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Test State
  const [testActive, setTestActive] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [previousAttempts, setPreviousAttempts] = useState<{
    id: string;
    topic: string;
    score: number;
    total: number;
    date: number;
  }[]>([
    {
      id: 'att_1',
      topic: 'Thermodynamics & Heat Transfer',
      score: 4,
      total: 5,
      date: Date.now() - 86400000
    }
  ]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (testActive && !testSubmitted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTestSubmitted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testActive, testSubmitted, timeRemaining]);

  const handleStartQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Create a ${difficulty} level test with ${numQuestions} questions on the topic: "${topic}". Question type: ${questionType}.`;
      const res = await generateQuiz(prompt, language);
      if (res && res.length > 0) {
        setQuestions(res.slice(0, numQuestions));
        setSelectedAnswers({});
        setTimeRemaining(timerMinutes * 60);
        setTestSubmitted(false);
        setTestActive(true);
      }
    } catch (err) {
      alert('Could not generate quiz right now. Please try a simpler topic.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (qIdx: number, optionIdx: number) => {
    if (testSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optionIdx }));
  };

  const handleSubmitTest = () => {
    setTestSubmitted(true);
    // Calculate Score
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) correct++;
    });

    const newAttempt = {
      id: 'att_' + Date.now(),
      topic,
      score: correct,
      total: questions.length,
      date: Date.now()
    };
    setPreviousAttempts(prev => [newAttempt, ...prev]);
  };

  const calculateScore = () => {
    let correct = 0;
    let wrong = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === undefined) return;
      if (selectedAnswers[idx] === q.correctAnswer) correct++;
      else wrong++;
    });

    let totalScore = correct;
    if (negativeMarking) {
      totalScore = Math.max(0, correct - wrong * 0.25);
    }
    return { correct, wrong, totalScore };
  };

  const { correct, wrong, totalScore } = calculateScore();
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
            Assessment &amp; Mock Tests
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">AI Exam &amp; Quiz Generator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate timed practice tests with instant evaluation, negative marking, and verified solutions.
          </p>
        </div>
      </div>

      {!testActive ? (
        /* Quiz Configuration Screen */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Test Configuration
            </h3>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Topic or Chapter Name
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Newton's Laws of Motion, Indian Constitution Fundamental Rights..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Number of Questions</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option>Beginner (School)</option>
                  <option>Intermediate (Board Exam)</option>
                  <option>Advanced (Competitive / JEE / NEET)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Timer (Minutes)</label>
                <select
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value={3}>3 Minutes</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                </select>
              </div>
            </div>

            {/* Negative marking toggle */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <input
                type="checkbox"
                id="negMark"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="negMark" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Enable Negative Marking (-0.25 marks per incorrect response)
              </label>
            </div>

            <button
              onClick={handleStartQuiz}
              disabled={!topic.trim() || isGenerating}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Generate &amp; Launch Timed Practice Test</span>
            </button>
          </div>

          {/* Past Attempts History */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Previous Test Attempts ({previousAttempts.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {previousAttempts.map(att => (
                <div key={att.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{att.topic}</h4>
                    <p className="text-[11px] text-slate-400">{new Date(att.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600">
                      {att.score} / {att.total}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {Math.round((att.score / att.total) * 100)}% Accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Interactive Test / Evaluation Screen */
        <div className="space-y-6">
          {/* Top Timer Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">{topic}</span>
              <span className="text-xs text-slate-400">({questions.length} questions)</span>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1.5 font-mono text-xs font-black px-3 py-1 rounded-xl ${
                timeRemaining < 60 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeRemaining)}</span>
              </div>

              {!testSubmitted && (
                <button
                  onClick={handleSubmitTest}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>

          {/* Test Evaluation Card (When Submitted) */}
          {testSubmitted && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">Scorecard Evaluated!</h3>
                  <p className="text-xs text-emerald-100 mt-1">
                    {correct} Correct • {wrong} Incorrect • Accuracy {Math.round((correct / questions.length) * 100)}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black">{totalScore}</span>
                  <span className="text-sm font-bold opacity-80"> / {questions.length}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setTestActive(false)}
                  className="px-4 py-2 bg-white text-emerald-800 rounded-xl font-black text-xs cursor-pointer shadow-xs"
                >
                  Configure New Quiz
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isSelected = selectedAnswers[idx] !== undefined;
              const isCorrect = selectedAnswers[idx] === q.correctAnswer;

              return (
                <div
                  key={idx}
                  className={`bg-white p-6 rounded-3xl border shadow-xs space-y-3 ${
                    testSubmitted 
                      ? isCorrect 
                        ? 'border-emerald-300 bg-emerald-50/20' 
                        : 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-relaxed">
                      <span className="text-blue-600 mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </h4>
                    {testSubmitted && (
                      isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedAnswers[idx] === oIdx;
                      const isOptionCorrect = q.correctAnswer === oIdx;

                      let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                      if (testSubmitted) {
                        if (isOptionCorrect) btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-black';
                        else if (isOptionSelected) btnStyle = 'bg-rose-100 border-rose-300 text-rose-900 line-through';
                      } else if (isOptionSelected) {
                        btnStyle = 'bg-blue-50 border-blue-500 text-blue-900 font-bold';
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={testSubmitted}
                          onClick={() => handleSelectAnswer(idx, oIdx)}
                          className={`w-full text-left p-3 rounded-2xl border text-xs transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Verified explanation when submitted */}
                  {testSubmitted && q.explanation && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-900">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
