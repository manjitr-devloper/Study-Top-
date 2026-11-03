import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Send, Trash2, Globe, Sparkles, Camera, Loader2, ArrowLeft, ChevronLeft } from 'lucide-react';
import { t } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

export interface GlobalMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: number;
  imageUrl?: string;
}

interface GlobalChatViewProps {
  userProfile: any;
  onBack?: () => void;
}

export function GlobalChatView({ userProfile, onBack }: GlobalChatViewProps) {
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'globalChat'), orderBy('createdAt', 'asc'), limit(150));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as GlobalMessage));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      console.warn('Global chat notice:', error?.message);
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent, uploadedImageUrl?: string) => {
    if (e) e.preventDefault();
    const contentText = newMessage.trim();
    if (!contentText && !uploadedImageUrl) return;
    if (!auth.currentUser) return;

    setNewMessage('');

    const messageId = doc(collection(db, '_')).id;
    const msg: GlobalMessage = {
      id: messageId,
      content: contentText,
      senderId: auth.currentUser.uid,
      senderName: userProfile?.displayName || auth.currentUser.displayName || 'Anonymous',
      createdAt: Date.now()
    };
    if (uploadedImageUrl) {
       msg.imageUrl = uploadedImageUrl;
    }

    try {
      await setDoc(doc(db, 'globalChat', messageId), msg);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'globalChat');
      setNewMessage(contentText); // revert
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete message?')) return;
    try {
      await deleteDoc(doc(db, 'globalChat', messageId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `globalChat/${messageId}`);
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 500) { // Keep under 500kb for Firestore docs limits
       alert('Image is too large. Please select a smaller photo (max 500kb).');
       return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
       const base64Url = ev.target?.result as string;
       await handleSendMessage(undefined, base64Url);
       setIsUploading(false);
       if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
      <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 z-10 relative">
        <div className="flex items-center gap-3 sm:gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-700"
              title="Back to Notebooks"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              Global Study Community <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Discuss study questions with peers worldwide.</p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Chat</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative">
        {messages.length === 0 && (
          <div className="text-center py-20 flex flex-col justify-center items-center h-full">
            <Globe className="w-16 h-16 text-slate-800 mb-4" />
            <p className="text-slate-500 font-medium">Be the first to say hello!</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            return (
              <motion.div 
                key={`gmsg-${msg.id || idx}-${idx}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  <span className={`text-[10px] font-bold ${isMe ? 'text-indigo-400' : 'text-slate-400'}`}>{isMe ? 'You' : msg.senderName}</span>
                  <span className="text-[9px] text-slate-600">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center gap-2 max-w-[85%] group">
                  {isMe && (
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div className={`px-5 py-3 rounded-2xl shadow-sm leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'}`}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Chat attachment" className="max-w-full rounded-lg mb-2 max-h-[300px] object-cover" />
                    )}
                    {msg.content && <div className="text-sm font-medium">{msg.content}</div>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-slate-900 border-t border-slate-800/50">
        <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm p-2 rounded-2xl border border-slate-700/50 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageCapture}
            className="hidden"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-10 h-10 shrink-0 text-slate-400 hover:text-indigo-400 bg-slate-800 rounded-xl flex items-center justify-center transition-all shadow-inner disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          
          <input 
            type="text" 
            value={newMessage}
            disabled={isUploading}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            maxLength={2000}
            className="flex-1 bg-transparent border-transparent px-2 py-2 outline-none text-white placeholder:text-slate-500 font-medium text-sm"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() && !isUploading} 
            className="w-10 h-10 shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
