import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Edit2, X, Plus } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ExamCountdownWidgetProps {
  userProfile?: UserProfile | null;
  onUpdateProvider?: (updates: Partial<UserProfile>) => void;
}

export const ExamCountdownWidget: React.FC<ExamCountdownWidgetProps> = ({ userProfile, onUpdateProvider }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [examName, setExamName] = useState('');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    if (userProfile?.examDate) {
      setExamDate(userProfile.examDate);
    }
    if (userProfile?.examName) {
      setExamName(userProfile.examName);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile?.examDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(userProfile.examDate!).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // update every minute
    return () => clearInterval(timer);
  }, [userProfile?.examDate]);

  const handleSave = async () => {
    if (userProfile?.uid) {
      const updates = { examDate, examName };
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), updates);
        if (onUpdateProvider) {
          onUpdateProvider(updates);
        }
      } catch (error) {
        console.error("Failed to update exam date", error);
      }
    }
    setIsEditing(false);
  };

  const handleClear = async () => {
    if (userProfile?.uid) {
      const updates = { examDate: '', examName: '' };
      setExamDate('');
      setExamName('');
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), updates);
        if (onUpdateProvider) {
          onUpdateProvider(updates);
        }
      } catch (error) {
        console.error("Failed to clear exam date", error);
      }
    }
    setIsEditing(false);
  };

  if (!userProfile) return null;

  return (
    <div className="bento-card bg-indigo-50 border border-indigo-100 p-5 col-span-1 md:col-span-2 relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-200/50 rounded-full blur-3xl" />
      <div className="relative z-10 flex flex-col h-full justify-center">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Clock className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-widest">Upcoming Exam</h3>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="w-8 h-8 rounded-full bg-white text-indigo-500 shadow-sm flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isEditing ? <X className="w-4 h-4" /> : (userProfile.examDate ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div>
                <input 
                  type="text" 
                  value={examName} 
                  onChange={e => setExamName(e.target.value)} 
                  placeholder="Exam Name (e.g., Final Math)" 
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <input 
                  type="date" 
                  value={examDate} 
                  onChange={e => setExamDate(e.target.value)} 
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSave}
                  disabled={!examDate || !examName}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
                {userProfile.examDate && (
                  <button 
                    onClick={handleClear}
                    className="px-3 bg-red-100 text-red-600 rounded-xl py-2 text-xs font-black uppercase tracking-widest hover:bg-red-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          ) : userProfile.examDate && timeLeft ? (
            <motion.div 
              key="view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-between items-center"
            >
              <div>
                <h4 className="text-xl font-black text-slate-900 leading-none mb-1">{userProfile.examName}</h4>
                <div className="flex items-center gap-1.5 text-indigo-700 mt-2 text-sm font-bold opacity-80">
                  <Calendar className="w-4 h-4" />
                  {new Date(userProfile.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="flex gap-2 text-center">
                <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-indigo-50 min-w-[3rem]">
                  <p className="text-xl font-black text-indigo-600">{timeLeft.days}</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Days</p>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-indigo-50 min-w-[3rem] hidden sm:block">
                  <p className="text-xl font-black text-indigo-600">{timeLeft.hours}</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Hrs</p>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-indigo-50 min-w-[3rem] hidden sm:block">
                  <p className="text-xl font-black text-indigo-600">{timeLeft.minutes}</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Mins</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center text-indigo-300 mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-black text-indigo-600">Set Exam Date</p>
              <p className="text-xs text-indigo-400 font-medium mt-1">Add a countdown to your next big test</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
