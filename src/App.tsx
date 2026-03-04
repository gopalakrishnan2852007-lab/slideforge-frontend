import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Layout, Briefcase, GraduationCap, Download, Loader2,
  Mic, Wand2, ChevronLeft, ChevronRight, RefreshCw, Presentation,
  FileText, AlertCircle, Play, Pause, CheckCircle2, MessageSquare,
  PlusCircle, BookOpen, Volume2, Copy
} from "lucide-react";

interface Slide {
  layout: "image_right" | "image_left" | "center_focus";
  heading: string;
  points: string[];
  speakerNotes: string;
  imagePrompt?: string;
}

interface PresentationData {
  title: string;
  slides: Slide[];
}

const API_BASE = "https://slideforge-backend.onrender.com"; // Set to localhost:5000 locally

const templates = [
  { id: "modern", icon: Layout, label: "Modern", color: "bg-indigo-600" },
  { id: "business", icon: Briefcase, label: "Business", color: "bg-blue-700" },
  { id: "academic", icon: GraduationCap, label: "Academic", color: "bg-teal-700" },
] as const;

type TemplateID = typeof templates[number]["id"];

export default function App() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState<TemplateID>("modern");
  const [tone, setTone] = useState("Professional");
  const [data, setData] = useState<PresentationData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [improving, setImproving] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(6);
  const [presenterMode, setPresenterMode] = useState(false);
  
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [fullScript, setFullScript] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const timerRef = useRef<any>(null);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("slideforge_autosave");
    if (saved) try { setData(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem("slideforge_autosave", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data) return;
      if (e.key === "ArrowRight") setActiveSlide(s => Math.min(data.slides.length - 1, s + 1));
      if (e.key === "ArrowLeft") setActiveSlide(s => Math.max(0, s - 1));
      if (e.key === "Escape") setPresenterMode(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    if (presenterMode) {
      setPresentationTimer(0);
      timerRef.current = setInterval(() => setPresentationTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    return () => { window.removeEventListener("keydown", handleKeyDown); clearInterval(timerRef.current); };
  }, [data, presenterMode]);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const apiCall = async (endpoint: string, payload: any, successMsg: string) => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text() || "API Error");
      showToast(successMsg, "success");
      return await res.json();
    } catch (err: any) {
      showToast(err.message || "Action failed.", "error");
      return null;
    }
  };

  const generateSlides = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const result = await apiCall("/generate-json", { topic, slideCount, tone }, "Deck Generated!");
    if (result) { setData(result); setActiveSlide(0); }
    setLoading(false);
  };

  const improveSlide = async () => {
    if (!data) return;
    setImproving(true);
    const current = data.slides[activeSlide];
    const result = await apiCall("/improve-slide", { heading: current.heading, points: current.points, tone }, "Design balanced!");
    if (result) {
      const updated = [...data.slides];
      updated[activeSlide] = { ...current, ...result };
      setData({ ...data, slides: updated });
    }
    setImproving(false);
  };

  const rewriteSlide = async () => {
    if (!data) return;
    setImproving(true);
    const current = data.slides[activeSlide];
    const result = await apiCall("/rewrite-slide", { heading: current.heading, points: current.points, tone }, "Rewritten perfectly!");
    if (result) {
      const updated = [...data.slides];
      updated[activeSlide] = { ...current, ...result };
      setData({ ...data, slides: updated });
    }
    setImproving(false);
  };

  const extendSlides = async () => {
    if (!data) return;
    setLoading(true);
    const result = await apiCall("/extend-slides", { currentSlides: data.slides, addCount: 4, tone }, "Added 4 Slides!");
    if (result?.slides) setData({ ...data, slides: [...data.slides, ...result.slides] });
    setLoading(false);
  };

  const downloadPPT = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/download-ppt`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, template }),
      });
      if (!res.ok) throw new Error("Export Failed");
      const { fileName, fileData } = await res.json();
      
      const byteCharacters = window.atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });

      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Download Complete!", "success");
    } catch (err) { showToast("Export failed.", "error"); }
    finally { setExporting(false); }
  };

  const toggleTTS = () => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); } 
    else playTTSForSlide(activeSlide);
  };

  const playTTSForSlide = (index: number) => {
    if (!data || !data.slides[index]) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(data.slides[index].speakerNotes || data.slides[index].heading);
    utterance.onend = () => {
      if (index < data.slides.length - 1 && presenterMode) {
        setActiveSlide(index + 1);
        setTimeout(() => playTTSForSlide(index + 1), 800);
      } else setIsSpeaking(false);
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleEdit = (type: 'heading' | 'point' | 'notes', val: string, idx?: number) => {
    if (!data) return;
    const newData = { ...data };
    if (type === 'heading') newData.slides[activeSlide].heading = val;
    if (type === 'notes') newData.slides[activeSlide].speakerNotes = val;
    if (type === 'point' && idx !== undefined) newData.slides[activeSlide].points[idx] = val;
    setData(newData);
  };

  // ==========================================
  // 👑 GOD-LEVEL THEME ENGINE 
  // ==========================================
  const getSlideDesign = (isFullscreen = false) => {
    const slide = data?.slides[activeSlide];
    if (!slide) return null;

    // ✅ FIXED: Bulletproof image URL generation with Seed
    const safePrompt = slide.imagePrompt || slide.heading || topic;
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=1024&height=1024&nologo=true&seed=${activeSlide}`;
    
    const layout = slide.layout || "image_right";
    const variantIndex = (activeSlide + 1) % 3; 

    const baseInputStyle = "w-full bg-transparent border-2 border-transparent outline-none transition-all resize-none leading-tight";
    
    // --- 1. MODERN THEME ---
    if (template === "modern") {
      const themes = [
        { bg: "bg-[#09090B]", text: "text-white", accent: "bg-indigo-500", glow: "shadow-indigo-500/50", points: "text-slate-300", overlay: "bg-black/80" },
        { bg: "bg-[#1E1B4B]", text: "text-white", accent: "bg-pink-500", glow: "shadow-pink-500/50", points: "text-indigo-200", overlay: "bg-[#1E1B4B]/80" },
        { bg: "bg-[#0F172A]", text: "text-white", accent: "bg-sky-400", glow: "shadow-sky-400/50", points: "text-slate-300", overlay: "bg-[#0F172A]/80" }
      ];
      const t = themes[variantIndex];

      return (
        <div className={`w-full aspect-video flex overflow-hidden relative group ${t.bg} shadow-2xl ${isFullscreen ? 'h-screen w-screen rounded-none' : 'rounded-3xl'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50 z-0" />
          <div className={`absolute top-0 left-0 right-0 h-2 ${t.accent} z-30`} />
          
          {/* ✅ FIXED: Center Focus Background Image */}
          {layout === "center_focus" && (
            <div className="absolute inset-0 z-0">
               <img src={imgUrl} alt="Background" className="w-full h-full object-cover opacity-40 blur-sm scale-105" />
               <div className={`absolute inset-0 ${t.overlay}`} />
            </div>
          )}

          {layout === "image_left" && (
            <div className="w-1/2 h-full relative border-r border-white/10 group-hover:scale-105 transition duration-700 z-10">
               <div className={`absolute inset-0 bg-gradient-to-l from-${t.bg.replace('bg-[','').replace(']','')} via-transparent z-10`} />
               <img src={imgUrl} alt="Visual" className="w-full h-full object-cover" />
            </div>
          )}

          <div className={`flex-1 p-8 md:p-16 h-full flex flex-col justify-center ${t.text} relative z-20 ${layout === "center_focus" ? 'items-center text-center' : ''}`}>
            <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
              className={`text-3xl md:text-5xl font-extrabold mb-6 ${baseInputStyle} ${layout === "center_focus" ? 'text-center' : ''}`} />
            <div className={`w-16 h-1.5 ${t.accent} rounded-full mb-8 shadow-[0_0_20px] ${t.glow}`} />
            <ul className={`space-y-5 overflow-y-auto custom-scrollbar ${layout === "center_focus" ? 'text-left max-w-3xl inline-block' : ''}`}>
              {slide.points.map((p, i) => (
                <li key={i} className={`flex items-start gap-4 text-lg md:text-2xl ${t.points}`}>
                  <span className={`${t.accent.replace('bg-','text-')} mt-1.5 opacity-80`}>✦</span>
                  <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${baseInputStyle} -mt-1`} />
                </li>
              ))}
            </ul>
          </div>

          {layout === "image_right" && (
            <div className="w-1/2 h-full relative border-l border-white/10 group-hover:scale-105 transition duration-700 z-10">
               <div className={`absolute inset-0 bg-gradient-to-r from-${t.bg.replace('bg-[','').replace(']','')} via-transparent z-10`} />
               <img src={imgUrl} alt="Visual" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      );
    }

    // --- 2. BUSINESS THEME ---
    if (template === "business") {
      const themes = [
        { bg: "bg-white", text: "text-slate-900", accent: "bg-blue-600", border: "border-slate-200", points: "text-slate-600", overlay: "bg-white/90" },
        { bg: "bg-slate-900", text: "text-white", accent: "bg-sky-400", border: "border-slate-800", points: "text-slate-300", overlay: "bg-slate-900/90" },
        { bg: "bg-slate-50", text: "text-slate-800", accent: "bg-teal-600", border: "border-slate-200", points: "text-slate-600", overlay: "bg-slate-50/90" }
      ];
      const t = themes[variantIndex];

      return (
        <div className={`w-full aspect-video flex ${t.bg} border ${t.border} shadow-xl overflow-hidden relative ${isFullscreen ? 'h-screen w-screen rounded-none' : 'rounded-3xl'}`}>
          <div className={`absolute top-0 left-0 right-0 h-3 ${t.accent} z-30`} />
          
          {/* ✅ FIXED: Center Focus Background Image */}
          {layout === "center_focus" && (
            <div className="absolute inset-0 z-0">
               <img src={imgUrl} alt="Background" className="w-full h-full object-cover opacity-30 blur-sm" />
               <div className={`absolute inset-0 ${t.overlay}`} />
            </div>
          )}

          {layout === "image_left" && (
            <div className="w-1/2 h-full p-8 flex items-center justify-center bg-black/5 z-10">
               <img src={imgUrl} alt="Visual" className="w-full h-full object-cover shadow-lg rounded-xl" />
            </div>
          )}

          <div className={`flex-1 p-8 md:p-14 h-full flex flex-col justify-center font-sans z-20 ${layout === "center_focus" ? 'items-center text-center' : ''}`}>
            <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
              className={`text-3xl md:text-4xl font-bold mb-4 ${t.text} ${baseInputStyle} ${layout === "center_focus" ? 'text-center' : ''}`} />
            <div className={`w-full h-px ${variantIndex === 1 ? 'bg-slate-700' : 'bg-slate-200'} mb-8`} />
            <ul className={`space-y-6 overflow-y-auto custom-scrollbar ${layout === "center_focus" ? 'text-left max-w-3xl' : ''}`}>
              {slide.points.map((p, i) => (
                <li key={i} className={`flex items-start gap-4 text-lg md:text-xl font-medium ${t.points}`}>
                  <div className={`mt-2.5 w-2 h-2 ${t.accent} shrink-0`} />
                  <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${baseInputStyle} -mt-1`} />
                </li>
              ))}
            </ul>
          </div>

          {layout === "image_right" && (
            <div className="w-1/2 h-full p-8 flex items-center justify-center bg-black/5 z-10">
               <img src={imgUrl} alt="Visual" className="w-full h-full object-cover shadow-lg rounded-xl" />
            </div>
          )}
        </div>
      );
    }

    // --- 3. ACADEMIC THEME ---
    const themes = [
      { bg: "bg-[#FDFBF7]", text: "text-slate-900", accent: "bg-teal-800", accentText: "text-teal-800", points: "text-slate-700", border: "border-slate-800", overlay: "bg-[#FDFBF7]/90" },
      { bg: "bg-[#450A0A]", text: "text-amber-50", accent: "bg-amber-400", accentText: "text-amber-400", points: "text-amber-100/80", border: "border-amber-400/30", overlay: "bg-[#450A0A]/90" },
      { bg: "bg-slate-800", text: "text-slate-50", accent: "bg-slate-300", accentText: "text-slate-300", points: "text-slate-300", border: "border-slate-600", overlay: "bg-slate-800/90" }
    ];
    const t = themes[variantIndex];

    return (
      <div className={`w-full aspect-video flex ${t.bg} shadow-2xl border ${t.border} overflow-hidden relative ${isFullscreen ? 'h-screen w-screen rounded-none' : 'rounded-3xl'}`}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} />
        
        <div className={`absolute top-0 left-0 right-0 h-4 ${variantIndex === 1 ? 'bg-black/40' : 'bg-slate-900'} z-30`} />
        <div className={`absolute top-4 left-0 right-0 h-1 ${t.accent} z-30`} />
        
        {/* ✅ FIXED: Center Focus Background Image */}
        {layout === "center_focus" && (
          <div className="absolute inset-0 z-0">
             <img src={imgUrl} alt="Background" className="w-full h-full object-cover opacity-20 sepia" />
             <div className={`absolute inset-0 ${t.overlay}`} />
          </div>
        )}

        {layout === "image_left" && (
          <div className="w-2/5 h-full p-10 flex items-center justify-center z-10">
             <img src={imgUrl} alt="Visual" className={`w-full h-auto max-h-full object-cover shadow-[8px_8px_0px_rgba(0,0,0,0.2)] border-2 ${t.border}`} />
          </div>
        )}

        <div className={`flex-1 p-8 md:p-16 h-full flex flex-col justify-center font-serif z-20 ${layout === "center_focus" ? 'items-center text-center' : ''}`}>
          <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
            className={`text-3xl md:text-5xl font-bold mb-6 ${t.text} ${baseInputStyle} ${layout === "center_focus" ? 'text-center' : ''}`} />
          <div className={`w-24 h-1 ${t.accent} mb-8`} />
          <ul className={`space-y-6 overflow-y-auto custom-scrollbar ${layout === "center_focus" ? 'text-left max-w-3xl' : ''}`}>
            {slide.points.map((p, i) => (
              <li key={i} className={`flex items-start gap-4 text-lg md:text-xl ${t.points} leading-relaxed`}>
                <span className={`${t.accentText} font-sans font-black mt-1`}>•</span>
                <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${baseInputStyle} -mt-1`} />
              </li>
            ))}
          </ul>
        </div>

        {layout === "image_right" && (
          <div className="w-2/5 h-full p-10 flex items-center justify-center z-10">
             <img src={imgUrl} alt="Visual" className={`w-full h-auto max-h-full object-cover shadow-[8px_8px_0px_rgba(0,0,0,0.2)] border-2 ${t.border}`} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-slate-900 lg:overflow-hidden print:bg-white print:block">
      
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white
            ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exporting && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center">
               <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
                  <Download className="w-8 h-8 text-indigo-600 animate-bounce" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Rendering Deck...</h3>
               <p className="text-sm text-slate-500 mb-6">Compiling AI images and layouts. Please do not close the window.</p>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-full animate-pulse" />
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <aside className="w-full lg:w-[400px] bg-white border-r border-slate-200 flex flex-col lg:h-screen shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-20 shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="text-white w-5 h-5" /></div>
          <h1 className="text-xl font-extrabold tracking-tight">SlideForge AI</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Topic</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The Future of AI..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-500" /> Strategy</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500">
              {tones.map(t => <option key={t} value={t}>{t} Tone</option>)}
            </select>
            <div className="grid grid-cols-4 gap-2">
              {[5, 6, 8, 12].map((num) => (
                <button key={num} onClick={() => setSlideCount(num)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${slideCount === num ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white hover:bg-slate-50"}`}>{num}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Presentation className="w-4 h-4 text-indigo-500" /> Theme</label>
            {templates.map((t) => (
              <button key={t.id} onClick={() => setTemplate(t.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${template === t.id ? "bg-white border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]" : "bg-white border-slate-200 hover:border-indigo-200"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${template === t.id ? t.color : 'bg-slate-100'}`}><t.icon className={`w-4 h-4 ${template === t.id ? 'text-white' : 'text-slate-500'}`} /></div>
                <span className={`text-sm font-bold ${template === t.id ? 'text-slate-900' : 'text-slate-600'}`}>{t.label}</span>
              </button>
            ))}
          </div>

          {data && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">God-Level Tools</label>
               <button onClick={extendSlides} disabled={loading} className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-3 text-slate-700 transition"><PlusCircle className="w-4 h-4 text-emerald-500"/> Auto-Expand Deck (+4)</button>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <button onClick={generateSlides} disabled={loading || !topic.trim()} className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Working...</> : <><Wand2 className="w-5 h-5" /> Generate Deck</>}
          </button>
        </div>
      </aside>

      <main ref={canvasRef} className="w-full flex-1 relative flex flex-col min-h-screen lg:overflow-y-auto bg-[#F8FAFC] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] print:bg-none">
        <div className="flex-1 p-4 lg:p-10 flex flex-col items-center">
          
          {loading ? (
             <div className="m-auto flex flex-col items-center gap-6 print:hidden">
               <div className="relative"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" /></div>
               <div className="text-center">
                 <h3 className="font-bold text-slate-800 text-xl mb-1">Architecting AI Presentation...</h3>
                 <p className="text-sm font-medium text-indigo-500 animate-pulse">{loadingMessages[loadingStep]}</p>
               </div>
             </div>
          ) : !data ? (
            <div className="m-auto text-center max-w-sm print:hidden">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 border border-slate-100"><Presentation className="w-10 h-10 text-indigo-400" /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Blank Canvas</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Enter a topic and let the God-Level Engine generate layouts, visuals, and content instantly.</p>
            </div>
          ) : (
            <div className="w-full max-w-[1280px] flex flex-col items-center print:block print:w-full">
              
              <div className="w-full flex justify-between items-center mb-6 print:hidden">
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 font-bold text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Slide {activeSlide + 1} / {data.slides.length}
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setPresenterMode(true)} className="px-5 py-2.5 bg-slate-900 text-white hover:bg-black rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105"><Play className="w-4 h-4 fill-current" /> Present</button>
                    <button onClick={downloadPPT} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-sm font-bold flex items-center gap-2 transition-all"><Download className="w-4 h-4"/> PPTX</button>
                 </div>
              </div>

              <div className="w-full print:hidden">
                <AnimatePresence mode="wait">
                  <motion.div key={activeSlide} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    {getSlideDesign(false)}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-8 bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-2 flex justify-center items-center gap-2 z-10 print:hidden">
                <div className="flex items-center">
                  <button onClick={() => setActiveSlide((s) => Math.max(0, s - 1))} disabled={activeSlide === 0} className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="px-4 text-sm font-bold text-slate-700 w-24 text-center">{activeSlide + 1} / {data.slides.length}</div>
                  <button onClick={() => setActiveSlide((s) => Math.min(data.slides.length - 1, s + 1))} disabled={activeSlide === data.slides.length - 1} className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="w-px h-8 bg-slate-200 mx-2" />
                <button onClick={improveSlide} disabled={improving} className="px-4 py-2 hover:bg-amber-50 text-slate-700 rounded-xl flex items-center gap-2 font-bold text-sm transition group">
                  <Sparkles className={`w-4 h-4 text-amber-500 ${improving ? 'animate-pulse' : ''}`} /> Balance Text
                </button>
                <button onClick={rewriteSlide} disabled={improving} className="px-4 py-2 hover:bg-indigo-50 text-slate-700 rounded-xl flex items-center gap-2 font-bold text-sm transition group">
                  <RefreshCw className={`w-4 h-4 text-indigo-500 ${improving ? 'animate-spin' : ''}`} /> Rewrite Slide
                </button>
              </div>

              <div className="mt-8 w-full max-w-4xl bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden text-left print:hidden mb-20">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2 text-slate-800 font-bold text-sm uppercase"><Mic className="w-4 h-4 text-indigo-500" /> Presenter Notes</div>
                <textarea value={data.slides[activeSlide].speakerNotes} onChange={(e) => handleEdit('notes', e.target.value)} rows={4} className="w-full p-6 text-slate-700 text-sm md:text-base leading-relaxed resize-none focus:outline-none focus:bg-slate-50 transition" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}