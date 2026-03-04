import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Layout, Briefcase, GraduationCap, Download, Loader2,
  Mic, Wand2, ChevronLeft, ChevronRight, RefreshCw, Presentation,
  FileText, AlertCircle, Play, Pause, CheckCircle2, MessageSquare,
  PlusCircle, BookOpen, Volume2, Copy
} from "lucide-react";

interface Slide {
  heading: string;
  points: string[];
  speakerNotes: string;
  imagePrompt?: string;
  icon?: string;
}

interface PresentationData {
  title: string;
  slides: Slide[];
}

const API_BASE = "https://slideforge-backend.onrender.com"; // Set to localhost:5000 for local dev

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
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(6);
  const [presenterMode, setPresenterMode] = useState(false);
  
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [fullScript, setFullScript] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const timerRef = useRef<any>(null);

  const [loadingStep, setLoadingStep] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-Save
  useEffect(() => {
    const saved = localStorage.getItem("slideforge_autosave");
    if (saved) try { setData(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem("slideforge_autosave", JSON.stringify(data));
  }, [data]);

  // Presenter Timer & Keyboard
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(timerRef.current);
    };
  }, [data, presenterMode]);

  // Loader Text
  useEffect(() => {
    let interval: any;
    if (loading) interval = setInterval(() => setLoadingStep((p) => (p + 1) % 4), 2500);
    else setLoadingStep(0);
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = ["Structuring narrative...", "Generating insights...", "Creating AI visual prompts...", "Designing layouts..."];

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* ========================= */
  /* API CALLS                 */
  /* ========================= */
  
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
    const result = await apiCall("/generate-json", { topic, slideCount, tone }, "Presentation generated!");
    if (result) { setData(result); setActiveSlide(0); }
    setLoading(false);
  };

  const improveSlide = async () => {
    if (!data) return;
    setImproving(true);
    const current = data.slides[activeSlide];
    const result = await apiCall("/improve-slide", { heading: current.heading, points: current.points, tone }, "Slide design balanced!");
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
    const result = await apiCall("/rewrite-slide", { heading: current.heading, points: current.points, tone }, "Slide perfectly rewritten!");
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
    const result = await apiCall("/extend-slides", { currentSlides: data.slides, addCount: 4, tone }, "Added 4 new slides!");
    if (result?.slides) setData({ ...data, slides: [...data.slides, ...result.slides] });
    setLoading(false);
  };

  const addSummarySlide = async () => {
    if (!data) return;
    setImproving(true);
    const result = await apiCall("/generate-summary", { slides: data.slides }, "Executive summary added!");
    if (result?.slide) setData({ ...data, slides: [...data.slides, result.slide] });
    setImproving(false);
  };

  const generateSpeechScript = async () => {
    if (!data) return;
    setLoading(true);
    const result = await apiCall("/generate-script", { slides: data.slides }, "Full script generated!");
    if (result?.script) { setFullScript(result.script); setShowScriptModal(true); }
    setLoading(false);
  };

  /* ========================= */
  /* EXPORTS & MULTI-FORMAT    */
  /* ========================= */
  
  const downloadPPT = async () => {
    if (!data) return;
    showToast("Compiling PPTX... This takes a moment.", "success");
    try {
      const res = await fetch(`${API_BASE}/download-ppt`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ data, template }),
      });
      
      // Prevent downloading error messages as PPTX
      if (!res.ok) throw new Error("Server failed to generate file");
      
      const { fileName, fileData } = await res.json();
      
      // Safely convert base64 back to a binary Blob
      const byteCharacters = window.atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });

      // Trigger actual download
      const a = document.createElement("a");
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showToast("PowerPoint downloaded successfully!", "success");
    } catch (err) { 
      console.error(err);
      showToast("PPT Export failed.", "error"); 
    }
  };

  const downloadMarkdown = () => {
    if (!data) return;
    let md = `# ${data.title}\n\n`;
    data.slides.forEach((s, i) => {
      md += `## ${i + 1}. ${s.heading}\n\n`;
      s.points.forEach(p => md += `- ${p}\n`);
      if (s.speakerNotes) md += `\n**Speaker Notes:** ${s.speakerNotes}\n`;
      md += `\n---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = `${data.title}.md`;
    a.click();
    showToast("Markdown downloaded!", "success");
  };

  const printToPDF = () => {
    showToast("Use browser dialog to Save as PDF.", "success");
    window.print();
  };

  /* ========================= */
  /* TEXT-TO-SPEECH (TTS)      */
  /* ========================= */
  
  const toggleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      playTTSForSlide(activeSlide);
    }
  };

  const playTTSForSlide = (index: number) => {
    if (!data || !data.slides[index]) return;
    window.speechSynthesis.cancel();
    
    const text = data.slides[index].speakerNotes || data.slides[index].heading;
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => {
      if (index < data.slides.length - 1 && presenterMode) {
        setActiveSlide(index + 1);
        setTimeout(() => playTTSForSlide(index + 1), 800);
      } else {
        setIsSpeaking(false);
      }
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

  /* ========================= */
  /* GOD-LEVEL THEME RENDERER  */
  /* ========================= */
  
  const getSlideDesign = (isFullscreen = false) => {
    const slide = data?.slides[activeSlide];
    if (!slide) return null;

    const imgUrl = slide.imagePrompt ? `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.imagePrompt)}?width=1024&height=1024&nologo=true` : null;

    const baseInputStyle = "w-full bg-transparent border-2 border-transparent outline-none transition-all resize-none leading-tight";
    
    // === 1. MODERN ===
    if (template === "modern") return (
      <div className={`w-full aspect-video flex overflow-hidden relative group bg-[#09090B] shadow-2xl ${isFullscreen ? 'h-screen w-screen max-w-none max-h-none rounded-none' : 'rounded-2xl md:rounded-3xl'}`}>
        <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-500 z-20" />
        <div className={`flex-1 p-6 md:p-16 h-full flex flex-col justify-center text-white relative z-10 ${imgUrl ? 'w-3/5' : 'w-full'}`}>
          <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
            className={`text-2xl md:text-5xl font-extrabold mb-4 ${baseInputStyle} focus:border-indigo-500/50 hover:border-white/10 rounded-xl px-2`} />
          <div className="w-16 h-1 bg-indigo-500 rounded-full mb-8 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
          <ul className="space-y-4 overflow-y-auto custom-scrollbar">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-4 text-sm md:text-xl text-slate-300">
                <span className="text-indigo-400 mt-1">✦</span>
                <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${baseInputStyle} focus:bg-white/5 focus:border-indigo-500/50 hover:border-white/10 rounded-xl px-2 -mt-1`} />
              </li>
            ))}
          </ul>
        </div>
        {imgUrl && (
          <div className="w-2/5 h-full relative border-l border-white/10 group">
             <div className="absolute inset-0 bg-gradient-to-r from-[#09090B] via-transparent to-transparent z-10" />
             <img src={imgUrl} alt="Slide Visual" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          </div>
        )}
      </div>
    );

    // === 2. BUSINESS ===
    if (template === "business") return (
      <div className={`w-full aspect-video flex bg-white border border-slate-200 shadow-xl overflow-hidden relative ${isFullscreen ? 'h-screen w-screen max-w-none max-h-none rounded-none' : 'rounded-2xl md:rounded-3xl'}`}>
        <div className="absolute top-0 left-0 right-0 h-3 bg-blue-700 z-20" />
        <div className={`flex-1 p-6 md:p-14 h-full flex flex-col justify-center font-sans ${imgUrl ? 'w-1/2' : 'w-full'}`}>
          <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
            className={`text-2xl md:text-4xl font-bold mb-4 text-blue-900 ${baseInputStyle} focus:bg-slate-50 focus:border-blue-200 hover:border-slate-200 rounded-xl px-2`} />
          <div className="w-full h-px bg-slate-200 mb-6" />
          <ul className="space-y-4 overflow-y-auto custom-scrollbar">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm md:text-lg text-slate-700 font-medium">
                <div className="mt-2 w-2 h-2 bg-blue-600 shrink-0" />
                <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${baseInputStyle} focus:bg-slate-50 focus:border-blue-200 hover:border-slate-200 rounded-xl px-2 -mt-1`} />
              </li>
            ))}
          </ul>
        </div>
        {imgUrl && (
          <div className="w-1/2 h-full bg-slate-50 p-6 md:p-10 flex items-center justify-center">
             <img src={imgUrl} alt="Visual" className="w-full h-full object-cover shadow-md border border-slate-200" />
          </div>
        )}
      </div>
    );

    // === 3. ACADEMIC ===
    return (
      <div className={`w-full aspect-video flex bg-[#FDFBF7] shadow-lg border border-slate-200 overflow-hidden relative ${isFullscreen ? 'h-screen w-screen max-w-none max-h-none rounded-none' : 'rounded-2xl md:rounded-3xl'}`}>
        <div className="absolute top-0 left-0 right-0 h-4 bg-slate-800 z-20" />
        <div className="absolute top-4 left-0 right-0 h-1 bg-teal-700 z-20" />
        <div className={`flex-1 p-6 md:p-16 h-full flex flex-col justify-center font-serif ${imgUrl ? 'w-3/5' : 'w-full'}`}>
          <input value={slide.heading} onChange={(e) => handleEdit('heading', e.target.value)}
            className={`text-2xl md:text-4xl font-bold mb-6 text-slate-900 ${baseInputStyle} focus:bg-white focus:border-teal-200 hover:border-slate-200 rounded-xl px-2`} />
          <div className="w-24 h-1 bg-teal-700 mb-6" />
          <ul className="space-y-4 overflow-y-auto custom-scrollbar">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm md:text-lg text-slate-700 leading-relaxed">
                <span className="text-slate-400 font-sans font-bold mt-1">•</span>
                <textarea value={p} onChange={(e) => handleEdit('point', e.target.value, i)} rows={2} className={`${baseInputStyle} focus:bg-white focus:border-teal-200 hover:border-slate-200 rounded-xl px-2 -mt-1`} />
              </li>
            ))}
          </ul>
        </div>
        {imgUrl && (
          <div className="w-2/5 h-full p-8 flex items-center justify-center">
             <img src={imgUrl} alt="Visual" className="w-full h-auto max-h-full object-cover rounded-lg shadow-[5px_5px_0px_#0F766E] border-2 border-slate-800" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 lg:overflow-hidden print:bg-white print:block">
      
      {/* TOAST NOTIFICATION */}
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

      {/* SCRIPT MODAL */}
      <AnimatePresence>
        {showScriptModal && (
          <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="text-indigo-500"/> Full Presentation Script</h2>
                 <button onClick={() => setShowScriptModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm">Close</button>
              </div>
              <div className="space-y-6 text-slate-700 leading-relaxed">
                {fullScript.map((p, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 block">Slide {i + 1}</span>
                    <p>{p}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRESENTER MODE OVERLAY */}
      <AnimatePresence>
        {presenterMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black flex flex-col print:hidden">
            {/* Presenter Top Bar */}
            <div className="w-full h-16 bg-black/50 px-6 flex items-center justify-between text-white/70 absolute top-0 z-50">
               <div className="font-bold tracking-widest text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> LIVE • {formatTime(presentationTimer)}</div>
               <button onClick={() => setPresenterMode(false)} className="hover:text-white px-4 py-2 bg-white/10 rounded-xl transition-all font-bold text-sm">Exit (ESC)</button>
            </div>
            
            <div className="flex-1 w-full h-full flex flex-col justify-center bg-black">
              <AnimatePresence mode="wait">
                <motion.div key={activeSlide} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full">
                  {getSlideDesign(true)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Presenter Bottom Bar */}
            <div className="h-auto min-h-[100px] bg-slate-900 w-full p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10 relative z-50">
               <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl">
                 <button onClick={() => setActiveSlide((s) => Math.max(0, s - 1))} className="p-3 bg-white/5 hover:bg-white/20 rounded-xl text-white transition"><ChevronLeft /></button>
                 <span className="text-white font-bold px-2">{activeSlide + 1} / {data?.slides.length}</span>
                 <button onClick={() => setActiveSlide((s) => Math.min((data?.slides.length || 1) - 1, s + 1))} className="p-3 bg-white/5 hover:bg-white/20 rounded-xl text-white transition"><ChevronRight /></button>
               </div>
               
               <button onClick={toggleTTS} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isSpeaking ? 'bg-red-500 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}>
                 {isSpeaking ? <Pause className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>} {isSpeaking ? "Pause Narration" : "AI Voice Play"}
               </button>

               <div className="flex-1 max-w-2xl bg-black/40 p-4 rounded-2xl text-white/80 text-sm overflow-y-auto max-h-[120px] custom-scrollbar">
                  <span className="text-xs text-indigo-400 font-bold block mb-1">NOTES:</span>
                  {data?.slides[activeSlide]?.speakerNotes || "No notes for this slide."}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR (Hidden in Print) */}
      <aside className="w-full lg:w-[380px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col lg:h-screen shadow-2xl z-20 shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="text-white w-5 h-5" /></div>
          <div><h1 className="text-xl font-extrabold tracking-tight">SlideForge AI</h1></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Topic</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The Future of SaaS..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-500" /> Strategy</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500">
              {tones.map(t => <option key={t} value={t}>{t} Tone</option>)}
            </select>
            <div className="grid grid-cols-4 gap-2">
              {[5, 6, 8, 12].map((num) => (
                <button key={num} onClick={() => setSlideCount(num)} className={`p-2 rounded-lg border text-xs font-bold ${slideCount === num ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white hover:bg-slate-50"}`}>{num}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Presentation className="w-4 h-4 text-indigo-500" /> Theme</label>
            {templates.map((t) => (
              <button key={t.id} onClick={() => setTemplate(t.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${template === t.id ? "bg-white border-indigo-500 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-300"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${template === t.id ? t.color : 'bg-slate-100'}`}><t.icon className={`w-4 h-4 ${template === t.id ? 'text-white' : 'text-slate-500'}`} /></div>
                <span className={`text-sm font-bold ${template === t.id ? 'text-slate-900' : 'text-slate-600'}`}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Advanced Actions */}
          {data && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Advanced Enhancements</label>
               <button onClick={extendSlides} disabled={loading} className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-3 text-slate-700 transition"><PlusCircle className="w-4 h-4 text-emerald-500"/> Add 4 More Slides</button>
               <button onClick={addSummarySlide} disabled={improving} className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-3 text-slate-700 transition"><BookOpen className="w-4 h-4 text-blue-500"/> Generate Executive Summary</button>
               <button onClick={generateSpeechScript} disabled={loading} className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-3 text-slate-700 transition"><Mic className="w-4 h-4 text-purple-500"/> Generate Full Speech Script</button>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <button onClick={generateSlides} disabled={loading || !topic.trim()} className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Wand2 className="w-5 h-5" /> Generate Deck</>}
          </button>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main ref={canvasRef} className="w-full flex-1 relative flex flex-col min-h-screen lg:overflow-y-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] print:bg-none print:min-h-0">
        <div className="flex-1 p-4 lg:p-10 flex flex-col items-center print:p-0">
          
          {loading ? (
             <div className="m-auto flex flex-col items-center gap-6 print:hidden">
               <div className="relative"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" /></div>
               <div className="text-center">
                 <h3 className="font-bold text-slate-800 text-xl mb-1">AI is working...</h3>
                 <p className="text-sm font-medium text-indigo-500 animate-pulse">{loadingMessages[loadingStep]}</p>
               </div>
             </div>
          ) : !data ? (
            <div className="m-auto text-center max-w-sm print:hidden">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform -rotate-6"><Presentation className="w-10 h-10 text-indigo-400" /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Blank Canvas</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Describe your vision on the left, pick a template, and generate an AI presentation.</p>
            </div>
          ) : (
            <div className="w-full max-w-[1200px] flex flex-col items-center print:block print:w-full print:max-w-none">
              
              {/* Toolbar */}
              <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 print:hidden">
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 font-bold text-xs sm:text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Slide {activeSlide + 1} / {data.slides.length}
                 </div>
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={() => setPresenterMode(true)} className="px-4 py-2 bg-slate-900 text-white hover:bg-black rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-all"><Play className="w-4 h-4 fill-current" /> Present</button>
                    <button onClick={downloadPPT} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-sm font-bold flex items-center gap-2"><Download className="w-4 h-4"/> PPTX</button>
                    <button onClick={downloadMarkdown} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-sm font-bold flex items-center gap-2"><Copy className="w-4 h-4"/> Markdown</button>
                    <button onClick={printToPDF} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-sm font-bold flex items-center gap-2"><FileText className="w-4 h-4"/> PDF</button>
                 </div>
              </div>

              {/* SLIDE RENDERER */}
              <div className="w-full print:hidden">
                <AnimatePresence mode="wait">
                  <motion.div key={activeSlide} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {getSlideDesign(false)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* PDF Print Output Block */}
              <div className="hidden print:block w-full">
                 {data.slides.map((s, idx) => (
                   <div key={idx} className="w-[100vw] h-[100vh] flex items-center justify-center page-break-after-always p-10">
                      {/* Using the standard modern render purely for PDF print uniformity */}
                      <div className="w-full aspect-video border-2 border-black flex overflow-hidden">
                        <div className="p-10 flex-1 flex flex-col justify-center">
                           <h1 className="text-5xl font-bold mb-6">{s.heading}</h1>
                           <ul className="space-y-4">{s.points.map((p,i) => <li key={i} className="text-2xl">• {p}</li>)}</ul>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Controls */}
              <div className="mt-8 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-wrap justify-center items-center gap-2 z-10 print:hidden">
                <div className="flex items-center">
                  <button onClick={() => setActiveSlide((s) => Math.max(0, s - 1))} disabled={activeSlide === 0} className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="px-4 text-sm font-bold text-slate-700 w-24 text-center">{activeSlide + 1} / {data.slides.length}</div>
                  <button onClick={() => setActiveSlide((s) => Math.min(data.slides.length - 1, s + 1))} disabled={activeSlide === data.slides.length - 1} className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
                </div>
                
                <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
                
                <div className="flex items-center gap-2">
                  <button onClick={improveSlide} disabled={improving} className="px-4 py-2 hover:bg-amber-50 text-slate-700 rounded-xl flex items-center gap-2 font-bold text-sm transition group">
                    <Sparkles className={`w-4 h-4 text-amber-500 ${improving ? 'animate-pulse' : ''}`} /> Balance Design
                  </button>
                  <button onClick={rewriteSlide} disabled={improving} className="px-4 py-2 hover:bg-indigo-50 text-slate-700 rounded-xl flex items-center gap-2 font-bold text-sm transition group">
                    <RefreshCw className={`w-4 h-4 text-indigo-500 ${improving ? 'animate-spin' : ''}`} /> Rewrite Clearer
                  </button>
                </div>
              </div>

              {/* Editable Presenter Notes */}
              {data && (
                <div className="mt-8 w-full max-w-3xl bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden text-left print:hidden mb-20">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2 text-slate-800 font-bold text-sm uppercase"><Mic className="w-4 h-4 text-indigo-500" /> Editable Speaker Script</div>
                  <textarea value={data.slides[activeSlide].speakerNotes} onChange={(e) => handleEdit('notes', e.target.value)} rows={4} className="w-full p-6 text-slate-700 text-sm leading-relaxed resize-none focus:outline-none focus:bg-slate-50 transition" />
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
        @media print { @page { size: landscape; margin: 0; } }
      `}} />
    </div>
  );
}