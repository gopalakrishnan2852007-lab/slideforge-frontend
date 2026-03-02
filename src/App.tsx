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
  ArrowRight,
  RefreshCw
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

/* ========================= */
/* PREMIUM THEMES (UNCHANGED) */
/* ========================= */
const premiumThemes = {
  modern: { /* unchanged */ },
  business: { /* unchanged */ },
  academic: { /* unchanged */ },
};

const templates = [
  { id: "modern", icon: Layout, label: "Modern" },
  { id: "business", icon: Briefcase, label: "Business" },
  { id: "academic", icon: GraduationCap, label: "Academic" },
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] =
    useState<keyof typeof premiumThemes>("modern");
  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ✅ NEW STATES */
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(6);

  /* ========================= */
  /* GENERATE SLIDES UPDATED  */
  /* ========================= */
  const generateSlides = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${API_BASE}/generate-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slideCount }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Backend error");

      const result = JSON.parse(text);
      setData(result);
      setActiveSlide(0);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ========================= */
  /* REGENERATE SINGLE SLIDE  */
  /* ========================= */
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
      setError("Failed to regenerate slide");
    } finally {
      setLoading(false);
    }
  };

  /* ========================= */
  /* DOWNLOAD PPT (UNCHANGED) */
  /* ========================= */
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
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="w-[460px] bg-white p-8 flex flex-col gap-6">

        {/* Topic */}
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic..."
          className="p-4 border rounded-xl"
        />

        {/* Slide Count Selector */}
        <select
          value={slideCount}
          onChange={(e) => setSlideCount(Number(e.target.value))}
          className="p-3 border rounded-xl"
        >
          <option value={5}>5 Slides</option>
          <option value={6}>6 Slides</option>
          <option value={8}>8 Slides</option>
          <option value={12}>12 Slides</option>
        </select>

        {/* Generate */}
        <button
          onClick={generateSlides}
          disabled={loading}
          className="bg-black text-white p-4 rounded-xl"
        >
          {loading ? "Generating..." : "Generate Presentation"}
        </button>

        {data && (
          <button
            onClick={downloadPPT}
            className="bg-indigo-600 text-white p-4 rounded-xl"
          >
            Download PPT
          </button>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-10 flex flex-col items-center">

        {data ? (
          <>
            {/* Slide Counter */}
            <div className="mb-6 font-semibold">
              Slide {activeSlide + 1} / {data.slides.length}
            </div>

            {/* Slide Preview */}
            <div className="w-full max-w-4xl aspect-video bg-black text-white p-10 rounded-3xl">
              <h2 className="text-3xl font-bold mb-6">
                {data.slides[activeSlide].heading}
              </h2>

              <ul className="space-y-3">
                {data.slides[activeSlide].points.map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex gap-6 mt-6">
              <button
                onClick={() =>
                  setActiveSlide((s) => Math.max(0, s - 1))
                }
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                ⬅ Previous
              </button>

              <button
                onClick={() =>
                  setActiveSlide((s) =>
                    Math.min(data.slides.length - 1, s + 1)
                  )
                }
                className="px-4 py-2 bg-black text-white rounded-lg"
              >
                Next ➡
              </button>

              <button
                onClick={regenerateSlide}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Regenerate Slide
              </button>
            </div>

            {/* Speaker Notes */}
            {data.slides[activeSlide].speakerNotes && (
              <div className="mt-6 max-w-3xl bg-white p-6 rounded-xl border">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Mic size={16} /> Speaker Notes
                </h3>
                <p>
                  {data.slides[activeSlide].speakerNotes}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400">
            No presentation generated yet.
          </div>
        )}
      </div>
    </div>
  );
}