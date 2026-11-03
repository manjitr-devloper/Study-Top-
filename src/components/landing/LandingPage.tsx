import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  FileUp, 
  Camera, 
  Youtube, 
  Network, 
  Download, 
  CheckCircle2, 
  ArrowRight, 
  Menu, 
  X, 
  MessageSquare, 
  BookOpen, 
  ShieldCheck, 
  ChevronRight,
  Search,
  ExternalLink,
  Layers,
  GraduationCap
} from 'lucide-react';
import { StudyTopLogo } from '../StudyTopLogo';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExplore: () => void;
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onExplore,
  onOpenAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'notes' | 'ask' | 'diagram' | 'export'>('notes');
  const [demoQuestion, setDemoQuestion] = useState('What causes cellular respiration to yield 32-34 ATP?');
  const [demoAnswer, setDemoAnswer] = useState<string | null>(
    'According to your uploaded textbook chapter [Source 1], the electron transport chain establishes a proton gradient across the inner mitochondrial membrane. Chemiosmosis then drives ATP synthase rotation, yielding approximately 32 to 34 ATP molecules per glucose molecule [1].'
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. FLOATING NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StudyTopLogo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#materials" className="hover:text-blue-600 transition-colors">Study Materials</a>
            <a href="#smart-notes" className="hover:text-blue-600 transition-colors">AI Notes</a>
            <a href="#ask" className="hover:text-blue-600 transition-colors">Source Q&A</a>
            <a href="#diagrams" className="hover:text-blue-600 transition-colors">Diagram Studio</a>
            <a href="#export" className="hover:text-blue-600 transition-colors">Export</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#materials"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Study Materials
            </a>
            <a
              href="#smart-notes"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              AI Notes
            </a>
            <a
              href="#diagrams"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Diagram Studio
            </a>
            <div className="pt-3 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onSignIn(); }}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-700 border border-slate-200 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-blue-600 rounded-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>AI-powered notes · Source-based answers · Smart diagrams</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Your Entire Learning World. One Intelligent Workspace.
              </h1>

              <p className="text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Transform PDFs, photos, documents, and lectures into beautiful study notes. Ask questions about your materials, generate diagrams, and understand difficult concepts with AI.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Create My First Note</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onExplore}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Explore Study Top</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real Gemini RAG
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Interactive Diagrams
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PDF &amp; PNG Export
                </span>
              </div>
            </div>

            {/* Right Column: Realistic Application Preview */}
            <div className="lg:col-span-6">
              <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xl relative">
                {/* Window Topbar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-bold text-slate-700">Study Top Workspace — AP Biology Notebook</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Autosaved</span>
                </div>

                {/* Layered Mini-Tabs Preview */}
                <div className="space-y-4">
                  {/* Document Converted into Formatted Note */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Generated Study Note</span>
                      <span className="text-xs text-slate-400">Source: Campbell_Bio_Ch9.pdf</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-1">
                      Cellular Respiration &amp; Chemiosmosis
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      Glucose oxidation through glycolysis and the citric acid cycle channels electrons to the inner mitochondrial membrane, driving an electrochemical proton gradient.
                    </p>
                    <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 font-mono border border-slate-200">
                      Formula: C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ~32-34 ATP
                    </div>
                  </div>

                  {/* AI Question & Answer Snippet with Citation */}
                  <div className="bg-blue-50/70 rounded-xl border border-blue-200/80 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Student Question &amp; Grounded Answer</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium italic mb-2">
                      &quot;How does ATP synthase use the proton gradient?&quot;
                    </p>
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-blue-100">
                      <span>Protons flow down their electrochemical gradient through the stator channel, spinning the rotor. This catalytic rotation phosphorylates ADP into ATP.</span>
                      <span className="ml-1.5 inline-block px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                        Source 1 · Page 182
                      </span>
                    </div>
                  </div>

                  {/* Mini Diagram and Export Bar */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Network className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">ATP Cycle Flowchart</div>
                        <div className="text-[11px] text-slate-500">Live Mermaid rendered</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">Export Ready</div>
                        <div className="text-[11px] text-slate-500">PDF, PNG &amp; TXT</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SECTION A — FROM MATERIAL TO KNOWLEDGE */}
      <section id="materials" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 1 — Ingestion</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Bring Any Study Material. Get Organized Knowledge.
            </h2>
            <p className="text-base text-slate-600 mt-3 leading-relaxed">
              Upload textbook chapters, lecture slides, handwriting photos, or YouTube video links. Study Top extracts the knowledge so you can study without manual transcript typing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">PDF Documents</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload digital textbooks, lecture notes, syllabus guides, or research papers. Extracts chapter headings, text blocks, and tables with full fidelity.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Textbook Photos &amp; OCR</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Take a quick camera snap of any printed textbook page or handwritten classroom board. Gemini vision scans and transcribes clear editable text.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Youtube className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">YouTube URL Transcripts</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Paste any educational YouTube lecture URL. Study Top processes available captions and transcripts into structured study notes.
              </p>
            </div>
          </div>

          {/* Workflow Sequence */}
          <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">The Study Top Processing Pipeline</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-extrabold text-blue-600 text-sm">1. Upload</div>
                <div className="text-xs text-slate-500 mt-1">PDF, Photo, URL</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-extrabold text-blue-600 text-sm">2. Extract</div>
                <div className="text-xs text-slate-500 mt-1">Text &amp; OCR parsing</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-extrabold text-blue-600 text-sm">3. Understand</div>
                <div className="text-xs text-slate-500 mt-1">Semantic chunking</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-extrabold text-blue-600 text-sm">4. Generate Notes</div>
                <div className="text-xs text-slate-500 mt-1">Key concepts &amp; formulas</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-extrabold text-blue-600 text-sm">5. Ask Questions</div>
                <div className="text-xs text-slate-500 mt-1">Source-grounded RAG</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION B — SMART NOTES */}
      <section id="smart-notes" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 2 — Synthesis</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Notes That Make Studying Easier.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Raw textbook text is dense. Study Top reformats long material into clean, memorable notes with clear headings, core definitions, real-world examples, comparison tables, and quick revision points.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <p className="text-sm text-slate-700 font-medium">Headings, definitions, and step-by-step concepts</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <p className="text-sm text-slate-700 font-medium">LaTeX mathematical formulas and comparison tables</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <p className="text-sm text-slate-700 font-medium">Interactive flashcards and auto-generated multiple choice quizzes</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Try AI Note Generator
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-md">
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Physics: Thermodynamics</span>
                    <span className="text-xs text-blue-600 font-semibold">Exam Revision Notes</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">1. The Second Law of Thermodynamics</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The total entropy of an isolated system can never decrease over time. Spontaneous changes always occur in a direction that increases total universal entropy {"(ΔS_total > 0)"}.
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800">Entropy Definition: </span>
                    <span className="text-slate-600">{"$ΔS = \\int \\frac{dQ_{rev}}{T}$ — Quantitative measure of microscopic state disorder."}</span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-slate-100 font-bold p-2 text-slate-700">
                      <div>Engine Cycle</div>
                      <div>Working Fluid</div>
                      <div>Max Efficiency</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-t border-slate-100 text-slate-600">
                      <div>Carnot Engine</div>
                      <div>Ideal Gas</div>
                      <div>$1 - T_C / T_H$</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION C — ASK YOUR MATERIALS (SOURCE-GROUNDED Q&A) */}
      <section id="ask" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 3 — Interactive Research</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Your Study Material, Ready to Answer.
            </h2>
            <p className="text-base text-slate-600 mt-3 leading-relaxed">
              Ask questions directly against your uploaded files. Study Top answers using verified passages and marks the specific source references so you know exactly where the knowledge comes from.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Selected Sources: 2 Documents Grounded</span>
                <span className="text-blue-600 font-bold">Strict RAG Grounding Active</span>
              </div>

              {/* Sample Question Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={demoQuestion}
                  onChange={(e) => setDemoQuestion(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  placeholder="Ask a question about your sources..."
                />
                <button
                  onClick={() => {
                    setDemoAnswer(
                      `Grounded in your document on Cellular Respiration [Source 1]: ATP synthase acts as a rotary motor. As hydrogen ions diffuse through the membrane stator channel, conformational changes drive ADP + Pi binding to synthesize 32-34 ATP per glucose cycle [1].`
                    );
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer"
                >
                  Ask
                </button>
              </div>

              {/* Grounded Response Card */}
              {demoAnswer && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Study Top Grounded Assistant</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {demoAnswer}
                  </p>
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-200/70 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">References:</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">
                      [1] Campbell_Bio_Ch9.pdf (Page 184)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION D — DIAGRAM STUDIO */}
      <section id="diagrams" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 4 — Visual Understanding</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Turn Difficult Concepts Into Clear Diagrams.
            </h2>
            <p className="text-base text-slate-600 mt-3 leading-relaxed">
              Generate flowcharts, mind maps, concept hierarchies, chronological timelines, and scientific process diagrams with live interactive preview and zoom controls.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <h4 className="font-bold text-slate-900 text-sm mb-1">Flowcharts &amp; Algorithms</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Map logic, programming workflows, decision trees, and experimental methods.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 text-sm mb-1">Mind Maps &amp; Concept Trees</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Connect high-level chapter topics to sub-branches and exam definitions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 text-sm mb-1">Timelines &amp; Science Pathways</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chronological historical events, biological metabolic pathways, and physics processes.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <span>Interactive Mermaid Renderer</span>
                  <span className="text-blue-600 font-bold">Zoom · Pan · Fullscreen</span>
                </div>

                {/* SVG Visual Diagram Simulation */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[260px] flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-4 flex-wrap justify-center">
                    <div className="px-4 py-2.5 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200 shadow-2xs">
                      Glycolysis (Cytoplasm)
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-200 shadow-2xs">
                      Krebs Cycle (Mitochondria)
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs">
                      Electron Transport Chain
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <span>Produces ~32-34 ATP</span>
                    <span>·</span>
                    <span>Mermaid 12.2 Renderer</span>
                    <span>·</span>
                    <span>Export to PNG / SVG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION E — EXPORT YOUR KNOWLEDGE */}
      <section id="export" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 5 — Portable Output</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Study Your Way. Export Your Way.
            </h2>
            <p className="text-base text-slate-600 mt-3 leading-relaxed">
              Take your generated notes, summaries, diagrams, and revision guides anywhere with genuine PDF, PNG, and clean text file downloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-4">
                PDF
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">A4 Printable Study Guides</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean academic layout with headings, page numbers, formula blocks, and creator attribution.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
                PNG
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">High-Resolution Diagram Images</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Save full visual flowcharts and mind maps directly to camera roll or laptop storage.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                TXT
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Clean UTF-8 Markdown / Text</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean text for pasting into Notion, Google Docs, Anki flashcard decks, or classroom boards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECTION F — FINAL CALL TO ACTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Make Your Next Study Session Smarter.
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Join students, researchers, and educators turning unstructured documents into clear notes and grounded AI knowledge.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Start Creating Notes</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-white font-extrabold text-lg mb-2">
                <StudyTopLogo size="xs" variant="icon" className="bg-white/10 p-1 rounded-xl" />
                <span>Study Top</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                An intelligent AI study platform created by Manjit Ranjan (Google Developer) for academic excellence.
              </p>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Product</div>
              <div className="space-y-2 text-xs">
                <a href="#materials" className="block hover:text-white transition-colors">Study Materials</a>
                <a href="#smart-notes" className="block hover:text-white transition-colors">Smart Notes</a>
                <a href="#diagrams" className="block hover:text-white transition-colors">Diagram Studio</a>
                <a href="#ask" className="block hover:text-white transition-colors">Source Q&amp;A</a>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Support</div>
              <div className="space-y-2 text-xs">
                <span className="block text-slate-500">Firebase Auth &amp; Firestore</span>
                <span className="block text-slate-500">Gemini RAG Engine</span>
                <span className="block text-slate-500">KaTeX Math &amp; Mermaid Diagrams</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Admin Console</div>
              <p className="text-xs text-slate-500 mb-3">
                Protected administration console for platform management and security audits.
              </p>
              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Study Top · Created by <strong className="text-slate-300">Manjit Ranjan (Google Developer)</strong></p>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Cloudflare Protected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
