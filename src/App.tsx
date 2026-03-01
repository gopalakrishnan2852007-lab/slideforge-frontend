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

const themeStyles: Record<string, string> = {
  modern:
    "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white",
  business:
    "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50",
  academic:
    "bg-gradient-to-br from-slate-50 to-white text-slate-900 border border-slate-200",
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

      if (!res.ok) {
        throw new Error(text || "Backend error");
      }

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

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col md:flex-row font-sans">
      
      {/* LEFT PANEL */}
      <div className="w-full md:w-[420px] bg-white border-r border-slate-200 flex flex-col h-screen">
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
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                <AlignLeft size={16} /> Topic
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter presentation topic..."
                className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                Choose Theme
              </label>
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
                  <Sparkles size={18} /> Generate
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
            <div
              className={`aspect-video rounded-2xl shadow-2xl p-12 ${themeStyles[template]}`}
            >
              <h2 className="text-4xl font-bold mb-8">
                {data.slides[0].heading}
              </h2>

              <ul className="space-y-4 text-xl">
                {data.slides[0].points.map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            </div>

            {data.slides[0].speakerNotes && (
              <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Mic size={16} /> Speaker Notes
                </h3>
                <p className="text-sm text-slate-600">
                  {data.slides[0].speakerNotes}
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