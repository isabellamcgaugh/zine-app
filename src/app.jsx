const { useEffect, useRef, useState } = React;

const STORAGE_KEY = "zine-o-matic-entries-v2";
const LEGACY_STORAGE_KEY = "zine-o-matic-entries-v1";
const MOOD_STORAGE_KEY = "zine-o-matic-daily-mood-v1";
const TILE_COUNT = 6;

/** ISO 216 / JIS B sizes at 300 DPI for print-ready PNG exports */
const EXPORT_DPI = 300;

function mmToExportPx(mm) {
  return Math.round((mm * EXPORT_DPI) / 25.4);
}

const PAPER_FORMATS = [
  { id: "a4", label: "A4", sub: "210 × 297 mm", wMm: 210, hMm: 297 },
  { id: "a5", label: "A5", sub: "148 × 210 mm", wMm: 148, hMm: 210 },
  { id: "b5", label: "B5", sub: "176 × 250 mm", wMm: 176, hMm: 250 },
  { id: "b6", label: "B6", sub: "125 × 176 mm", wMm: 125, hMm: 176 },
].map((p) => ({
  ...p,
  widthPx: mmToExportPx(p.wMm),
  heightPx: mmToExportPx(p.hMm),
}));

function getPaperFormat(id) {
  return PAPER_FORMATS.find((p) => p.id === id) || PAPER_FORMATS[1];
}

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadDailyMood() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(MOOD_STORAGE_KEY);
  if (!raw) return null;
  let o = null;
  try {
    o = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!o || typeof o.moodId !== "string" || o.date !== todayDateKey()) return null;
  return o.moodId;
}

function saveDailyMood(moodId) {
  window.localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify({ date: todayDateKey(), moodId }));
}

/**
 * Theme tokens applied to :root — keep keys in sync with global.css defaults.
 * Each mood shifts the whole UI (backgrounds, accents, glows).
 */
const MOODS = [
  {
    id: "calm",
    label: "Calm",
    sub: "Soft & steady",
    face: "calm",
    vars: {
      "--theme-bg": "#c4e8de",
      "--theme-bg-light": "#e2f6f0",
      "--theme-bg-deep": "#a8d9cc",
      "--theme-spot": "rgba(255,255,255,0.58)",
      "--theme-side": "rgba(170, 225, 210, 0.45)",
      "--accent": "#4a8a9c",
      "--accent-soft": "rgba(74, 138, 156, 0.52)",
      "--btn": "rgba(74, 138, 156, 0.58)",
      "--glow": "rgba(74, 138, 156, 0.32)",
      "--glow-phone": "rgba(50, 110, 120, 0.28)",
      "--card-glow": "rgba(74, 138, 156, 0.14)",
      "--icon": "#3a7a8c",
    },
  },
  {
    id: "happy",
    label: "Happy",
    sub: "Bright & light",
    face: "happy",
    vars: {
      "--theme-bg": "#f2e8b0",
      "--theme-bg-light": "#faf4d4",
      "--theme-bg-deep": "#e4d48e",
      "--theme-spot": "rgba(255, 250, 210, 0.75)",
      "--theme-side": "rgba(255, 214, 120, 0.4)",
      "--accent": "#c49a1a",
      "--accent-soft": "rgba(196, 154, 26, 0.55)",
      "--btn": "rgba(196, 154, 26, 0.58)",
      "--glow": "rgba(230, 180, 60, 0.38)",
      "--glow-phone": "rgba(200, 150, 40, 0.3)",
      "--card-glow": "rgba(196, 154, 26, 0.16)",
      "--icon": "#b8860b",
    },
  },
  {
    id: "energized",
    label: "Energized",
    sub: "Buzzing",
    face: "energized",
    vars: {
      "--theme-bg": "#ffd4c4",
      "--theme-bg-light": "#ffe8df",
      "--theme-bg-deep": "#ffb89e",
      "--theme-spot": "rgba(255, 240, 230, 0.7)",
      "--theme-side": "rgba(255, 160, 120, 0.42)",
      "--accent": "#e0653a",
      "--accent-soft": "rgba(224, 101, 58, 0.52)",
      "--btn": "rgba(224, 101, 58, 0.58)",
      "--glow": "rgba(255, 120, 80, 0.35)",
      "--glow-phone": "rgba(220, 90, 50, 0.28)",
      "--card-glow": "rgba(224, 101, 58, 0.15)",
      "--icon": "#c94f28",
    },
  },
  {
    id: "creative",
    label: "Creative",
    sub: "Ideas flowing",
    face: "creative",
    vars: {
      "--theme-bg": "#ddd4f0",
      "--theme-bg-light": "#eee8fb",
      "--theme-bg-deep": "#c8bae8",
      "--theme-spot": "rgba(245, 240, 255, 0.65)",
      "--theme-side": "rgba(180, 150, 240, 0.38)",
      "--accent": "#7a5eb8",
      "--accent-soft": "rgba(122, 94, 184, 0.52)",
      "--btn": "rgba(122, 94, 184, 0.58)",
      "--glow": "rgba(140, 100, 220, 0.32)",
      "--glow-phone": "rgba(100, 70, 180, 0.26)",
      "--card-glow": "rgba(122, 94, 184, 0.16)",
      "--icon": "#6347a0",
    },
  },
  {
    id: "tender",
    label: "Tender",
    sub: "Gentle heart",
    face: "tender",
    vars: {
      "--theme-bg": "#f5d0dc",
      "--theme-bg-light": "#fde8ef",
      "--theme-bg-deep": "#e8b8c8",
      "--theme-spot": "rgba(255, 235, 245, 0.72)",
      "--theme-side": "rgba(255, 170, 200, 0.38)",
      "--accent": "#c75e84",
      "--accent-soft": "rgba(199, 94, 132, 0.52)",
      "--btn": "rgba(199, 94, 132, 0.56)",
      "--glow": "rgba(230, 120, 160, 0.3)",
      "--glow-phone": "rgba(190, 80, 120, 0.25)",
      "--card-glow": "rgba(199, 94, 132, 0.14)",
      "--icon": "#a8486c",
    },
  },
  {
    id: "low",
    label: "Low",
    sub: "Heavy sky",
    face: "low",
    vars: {
      "--theme-bg": "#c5d0de",
      "--theme-bg-light": "#dde6f0",
      "--theme-bg-deep": "#a8b8cc",
      "--theme-spot": "rgba(230, 238, 248, 0.55)",
      "--theme-side": "rgba(140, 170, 210, 0.35)",
      "--accent": "#5a7390",
      "--accent-soft": "rgba(90, 115, 144, 0.5)",
      "--btn": "rgba(90, 115, 144, 0.55)",
      "--glow": "rgba(100, 130, 170, 0.28)",
      "--glow-phone": "rgba(70, 95, 130, 0.24)",
      "--card-glow": "rgba(90, 115, 144, 0.12)",
      "--icon": "#4a6278",
    },
  },
  {
    id: "angry",
    label: "Angry",
    sub: "Fired up",
    face: "angry",
    vars: {
      "--theme-bg": "#e8b0b0",
      "--theme-bg-light": "#f8d8d8",
      "--theme-bg-deep": "#d89090",
      "--theme-spot": "rgba(255, 220, 220, 0.65)",
      "--theme-side": "rgba(255, 140, 140, 0.38)",
      "--accent": "#b03030",
      "--accent-soft": "rgba(176, 48, 48, 0.52)",
      "--btn": "rgba(176, 48, 48, 0.58)",
      "--glow": "rgba(220, 80, 80, 0.34)",
      "--glow-phone": "rgba(180, 50, 50, 0.28)",
      "--card-glow": "rgba(176, 48, 48, 0.15)",
      "--icon": "#9c2020",
    },
  },
  {
    id: "growth",
    label: "Growth",
    sub: "Fresh energy",
    face: "growth",
    vars: {
      "--theme-bg": "#d8f0e4",
      "--theme-bg-light": "#effaf3",
      "--theme-bg-deep": "#bfe8d4",
      "--theme-spot": "rgba(255,255,255,0.62)",
      "--theme-side": "rgba(130, 240, 190, 0.4)",
      "--accent": "#4ade80",
      "--accent-soft": "rgba(74, 222, 128, 0.52)",
      "--btn": "rgba(52, 211, 153, 0.62)",
      "--glow": "rgba(74, 222, 128, 0.34)",
      "--glow-phone": "rgba(34, 197, 94, 0.26)",
      "--card-glow": "rgba(74, 222, 128, 0.15)",
      "--icon": "#16a34a",
    },
  },
];

