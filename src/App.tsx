import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Presentation,
  Settings2,
  FileText,
  AlertCircle
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

const API_BASE = "https://slideforge-backend.onrender.com";

const templates = [
  { id: "modern", icon: Layout, label: "Modern", color: "bg-blue-500" },
  { id: "business", icon: Briefcase, label: "Business", color: "bg-slate-800" },
  { id: "academic", icon: GraduationCap, label: "Academic", color: "bg-emerald-600" },
] as const;

type TemplateID = typeof templates[number]["id"];

export default function App() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState<TemplateID>("modern");
  const [data, setData] = useState<PresentationData | null>(null);
  
  // States
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(6);

  /* ========================= */
  /* API CALLS                 */
  /* ========================= */
  const generateSlides = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/generate-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slideCount }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to generate presentation.");

      const result = JSON.parse(text);
      setData(result);
      setActiveSlide(0);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateSlide = async () => {
    if (!data) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/generate-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: data.slides[activeSlide].heading,
          slideCount: 1,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const result = JSON.parse(text);
      const updatedSlides = [...data.slides];
      updatedSlides[activeSlide] = result.slides[0];

      setData({ ...data, slides: updatedSlides });
    } catch (err: any) {
      setError("Failed to regenerate slide. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPPT = async () => {
    if (!data) return;
    try {
      setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  };

  /* ========================= */
  /* LIVE EDITING HANDLERS     */
  /* ========================= */
  const handleEditHeading = (newHeading: string) => {
    if (!data) return;
    const newData = { ...data };
    newData.slides[activeSlide].heading = newHeading;
    setData(newData);
  };

  const handleEditPoint = (index: number, newPoint: string) => {
    if (!data) return;
    const newData = { ...data };
    newData.slides[activeSlide].points[index] = newPoint;
    setData(newData);
  };

  /* ========================= */
  /* RENDER HELPERS            */
  /* ========================= */
  // Dynamic classes for live preview based on selected theme
  const getThemeClasses = () => {
    switch (template) {
      case "business":
        return "bg-slate-900 text-white font-serif";
      case "academic":
        return "bg-[#f4f1ea] text-slate-900 font-serif border-8 border-double border-slate-300";
      case "modern":
      default:
        return "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white font-sans";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      
      {/* ============================== */}
      {/* LEFT SIDEBAR (CONTROLS)        */}
      {/* ============================== */}
      <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col h-screen shadow-xl z-20 relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              SlideForge
            </h1>
            <p className="text-xs text-slate-500 font-medium">AI Presentation Builder</p>
          </div>
        </div>

        {/* Scrollable Settings */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Topic Input */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText className="w-4 h-4 text-indigo-500" />
              Presentation Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The Future of Artificial Intelligence in Healthcare..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none h-32 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-inner"
            />
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              Configuration
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              {[5, 6, 8, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => setSlideCount(num)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    slideCount === num 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {num} Slides
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Presentation className="w-4 h-4 text-indigo-500" />
              Design Theme
            </label>
            <div className="space-y-3">
              {templates.map((t) => {
                const Icon = t.icon;
                const isActive = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isActive 
                        ? "bg-white border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]" 
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? t.color : 'bg-slate-100'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <span className={`font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {t.label}
                    </span>
                    {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm mb-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={generateSlides}
            disabled={loading || !topic.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Magic...</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate Presentation</>
            )}
          </button>

          {data && (
            <button
              onClick={downloadPPT}
              disabled={downloading}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-700 p-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              {downloading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-5 h-5" /> Export to PowerPoint</>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* ============================== */}
      {/* RIGHT CANVAS (PREVIEW)         */}
      {/* ============================== */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
        
        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center justify-center relative">
          
          {loading && !data ? (
            <div className="flex flex-col items-center text-slate-400 gap-4 animate-pulse">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-indigo-600 animate-bounce" />
              </div>
              <p className="font-medium text-lg text-slate-600">Crafting your presentation...</p>
            </div>
          ) : !data ? (
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                <Presentation className="w-12 h-12 text-indigo-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">No slides yet</h2>
              <p className="text-slate-500">Enter a topic on the left and hit generate to watch the AI build your deck.</p>
            </div>
          ) : (
            <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              
              {/* Slide Counter Indicator */}
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 mb-6 font-semibold text-sm text-slate-600 flex items-center gap-2">
                <span>Slide {activeSlide + 1} of {data.slides.length}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-indigo-600 truncate max-w-[200px]">{data.title}</span>
              </div>

              {/* SLIDE PREVIEW BOX (16:9) */}
              <div className={`w-full aspect-video rounded-3xl shadow-2xl p-12 flex flex-col relative group transition-all duration-700 ${getThemeClasses()}`}>
                
                {/* Editable Heading */}
                <input
                  value={data.slides[activeSlide].heading}
                  onChange={(e) => handleEditHeading(e.target.value)}
                  className="text-4xl lg:text-5xl font-bold mb-10 bg-transparent border-2 border-transparent hover:border-white/20 focus:border-white/50 focus:bg-white/5 outline-none rounded-xl px-2 py-1 -ml-2 transition-all"
                />

                {/* Editable Bullet Points */}
                <ul className="space-y-4 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  {data.slides[activeSlide].points.map((p, i) => (
                    <li key={i} className="flex items-start gap-4 text-xl lg:text-2xl opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="mt-2 h-2 w-2 rounded-full bg-current shrink-0" />
                      <textarea
                        value={p}
                        onChange={(e) => handleEditPoint(i, e.target.value)}
                        className="w-full bg-transparent border-2 border-transparent hover:border-white/20 focus:border-white/50 focus:bg-white/5 outline-none rounded-xl px-2 py-1 -mt-1 -ml-2 resize-none transition-all leading-tight"
                        rows={2}
                      />
                    </li>
                  ))}
                </ul>

                {/* Theme Watermark (Purely visual) */}
                <div className="absolute bottom-6 right-8 opacity-20 flex items-center gap-2 font-bold tracking-widest uppercase text-sm">
                  <Sparkles className="w-4 h-4" /> SlideForge
                </div>
              </div>

              {/* Floating Slide Controls */}
              <div className="mt-8 bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-2 flex items-center gap-2">
                <button
                  onClick={() => setActiveSlide((s) => Math.max(0, s - 1))}
                  disabled={activeSlide === 0}
                  className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="px-4 text-sm font-bold text-slate-700">
                  {activeSlide + 1} / {data.slides.length}
                </div>

                <button
                  onClick={() => setActiveSlide((s) => Math.min(data.slides.length - 1, s + 1))}
                  disabled={activeSlide === data.slides.length - 1}
                  className="p-3 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="w-px h-8 bg-slate-200 mx-2" />

                <button
                  onClick={regenerateSlide}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center gap-2 font-semibold text-sm transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate Slide
                </button>
              </div>

              {/* Speaker Notes Card */}
              {data.slides[activeSlide].speakerNotes && (
                <div className="mt-8 w-full max-w-3xl bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-bold text-sm">
                    <Mic className="w-4 h-4 text-indigo-500" />
                    Speaker Notes
                  </div>
                  <div className="p-6 text-slate-600 leading-relaxed text-sm">
                    {data.slides[activeSlide].speakerNotes}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Inline styles for custom scrollbar to keep code single-file */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}