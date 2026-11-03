import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Download, GraduationCap, Award, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface ResultMakerAppProps {
  onBack: () => void;
}

export const ResultMakerApp: React.FC<ResultMakerAppProps> = ({ onBack }) => {
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [subjects, setSubjects] = useState<{ id: string; name: string; marks: string; maxMarks: string }[]>([
    { id: '1', name: 'Mathematics', marks: '90', maxMarks: '100' },
    { id: '2', name: 'Science', marks: '85', maxMarks: '100' },
    { id: '3', name: 'English literature', marks: '92', maxMarks: '100' }
  ]);

  const handleAddSubject = () => {
    setSubjects([...subjects, { id: Date.now().toString(), name: '', marks: '', maxMarks: '100' }]);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleChange = (id: string, field: keyof typeof subjects[number], value: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const totalMarks = subjects.reduce((sum, s) => sum + (Number(s.marks) || 0), 0);
  const totalMaxMarks = subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0);
  const percentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : '0';
  const isPassing = Number(percentage) >= 40;

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-2xs"
            title="Back to Notebooks"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
            <span>Back to Notebooks</span>
          </button>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">Result &amp; Grade Maker</h2>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Editor Form */}
        <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-[32px] p-2 sm:p-8 border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-indigo-500" />
              Student Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Student Name</label>
                <input 
                  type="text" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Eleanor Shellstrop"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Grade / Class</label>
                <input 
                  type="text" 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 10th Grade"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <Award className="w-6 h-6 text-indigo-500" />
                Subjects & Marks
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <AnimatePresence>
                {subjects.map((sub, index) => (
                  <motion.div 
                    key={`sub-${sub.id || index}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row gap-3 items-center bg-white p-2 border-b border-slate-100 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                      <input 
                        type="text" 
                        value={sub.name}
                        onChange={(e) => handleChange(sub.id, 'name', e.target.value)}
                        placeholder="Subject Name"
                        className="w-full px-3 py-2 bg-transparent text-slate-800 font-bold focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-1 py-1 w-full sm:w-auto shrink-0">
                      <input 
                        type="number" 
                        value={sub.marks}
                        onChange={(e) => handleChange(sub.id, 'marks', e.target.value)}
                        placeholder="Score"
                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-indigo-400"
                      />
                      <span className="text-slate-400 font-bold text-sm">/</span>
                      <input 
                        type="number" 
                        value={sub.maxMarks}
                        onChange={(e) => handleChange(sub.id, 'maxMarks', e.target.value)}
                        placeholder="Max"
                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center text-slate-500 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveSubject(sub.id)}
                      className="w-10 h-10 shrink-0 bg-transparent rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleAddSubject}
              className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-indigo-500 font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Subject
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 h-full relative">
          <div className="sticky top-0 h-full flex flex-col">
            <div className={cn(
              "flex-1 rounded-[32px] p-8 shadow-2xl flex flex-col relative overflow-hidden transition-colors duration-500",
              isPassing ? "bg-slate-900" : "bg-rose-950"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 transition-colors duration-500",
                isPassing ? "bg-indigo-500" : "bg-rose-500"
              )}></div>
              
              <div className="text-center space-y-2 mb-10 z-10">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Official Report Card</h4>
                <div className="w-12 h-1 bg-white/10 mx-auto rounded-full"></div>
              </div>
              
              <div className="flex-1 z-10 flex flex-col">
                <div className="mb-8">
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2 truncate">
                    {studentName || 'Student Name'}
                  </h1>
                  <p className="text-xl text-white/60 font-medium">
                    {grade || 'Class / Grade'}
                  </p>
                </div>

                <div className="space-y-4 mb-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {subjects.map((sub, i) => (
                    <div key={i} className="flex justify-between items-center group">
                      <span className="font-medium text-white/70 text-lg group-hover:text-white transition-colors">{sub.name || 'Subject Name'}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{sub.marks || 0}</span>
                        <span className="text-sm font-medium text-white/40">/{sub.maxMarks || 100}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"></div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Score</div>
                      <div className="text-2xl font-black text-white flex items-baseline gap-2">
                        {totalMarks} <span className="text-lg text-white/40 font-medium">/ {totalMaxMarks}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" /> Percentage
                      </div>
                      <div className={cn(
                        "text-5xl font-black tracking-tighter",
                        isPassing ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Export Button */}
            <button className="sm:hidden mt-4 flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg">
              <Download className="w-5 h-5" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