const MOOD_VAR_KEYS = Object.keys(MOODS[0].vars);

function getMoodById(id) {
  return MOODS.find((m) => m.id === id) || MOODS[0];
}

function applyMoodTheme(moodId) {
  const m = getMoodById(moodId);
  const root = document.documentElement;
  root.dataset.mood = m.id;
  MOOD_VAR_KEYS.forEach((k) => {
    const v = m.vars[k];
    if (v != null) root.style.setProperty(k, v);
  });
}

function resetMoodThemeToDefaults() {
  const root = document.documentElement;
  delete root.dataset.mood;
  MOOD_VAR_KEYS.forEach((k) => root.style.removeProperty(k));
}

/** 30+ daily prompts: chip title + matching sentence starter (placeholder / theme for the text area). */
const PROMPTS = [
  { title: "What brings you joy?", sentenceStarter: "What gives me joy is..." },
  { title: "What made you smile today?", sentenceStarter: "What made me smile today was..." },
  { title: "Where did you notice beauty?", sentenceStarter: "The beauty I noticed was..." },
  { title: "When did you feel present?", sentenceStarter: "I felt present when I..." },
  { title: "What are you grateful for?", sentenceStarter: "I'm grateful for..." },
  { title: "What slowed you down—in a good way?", sentenceStarter: "Something that slowed me down today was..." },
  { title: "What sound did you love?", sentenceStarter: "A sound I loved today was..." },
  { title: "What color caught your eye?", sentenceStarter: "A color that stood out to me was..." },
  { title: "Who made your day warmer?", sentenceStarter: "Someone who brightened my day was..." },
  { title: "What tiny win happened?", sentenceStarter: "A small win I had was..." },
  { title: "What did you touch that felt good?", sentenceStarter: "Something I touched that felt good was..." },
  { title: "What did you taste that you liked?", sentenceStarter: "Something I tasted that I liked was..." },
  { title: "Where did light fall beautifully?", sentenceStarter: "I loved how light fell on..." },
  { title: "What pattern did you see?", sentenceStarter: "A pattern I noticed was..." },
  { title: "What made you laugh?", sentenceStarter: "Something that made me laugh was..." },
  { title: "What felt cozy?", sentenceStarter: "Something that felt cozy was..." },
  { title: "What did you create or arrange?", sentenceStarter: "Something I made or arranged was..." },
  { title: "What did you learn about yourself?", sentenceStarter: "Something I learned about myself is..." },
  { title: "What would you like to remember?", sentenceStarter: "I want to remember..." },
  { title: "What felt like a gift?", sentenceStarter: "Something that felt like a gift was..." },
  { title: "Where did you breathe easier?", sentenceStarter: "I breathed easier when..." },
  { title: "What surprised you?", sentenceStarter: "Something that surprised me was..." },
  { title: "What felt honest today?", sentenceStarter: "Something that felt honest was..." },
  { title: "What are you proud of?", sentenceStarter: "I'm proud that..." },
  { title: "What felt playful?", sentenceStarter: "Something playful I did or saw was..." },
  { title: "What texture did you enjoy?", sentenceStarter: "A texture I enjoyed was..." },
  { title: "What moment felt still?", sentenceStarter: "A still moment I had was..." },
  { title: "What did nature show you?", sentenceStarter: "Nature showed me..." },
  { title: "What did you choose on purpose?", sentenceStarter: "On purpose, I chose to..." },
  { title: "What felt like home?", sentenceStarter: "Something that felt like home was..." },
  { title: "What are you carrying forward?", sentenceStarter: "I'm carrying forward..." },
  { title: "What question are you sitting with?", sentenceStarter: "A question I'm sitting with is..." },
];

function clampPromptIndex(i) {
  const n = PROMPTS.length;
  return ((i % n) + n) % n;
}

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function defaultEntries() {
  return Array.from({ length: TILE_COUNT }, (_, i) => ({
    id: i,
    photoDataUrl: null,
    sentence: "",
    promptIndex: 0,
    zineDate: "",
    pageMode: "text",
  }));
}

function migrateLegacyEntry(e, idx) {
  const sentence = e?.sentence ?? "";
  const photoDataUrl = e?.photoDataUrl ?? null;
  let promptIndex = 0;
  const legacyText = e?.promptText;
  if (typeof legacyText === "string") {
    const found = PROMPTS.findIndex((p) => p.sentenceStarter === legacyText);
    promptIndex = found >= 0 ? found : 0;
  }
  return { id: idx, photoDataUrl, sentence, promptIndex, zineDate: "", pageMode: "text" };
}

