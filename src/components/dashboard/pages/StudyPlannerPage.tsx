import React, { useState } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Plus, 
  Clock, 
  Award, 
  Flame, 
  Target, 
  Trash2, 
  Check, 
  ArrowRight,
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface PlannerTask {
  id: string;
  title: string;
  subject: string;
  time: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const StudyPlannerPage: React.FC = () => {
  const [tasks, setTasks] = useState<PlannerTask[]>([
    { id: '1', title: 'Revise Thermodynamics Formulas (Carnot efficiency & Entropy)', subject: 'Physics', time: '10:00 AM - 11:30 AM', completed: true, priority: 'high' },
    { id: '2', title: 'Solve 10 Trigonometry problems from Chapter 3', subject: 'Mathematics', time: '02:00 PM - 03:30 PM', completed: false, priority: 'high' },
    { id: '3', title: 'Read Plant Anatomy & Draw Chloroplast diagram', subject: 'Biology', time: '05:00 PM - 06:00 PM', completed: false, priority: 'medium' },
    { id: '4', title: 'Practice 5 MCQs on Periodic Table Trends', subject: 'Chemistry', time: '07:30 PM - 08:30 PM', completed: false, priority: 'low' }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Physics');
  const [newTaskTime, setNewTaskTime] = useState('04:00 PM - 05:00 PM');
  const [examDate, setExamDate] = useState('2026-11-20');
  const [examName, setExamName] = useState('Term Finals & Board Pre-Boards');

  const daysUntilExam = Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: PlannerTask = {
      id: 'task_' + Date.now(),
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      time: newTaskTime,
      completed: false,
      priority: 'high'
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Goal Tracking &amp; Timetable
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Study Planner &amp; Schedule</h2>
          <p className="text-xs text-slate-500 mt-1">
            Build consistent learning habits, maintain your study streak, and countdown to exams.
          </p>
        </div>

        {/* Study Streak Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md">
            <Flame className="w-5 h-5 text-yellow-200 fill-current animate-bounce" />
            <div>
              <p className="text-[10px] font-black uppercase text-amber-100">Study Streak</p>
              <p className="text-sm font-black">7 Days Active 🔥</p>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown and Progress Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Exam Countdown Box */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-3xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Exam Countdown</span>
              <Calendar className="w-4 h-4 text-blue-200" />
            </div>
            <h3 className="text-sm font-extrabold text-blue-50">{examName}</h3>
          </div>
          <div className="my-3">
            <span className="text-4xl font-black">{daysUntilExam}</span>
            <span className="text-sm font-bold text-blue-200 ml-1.5">days left</span>
          </div>
          <p className="text-[11px] text-blue-200">Scheduled: {new Date(examDate).toLocaleDateString()}</p>
        </div>

        {/* Daily Goals Progress Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Goal Completion</span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Today's Target Progress</h3>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-black text-slate-900">{progressPercent}%</span>
              <span className="text-xs font-bold text-slate-500">{completedCount} of {tasks.length} tasks</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            {progressPercent === 100 ? '🎉 All goals finished for today!' : 'Keep going! Complete remaining tasks.'}
          </p>
        </div>

        {/* Weekly Focus Hours */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Study Hours</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Time Spent Learning</h3>
          </div>

          <div className="my-3">
            <span className="text-3xl font-black text-slate-900">18.5</span>
            <span className="text-xs font-bold text-slate-500 ml-1">hours this week</span>
          </div>

          <p className="text-[11px] text-slate-400">
            +3.5 hours compared to last week (Top 10% student pace)
          </p>
        </div>
      </div>

      {/* Daily Tasks Checklist & Add Task Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>Today's Study Schedule &amp; Tasks</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {tasks.length} planned items
          </span>
        </div>

        {/* Quick Add Bar */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add new study goal (e.g., Practice Ray Optics numericals)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
          />
          <select
            value={newTaskSubject}
            onChange={(e) => setNewTaskSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
          >
            <option>Physics</option>
            <option>Mathematics</option>
            <option>Chemistry</option>
            <option>Biology</option>
            <option>Computer Science</option>
            <option>History</option>
          </select>
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Task items list */}
        <div className="space-y-2.5 pt-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                task.completed 
                  ? 'bg-slate-50/50 border-slate-200/80 text-slate-400' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                  task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {task.completed && <Check className="w-3.5 h-3.5" />}
                </div>

                <div className="min-w-0">
                  <h4 className={`text-xs font-bold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-bold text-blue-600 uppercase">{task.subject}</span>
                    <span>•</span>
                    <span>{task.time}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                className="p-1 text-slate-300 hover:text-rose-600 cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
