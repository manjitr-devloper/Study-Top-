import React, { useState, useRef } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, FileText, Send, CalendarPlus, Mic, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import { Task } from '../types';
import { parseVoiceToTask } from '../lib/gemini';

interface QuickEventWidgetProps {
  onCreateEvent: (event: Partial<Task>) => void;
  language: string;
}

export const QuickEventWidget: React.FC<QuickEventWidgetProps> = ({ onCreateEvent, language }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let dueDateStr = undefined;
    if (date) {
      dueDateStr = new Date(`${date}T${time || '00:00'}`).getTime();
    }

    onCreateEvent({
      title,
      description,
      location,
      dueDate: dueDateStr || Date.now(),
      priority: 'medium',
    });

    // Reset form
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        setIsProcessingVoice(true);
        try {
          const result = await parseVoiceToTask(blob, language);
          if (result.title) {
             let parsedDate = Date.now();
             if (result.dueDate) {
               parsedDate = new Date(result.dueDate).getTime();
             }
             onCreateEvent({
               title: result.title,
               dueDate: parsedDate,
               priority: 'medium'
             });
          }
        } catch (error) {
          console.error("Failed to parse voice task", error);
        } finally {
          setIsProcessingVoice(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access is required to use voice add.");
    }
  };

  return (
    <section className="bento-card p-6 bg-white shadow-sm flex flex-col md:col-span-2 lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black rounded uppercase tracking-widest inline-flex items-center gap-1">
          <CalendarPlus className="w-3 h-3" /> Quick Add Event
        </span>
      </div>
      <h3 className="text-sm font-bold text-slate-400 mb-4">{t(language, "Plan a new task or event")}</h3>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
        <div className="flex bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
          <div className="pl-3 flex items-center justify-center text-slate-400 border-r border-slate-100 pr-3 bg-slate-100/50">
            <FileText className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder={t(language, "Event Name (e.g. Study Group)")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm font-bold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-400"
            required={!isRecording && !isProcessingVoice}
          />
          <button 
            type="button" 
            onClick={toggleRecording}
            className={cn(
              "px-3 flex items-center justify-center transition-colors border-l border-slate-100",
              isRecording ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse" : "text-slate-400 hover:text-brand-500 hover:bg-brand-50"
            )}
            title={isRecording ? "Stop Recording" : "Voice Add Task"}
          >
            {isProcessingVoice ? <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
            <div className="pl-3 flex items-center justify-center text-slate-400 border-r border-slate-100 pr-3 bg-slate-100/50">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm font-bold text-slate-700 outline-none"
            />
          </div>
          
          <div className="flex bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
            <div className="pl-3 flex items-center justify-center text-slate-400 border-r border-slate-100 pr-3 bg-slate-100/50">
              <Clock className="w-4 h-4" />
            </div>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm font-bold text-slate-700 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
            <div className="pl-3 flex items-center justify-center text-slate-400 border-r border-slate-100 pr-3 bg-slate-100/50">
              <MapPin className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder={t(language, "Location (Optional)")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm font-bold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-400"
            />
          </div>
          
          <button 
            type="submit"
            disabled={!title.trim() || isRecording || isProcessingVoice}
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 active:scale-95 shadow-md shadow-brand-500/20"
          >
            <span>{t(language, "Add")}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </section>
  );
};
