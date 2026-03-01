import React, { useState } from "react";
import {
  Sparkles,
  Layout,
  Briefcase,
  GraduationCap,
  Download,
  Loader2,
  Mic,
  AlignLeft,
  Wand2,
  ArrowRight
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

/* ✅ LIVE RENDER BACKEND */
const API_BASE = "https://slideforge-backend.onrender.com";

// ===========================
// PREMIUM THEME CONFIGURATION (UNCHANGED)
// ===========================
const premiumThemes = {
  modern: {
    wrapper: "bg-[#09090b] shadow-[0_0_100px_rgba(139,92,246,0.15)] ring-1 ring-white/10 relative overflow-hidden",
    heading: "text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 mb-4",
    text: "text-base md:text-lg lg:text-xl text-slate-300 font-medium",
    bullet: () => <Sparkles className="w-5 h-5 mt-1 text-pink-400 flex-shrink-0" />,
    decorative: (
      <>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-8 right-10 text-slate-800/50 font-black text-6xl z-0 tracking-tighter">01</div>
      </>
    ),
  },
  business: {
    wrapper: "bg-gradient-to-br from-[#0B101E] to-[#111827] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden",
    heading: "text-3xl md:text-4xl lg:text-5xl font-light tracking-wide text-white mb-4 pb-4 border-b border-slate-700/50",
    text: "text-base md:text-lg lg:text-xl text-slate-300 font-light leading-relaxed",
    bullet: () => <div className="w-6 h-[2px] mt-3.5 bg-blue-500 flex-shrink-0" />,
    decorative: (
      <>
        <div className="absolute left-0 top-0 w-2 h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
        <div className="absolute bottom-8 right-10 text-slate-700 font-mono text-xl z-0 tracking-widest border border-slate-700/50 px-3 py-1 rounded">SLIDE / 1</div>
      </>
    ),
  },
  academic: {
    wrapper: "bg-[#FDFBF7] shadow-[0_20px_60px_rgba(0,0,0,0.08)] ring-1 ring-[#E5E0D8] relative overflow-hidden",
    heading: "text-3xl md:text-4xl lg:text-5xl font-serif text-[#1A2E44] mb-4 pb-4 border-b-2 border-[#8B1E0F]",
    text: "text-base md:text-lg lg:text-xl text-slate-800 font-serif leading-relaxed",
    bullet: () => <div className="w-2.5 h-2.5 mt-2.5 rotate-45 bg-[#8B1E0F] flex-shrink-0" />,
    decorative: (
      <>
        <div className="absolute top-0 left-0 w-full h-3 bg-[#1A2E44]" />
        <div className="absolute top-3 left-0 w-full h-[1px] bg-[#8B1E0F]" />
        <div className="absolute top-12 right-12 text-[#1A2E44]/10 font-serif italic text-7xl z-0">I</div>
      </>
    ),
  },
};

const templates = [
  { id: "modern", icon: Layout, label: "Modern", bgHover: "hover:bg-purple-50", ring: "ring-purple-500" },
  { id: "business", icon: Briefcase, label: "Business", bgHover: "hover:bg-blue-50", ring: "ring-blue-500" },
  { id: "academic", icon: GraduationCap, label: "Academic", bgHover: "hover:bg-red-50", ring: "ring-red-500" },
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState<keyof typeof premiumThemes>("modern");
  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // GENERATE SLIDES (UNCHANGED)
  // ===========================
  const generateSlides = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${API_BASE}/generate-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Backend error");

      const result = JSON.parse(text);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // DOWNLOAD PPT (UNCHANGED)
  // ===========================
  const downloadPPT = async () => {
    if (!data) return;

    try {
      const res = await fetch(`${API_BASE}/download-ppt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, template }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate PPT");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || "Download failed.");
    }
  };

  const currentTheme = premiumThemes[template];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* 🔮 BACKGROUND MESH GRADIENT (GOD LEVEL UI) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 blur-[120px]" />
      </div>

      {/* ========================================== */}
      {/* LEFT PANEL: COMMAND CENTER                 */}
      {/* ========================================== */}
      <div className="w-full md:w-[460px] bg-white/80 backdrop-blur-3xl border-r border-slate-200/50 flex flex-col h-screen shadow-[20px_0_60px_-20px_rgba(0,0,0,0.05)] z-20 relative">
        <div className="p-8 md:p-10 flex flex-col h-full overflow-y-auto space-y-10 custom-scrollbar">
          
          {/* LOGO AREA */}
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center shadow-lg shadow-indigo-900/20 group-hover:scale-105 transition-transform duration-500 ease-out relative">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur animate-pulse" />
              <Sparkles className="text-white w-7 h-7 relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
                SlideForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">AI</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                Executive Generator
              </p>
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="space-y-10 flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                  <AlignLeft size={14} className="text-indigo-500" /> Presentation Topic
                </label>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-15 transition duration-500" />
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Describe your presentation topic in detail. E.g., The future of AI in autonomous healthcare and robotics..."
                  className="relative w-full h-40 p-5 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/80 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] text-slate-700 font-medium text-base leading-relaxed placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block">
                Visual Aesthetic
              </label>
              <div className="grid grid-cols-3 gap-4">
                {templates.map((t) => {
                  const Icon = t.icon;
                  const isActive = template === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id as keyof typeof premiumThemes)}
                      className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ease-out overflow-hidden group ${
                        isActive
                          ? `border-indigo-500 bg-white shadow-lg shadow-indigo-500/15 scale-[1.02] ring-1 ring-indigo-500/50`
                          : `border-slate-200/80 bg-slate-50/50 ${t.bgHover} hover:border-slate-300 hover:scale-[1.02]`
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                      )}
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`mb-3 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? "text-indigo-950" : "text-slate-500"}`}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 p-4 rounded-2xl text-sm font-medium flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                <span className="text-lg">⚠️</span>
                <p className="leading-relaxed pt-0.5">{error}</p>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="space-y-4 pt-6 border-t border-slate-200/50">
            <button
              onClick={generateSlides}
              disabled={loading || !topic.trim()}
              className="group relative w-full bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-center gap-3 font-bold tracking-wide transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine" />
              
              <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin text-indigo-400" />
                    Synthesizing Data...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
                    Generate Presentation
                  </>
                )}
              </span>
            </button>

            {data && (
              <button
                onClick={downloadPPT}
                className="w-full bg-white border border-slate-200 text-slate-900 p-5 rounded-2xl flex items-center justify-center gap-3 font-bold tracking-wide transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.98]"
              >
                <Download size={20} className="text-slate-400" /> Export PowerPoint (.pptx)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* RIGHT PANEL: DESIGN CANVAS (PREVIEW)       */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 overflow-y-auto relative z-10">
        
        {/* Architectural Dot Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.4]" 
          style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />
        
        {data ? (
          <div className="w-full max-w-5xl z-10 flex flex-col gap-8 animate-in fade-in zoom-in-[0.98] duration-700 ease-out">
            
            {/* Status Pill */}
            <div className="self-center bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-sm rounded-full px-5 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">Preview Generated • 1 of 6 Slides</span>
            </div>

            {/* Premium Slide Container */}
            <div className="relative group">
              {/* Massive ambient glow behind the slide */}
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition duration-1000" />
              
              <div className={`aspect-video rounded-3xl p-10 md:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 transition-transform duration-500 ease-out group-hover:scale-[1.01] ${currentTheme.wrapper}`}>
                {currentTheme.decorative}

                <div className="flex flex-col justify-center h-full relative z-10">
                  <h2 className={currentTheme.heading}>
                    {data.slides[0].heading}
                  </h2>

                  <ul className="space-y-5 mt-2">
                    {data.slides[0].points.map((p, i) => (
                      <li key={i} className="flex items-start gap-4">
                        {currentTheme.bullet()}
                        <span className={currentTheme.text}>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Premium Speaker Notes Teleprompter */}
            {data.slides[0].speakerNotes && (
              <div className="mx-auto w-full max-w-4xl bg-white/70 backdrop-blur-2xl p-8 rounded-3xl border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                <h3 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-2 tracking-[0.2em] uppercase">
                  <Mic size={16} className="text-indigo-500" /> Teleprompter Notes
                </h3>
                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                  {data.slides[0].speakerNotes}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ========================================== */
          /* EMPTY STATE (DROP ZONE AESTHETIC)          */
          /* ========================================== */
          <div className="z-10 w-full max-w-2xl text-center space-y-8 animate-in fade-in duration-1000">
            <div className="relative w-40 h-40 mx-auto group">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-700" />
              <div className="absolute inset-0 border-2 border-dashed border-slate-300 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 bg-white shadow-xl shadow-slate-200/50 rounded-full flex items-center justify-center">
                <Layout className="w-12 h-12 text-indigo-500" strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                Design the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Impossible.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                Describe your vision on the left panel. Our AI engine will engineer a stunning, investor-ready presentation in seconds.
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm font-bold text-slate-400 uppercase tracking-widest mt-8">
              <span className="flex items-center gap-2"><ArrowRight size={16} className="text-indigo-400" /> Input Topic</span>
              <span className="flex items-center gap-2"><ArrowRight size={16} className="text-indigo-400" /> Select Aesthetic</span>
              <span className="flex items-center gap-2"><Sparkles size={16} className="text-indigo-400" /> Generate</span>
            </div>
          </div>
        )}
      </div>

      {/* Shine Animation Keyframes inside global tailwind config (simulated here via custom class) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine {
          100% { left: 125%; }
        }
        .animate-shine {
          animation: shine 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}