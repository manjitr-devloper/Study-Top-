import React, { useState, useEffect, useRef } from 'react';
import { Classroom, ClassroomMessage, ClassroomHomework, HomeworkSubmission, UserProfile } from '../types';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Send, ImagePlus, User, Edit3, X, Check } from 'lucide-react';
import { t } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  classroom: Classroom;
  userProfile: UserProfile;
  onBack: () => void;
}

export function ClassroomView({ classroom, userProfile, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'homework' | 'whiteboard' | 'students'>('chat');
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [homeworks, setHomeworks] = useState<ClassroomHomework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);

  // Chat form
  const [newMessage, setNewMessage] = useState('');
  
  // Homework form
  const [isCreatingHomework, setIsCreatingHomework] = useState(false);
  const [newHomeworkTitle, setNewHomeworkTitle] = useState('');
  const [newHomeworkDesc, setNewHomeworkDesc] = useState('');

  // Submit form
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTeacher = classroom.teacherId === auth.currentUser?.uid;

  useEffect(() => {
    // 1. Listen messages
    const messagesPath = `classrooms/${classroom.id}/messages`;
    const qM = query(collection(db, messagesPath), orderBy('createdAt', 'asc'));
    const unsubM = onSnapshot(qM, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassroomMessage)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, e => handleFirestoreError(e, OperationType.GET, messagesPath));

    // 2. Listen homeworks
    const hwPath = `classrooms/${classroom.id}/homeworks`;
    const qH = query(collection(db, hwPath), orderBy('createdAt', 'desc'));
    const unsubH = onSnapshot(qH, (snap) => {
      setHomeworks(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassroomHomework)));
    }, e => handleFirestoreError(e, OperationType.GET, hwPath));

    return () => {
      unsubM();
      unsubH();
    };
  }, [classroom.id]);

  useEffect(() => {
    if (!isTeacher) return;
    // Load ALL submissions for teacher
    const subsPath = `classrooms/${classroom.id}/homeworks`;
    // We actually need a collection group query or just run them based on open homework.
    // Simplifying: we'll fetch submissions per homework when a teacher clicks.
  }, [isTeacher, classroom.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;
    const msgRef = doc(collection(db, `classrooms/${classroom.id}/messages`));
    await setDoc(msgRef, {
      id: msgRef.id,
      classroomId: classroom.id,
      senderId: auth.currentUser.uid,
      senderName: userProfile.displayName || auth.currentUser.email || 'User',
      content: newMessage.trim(),
      createdAt: Date.now()
    });
    setNewMessage('');
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeworkTitle.trim() || !newHomeworkDesc.trim()) return;
    const hwRef = doc(collection(db, `classrooms/${classroom.id}/homeworks`));
    await setDoc(hwRef, {
      id: hwRef.id,
      classroomId: classroom.id,
      title: newHomeworkTitle.trim(),
      description: newHomeworkDesc.trim(),
      dueDate: Date.now() + 86400000 * 7,
      createdAt: Date.now()
    });
    setNewHomeworkTitle('');
    setNewHomeworkDesc('');
    setIsCreatingHomework(false);
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHomeworkId || !submissionContent.trim() || !auth.currentUser) return;
    const subRef = doc(collection(db, `classrooms/${classroom.id}/homeworks/${submittingHomeworkId}/submissions`));
    await setDoc(subRef, {
      id: subRef.id,
      homeworkId: submittingHomeworkId,
      studentId: auth.currentUser.uid,
      content: submissionContent.trim(),
      createdAt: Date.now()
    });
    setSubmittingHomeworkId(null);
    setSubmissionContent('');
  };

  const handleDeleteClassroom = async () => {
    if (!window.confirm(t(userProfile.language, "Are you sure you want to delete this classroom?"))) return;
    try {
      await deleteDoc(doc(db, 'joinCodes', classroom.joinCode));
      await deleteDoc(doc(db, 'classrooms', classroom.id));
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classrooms/${classroom.id}`);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm(t(userProfile.language, "Are you sure you want to remove this student?"))) return;
    try {
       await updateDoc(doc(db, 'classrooms', classroom.id), {
         studentIds: arrayRemove(studentId)
       });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `classrooms/${classroom.id}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 font-bold text-sm">
            <X className="w-5 h-5 md:hidden" />
            <span className="hidden md:inline">&larr; Back</span>
            <span className="md:hidden">Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{classroom.name}</h2>
              {isTeacher && (
                <button 
                  onClick={handleDeleteClassroom}
                  className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
             <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t(userProfile.language, "Join Code:")}</p>
                  <span className="font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-sm font-bold border border-brand-100">{classroom.joinCode}</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(classroom.joinCode);
                    alert('Join code copied to clipboard!');
                  }}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase hover:bg-slate-200 transition-colors"
                >
                  {t(userProfile.language, "Copy Code")}
                </button>
             </div>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto hide-scrollbar shrink-0">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t(userProfile.language, "Chat")}
          </button>
          <button 
            onClick={() => setActiveTab('homework')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'homework' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t(userProfile.language, "Homework")}
          </button>
          <button 
            onClick={() => setActiveTab('whiteboard')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'whiteboard' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t(userProfile.language, "Whiteboard")}
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'students' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t(userProfile.language, "Students")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
        <AnimatePresence mode="wait">
        {activeTab === 'chat' && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={msg.id} 
                  className={`flex flex-col ${msg.senderId === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{msg.senderName}</span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.senderId === auth.currentUser?.uid ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={t(userProfile.language, "Type a message...")}
                  className="flex-1 bg-slate-100 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all font-medium text-sm"
                />
                <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 bg-brand-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-brand-700 hover:scale-105 active:scale-95 transition-all">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'homework' && (
          <motion.div 
            key="homework"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {isTeacher && (
              <div className="mb-6">
                {!isCreatingHomework ? (
                   <button onClick={() => setIsCreatingHomework(true)} className="px-5 py-3 bg-brand-600 text-white font-bold text-sm rounded-xl hover:bg-brand-700 transition">
                     {t(userProfile.language, "+ Assign New Homework")}
                   </button>
                ) : (
                   <form onSubmit={handleCreateHomework} className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 space-y-4">
                     <h3 className="font-bold text-lg">{t(userProfile.language, "New Homework")}</h3>
                     <input type="text" value={newHomeworkTitle} onChange={e => setNewHomeworkTitle(e.target.value)} placeholder="Title" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" required />
                     <textarea value={newHomeworkDesc} onChange={e => setNewHomeworkDesc(e.target.value)} placeholder="Description" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" required />
                     <div className="flex gap-2 justify-end">
                       <button type="button" onClick={() => setIsCreatingHomework(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                       <button type="submit" className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700">Assign</button>
                     </div>
                   </form>
                )}
              </div>
            )}

            {homeworks.map(hw => (
              <div key={hw.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-xl text-slate-900 mb-2">{hw.title}</h3>
                <p className="text-slate-600 text-sm mb-4 whitespace-pre-wrap">{hw.description}</p>
                <div className="text-xs text-slate-400 font-bold mb-4">
                  Due: {new Date(hw.dueDate).toLocaleDateString()}
                </div>
                
                {!isTeacher && (
                  submittingHomeworkId === hw.id ? (
                    <form onSubmit={handleSubmitHomework} className="space-y-3">
                      <textarea value={submissionContent} onChange={e => setSubmissionContent(e.target.value)} placeholder="Type your answer or link to drive..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:border-brand-500 text-sm" required />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSubmittingHomeworkId(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 text-sm">Submit</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setSubmittingHomeworkId(hw.id)} className="px-4 py-2 bg-slate-100 font-bold text-slate-700 text-sm rounded-lg hover:bg-slate-200">
                      {t(userProfile.language, "Submit Work")}
                    </button>
                  )
                )}
                
                {isTeacher && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <TeacherHomeworkSubmissions classroomId={classroom.id} homeworkId={hw.id} />
                  </div>
                )}
              </div>
            ))}
            
            {homeworks.length === 0 && (
              <div className="text-center py-20 flex flex-col justify-center items-center">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Edit3 className="w-8 h-8" />
                 </div>
                 <p className="text-slate-400 font-bold">{t(userProfile.language, "No homework assigned yet.")}</p>
                 <p className="text-slate-400/70 text-sm mt-1">{t(userProfile.language, "Click '+ Assign New Homework' to get started.")}</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div 
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="font-black text-xl text-slate-900 mb-6">Students ({classroom.studentIds.length})</h3>
               {classroom.studentIds.length === 0 ? (
                 <p className="text-slate-400 font-bold">No students have joined yet.</p>
               ) : (
                 <ul className="space-y-3">
                   <AnimatePresence>
                   {classroom.studentIds.map(sid => (
                     <motion.li 
                       key={sid}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold">
                           <User className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="font-bold text-slate-900"><StudentName studentId={sid} showActivity={true} /></p>
                           <p className="text-xs text-slate-500 font-medium">Student ID: {sid}</p>
                         </div>
                       </div>
                       {isTeacher && (
                         <div className="flex items-center gap-2">
                           <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-500 rounded-lg">Active</span>
                           <button onClick={() => handleRemoveStudent(sid)} className="px-3 py-1 bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                             Remove
                           </button>
                         </div>
                       )}
                     </motion.li>
                   ))}
                   </AnimatePresence>
                 </ul>
               )}
             </div>
          </motion.div>
        )}

        {activeTab === 'whiteboard' && (
          <motion.div 
            key="whiteboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden relative bg-white"
          >
             {/* A simple digital whiteboard */}
             <SimpleWhiteboard />
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StudentName({ studentId, showActivity }: { studentId: string, showActivity?: boolean }) {
  const [name, setName] = useState('Loading...');
  const [activity, setActivity] = useState<number | null>(null);
  
  useEffect(() => {
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(db, 'users', studentId)).then(snap => {
        if (snap.exists()) {
          const userObj = snap.data();
          setName(userObj.displayName || userObj.email?.split('@')[0] || 'Unknown Student');
          setActivity(userObj.lastLogin || null);
        } else {
          setName('Unknown Student');
        }
      }).catch(() => {
        setName('Student');
      });
    });
  }, [studentId]);

  return (
    <span className="flex flex-col">
       <span>{name}</span>
       {showActivity && activity && (
         <span className="text-[10px] font-medium text-slate-400 mt-0.5">Last active: {new Date(activity).toLocaleString()}</span>
       )}
    </span>
  );
}

function TeacherHomeworkSubmissions({ classroomId, homeworkId }: { classroomId: string, homeworkId: string }) {
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, `classrooms/${classroomId}/homeworks/${homeworkId}/submissions`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as HomeworkSubmission)));
    }, (err) => {
      console.warn('Submissions stream notice:', err.message);
    });
    return () => unsub();
  }, [classroomId, homeworkId]);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Submissions ({submissions.length})</h4>
      {submissions.map(sub => (
        <div key={sub.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
           <p className="text-xs font-bold text-slate-500 mb-2">Student: <StudentName studentId={sub.studentId} /></p>
           <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">{sub.content}</p>
           {sub.grade ? (
             <div className="mt-3 text-xs font-bold text-green-600 bg-green-50 inline-block px-2 py-1 rounded">Grade: {sub.grade}</div>
           ) : (
             <div className="mt-3 flex gap-2">
               <button onClick={() => updateDoc(doc(db, `classrooms/${classroomId}/homeworks/${homeworkId}/submissions/${sub.id}`), { grade: 'A' })} className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded hover:bg-green-200 text-xs transition">Grade A</button>
               <button onClick={() => updateDoc(doc(db, `classrooms/${classroomId}/homeworks/${homeworkId}/submissions/${sub.id}`), { grade: 'B' })} className="px-3 py-1 bg-brand-100 text-brand-700 font-bold rounded hover:bg-brand-200 text-xs transition">Grade B</button>
               <button onClick={() => updateDoc(doc(db, `classrooms/${classroomId}/homeworks/${homeworkId}/submissions/${sub.id}`), { grade: 'C' })} className="px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded hover:bg-amber-200 text-xs transition">Grade C</button>
             </div>
           )}
        </div>
      ))}
    </div>
  )
}

function SimpleWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0ea5e9');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    ctx.strokeStyle = color;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div className="absolute inset-0">
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
         {['#000000', '#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#ffffff'].map(c => (
           <button 
             key={c}
             onClick={() => setColor(c)}
             className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
             style={{ backgroundColor: c }}
             title={c === '#ffffff' ? 'Eraser' : 'Color'}
           />
         ))}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
}
