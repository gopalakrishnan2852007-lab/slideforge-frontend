import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Layout, Briefcase, GraduationCap, Download, Loader2,
  Mic, Wand2, ChevronLeft, ChevronRight, RefreshCw, Presentation,
  Settings2, FileText, AlertCircle, Play, CheckCircle2, MessageSquare
} from "lucide-react";

interface Slide {
  heading: string;
  points: string[];
  speakerNotes: string;
}

interface PresentationData {
  title: string;
  slides: Slide[];
}

const API_BASE = "https://slideforge-backend.onrender.com"; // Change to localhost:5000 if running locally

// Updated template colors to match the new Backend visually
const templates = [
  { id: "modern", icon: Layout, label: "Modern", color: "bg-indigo-600" },
  { id: "business", icon: Briefcase, label: "Business", color: "bg-blue-700" },
  { id: "academic", icon: GraduationCap, label: "Academic", color: "bg-teal-700" },
] as const;

const tones = ["Professional", "Simple", "Technical", "Investor Pitch", "Storytelling"];
type TemplateID = typeof templates[number]["id"];

export default function App() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState<TemplateID>("modern");
  const [tone, setTone] = useState("Professional");
  const [data, setData] = useState<PresentationData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(6);
  const [presenterMode, setPresenterMode] = useState(false);
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-Save / Load
  useEffect(() => {
    const saved = localStorage.getItem("slideforge_autosave");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.slides) setData(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem("slideforge_autosave", JSON.stringify(data));
  }, [data]);

  // Keyboard Navigation for Presenter Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data) return;
      if (e.key === "ArrowRight") setActiveSlide(s => Math.min(data.slides.length - 1, s + 1));
      if (e.key === "ArrowLeft") setActiveSlide(s => Math.max(0, s - 1));
      if (e.key === "Escape") setPresenterMode(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data]);

  // Smart Loader
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = [
    "Structuring presentation narrative...",
    "Generating deep insights...",
    "Designing slide layouts...",
    "Applying premium typography..."
  ];

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ========================= */
  /* API CALLS                 */
  /* ========================= */
  const generateSlides = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slideCount, tone }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to generate deck.");
      setData(JSON.parse(text));
      setActiveSlide(0);
      showToast("Presentation generated successfully!", "success");
      
      setTimeout(() => {
        canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      showToast(err.message || "Generation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const improveSlide = async () => {
    if (!data) return;
    setImproving(true);
    try {
      const current = data.slides[activeSlide];
      const res = await fetch(`${API_BASE}/improve-slide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heading: current.heading, points: current.points, tone }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const result = JSON.parse(text);
      
      const updatedSlides = [...data.slides];
      updatedSlides[activeSlide] = { ...current, ...result };
      setData({ ...data, slides: updatedSlides });
      showToast("Slide improved by AI!", "success");
    } catch (err: any) {
      showToast("Failed to improve slide.", "error");
    } finally {
      setImproving(false);
    }
  };

  const regenerateSlide = async () => {
    if (!data) return;
    setImproving(true);
    try {
      const res = await fetch(`${API_BASE}/generate-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: data.slides[activeSlide].heading, slideCount: 1, tone }),
      });
      const result = JSON.parse(await res.text());
      const updatedSlides = [...data.slides];
      updatedSlides[activeSlide] = result.slides[0];
      setData({ ...data, slides: updatedSlides });
      showToast("Slide regenerated.", "success");
    } catch (err: any) {
      showToast("Failed to regenerate slide.", "error");
    } finally {
      setImproving(false);
    }
  };

  const downloadPPT = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/download-ppt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, template }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("PowerPoint downloaded!", "success");
    } catch (err: any) {
      showToast("Export failed.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleEdit = (type: 'heading' | 'point', val: string, idx?: number) => {
    if (!data) return;
    const newData = { ...data };
    if (type === 'heading') newData.slides[activeSlide].heading = val;
    if (type === 'point' && idx !== undefined) newData.slides[activeSlide].points[idx] = val;
    setData(newData);
  };

  /* ========================= */
  /* GOD-LEVEL THEME RENDERER  */
  /* ========================= */
  const getSlideDesign = (isFullscreen = false) => {
    const slide = data?.slides[activeSlide];
    if (!slide) return null;

    // Theme-specific input styles for dark vs light modes
    const darkInputStyle = "w-full bg-transparent border-2 border-transparent hover:border-white/10 focus:border-indigo-500/50 focus:bg-white/5 outline-none rounded-xl px-1 sm:px-2 py-1 transition-all resize-none leading-tight";
    const lightInputStyle = "w-full bg-transparent border-2 border-transparent hover:border-black/5 focus:border-blue-500/30 focus:bg-slate-50 outline-none rounded-xl px-1 sm:px-2 py-1 transition-all resize-none leading-tight";
    const academicInputStyle = "w-full bg-transparent border-2 border-transparent hover:border-slate-300 focus:border-teal-600/30 focus:bg-white outline-none rounded-xl px-1 sm:px-2 py-1 transition-all resize-none leading-tight";
    
    // === 1. MODERN (Tech Dark Mode) ===
    if (template === "modern") return (
      <div className={`w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden relative group bg-[#09090B] shadow-[0_0_80px_-20px_rgba(99,102,241,0.25)] ${isFullscreen ? 'h-screen max-h-screen rounded-none' : ''}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#09090B] to-[#09090B] opacity-70 pointer-events-none" />
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-2 md:h-4 bg-indigo-500" />
        
        <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 h-full flex flex-col text-white pt-8 md:pt-16">
          <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
            className={`text-lg sm:text-2xl md:text-4xl lg:text-5xl font-extrabold mb-2 md:mb-6 ${darkInputStyle} text-white tracking-tight`} />
          <div className="w-8 md:w-16 h-1 bg-indigo-500 rounded-full mb-2 md:mb-8 shadow-[0_0_15px_rgba(99,102,241,0.6)] shrink-0" />
          
          <ul className="space-y-2 md:space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 md:gap-4 text-xs sm:text-sm md:text-xl lg:text-2xl text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="mt-1 md:mt-2 text-indigo-400">✦</span>
                <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${darkInputStyle} -mt-1`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );

    // === 2. BUSINESS (Corporate Light Mode) ===
    if (template === "business") return (
      <div className={`w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden relative group bg-white shadow-2xl border border-slate-200 ${isFullscreen ? 'h-screen max-h-screen rounded-none' : ''}`}>
        {/* Top Blueprint Header */}
        <div className="absolute top-0 left-0 right-0 h-3 md:h-5 bg-blue-700" />
        {/* Bottom Gray Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-6 md:h-10 bg-slate-100 border-t border-slate-200" />
        
        <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 h-full flex flex-col font-sans pt-8 md:pt-16 pb-10 md:pb-16">
          <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
            className={`text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 ${lightInputStyle} text-blue-800`} />
          <div className="w-full h-px bg-slate-300 mb-2 md:mb-8 shrink-0" />
          
          <ul className="space-y-2 md:space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 md:gap-4 text-xs sm:text-sm md:text-xl lg:text-2xl text-slate-700 font-medium">
                <div className="mt-2 md:mt-3 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-600 rounded-sm shrink-0" />
                <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${lightInputStyle} -mt-1 focus:bg-slate-50`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );

    // === 3. ACADEMIC (Classic Cream) ===
    return (
      <div className={`w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden relative group bg-[#FDFBF7] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-200 ${isFullscreen ? 'h-screen max-h-screen rounded-none' : ''}`}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")`}} />
        
        {/* Double Top Line */}
        <div className="absolute top-0 left-0 right-0 h-4 md:h-6 bg-slate-800" />
        <div className="absolute top-4 md:top-6 left-0 right-0 h-1 md:h-1.5 bg-teal-700" />

        <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 h-full flex flex-col font-serif pt-10 md:pt-20">
          <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
            className={`text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-6 ${academicInputStyle} text-slate-900`} />
          <div className="w-16 md:w-24 h-1 bg-teal-700 mb-4 md:mb-8 shrink-0" />
          
          <ul className="space-y-2 md:space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 md:gap-4 text-xs sm:text-sm md:text-xl lg:text-2xl text-slate-600 leading-relaxed">
                <span className="mt-1 md:mt-2 text-slate-400 font-sans font-bold">•</span>
                <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${academicInputStyle} -mt-1`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 lg:overflow-hidden">
      
      {/* GLOBAL TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white
            ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRESENTER MODE OVERLAY */}
      <AnimatePresence>
        {presenterMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
            <button onClick={() => setPresenterMode(false)} className="absolute top-6 right-6 text-white/50 hover:text-white px-4 py-2 bg-white/10 rounded-xl transition-all z-50">Exit (ESC)</button>
            <div className="w-full h-full md:w-[95vw] md:max-w-[1600px] md:aspect-video flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={activeSlide} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="w-full relative">
                  {getSlideDesign(true)}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (SETTINGS) */}
      <aside className="w-full lg:w-[380px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col h-auto lg:h-screen shadow-2xl z-20 shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div><h1 className="text-xl font-extrabold tracking-tight text-slate-900">SlideForge</h1><p className="text-xs text-slate-500 font-medium">Pro Presentation AI</p></div>
        </div>

        <div className="flex-1 lg:overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Topic */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider text-[11px]"><FileText className="w-4 h-4 text-indigo-500" /> Topic</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The Future of SaaS..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none h-28 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-inner" />
          </div>

          {/* Tone & Count */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider text-[11px]"><MessageSquare className="w-4 h-4 text-indigo-500" /> Content Strategy</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer">
              {tones.map(t => <option key={t} value={t}>{t} Tone</option>)}
            </select>
            <div className="grid grid-cols-4 gap-2">
              {[5, 6, 8, 12].map((num) => (
                <button key={num} onClick={() => setSlideCount(num)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${slideCount === num ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{num}</button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider text-[11px]"><Presentation className="w-4 h-4 text-indigo-500" /> Visual Theme</label>
            <div className="space-y-2">
              {templates.map((t) => {
                const isActive = template === t.id;
                return (
                  <button key={t.id} onClick={() => setTemplate(t.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${isActive ? "bg-white border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]" : "bg-white border-slate-200 hover:border-indigo-300"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? t.color : 'bg-slate-100'}`}><t.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} /></div>
                    <span className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate Action */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-3 shrink-0">
          <button onClick={generateSlides} disabled={loading || !topic.trim()} className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5 relative overflow-hidden group">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin relative z-10" /> <span className="relative z-10">Generating Deck...</span></> : <><Wand2 className="w-5 h-5 relative z-10" /> <span className="relative z-10">Generate Deck</span></>}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        </div>
      </aside>

      {/* THUMBNAIL NAVIGATION COLUMN */}
      {data && !loading && (
        <aside className="w-[200px] bg-slate-100 border-r border-slate-200 h-screen overflow-y-auto custom-scrollbar p-4 space-y-4 hidden lg:block shrink-0">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-2">Slides</div>
          {data.slides.map((s, i) => (
            <div key={i} onClick={() => setActiveSlide(i)} className={`cursor-pointer group relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeSlide === i ? 'border-indigo-500 shadow-md ring-4 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'}`}>
              <div className="absolute inset-0 bg-white p-2 flex flex-col pointer-events-none">
                <span className="text-[9px] font-bold text-indigo-500 mb-1">0{i + 1}</span>
                <p className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-3">{s.heading}</p>
              </div>
            </div>
          ))}
        </aside>
      )}

      {/* MAIN CANVAS */}
      <main ref={canvasRef} className="w-full lg:flex-1 relative flex flex-col min-h-[500px] lg:min-h-0 lg:overflow-y-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
        <div className="flex-1 p-4 sm:p-6 lg:p-10 flex flex-col items-center justify-center relative">
          
          {loading ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-slate-400 gap-6 my-20 lg:my-0">
               <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
                 <div className="w-20 h-20 bg-white border border-slate-100 rounded-full shadow-2xl flex items-center justify-center relative z-10">
                   <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                 </div>
               </div>
               <div className="text-center">
                 <h3 className="font-bold text-slate-800 text-xl mb-1">AI is working...</h3>
                 <motion.p key={loadingStep} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-sm font-medium text-indigo-500">{loadingMessages[loadingStep]}</motion.p>
               </div>
             </motion.div>
          ) : !data ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm my-20 lg:my-0">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 border border-slate-100">
                <Presentation className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Blank Canvas</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Describe your vision on the left, select a pro template, and watch the AI instantly design your deck.</p>
            </motion.div>
          ) : (
            <div className="w-full max-w-5xl flex flex-col items-center pb-20 lg:pb-0">
              
              {/* Top Bar Actions */}
              <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 font-semibold text-xs sm:text-sm text-slate-600 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-[300px]">Editing Slide {activeSlide + 1} of {data.slides.length}</span>
                 </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setPresenterMode(true)} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-all"><Play className="w-4 h-4 fill-current" /> Present</button>
                    <button onClick={downloadPPT} disabled={downloading} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-all">{downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export</button>
                 </div>
              </div>

              {/* SLIDE PREVIEW WITH ANIMATION */}
              <AnimatePresence mode="wait">
                <motion.div key={activeSlide} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }} className="w-full relative">
                  {getSlideDesign(false)}
                </motion.div>
              </AnimatePresence>

              {/* Advanced Floating Slide Controls */}
              <div className="mt-8 bg-white backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-wrap justify-center items-center gap-2 relative z-10 w-full sm:w-auto">
                <div className="flex items-center">
                  <button onClick={() => setActiveSlide((s) => Math.max(0, s - 1))} disabled={activeSlide === 0} className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="px-2 sm:px-4 text-sm font-bold text-slate-700 w-16 sm:w-20 text-center">{activeSlide + 1} / {data.slides.length}</div>
                  <button onClick={() => setActiveSlide((s) => Math.min(data.slides.length - 1, s + 1))} disabled={activeSlide === data.slides.length - 1} className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
                
                <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
                
                {/* AI Tools */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 mt-2 sm:mt-0">
                  <button onClick={improveSlide} disabled={improving} className="px-3 sm:px-4 py-2 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition-colors group">
                    <Sparkles className={`w-4 h-4 text-amber-500 ${improving ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} /> <span className="hidden sm:inline">Improve</span>
                  </button>
                  <button onClick={regenerateSlide} disabled={improving} className="px-3 sm:px-4 py-2 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition-colors group">
                    <RefreshCw className={`w-4 h-4 text-indigo-500 ${improving ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> <span className="hidden sm:inline">Rewrite</span>
                  </button>
                </div>
              </div>

              {/* Speaker Notes */}
              {data.slides[activeSlide].speakerNotes && (
                <div className="mt-8 w-full max-w-3xl bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden text-left">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider text-[11px]"><Mic className="w-4 h-4 text-indigo-500" /> Presenter Notes</div>
                  <div className="p-6 text-slate-600 leading-relaxed text-sm">{data.slides[activeSlide].speakerNotes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.4); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.7); }
      `}} />
    </div>
  );
}