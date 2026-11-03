import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Search, BookOpen, Bot, Globe, LayoutGrid, Rocket, Brain, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface TutorialFlowProps {
  userProfile: UserProfile;
  onComplete: () => void;
}

export const TutorialFlow: React.FC<TutorialFlowProps> = ({ userProfile, onComplete }) => {
  const [step, setStep] = useState(0);
  const [userContext, setUserContext] = useState('');

  const checkUserStatus = () => {
    return !!userProfile;
  };

  const getUserContext = () => {
    // Determine context based on the user object
    if (userProfile.lastLogin && (Date.now() - userProfile.lastLogin < 60000)) {
      return 'new_signup';
    } else {
      return 'returning';
    }
  };

  useEffect(() => {
    if (checkUserStatus()) {
      const context = getUserContext();
      setUserContext(context);
    }
  }, [userProfile]);

  const executeTutorial = (nextStep: number) => {
    setStep(nextStep);
  };

  const handleComplete = () => {
    onComplete();
  };

  const tutorialSteps = [
    {
      id: 'welcome',
      title: userContext === 'new_signup' ? "Welcome to ProNotes!" : "Welcome back to ProNotes!",
      content: userContext === 'new_signup' 
        ? "We're thrilled to have you! Let's get you familiar with your new AI-powered workspace."
        : "It looks like you haven't taken the official tour yet. Let's make sure you know where everything is!",
      icon: <Rocket className="w-12 h-12 text-indigo-500" />,
      colors: "bg-indigo-50 text-indigo-900 border-indigo-200",
      buttonText: "Start Tutorial"
    },
    {
      id: 'notes',
      title: "Smart Notes & Editor",
      content: "Create powerful notes with AI assistance. You can generate summaries, create study guides, and chat with your documents directly from the editor.",
      icon: <BookOpen className="w-12 h-12 text-emerald-500" />,
      colors: "bg-emerald-50 text-emerald-900 border-emerald-200",
      buttonText: "Got it, what's next?"
    },
    {
      id: 'ai',
      title: "AI Agent & Assistants",
      content: "Press the 'AI' floating button anytime to create tasks, add events to your calendar, or get quick answers without leaving your current context.",
      icon: <Bot className="w-12 h-12 text-blue-500" />,
      colors: "bg-blue-50 text-blue-900 border-blue-200",
      buttonText: "Makes sense!"
    },
    {
      id: 'global',
      title: "Global Collaboration",
      content: "Connect with peers worldwide in Global Chat, or join specific Classrooms to collaborate closely on assignments and projects.",
      icon: <Globe className="w-12 h-12 text-amber-500" />,
      colors: "bg-amber-50 text-amber-900 border-amber-200",
      buttonText: "Awesome!"
    },
    {
      id: 'apphub',
      title: "App Hub",
      content: "Need a calculator, a calendar, or a specialized tool like Result Maker? Click the App Hub icon (Rocket) to launch micro-apps over your workspace.",
      icon: <LayoutGrid className="w-12 h-12 text-purple-500" />,
      colors: "bg-purple-50 text-purple-900 border-purple-200",
      buttonText: "Finish Tutorial"
    }
  ];

  const currentStep = tutorialSteps[step];

  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            "w-full max-w-md rounded-[32px] p-8 border shadow-2xl relative overflow-hidden flex flex-col items-center text-center",
            currentStep.colors,
            "bg-white"
          )}
        >
          {/* Top Skip / Close Button */}
          <button
            onClick={handleComplete}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            aria-label="Skip Tutorial"
            title="Skip Tutorial"
          >
            <span>Skip</span>
            <X className="w-4 h-4" />
          </button>

          {/* Progress dots */}
          <div className="absolute top-6 left-8 flex gap-1.5">
            {tutorialSteps.map((_, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "w-2 h-2 rounded-full transition-all", 
                  idx === step ? "bg-slate-800 scale-125" : "bg-slate-200"
                )}
              />
            ))}
          </div>

          <div className="mb-6 mt-6 p-4 rounded-[24px] bg-white shadow-xl shadow-slate-200/50">
            {currentStep.icon}
          </div>

          <h2 className="text-2xl font-black mb-3 text-slate-900">{currentStep.title}</h2>
          <p className="text-slate-600 font-medium mb-8 leading-relaxed">
            {currentStep.content}
          </p>

          <div className="flex gap-3 w-full mt-auto">
            {step > 0 && (
              <button
                onClick={() => executeTutorial(step - 1)}
                className="px-6 py-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (step === tutorialSteps.length - 1) {
                  handleComplete();
                } else {
                  executeTutorial(step + 1);
                }
              }}
              className="flex-1 py-4 px-6 rounded-2xl font-black bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {currentStep.buttonText}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