/** Each zine page is either a photo or a text answer — never both. */
function normalizeEntry(e, idx) {
  let photoDataUrl = e?.photoDataUrl ?? null;
  let sentence = typeof e?.sentence === "string" ? e.sentence : "";
  const promptIndex = clampPromptIndex(typeof e?.promptIndex === "number" ? e.promptIndex : 0);
  const zineDate = typeof e?.zineDate === "string" ? e.zineDate : "";
  let pageMode = e?.pageMode === "photo" || e?.pageMode === "text" ? e.pageMode : null;

  const hasPhoto = !!photoDataUrl;
  const hasText = sentence.trim().length > 0;

  if (!pageMode) {
    if (hasPhoto && hasText) {
      pageMode = "photo";
      sentence = "";
    } else if (hasPhoto) pageMode = "photo";
    else if (hasText) pageMode = "text";
    else pageMode = "text";
  }

  if (pageMode === "photo") {
    sentence = "";
  } else {
    photoDataUrl = null;
  }

  return {
    id: idx,
    photoDataUrl,
    sentence,
    promptIndex,
    zineDate,
    pageMode,
  };
}

function loadEntries() {
  if (typeof window === "undefined") return defaultEntries();
  let raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = safeParseJSON(raw, null);
      if (Array.isArray(parsed) && parsed.length === TILE_COUNT) {
        const migrated = parsed.map((e, idx) => migrateLegacyEntry(e, idx)).map(normalizeEntry);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return defaultEntries();
  }
  const parsed = safeParseJSON(raw, defaultEntries());
  if (!Array.isArray(parsed) || parsed.length !== TILE_COUNT) return defaultEntries();
  return parsed.map((e, idx) => normalizeEntry(e, idx));
}

function persistEntries(entries) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function hashRoute() {
  const h = window.location.hash || "";
  if (h.startsWith("#/library")) return "library";
  if (h.startsWith("#/export")) return "export";
  if (h.startsWith("#/mood")) return "mood";
  if (h.startsWith("#/prompt")) return "prompt";
  return "";
}

function navigate(to) {
  window.location.hash = to;
}

function Icons() {
  const stroke = "rgba(0,0,0,0.62)";
  const stroke2 = "rgba(0,0,0,0.72)";

  function IconSvg({ children, size = 48 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {children}
      </svg>
    );
  }

  const PhotoPlaceholder = () => (
    <IconSvg>
      <rect x="8.5" y="10" width="31" height="24" rx="3" stroke={stroke} strokeWidth="2" />
      <circle cx="17" cy="20" r="2.5" stroke={stroke} strokeWidth="2" />
      <path d="M13 34L21 24l6 7 5-6 4 9" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 13L18 13" stroke={stroke2} strokeWidth="2" strokeLinecap="round" />
    </IconSvg>
  );

  const ImageIcon = () => (
    <IconSvg>
      <rect x="8.5" y="10" width="31" height="24" rx="3" stroke={stroke} strokeWidth="2" />
      <circle cx="17" cy="20" r="2.5" stroke={stroke} strokeWidth="2" />
      <path d="M13 34L21 24l6 7 5-6 4 9" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </IconSvg>
  );

  const CameraIcon = () => (
    <IconSvg>
      <rect x="10" y="18" width="28" height="20" rx="4" stroke={stroke} strokeWidth="2" />
      <path d="M18 18l3-4h6l3 4" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="28" r="6" stroke={stroke} strokeWidth="2" />
    </IconSvg>
  );

  /** Expand / full-screen camera (arrows outward). */
  const ExpandFullscreenIcon = () => (
    <IconSvg>
      <path d="M14 18V14h4" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 14L10 22" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 18V14h-4" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 14L38 22" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 30v4h4" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 34L10 26" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 30v4h-4" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 34L38 26" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </IconSvg>
  );

  const PencilIcon = () => (
    <IconSvg size={46}>
      <path
        d="M14 34l-2 7 7-2 18-18-5-5-18 18z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M26 14l8 8" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </IconSvg>
  );

  const ExportIcon = () => (
    <IconSvg size={46}>
      <path d="M24 10v18" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 18l8-8 8 8" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <rect x="12" y="26" width="24" height="12" rx="3" stroke={stroke} strokeWidth="2" />
    </IconSvg>
  );

  const RefreshIcon = () => (
    <IconSvg size={40}>
      <path d="M34 14a14 14 0 10 2 15" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M36 10v6h-6" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </IconSvg>
  );

  const PlusCircleIcon = () => (
    <IconSvg size={40}>
      <path d="M24 18v12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 24h12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </IconSvg>
  );

  const ChevronLeftIcon = () => (
    <IconSvg size={40}>
      <path d="M28 14L16 24l12 10" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  );

  const ChevronRightIcon = () => (
    <IconSvg size={40}>
      <path d="M20 14l12 10-12 10" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  );

  const GridLibraryIcon = () => (
    <IconSvg size={42}>
      <rect x="10" y="10" width="11" height="11" rx="2" stroke={stroke} strokeWidth="2" />
      <rect x="27" y="10" width="11" height="11" rx="2" stroke={stroke} strokeWidth="2" />
      <rect x="10" y="27" width="11" height="11" rx="2" stroke={stroke} strokeWidth="2" />
      <rect x="27" y="27" width="11" height="11" rx="2" stroke={stroke} strokeWidth="2" />
    </IconSvg>
  );

  const DocumentPageIcon = () => (
    <IconSvg size={42}>
      <path d="M14 12h14l8 8v22H14V12z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 12v8h8" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </IconSvg>
  );

  const DownloadDiskIcon = () => (
    <IconSvg size={42}>
      <path d="M24 10v14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 17l7-7 7 7" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 28h24v10H12V28z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </IconSvg>
  );

  const PrinterIcon = () => (
    <IconSvg size={40}>
      <rect x="14" y="12" width="20" height="8" rx="2" stroke={stroke} strokeWidth="2" />
      <rect x="12" y="20" width="24" height="14" rx="2" stroke={stroke} strokeWidth="2" />
      <rect x="16" y="24" width="16" height="10" rx="1" stroke={stroke} strokeWidth="2" />
    </IconSvg>
  );

  return {
    PhotoPlaceholder,
    ImageIcon,
    CameraIcon,
    ExpandFullscreenIcon,
    PencilIcon,
    ExportIcon,
    RefreshIcon,
    PlusCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    GridLibraryIcon,
    DocumentPageIcon,
    DownloadDiskIcon,
    PrinterIcon,
  };
}

