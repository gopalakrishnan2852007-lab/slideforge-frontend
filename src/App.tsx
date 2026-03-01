import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Layout,
  Briefcase,
  GraduationCap,
  Download,
  Loader2,
  Mic,
  Presentation,
  AlignLeft
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

const themeStyles: Record<string, string> = {
  modern: "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white",
  business: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50",
  academic: "bg-gradient-to-br from-slate-50 to-white text-slate-900 border border-slate-200",
};

const templates = [
  { id: "modern", icon: Layout, label: "Modern" },
  { id: "business", icon: Briefcase, label: "Business" },
  { id: "academic", icon: GraduationCap, label: "Academic" },
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState("modern");
  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ✅ GENERATE SLIDES (LIVE BACKEND)
  const generateSlides = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/generate-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, template }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const result = await res.json();
      setData(result);
      setActiveSlide(0);
    } catch (err: any) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ DOWNLOAD PPT (LIVE BACKEND)
  const downloadPPT = async () => {
    if (!data) return;

    const res = await fetch(`${API_BASE}/download-ppt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, template }),
    });

    if (!res.ok) {
      setError("PPT generation failed");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title}.pptx`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* LEFT PANEL */}
      <div className="w-full md:w-[400px] bg-white border-r border-slate-200 flex flex-col h-screen">
        <div className="p-8 flex flex-col h-full overflow-y-auto space-y-8">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              SlideForge <span className="text-indigo-600">AI</span>
            </h1>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlignLeft size={16} /> Topic
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter presentation topic..."
                className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Choose Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {templates.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`flex flex-col items-center p-4 rounded-xl border ${
                        template === t.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <Icon size={20} className="mb-2" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={generateSlides}
              disabled={loading || !topic.trim()}
              className="w-full bg-slate-900 text-white p-4 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> {data ? "Regenerate" : "Generate"}
                </>
              )}
            </button>

            {data && (
              <button
                onClick={downloadPPT}
                className="w-full bg-indigo-600 text-white p-4 rounded-xl flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download PPT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-12 overflow-auto">
        {data ? (
          <div className="w-full max-w-5xl">
            <div className={`aspect-video rounded-2xl shadow-2xl p-12 ${themeStyles[template]}`}>
              <h2 className="text-4xl font-bold mb-8">
                {data.slides[activeSlide].heading}
              </h2>

              <ul className="space-y-4 text-xl">
                {data.slides[activeSlide].points.map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            </div>

            {data.slides[activeSlide].speakerNotes && (
              <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Mic size={16} /> Speaker Notes
                </h3>
                <p className="text-sm text-slate-600">
                  {data.slides[activeSlide].speakerNotes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-400 text-center">
            No presentation generated yet
          </div>
        )}
      </div>
    </div>
  );
}