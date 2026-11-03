import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface CalendarAppProps {
  onBack: () => void;
}

interface Event {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string;
  color: string;
}

export const CalendarApp: React.FC<CalendarAppProps> = ({ onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([
    { id: '1', date: new Date().toISOString().split('T')[0], title: 'Product Review', time: '10:00 AM', color: 'bg-indigo-500' },
    { id: '2', date: new Date().toISOString().split('T')[0], title: 'Lunch with Sarah', time: '12:30 PM', color: 'bg-rose-500' },
  ]);
  const [newEventTitle, setNewEventTitle] = useState('');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const getDateString = (day: number) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    setEvents([...events, {
      id: Date.now().toString(),
      date: selectedDateString,
      title: newEventTitle.trim(),
      time: 'All Day',
      color: randomColor
    }]);
    setNewEventTitle('');
  };

  const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDateEvents = events.filter(e => e.date === selectedDateString);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-3 pb-2">
        <button
          onClick={onBack}
          className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-2xs"
          title="Back to Notebooks"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
          <span>Back to Notebooks</span>
        </button>
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">Calendar &amp; Schedule</h2>
        <button 
          onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          Today
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-sm relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">
              {monthNames[currentDate.getMonth()]} <span className="text-slate-400 font-medium">{currentDate.getFullYear()}</span>
            </h3>
            <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 rounded-xl text-slate-600 shadow-sm transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 rounded-xl text-slate-600 shadow-sm transition">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-black uppercase tracking-widest text-slate-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 flex-1 content-start">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-2 border border-transparent"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = getDateString(dayNum);
              const dayEvents = events.filter(e => e.date === dateStr);
              
              return (
                <button 
                  key={`day-${i}`} 
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum))}
                  className={cn(
                    "relative aspect-square p-2 border rounded-[20px] sm:rounded-[24px] flex flex-col items-center sm:items-start transition-all overflow-hidden",
                    isSelected(dayNum) 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20" 
                      : isToday(dayNum)
                        ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                        : "bg-white border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className={cn(
                    "text-sm sm:text-lg font-bold w-7 h-7 sm:w-auto sm:h-auto flex items-center justify-center rounded-full mt-1 sm:mt-0 sm:ml-1",
                  )}>
                    {dayNum}
                  </span>
                  
                  {/* Event Dots */}
                  <div className="mt-auto flex gap-1 justify-center w-full px-1 sm:justify-start">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div key={idx} className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", ev.color)}></div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-300"></div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Schedule Panel */}
        <div className="lg:col-span-4 h-full flex flex-col">
          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 border-dashed h-full flex flex-col relative overflow-hidden">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Schedule</div>
                <h3 className="text-2xl font-black text-slate-900">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar pr-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {selectedDateEvents.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-40 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-slate-400"
                  >
                    <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p className="font-semibold text-sm">No events scheduled</p>
                  </motion.div>
                ) : (
                  selectedDateEvents.map(event => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={event.id}
                      className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm group hover:shadow-md transition-all flex gap-4"
                    >
                      <div className={cn("w-2 rounded-full shrink-0", event.color)}></div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 line-clamp-1 mb-1">{event.title}</h4>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.time}</span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddEvent} className="mt-auto bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm flex items-center shadow-slate-200/50 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
              <input 
                type="text" 
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                placeholder="Add new event..."
                className="flex-1 bg-transparent border-none focus:outline-none px-4 py-3 font-semibold text-slate-800 placeholder:text-slate-400"
              />
              <button 
                type="submit"
                disabled={!newEventTitle.trim()}
                className="w-10 h-10 bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center rounded-xl shrink-0 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