/** Simple doodle faces — chunky strokes to match the soft glass UI. */
function MoodFace({ kind, color }) {
  const vb = "0 0 72 72";
  const sw = 3.2;
  const face = { fill: `${color}30`, stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  const line = { fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };

  if (kind === "calm") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <circle cx="36" cy="40" r="24" {...face} />
        <path d="M26 38h8M38 38h8" {...line} />
        <path d="M28 50c4 5 12 5 16 0" {...line} />
        <path d="M36 12v8" {...line} opacity="0.45" />
      </svg>
    );
  }
  if (kind === "happy") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <circle cx="36" cy="40" r="24" {...face} />
        <circle cx="27" cy="36" r="3.5" fill={color} stroke="none" />
        <circle cx="45" cy="36" r="3.5" fill={color} stroke="none" />
        <path d="M26 48c4 8 16 8 20 0" {...line} />
        <path d="M18 22l6 4M48 22l-6 4" {...line} opacity="0.6" />
      </svg>
    );
  }
  if (kind === "energized") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <path
          d="M36 14l4 10 10 2-8 8 2 10-10-6-10 6 2-10-8-8 10-2z"
          fill={`${color}35`}
          stroke={color}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <circle cx="36" cy="42" r="20" {...face} fill={`${color}28`} />
        <path d="M28 40l4-4 4 4M36 40l4-4 4 4" {...line} />
        <path d="M28 50h16" {...line} />
      </svg>
    );
  }
  if (kind === "creative") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <circle cx="36" cy="40" r="24" {...face} />
        <path d="M30 22l4 8 8-6-2 10 10 2-10 4" fill="none" stroke={color} strokeWidth={sw * 0.85} strokeLinejoin="round" />
        <circle cx="28" cy="38" r="3" fill={color} stroke="none" />
        <path d="M40 35l6 3-6 3 2-3z" fill={color} stroke="none" />
        <path d="M26 50c5 4 15 4 20 0" {...line} />
      </svg>
    );
  }
  if (kind === "tender") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <circle cx="36" cy="40" r="24" {...face} />
        <path
          d="M24 34c0-4 6-4 6 0 0-4 6-4 6 0M36 34c0-4 6-4 6 0 0-4 6-4 6 0"
          fill={color}
          stroke="none"
          opacity="0.85"
        />
        <path d="M28 50c3 5 13 5 16 0" {...line} />
        <ellipse cx="36" cy="18" rx="10" ry="5" fill={`${color}40`} stroke="none" />
      </svg>
    );
  }
  if (kind === "low") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <path
          d="M16 46c4-18 40-18 44 0v8H16v-8z"
          fill={`${color}32`}
          stroke={color}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <circle cx="30" cy="40" r="2.8" fill={color} stroke="none" />
        <circle cx="42" cy="40" r="2.8" fill={color} stroke="none" />
        <path d="M32 48h8" {...line} />
        <path d="M22 26h6M34 24h6M46 26h6" {...line} opacity="0.45" strokeWidth={2} />
      </svg>
    );
  }
  if (kind === "angry") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <circle cx="36" cy="40" r="24" fill={`${color}38`} stroke={color} strokeWidth={sw} />
        <path d="M24 32l8 4M48 32l-8 4" {...line} />
        <circle cx="28" cy="40" r="3" fill={color} stroke="none" />
        <circle cx="44" cy="40" r="3" fill={color} stroke="none" />
        <path d="M28 50l16-6" {...line} />
        <path d="M20 18c2 6 6 8 8 4M44 18c-2 6-6 8-8 4" {...line} />
      </svg>
    );
  }
  if (kind === "growth") {
    return (
      <svg viewBox={vb} width="56" height="56" aria-hidden>
        <ellipse cx="36" cy="48" rx="20" ry="14" fill={`${color}25`} stroke={color} strokeWidth={sw} />
        <path d="M36 46V26" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
        <path
          d="M36 30c-12-2-18 8-10 16 4-8 10-12 10-12z"
          fill={color}
          stroke={color}
          strokeWidth={1.2}
          strokeLinejoin="round"
          opacity="0.88"
        />
        <path
          d="M36 28c12-4 20 4 12 14-6-6-12-6-12-6z"
          fill={color}
          stroke={color}
          strokeWidth={1.2}
          strokeLinejoin="round"
          opacity="0.72"
        />
        <circle cx="32" cy="44" r="2.2" fill={color} stroke="none" opacity="0.5" />
        <circle cx="40" cy="44" r="2.2" fill={color} stroke="none" opacity="0.5" />
      </svg>
    );
  }
  return null;
}

/** Soft neumorphic text nav (not icon-only) — pill tiles with title + caption. */
function NmNavRow({ children, className }) {
  return (
    <nav
      className={"nmNavRow" + (className ? ` ${className}` : "")}
      aria-label="Section navigation"
    >
      {children}
    </nav>
  );
}

function NmNavPill({ href, title, subtitle }) {
  return (
    <a className="nmNavPill" href={href}>
      <span className="nmNavPillMain">{title}</span>
      {subtitle ? <span className="nmNavPillSub">{subtitle}</span> : null}
    </a>
  );
}

function MoodPage({ savedMoodId, onPickMood, onContinue }) {
  return (
    <div className="pageStack moodPage">
      <header className="moodHeader">
        <p className="moodKicker">Good morning</p>
        <h1 className="moodTitle">How&apos;s your mood today?</h1>
        <p className="moodSubtitle">Tap one — the whole app will glow in that vibe until tomorrow.</p>
      </header>

      <div className="moodGrid">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={"moodCard" + (savedMoodId === m.id ? " moodCardSelected" : "")}
            onClick={() => onPickMood(m.id)}
            style={{ "--mood-card-accent": m.vars["--icon"] }}
          >
            <div className="moodCardGlow" aria-hidden />
            <div className="moodCardIcon">
              <MoodFace kind={m.face} color={m.vars["--icon"]} />
            </div>
            <div className="moodCardText">
              <span className="moodCardLabel">{m.label}</span>
              <span className="moodCardSub">{m.sub}</span>
            </div>
          </button>
        ))}
      </div>

      {savedMoodId ? (
        <div className="moodFooter">
          <button type="button" className="moodContinueBtn" onClick={onContinue}>
            Continue to zine
          </button>
        </div>
      ) : null}

      <div className="spacerGrow" />
    </div>
  );
}

