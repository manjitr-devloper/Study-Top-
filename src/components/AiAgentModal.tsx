import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Command, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { executeAiCommand } from '../lib/gemini';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

interface AiAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onActionComplete: (actions: any[]) => void;
}

export const AiAgentModal: React.FC<AiAgentModalProps> = ({ isOpen, onClose, language, onActionComplete }) => {
  const [modelType, setModelType] = useState<'agent' | 'setup'>('setup');
  const [persona, setPersona] = useState('Helpful AI Assistant');
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartAgent = () => {
    setModelType('agent');
    setHistory([{ role: 'model', text: `Hi! I am set up as a ${persona}. Tell me what tasks, notes, or events you want to create.` }]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userText = prompt.trim();
    setPrompt('');
    setHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await executeAiCommand(userText, history, language, persona);
      setHistory(prev => [...prev, { role: 'model', text: response.reply }]);
      if (response.actions && response.actions.length > 0) {
        onActionComplete(response.actions);
      }
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { role: 'model', text: "I encountered an error trying to process that command." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-3 sm:p-4"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] sm:rounded-[40px] w-full max-w-2xl h-[85vh] sm:h-[80vh] shadow-2xl relative border border-slate-100 flex flex-col overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (modelType === 'agent') {
                    setModelType('setup');
                  } else {
                    onClose();
                  }
                }}
                className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-2xs"
                title="Go Back"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">Custom AI Agent</h2>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
                  {modelType === 'agent' ? 'Interactive Assistant' : 'Smart Automation Setup'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Close Agent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
            {modelType === 'setup' ? (
              <div className="max-w-md mx-auto space-y-8 py-10">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Create Custom Model</h3>
                  <p className="text-slate-500 font-medium text-sm">Define how your AI assistant should behave and what tone it should use when creating tasks and notes.</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">AI Persona / Role</label>
                  <textarea 
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl h-32 text-sm font-bold resize-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button 
                  onClick={handleStartAgent}
                  className="w-full py-4 bg-brand-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-200 hover:bg-brand-700 active:scale-95 transition-all"
                >
                  Deploy Model
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl border border-amber-100 text-sm font-medium flex items-start gap-3">
                  <Command className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>You can ask me to: "Create a task for my math homework due tomorrow", "Make a note about photosynthesis", or "Schedule an exam review for Friday at 3PM".</p>
                </div>

                {history.map((msg, idx) => (
                  <div key={`agent-msg-${msg.role}-${idx}`} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-[24px] p-5 text-sm font-medium",
                      msg.role === 'user' 
                        ? "bg-brand-600 text-white rounded-tr-sm shadow-md" 
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-[24px] rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing</span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {modelType === 'agent' && (
            <div className="p-6 bg-white border-t border-slate-50">
              <form onSubmit={handleSend} className="relative">
                <input 
                  type="text"
                  dir="auto"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask the AI to create something..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] pl-6 pr-16 py-4 text-sm font-bold outline-none focus:border-brand-500 transition-colors text-left"
                />
                <button 
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4 -ml-0.5" />
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
