import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  Send, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  LifeBuoy, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: number;
}

export const HelpSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('AI & Note Generation');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-2026-9042',
      subject: 'Inquiry regarding LaTeX formula rendering on Android',
      category: 'Technical Issue',
      description: 'Equations in physics note render smoothly on desktop, requesting font optimization on mobile.',
      priority: 'low',
      status: 'Resolved',
      date: Date.now() - 172800000
    }
  ]);

  const faqs = [
    {
      q: 'How do I generate interactive flashcards from my study notes?',
      a: 'Open any note in the editor, highlight any sentence or formula, and click "Set Front" or "Set Back" on the floating toolbar. You can also click "AI Auto-Extract Full Deck" at the bottom dock to automatically generate a complete 3D active-recall deck.'
    },
    {
      q: 'Is the Step-by-Step Math Solver free for all students?',
      a: 'Yes! Step-by-step mathematical problem solving with verified algebraic derivations and LaTeX formula outputs is 100% free for all students on Study Top without mandatory paywalls.'
    },
    {
      q: 'How do discount coupons (STUDENT50, STUDYTOP20) work?',
      a: 'Enter your promo code during subscription checkout or inside the "My Coupons" wallet. Valid student coupons discount eligible plans instantly before payment.'
    },
    {
      q: 'How does Study Top protect my private textbooks and study notes?',
      a: 'Your notes and uploaded documents are isolated within per-user authenticated Firestore collections and encrypted storage. Other students cannot view your private notes.'
    },
    {
      q: 'Can I export notes into printable PDF and Word documents?',
      a: 'Yes. Every note has an "Export" button in the top toolbar supporting formatted PDF, TXT, PNG, and Markdown.'
    }
  ];

  const filteredFaqs = faqs.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
  });

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    const newTicketId = `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicket = {
      id: newTicketId,
      subject: ticketSubject.trim(),
      category: ticketCategory,
      description: ticketDescription.trim(),
      priority: ticketPriority,
      status: 'Open',
      date: Date.now()
    };

    setTickets(prev => [newTicket, ...prev]);
    setSubmittedTicketId(newTicketId);
    setTicketSubject('');
    setTicketDescription('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Student Assistance 24/7
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Help, FAQs &amp; Support Tickets</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse knowledge base guides or submit an inquiry directly to the Study Top engineering desk.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <LifeBuoy className="w-4 h-4 text-blue-600" />
          <span>Average response &lt; 2 hrs</span>
        </div>
      </div>

      {/* Searchable FAQs */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </h3>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus-within:bg-white focus-within:border-blue-500">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. flashcards, export, math solver)..."
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800"
          />
        </div>

        {/* FAQ Accordion */}
        <div className="divide-y divide-slate-100">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {faq.q}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Support Ticket Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>Submit a Support Ticket or Report an Issue</span>
        </h3>

        {submittedTicketId && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p>Ticket #{submittedTicketId} generated successfully!</p>
              <p className="font-normal text-[11px] text-emerald-700">Our engineering team has received your inquiry.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Subject / Issue Title</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Error parsing complex chemical formula"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option>AI &amp; Note Generation</option>
                <option>Math Solver Inquiry</option>
                <option>Billing &amp; Subscription</option>
                <option>Document Upload &amp; OCR</option>
                <option>Feedback &amp; Feature Suggestion</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Detailed Description</label>
            <textarea
              rows={4}
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              placeholder="Please describe your question or what occurred..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Ticket</span>
          </button>
        </form>
      </div>

      {/* Tracked Tickets List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Your Support Inquiries ({tickets.length})
        </h3>
        <div className="divide-y divide-slate-100">
          {tickets.map(t => (
            <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600">{t.id}</span>
                  <span className="text-xs font-black text-slate-900">{t.subject}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{t.category} • Submitted on {new Date(t.date).toLocaleDateString()}</p>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase self-start sm:self-auto ${
                t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