function PhoneShell({ children }) {
  return (
    <div className="phone">
      <div className="phoneGlow" aria-hidden />
      <div className="phoneInner">
        <div className="statusBar">
          <div>9:41</div>
          <div className="statusRight">
            <div style={{ fontWeight: 800 }}>▮▮▮</div>
            <div style={{ fontWeight: 800 }}>⟲</div>
            <div style={{ fontWeight: 800 }}>●</div>
          </div>
        </div>
        <div className="phoneContent">{children}</div>
      </div>
      <div className="homeIndicator" />
    </div>
  );
}

function LibraryPage({ entries, selectedIndex, onSelectTile, onEdit, onExport }) {
  const { PhotoPlaceholder } = Icons();

  return (
    <div className="pageStack">
      <NmNavRow>
        <NmNavPill href="#/mood" title="Mood" subtitle="Today" />
        <NmNavPill href="#/prompt" title="Prompt" subtitle="Camera & text" />
      </NmNavRow>
      <header className="uiScreenHead">
        <h2 className="uiScreenTitle">My zine</h2>
        <p className="uiScreenMeta">Pages · tap to select, then edit or export</p>
      </header>
      <div className="grid2 grid2Even">
        {entries.map((e, idx) => {
          const isPhoto = e.pageMode === "photo";
          const isText = e.pageMode === "text";
          const hasPhoto = isPhoto && e.photoDataUrl;
          const hasText = isText && e.sentence.trim();
          return (
            <div
              key={e.id}
              className={
                "zTile zTileClickable" + (idx === selectedIndex ? " zTileSelected" : "")
              }
              onClick={() => onSelectTile(idx)}
              role="button"
              tabIndex={0}
            >
              <div className="zTileKindPill">{isPhoto ? "Photo" : "Text"}</div>
              {isPhoto && !hasPhoto ? (
                <div className="iconWrap" style={{ opacity: 0.85 }}>
                  <PhotoPlaceholder />
                </div>
              ) : null}
              {isText && !hasText ? <div className="zTileTextEmptyMark">Aa</div> : null}
              {hasPhoto ? (
                <div className="framePreview" style={{ padding: 16 }}>
                  <img src={e.photoDataUrl} alt={`pg ${idx + 1}`} />
                </div>
              ) : null}
              {hasText ? (
                <div className="zTileTextPreview" title={e.sentence}>
                  {e.sentence.trim()}
                </div>
              ) : null}
              {!hasPhoto && !hasText && isText ? (
                <div className="zTileEmptyHint">Write your answer</div>
              ) : null}
              {!hasPhoto && !hasText && isPhoto ? (
                <div className="zTileEmptyHint">Add a photo</div>
              ) : null}
              <div className="zTileLabel">pg #{idx + 1}</div>
            </div>
          );
        })}
      </div>

      <div className="spacerGrow" />

      <div className="bottomBar">
        <button className="bottomBtn" onClick={onEdit} type="button">
          <span style={{ transform: "translateY(-1px)" }}>
            {(() => {
              const { PencilIcon } = Icons();
              return <PencilIcon />;
            })()}
          </span>
          <span>Edit</span>
        </button>
        <button className="bottomBtn" onClick={onExport} type="button">
          {(() => {
            const { ExportIcon } = Icons();
            return <span style={{ transform: "translateY(-1px)" }}><ExportIcon /></span>;
          })()}
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}

function useCameraStream(active) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) {
      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
      setError(null);
      return;
    }

    let cancelled = false;
    let mediaStream = null;
    setError(null);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported in this browser.");
        }
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream((prev) => {
          prev?.getTracks().forEach((t) => t.stop());
          return mediaStream;
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Could not access camera.");
      }
    })();

    return () => {
      cancelled = true;
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  return { stream, error };
}

