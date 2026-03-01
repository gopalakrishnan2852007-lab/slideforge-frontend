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
// PREMIUM THEME CONFIGURATION
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
  { id: "modern", icon: Layout, label: "Modern", bgHover: "hover:bg-purple-50" },
  { id: "business", icon: Briefcase, label: "Business", bgHover: "hover:bg-blue-50" },
  { id: "academic", icon: GraduationCap, label: "Academic", bgHover: "hover:bg-red-50" },
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState<keyof typeof premiumThemes>("modern");
  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // GENERATE SLIDES
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
  // DOWNLOAD PPT
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
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* LEFT PANEL */}
      <div className="w-full md:w-[420px] bg-white border-r border-slate-200 flex flex-col h-screen shadow-xl z-20">
        <div className="p-8 flex flex-col h-full overflow-y-auto space-y-8">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                SlideForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI</span>
              </h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">Premium Generator</p>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div>
              <label className="text-sm font-bold tracking-wide text-slate-700 flex items-center gap-2 mb-3">
                <AlignLeft size={16} className="text-indigo-600" /> Topic or Prompt
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., The impact of Artificial Intelligence on modern healthcare..."
                className="w-full h-36 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-inner"
              />
            </div>

            <div>
              <label className="text-sm font-bold tracking-wide text-slate-700 mb-4 block">
                Visual Aesthetic
              </label>
              <div className="grid grid-cols-3 gap-3">
                {templates.map((t) => {
                  const Icon = t.icon;
                  const isActive = template === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id as keyof typeof premiumThemes)}
                      className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? `border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-500/10 scale-105`
                          : `border-slate-200 bg-white ${t.bgHover} hover:border-slate-300 hover:scale-105`
                      }`}
                    >
                      <Icon size={24} className={`mb-3 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className={`text-xs font-bold ${isActive ? "text-indigo-900" : "text-slate-600"}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <button
              onClick={generateSlides}
              disabled={loading || !topic.trim()}
              className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Crafting...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Generate Slides
                </>
              )}
            </button>

            {data && (
              <button
                onClick={downloadPPT}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold tracking-wide transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
              >
                <Download size={20} /> Export to PowerPoint
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - PREMIUM PREVIEW */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 overflow-auto relative">
        <div className="absolute inset-0 bg-slate-100/80 z-0" />
        
        {data ? (
          <div className="w-full max-w-5xl z-10 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            
            {/* Slide Preview Container */}
            <div className={`aspect-video rounded-2xl p-10 md:p-16 ${currentTheme.wrapper}`}>
              {currentTheme.decorative}

              {/* ✨ FIX: Inner Wrapper Centers Content Perfectly ✨ */}
              <div className="flex flex-col justify-center h-full relative z-10">
                <h2 className={currentTheme.heading}>
                  {data.slides[0].heading}
                </h2>

                <ul className="space-y-4">
                  {data.slides[0].points.map((p, i) => (
                    <li key={i} className="flex items-start gap-4">
                      {currentTheme.bullet()}
                      <span className={currentTheme.text}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Speaker Notes */}
            {data.slides[0].speakerNotes && (
              <div className="bg-white/90 p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2 tracking-wide uppercase">
                  <Mic size={18} className="text-indigo-600" /> Speaker Notes
                </h3>
                <p className="text-base text-slate-600 leading-relaxed font-medium">
                  {data.slides[0].speakerNotes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="z-10 text-center space-y-4">
            <div className="w-24 h-24 bg-slate-200/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Layout className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-400 tracking-tight">Your Canvas Awaits</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto">
              Enter a topic on the left and select your preferred aesthetic to see the AI magic happen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}