function NewPromptPage({ entry, onChangeEntry, onNewPrompt }) {
  const promptMeta = PROMPTS[clampPromptIndex(entry.promptIndex)];
  const pageMode = entry.pageMode === "photo" ? "photo" : "text";

  const { ImageIcon, CameraIcon, ExpandFullscreenIcon, PhotoPlaceholder, RefreshIcon, PlusCircleIcon } = Icons();
  const photoInputRef = useRef(null);
  const videoRef = useRef(null);
  const frameContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const [savedFlash, setSavedFlash] = useState(false);
  const savedTimerRef = useRef(null);

  const showLiveCamera = pageMode === "photo" && !entry.photoDataUrl;
  const { stream, error: streamError } = useCameraStream(showLiveCamera);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream || null;
    if (stream) v.play().catch(() => {});
  }, [stream, showLiveCamera]);

  function flashSaved() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSavedFlash(true);
    savedTimerRef.current = setTimeout(() => setSavedFlash(false), 1200);
  }

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    []
  );

  function setPromptPageMode(next) {
    if (next === pageMode) return;
    if (next === "photo") {
      if (entry.sentence.trim()) {
        if (!window.confirm("Switch to photo? Your written answer will be removed.")) return;
      }
      onChangeEntry({ ...entry, pageMode: "photo", sentence: "" });
      return;
    }
    if (entry.photoDataUrl) {
      if (!window.confirm("Switch to text? Your photo will be removed.")) return;
    }
    onChangeEntry({ ...entry, pageMode: "text", photoDataUrl: null });
  }

  function handleSentenceChange(value) {
    if (pageMode !== "text") return;
    onChangeEntry({ ...entry, pageMode: "text", sentence: value.slice(0, 2000) });
  }

  function commitTextAnswer() {
    if (pageMode !== "text") return;
    textareaRef.current?.blur();
    flashSaved();
  }

  function handleTextKeyDown(e) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    commitTextAnswer();
  }

  function pickNextPromptIndex() {
    const current = clampPromptIndex(entry.promptIndex);
    if (PROMPTS.length <= 1) return 0;
    let next = current;
    let guard = 0;
    while (next === current && guard < 50) {
      next = Math.floor(Math.random() * PROMPTS.length);
      guard++;
    }
    return next;
  }

  async function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChangeEntry({
        ...entry,
        pageMode: "photo",
        photoDataUrl: String(reader.result),
        sentence: "",
      });
      flashSaved();
    };
    reader.readAsDataURL(file);
  }

  function capturePhoto() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      alert("Camera is not ready yet. Wait a moment or allow camera access.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(v, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onChangeEntry({
      ...entry,
      pageMode: "photo",
      photoDataUrl: dataUrl,
      sentence: "",
    });
    flashSaved();
  }

  function toggleFullscreenCamera() {
    const videoEl = videoRef.current;
    const container = frameContainerRef.current;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    if (videoEl && typeof videoEl.webkitEnterFullscreen === "function") {
      videoEl.webkitEnterFullscreen();
      return;
    }
    const target = container || videoEl;
    if (target?.requestFullscreen) {
      target.requestFullscreen().catch(() => {
        alert("Fullscreen is not available in this browser.");
      });
    } else {
      alert("Fullscreen is not supported here. Try Safari on iPhone or Chrome on desktop.");
    }
  }

  useEffect(() => {
    function onFsChange() {
      if (!document.fullscreenElement && videoRef.current && document.pictureInPictureElement) {
        /* no-op */
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div className="pageStack">
      <div className="plusFab" onClick={() => onNewPrompt({ resetEntry: true })} role="button" tabIndex={0} title="New entry">
        <PlusCircleIcon />
      </div>

      <div className="chipTitle" style={{ marginTop: 8 }}>
        {promptMeta.title}
      </div>

      <div className="promptModeRow" role="group" aria-label="Page type">
        <button
          type="button"
          className={"promptModeBtn" + (pageMode === "photo" ? " promptModeBtnOn" : "")}
          onClick={() => setPromptPageMode("photo")}
        >
          Photo page
        </button>
        <button
          type="button"
          className={"promptModeBtn" + (pageMode === "text" ? " promptModeBtnOn" : "")}
          onClick={() => setPromptPageMode("text")}
        >
          Text answer
        </button>
      </div>

      <p className="promptModeHint">
        {pageMode === "photo"
          ? "This page is image-only. Switch to Text answer to type instead."
          : "This page is text-only. Switch to Photo page to use the camera or library instead."}
      </p>

      {pageMode === "photo" ? (
        <>
          <div className="frame frameCameraWrap" ref={frameContainerRef} style={{ marginTop: 10 }}>
            <div className="frameGrid frameOverlay">
              <div className="frameCorner tl" />
              <div className="frameCorner tr" />
              <div className="frameCorner bl" />
              <div className="frameCorner br" />
              <div className="frameCross" />
            </div>

            <div className="framePreview frameCameraInner">
              {entry.photoDataUrl ? (
                <img src={entry.photoDataUrl} alt="Captured" />
              ) : (
                <>
                  <video ref={videoRef} className="cameraVideo" playsInline muted autoPlay />
                  {streamError ? (
                    <div className="cameraFallback">
                      <PhotoPlaceholder />
                      <p className="cameraFallbackText">{streamError}</p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {entry.photoDataUrl ? (
        <button
          type="button"
          className="nmInlineLink"
          onClick={() => onChangeEntry({ ...entry, pageMode: "photo", photoDataUrl: null })}
        >
          Retake with camera
        </button>
          ) : null}

          <div className="modeRow">
            <button
              type="button"
              className="modeBtn modeBtnRound"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Open photo library"
            >
              <ImageIcon />
            </button>
            <button type="button" className="modeBtn modeBtnRound" onClick={capturePhoto} aria-label="Take photo">
              <CameraIcon />
            </button>
            <button
              type="button"
              className="modeBtn modeBtnRound"
              onClick={toggleFullscreenCamera}
              aria-label="Full screen camera"
            >
              <ExpandFullscreenIcon />
            </button>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </>
      ) : (
        <div className="textCard" style={{ marginTop: 12 }}>
          <div className="textCardHeader">
            <span className="saveHint" aria-live="polite">
              {savedFlash ? "Saved" : " "}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            className="promptArea promptAreaMono"
            value={entry.sentence}
            placeholder={promptMeta.sentenceStarter}
            onChange={(e) => handleSentenceChange(e.target.value)}
            onBlur={() => flashSaved()}
            onKeyDown={handleTextKeyDown}
            spellCheck="true"
            rows={6}
          />
          <button type="button" className="enterAnswerBtn" onClick={commitTextAnswer}>
            Enter
          </button>
          <p className="enterAnswerNote">Enter saves this answer. Use Shift+Enter for a new line.</p>
        </div>
      )}

      <button
        className="pillBtn"
        type="button"
        onClick={() => {
          onNewPrompt({
            resetEntry: false,
            newPromptIndex: pickNextPromptIndex(),
            clearSentence: pageMode === "text",
          });
          setTimeout(flashSaved, 0);
        }}
        aria-label="New prompt"
      >
        <span style={{ transform: "translateY(-1px)" }}>
          <RefreshIcon />
        </span>
        <span>NEW PROMPT</span>
        <span style={{ transform: "translateY(-1px) rotate(180deg)" }}>
          <RefreshIcon />
        </span>
      </button>

      <div className="spacerGrow" />
      <NmNavRow className="nmNavRowBottom">
        <NmNavPill href="#/mood" title="Mood" subtitle="Change today" />
        <NmNavPill href="#/library" title="My zine" subtitle="All pages" />
      </NmNavRow>
      <div style={{ height: 10 }} />
    </div>
  );
}

function formatDefaultZineDate() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = String(d.getFullYear()).slice(-2);
  return `${m}/${day}/${y}`;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function drawImageCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const r = w / h;
  let dw;
  let dh;
  let ox;
  let oy;
  if (ir > r) {
    dh = h;
    dw = h * ir;
    ox = x + (w - dw) / 2;
    oy = y;
  } else {
    dw = w;
    dh = w / ir;
    ox = x;
    oy = y + (h - dh) / 2;
  }
  ctx.drawImage(img, ox, oy, dw, dh);
}

function drawImageContain(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const r = w / h;
  let dw;
  let dh;
  let ox;
  let oy;
  if (ir > r) {
    dw = w;
    dh = w / ir;
    ox = x;
    oy = y + (h - dh) / 2;
  } else {
    dh = h;
    dw = h * ir;
    ox = x + (w - dw) / 2;
    oy = y;
  }
  ctx.drawImage(img, ox, oy, dw, dh);
}

function wrapTextLines(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let line = "";
  let yy = y;
  let lines = 0;
  for (let n = 0; n < words.length; n++) {
    const test = line ? `${line} ${words[n]}` : words[n];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      lines++;
      if (lines >= maxLines) return;
      line = words[n];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

async function renderZinePageToBlob({
  width: W,
  height: H,
  pageMode,
  photoDataUrl,
  dateLine,
  promptTitle,
  captionBody,
  marginInset,
  photoFit,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const t = Math.max(0.55, Math.min(W / 1200, H / 1700, 2.4));
  const margin = Math.round(
    Math.min(W, H) * (0.042 + ((Math.min(30, Math.max(10, marginInset)) - 10) / 20) * 0.058)
  );
  const hair = Math.max(1, Math.round(t));

  ctx.fillStyle = "#f2f0eb";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#fffef9";
  ctx.fillRect(margin, margin, W - 2 * margin, H - 2 * margin);

  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = hair;
  ctx.strokeRect(margin + hair, margin + hair, W - 2 * margin - 2 * hair, H - 2 * margin - 2 * hair);

  const innerX = margin + Math.round(14 * t);
  const innerY = margin + Math.round(14 * t);
  const innerW = W - 2 * margin - Math.round(28 * t);
  const innerH = H - 2 * margin - Math.round(28 * t);

  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.font = `600 ${Math.round(32 * t)}px -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
  ctx.fillText(dateLine || "—", innerX, innerY + Math.round(36 * t));

  const isPhoto = pageMode === "photo";
  const title = promptTitle || "Today’s prompt";

  if (isPhoto) {
    const footerH = photoDataUrl ? Math.round(52 * t) : 0;
    const imgTop = innerY + Math.round(52 * t);
    const imgBox = {
      x: innerX,
      y: imgTop,
      w: innerW,
      h: innerH - (imgTop - innerY) - footerH,
    };
    if (photoDataUrl) {
      try {
        const img = await loadImageElement(photoDataUrl);
        ctx.save();
        ctx.beginPath();
        ctx.rect(imgBox.x, imgBox.y, imgBox.w, imgBox.h);
        ctx.clip();
        if (photoFit === "contain") {
          drawImageContain(ctx, img, imgBox.x, imgBox.y, imgBox.w, imgBox.h);
        } else {
          drawImageCover(ctx, img, imgBox.x, imgBox.y, imgBox.w, imgBox.h);
        }
        ctx.restore();
      } catch {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.font = `500 ${Math.round(22 * t)}px ui-monospace, monospace`;
        ctx.fillText("Could not load image.", imgBox.x + Math.round(16 * t), imgBox.y + imgBox.h / 2);
      }
    }
    if (photoDataUrl) {
      ctx.fillStyle = "rgba(0,0,0,0.48)";
      ctx.font = `700 ${Math.round(22 * t)}px -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
      ctx.fillText(title, innerX, innerY + innerH - Math.round(18 * t));
    }
  } else {
    const bodyTrim = (captionBody || "").trim();
    if (bodyTrim) {
      const headY = innerY + Math.round(56 * t);
      ctx.fillStyle = "rgba(0,0,0,0.84)";
      ctx.font = `800 ${Math.round(30 * t)}px -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
      const titleLines = title.length > 42 ? title.slice(0, 41) + "…" : title;
      ctx.fillText(titleLines, innerX, headY);

      const bodyTop = headY + Math.round(36 * t);
      const lineH = Math.round(30 * t);
      const maxLines = Math.max(12, Math.floor((innerY + innerH - bodyTop - Math.round(20 * t)) / lineH));

      ctx.fillStyle = "rgba(0,0,0,0.68)";
      ctx.font = `500 ${Math.round(24 * t)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      wrapTextLines(ctx, bodyTrim, innerX, bodyTop, innerW, lineH, maxLines);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

function triggerDownloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function ExportPage({ entries, selectedIndex, onGoLibrary, onSelectIndex }) {
  const { GridLibraryIcon, DownloadDiskIcon, PrinterIcon } = Icons();

  const pageCount = entries.length;
  const entry = entries[selectedIndex] || entries[0];
  const canStepPage = pageCount > 1;

  function bumpPage(delta) {
    if (!canStepPage) return;
    onSelectIndex((selectedIndex + delta + pageCount) % pageCount);
  }
  const promptMeta = PROMPTS[clampPromptIndex(entry.promptIndex)];
  const isPhoto = entry.pageMode === "photo";
  const isText = entry.pageMode === "text";
  const textBody = (entry.sentence || "").trim();
  const hasPhoto = Boolean(entry.photoDataUrl);

  const [paperId, setPaperId] = useState("a5");
  const [sheetInset, setSheetInset] = useState(18);
  const [previewFit, setPreviewFit] = useState("cover");

  const paper = getPaperFormat(paperId);
  const dateLine = (entry.zineDate && entry.zineDate.trim()) || formatDefaultZineDate();

  async function handleDownloadPng() {
    const blob = await renderZinePageToBlob({
      width: paper.widthPx,
      height: paper.heightPx,
      pageMode: isPhoto ? "photo" : "text",
      photoDataUrl: isPhoto ? entry.photoDataUrl : null,
      dateLine,
      promptTitle: promptMeta.title,
      captionBody: isText ? entry.sentence : "",
      marginInset: sheetInset,
      photoFit: previewFit,
    });
    triggerDownloadBlob(blob, `zine-p${selectedIndex + 1}-${paper.id}-${EXPORT_DPI}dpi.png`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="pageStack exportPage">
      <NmNavRow className="nmNavRowDense exportTopLinks">
        <NmNavPill href="#/mood" title="Mood" subtitle="Theme" />
        <NmNavPill href="#/library" title="Zine" subtitle="Grid" />
        <NmNavPill href="#/prompt" title="Prompt" subtitle="Edit" />
      </NmNavRow>

      <header className="uiScreenHead uiScreenHeadTight">
        <h2 className="uiScreenTitle">Print zine</h2>
      </header>

      {pageCount > 0 ? (
        <div
          className="exportPgBar"
          role="navigation"
          aria-label={`Page ${selectedIndex + 1} of ${pageCount}`}
        >
          <button
            type="button"
            className="exportPgStepBtn"
            onClick={() => bumpPage(-1)}
            disabled={!canStepPage}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="exportPgLabel">
            {selectedIndex + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="exportPgStepBtn"
            onClick={() => bumpPage(1)}
            disabled={!canStepPage}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      ) : null}

      <div className="exportPaperPicker" role="group" aria-label="Paper size">
        {PAPER_FORMATS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={"exportPaperBtn" + (paperId === p.id ? " exportPaperBtnOn" : "")}
            onClick={() => setPaperId(p.id)}
          >
            <span className="exportPaperBtnLabel">{p.label}</span>
            <span className="exportPaperBtnSub">{p.sub}</span>
          </button>
        ))}
      </div>

      <div className="zinePaperStage">
        <div
          className="zinePaperSheet"
          style={{
            aspectRatio: `${paper.wMm} / ${paper.hMm}`,
          }}
        >
          <div className="zinePaperSheetInner" style={{ padding: sheetInset }}>
            <div className="zinePaperFibers" aria-hidden />
            <div className="zinePaperDate exportDateStaticWrap">
              <p className="exportDateStatic">{dateLine}</p>
            </div>
            {isPhoto ? (
              <div className={"exportPhotoSlot zinePaperPhoto" + (hasPhoto ? "" : " exportPhotoSlotBlank")}>
                {hasPhoto ? (
                  <img
                    src={entry.photoDataUrl}
                    alt=""
                    className="exportPhotoImg"
                    style={{ objectFit: previewFit }}
                  />
                ) : null}
              </div>
            ) : (
              <div className="exportTextOnlyBlock zinePaperTextBlock">
                {textBody ? (
                  <>
                    <div className="exportCaptionTitle">{promptMeta.title}</div>
                    <div className="exportCaptionBodyReadonly">{entry.sentence}</div>
                  </>
                ) : (
                  <div className="exportPageBodyBlank" aria-hidden />
                )}
              </div>
            )}
            {isPhoto && hasPhoto ? <div className="zinePaperFooterTitle">{promptMeta.title}</div> : null}
          </div>
        </div>
      </div>

      <div className="exportDimRow">
        <span className="exportDimLabel">Print margin</span>
        <button
          type="button"
          className="exportDimBtn"
          onClick={() => setSheetInset((v) => Math.max(10, v - 2))}
        >
          −
        </button>
        <input
          className="exportDimSlider"
          type="range"
          min={10}
          max={30}
          value={sheetInset}
          onChange={(e) => setSheetInset(Number(e.target.value))}
          aria-label="Print margin"
        />
        <button
          type="button"
          className="exportDimBtn"
          onClick={() => setSheetInset((v) => Math.min(30, v + 2))}
        >
          +
        </button>
      </div>

      <div className="exportToolRow">
        {isPhoto ? (
          <>
            <button
              type="button"
              className={"exportChipBtn" + (previewFit === "cover" ? " exportChipBtnOn" : "")}
              onClick={() => setPreviewFit("cover")}
            >
              Bleed fill
            </button>
            <button
              type="button"
              className={"exportChipBtn" + (previewFit === "contain" ? " exportChipBtnOn" : "")}
              onClick={() => setPreviewFit("contain")}
            >
              Full photo
            </button>
          </>
        ) : null}
        <button type="button" className="exportChipBtn" onClick={() => setSheetInset(18)}>
          Reset margin
        </button>
      </div>

      <div className="exportBottomActions">
        <button type="button" className="exportRoundBtn" onClick={onGoLibrary} aria-label="Library">
          <GridLibraryIcon />
        </button>
        <button type="button" className="exportRoundBtn" onClick={handleDownloadPng} aria-label="Download PNG">
          <DownloadDiskIcon />
        </button>
        <button type="button" className="exportRoundBtn" onClick={handlePrint} aria-label="Print">
          <PrinterIcon />
        </button>
      </div>

      <div className="spacerGrow" />
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(() => hashRoute());
  const [entries, setEntries] = useState(() => loadEntries());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dailyMoodId, setDailyMoodId] = useState(() => loadDailyMood());

  useEffect(() => {
    const onHashChange = () => setRoute(hashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    function syncMoodFromStorage() {
      setDailyMoodId(loadDailyMood());
    }
    syncMoodFromStorage();
    const onVis = () => {
      if (document.visibilityState === "visible") syncMoodFromStorage();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (dailyMoodId) applyMoodTheme(dailyMoodId);
    else resetMoodThemeToDefaults();
  }, [dailyMoodId]);

  useEffect(() => {
    persistEntries(entries);
  }, [entries]);

  useEffect(() => {
    const h = window.location.hash;
    if (!h || h === "#" || h === "#/") {
      navigate(loadDailyMood() ? "#/prompt" : "#/mood");
    }
  }, []);

  useEffect(() => {
    if (dailyMoodId) return;
    if (route === "mood" || route === "") return;
    navigate("#/mood");
  }, [route, dailyMoodId]);

  function onSelectTile(idx) {
    setSelectedIndex(idx);
  }

  function onEdit() {
    navigate("#/prompt");
  }

  function onExport() {
    navigate("#/export");
  }

  function onChangeEntry(nextEntry) {
    setEntries((prev) => {
      const copy = [...prev];
      copy[selectedIndex] = { ...copy[selectedIndex], ...nextEntry, id: selectedIndex };
      return copy;
    });
  }

  function onNewPrompt({ resetEntry, newPromptIndex, clearSentence } = {}) {
    setEntries((prev) => {
      const copy = [...prev];
      const current = copy[selectedIndex];
      if (resetEntry) {
        copy[selectedIndex] = {
          ...current,
          id: selectedIndex,
          sentence: "",
          photoDataUrl: null,
          promptIndex: 0,
          zineDate: "",
          pageMode: "text",
        };
        return copy;
      }
      const nextIdx =
        typeof newPromptIndex === "number"
          ? clampPromptIndex(newPromptIndex)
          : clampPromptIndex(current.promptIndex + 1);
      copy[selectedIndex] = {
        ...current,
        id: selectedIndex,
        promptIndex: nextIdx,
        ...(clearSentence ? { sentence: "" } : {}),
      };
      return copy;
    });
  }

  const selectedEntry = entries[selectedIndex] || entries[0];

  function handlePickMood(id) {
    saveDailyMood(id);
    setDailyMoodId(id);
    applyMoodTheme(id);
    navigate("#/prompt");
  }

  return (
    <PhoneShell>
      {route === "mood" ? (
        <MoodPage
          savedMoodId={dailyMoodId}
          onPickMood={handlePickMood}
          onContinue={() => navigate("#/prompt")}
        />
      ) : route === "library" ? (
        <LibraryPage
          entries={entries}
          selectedIndex={selectedIndex}
          onSelectTile={onSelectTile}
          onEdit={onEdit}
          onExport={onExport}
        />
      ) : route === "export" ? (
        <ExportPage
          entries={entries}
          selectedIndex={selectedIndex}
          onGoLibrary={() => navigate("#/library")}
          onSelectIndex={setSelectedIndex}
        />
      ) : (
        <NewPromptPage entry={selectedEntry} onChangeEntry={onChangeEntry} onNewPrompt={onNewPrompt} />
      )}
    </PhoneShell>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
