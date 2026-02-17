import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { blogService, type BlogPost } from "../lib/blogService";
import { settingsService } from "../lib/settingsService";
import { supabase } from "../lib/supabase";
import {
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Pencil,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GripVertical,
  ImagePlus,
  Settings,
  Crop,
} from "lucide-react";
import { SpotlightCropModal } from "../components/SpotlightCropModal";

const gridStyles = `
.blog-photo-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
@media (min-width: 640px) {
  .blog-photo-grid { gap: 16px; }
}
@media (min-width: 1024px) {
  .blog-photo-grid { gap: 20px; }
}

.blog-photo-item {
  position: relative;
  overflow: hidden;
  max-height: 75vh;
  scroll-margin-top: 100px;
}

.blog-grid-wrapper {
  scroll-margin-top: 120px;
  overflow-anchor: none;
}

.blog-post-article {
  scroll-margin-top: 80px;
}

/* Desktop: Default 3 columns (span 2) */
/* Desktop: 6-column base */
@media (min-width: 1024px) {
  .blog-photo-item { grid-column: span 2; aspect-ratio: 4/3; }
  
  .blog-photo-item.span-1 { grid-column: span 2; aspect-ratio: 4/3; } /* 1/3 */
  .blog-photo-item.span-2 { grid-column: span 3; aspect-ratio: 3/2; } /* 1/2 */
  .blog-photo-item.span-3 { grid-column: span 4; aspect-ratio: 16/9; } /* 2/3 */
  .blog-photo-item.span-4 { grid-column: span 6; aspect-ratio: 21/9; } /* Full */
}
@media (max-width: 1023px) {
  .blog-photo-item { grid-column: span 6; aspect-ratio: 16/9; } 
  .blog-photo-item.span-1 { grid-column: span 6; }
}
`;

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                             */
/* ═══════════════════════════════════════════════════════════════════ */
interface BlogHeroSettings {
  background_image: string;
  title_en: string;
  title_bg: string;
  subtitle_en: string;
  subtitle_bg: string;
  font_family?: string;
  sub_font?: string;
  sub_size?: number;
  sub_color?: string;
  sub_opacity?: number;
  sub_weight?: string;
  bg_opacity?: number;
  bg_blur?: number;
}

const FONT_OPTIONS = [
  { name: "Elegant Serif", value: "'Cormorant Garamond', serif" },
  { name: "Modern Fashion", value: "'Playfair Display', serif" },
  { name: "Clean Minimal", value: "'Montserrat', sans-serif" },
  { name: "Bold Impact", value: "'Oswald', sans-serif" },
  { name: "Artistic", value: "'Philosopher', sans-serif" },
  { name: "Classic Bold", value: "'Yeseva One', serif" },
  { name: "Handwritten", value: "'Bad Script', cursive" },
  { name: "Inter", value: "Inter" },
  { name: "Raleway", value: "Raleway" },
  { name: "Lora", value: "Lora" },
  { name: "Merriweather", value: "Merriweather" },
  { name: "Poppins", value: "Poppins" },
  { name: "Roboto Slab", value: "Roboto Slab" },
  { name: "Dancing Script", value: "Dancing Script" },
  { name: "Great Vibes", value: "Great Vibes" },
  { name: "Cinzel", value: "Cinzel" },
  { name: "Bebas Neue", value: "Bebas Neue" },
  { name: "Abril Fatface", value: "Abril Fatface" },
  { name: "Josefin Sans", value: "Josefin Sans" },
  { name: "Libre Baskerville", value: "Libre Baskerville" },
  { name: "Nunito", value: "Nunito" },
  { name: "Crimson Text", value: "Crimson Text" },
  { name: "DM Serif Display", value: "DM Serif Display" },
  { name: "Italiana", value: "Italiana" },
  { name: "Bodoni Moda", value: "Bodoni Moda" },
  { name: "Sugo Display", value: "'Sugo Display', sans-serif" },
  { name: "Kingred Modern", value: "'Kingred Modern', serif" },
  { name: "Sugar Pie", value: "'Sugar Pie', cursive" },
  { name: "Tan Headline", value: "'TAN HEADLINE', serif" },
  { name: "Hobo", value: "'Hobo', cursive" },
  { name: "Satyr", value: "'Satyr', serif" },
  { name: "Gang of Three", value: "'Gang of Three', sans-serif" },
  { name: "Subway NewYork", value: "'Subway NewYork OT W03 Regular', sans-serif" },
  { name: "Ethnocentric", value: "'Ethnocentric Rg', sans-serif" },
  { name: "Blackburr", value: "'Blackburr', sans-serif" },
];

const COLOR_OPTIONS = [
  { name: "White", value: "#ffffff" },
  { name: "Gold", value: "#d4af37" },
  { name: "Silver/Gray", value: "#a1a1aa" },
  { name: "Soft Rose", value: "#fda4af" },
];

const DEFAULT_HERO: BlogHeroSettings = {
  background_image: "",
  title_en: "Photoshoots",
  title_bg: "Фотосесии",
  subtitle_en:
    "Behind the scenes of our most exciting photoshoots from the fashion world.",
  subtitle_bg:
    "Зад кулисите на нашите най-вълнуващи фотосесии от света на модата.",
  font_family: "'Cormorant Garamond', serif",
  sub_font: "'Montserrat', sans-serif",
  sub_size: 16,
  sub_color: "#ffffff",
  sub_opacity: 0.5,
  sub_weight: "300",
  bg_opacity: 0.4,
  bg_blur: 0,
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Helper — Blog Hero Settings read / write                          */
/* ═══════════════════════════════════════════════════════════════════ */
const blogHeroService = {
  async get(): Promise<BlogHeroSettings> {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "blog_hero")
      .maybeSingle();

    if (error || !data?.value) return DEFAULT_HERO;
    try {
      return JSON.parse(data.value);
    } catch {
      return DEFAULT_HERO;
    }
  },

  async set(settings: BlogHeroSettings): Promise<void> {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "blog_hero",
        value: JSON.stringify(settings),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw error;
  },

  async uploadBg(file: File): Promise<string> {
    const path = `blog/hero/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("models")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("models").getPublicUrl(path);
    return publicUrl;
  },
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Photo Lightbox                                                    */
/* ═══════════════════════════════════════════════════════════════════ */
const PhotoLightbox: React.FC<{
  images: (string | { url: string; span?: number })[];
  startIndex: number;
  onClose: () => void;
}> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white z-50 p-2"
      >
        <X className="w-7 h-7" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i - 1 + images.length) % images.length);
            }}
            className="absolute left-4 md:left-8 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i + 1) % images.length);
            }}
            className="absolute right-4 md:right-8 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <motion.img
        key={idx}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        src={
          typeof images[idx] === "string"
            ? (images[idx] as string)
            : (images[idx] as { url: string }).url
        }
        alt=""
        className="max-w-[95vw] max-h-[90vh] object-contain select-none shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Hero Editor Modal (admin only)                                    */
/* ═══════════════════════════════════════════════════════════════════ */
const HeroEditorModal: React.FC<{
  settings: BlogHeroSettings;
  onSave: (s: BlogHeroSettings, file?: File) => Promise<void>;
  onClose: () => void;
}> = ({ settings, onSave, onClose }) => {
  const [form, setForm] = useState<BlogHeroSettings>({ ...settings });
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string>(
    settings.background_image || "",
  );
  const [saving, setSaving] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  const handleBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageToCrop(url);
      setCropModalOpen(true);
    }
  };

  const handleCropComplete = async (croppedUrl: string) => {
    try {
      setBgPreview(croppedUrl);
      const response = await fetch(croppedUrl);
      const blob = await response.blob();
      const file = new File([blob], `blog_hero_bg_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      setBgFile(file);
    } catch (err) {
      console.error("Error handling crop:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form, bgFile || undefined);
      onClose();
    } catch {
      /* toast handled upstream */
    } finally {
      setSaving(false);
    }
  };

  const cls =
    "w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-gold-accent/50 transition-colors placeholder:text-white/20";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface border border-white/10 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-serif text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-gold-accent" /> Hero Settings
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-6 max-h-[70vh] overflow-y-auto"
        >
          {/* Title Settings */}
          <div className="space-y-3 p-4 bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">
              Title Typography
            </p>
            <div className="grid grid-cols-1 gap-3">
              <select
                className={cls}
                value={form.font_family}
                onChange={(e) =>
                  setForm((f) => ({ ...f, font_family: e.target.value }))
                }
              >
                {FONT_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{ fontFamily: opt.value, background: "#111" }}
                  >
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                className={cls}
                placeholder="Title (EN)"
                value={form.title_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title_en: e.target.value }))
                }
              />
              <input
                className={cls}
                placeholder="Заглавие (BG)"
                value={form.title_bg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title_bg: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Subtitle Settings */}
          <div className="space-y-3 p-4 bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">
              Subtitle Design
            </p>
            <div className="grid grid-cols-2 gap-3">
              <select
                className={cls}
                value={form.sub_font}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sub_font: e.target.value }))
                }
              >
                {FONT_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{ fontFamily: opt.value, background: "#111" }}
                  >
                    {opt.name}
                  </option>
                ))}
              </select>
              <select
                className={cls}
                value={form.sub_color}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sub_color: e.target.value }))
                }
              >
                {COLOR_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{ color: opt.value, background: "#111" }}
                  >
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/40 mb-1">
                  <span>Font Size: {form.sub_size}px</span>
                  <span>
                    Opacity: {Math.round((form.sub_opacity || 0.5) * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="range"
                    min="12"
                    max="32"
                    step="1"
                    className="accent-gold-accent"
                    value={form.sub_size}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sub_size: Number(e.target.value),
                      }))
                    }
                  />
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    className="accent-gold-accent"
                    value={form.sub_opacity}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sub_opacity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
                  Weight
                </p>
                <div className="flex gap-2">
                  {["300", "400", "600"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, sub_weight: w }))}
                      className={`px-3 py-1 text-[10px] border transition-colors ${form.sub_weight === w ? "bg-gold-accent text-black border-gold-accent" : "border-white/10 text-white/50"}`}
                    >
                      {w === "300" ? "Thin" : w === "400" ? "Regular" : "Bold"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <textarea
                className={cls + " min-h-[60px] resize-none"}
                placeholder="Subtitle (EN)"
                value={form.subtitle_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subtitle_en: e.target.value }))
                }
              />
              <textarea
                className={cls + " min-h-[60px] resize-none"}
                placeholder="Подзаглавие (BG)"
                value={form.subtitle_bg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subtitle_bg: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Background Settings */}
          <div className="space-y-3 p-4 bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">
              Hero Background Image
            </p>
            <div className="flex gap-4 items-center">
              {bgPreview && (
                <div className="relative w-32 aspect-video group shrink-0">
                  <img
                    src={bgPreview}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBgFile(null);
                        setBgPreview("");
                      }}
                      className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageToCrop(bgPreview);
                        setCropModalOpen(true);
                      }}
                      className="p-1.5 bg-gold-accent/80 text-black rounded-full hover:bg-gold-accent"
                    >
                      <Crop className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer text-white/50 hover:text-gold-accent transition-colors text-xs border border-dashed border-white/20 hover:border-gold-accent/50 px-4 py-3">
                <Upload className="w-4 h-4" />{" "}
                {bgPreview ? "Change" : "Upload Background"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBg}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/40">
                  <span>Darkness: {Math.round((form.bg_opacity || 0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  className="w-full accent-gold-accent"
                  value={form.bg_opacity ?? 0.4}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bg_opacity: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/40">
                  <span>Blur: {form.bg_blur || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  className="w-full accent-gold-accent"
                  value={form.bg_blur ?? 0}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bg_blur: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>

          <SpotlightCropModal
            isOpen={cropModalOpen}
            onClose={() => setCropModalOpen(false)}
            imageUrl={imageToCrop || ""}
            onCropComplete={handleCropComplete}
            aspectRatio={21 / 9}
          />

          <div className="flex justify-end pt-3 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gold-accent text-black text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Draggable Image Item                                              */
/* ═══════════════════════════════════════════════════════════════════ */
const DraggableImage: React.FC<{
  src: string | { url: string; span?: number };
  index: number;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDragEnd: () => void;
  onRemove: (i: number) => void;
  isCover?: boolean;
  onSetCover?: (i: number) => void;
}> = ({
  src,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
  isCover,
  onSetCover,
}) => {
  const url = typeof src === "string" ? src : src.url;
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className={`relative aspect-square group cursor-grab active:cursor-grabbing border-2 transition-colors ${
        isCover
          ? "border-gold-accent"
          : "border-transparent hover:border-white/20"
      }`}
    >
      <img src={url} className="w-full h-full object-cover" alt="" />
      <div className="absolute top-1 left-1 p-0.5 bg-black/60 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3" />
      </div>
      {isCover && (
        <div className="absolute bottom-0 inset-x-0 bg-gold-accent/90 text-black text-center py-0.5 text-[8px] font-bold uppercase tracking-widest">
          Cover
        </div>
      )}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isCover && onSetCover && (
          <button
            type="button"
            onClick={() => onSetCover(index)}
            className="p-1 bg-gold-accent/80 text-black"
            title="Set as cover"
          >
            <ImagePlus className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 bg-red-500/80 text-white"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Post Editor Modal                                                 */
/* ═══════════════════════════════════════════════════════════════════ */
const PostEditorModal: React.FC<{
  post?: BlogPost | null;
  onSave: (
    data: Partial<BlogPost>,
    files?: File[],
    bgFile?: File,
  ) => Promise<void>;
  onClose: () => void;
}> = ({ post, onSave, onClose }) => {
  const { i18n } = useTranslation();
  const isBg = i18n.language === "bg";
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: post?.title || "",
    title_bg: post?.title_bg || "",
    description: post?.description || "",
    description_bg: post?.description_bg || "",
    location: post?.location || "",
    date: post?.date?.split("T")[0] || new Date().toISOString().split("T")[0],
    tags: post?.tags?.join(", ") || "",
    is_published: post?.is_published ?? false,
    slug: post?.slug || "",
    sort_order: post?.sort_order || 0,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(
    post?.cover_image || null,
  );
  const [existingImages, setExistingImages] = useState<
    (string | { url: string; span?: number })[]
  >(post?.images || []);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // Helper to get filename from URL (format: blog/slug/timestamp_filename.jpg)
    const getFileNameFromUrl = (url: string) => {
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];
      const underscoreIndex = lastPart.indexOf("_");
      if (underscoreIndex === -1) return lastPart;
      return lastPart.substring(underscoreIndex + 1);
    };

    // Сравняваме имената на новите файлове с имената на:
    // 1. Вече избраните нови файлове (files)
    // 2. Вече съществуващите снимки в албума (existingImages)
    const existingNames = new Set([
      ...files.map((f) => f.name),
      ...existingImages.map((img) =>
        getFileNameFromUrl(typeof img === "string" ? img : img.url),
      ),
    ]);
    const duplicates: string[] = [];
    const uniqueFiles: File[] = [];

    selected.forEach((file) => {
      if (existingNames.has(file.name)) {
        duplicates.push(file.name);
      } else {
        uniqueFiles.push(file);
      }
    });

    if (duplicates.length > 0) {
      const truncate = (name: string) =>
        name.length > 15 ? name.substring(0, 12) + "..." : name;

      if (duplicates.length === 1) {
        const msg =
          i18n.language === "bg"
            ? `Снимка "${truncate(duplicates[0])}" вече е добавена`
            : `Photo "${truncate(duplicates[0])}" is already added`;
        showToast(msg, "error");
      } else {
        const displayCount = 2;
        const shown = duplicates
          .slice(0, displayCount)
          .map(truncate)
          .join(", ");
        const remaining = duplicates.length - displayCount;

        const msg =
          i18n.language === "bg"
            ? `${duplicates.length} снимки ("${shown}"${remaining > 0 ? ` + още ${remaining}` : ""}) вече са добавени`
            : `${duplicates.length} photos ("${shown}"${remaining > 0 ? ` + ${remaining} more` : ""}) are already added`;
        showToast(msg, "error");
      }
    }

    if (uniqueFiles.length > 0) {
      setFiles((prev) => [...prev, ...uniqueFiles]);
      setPreviews((prev) => [
        ...prev,
        ...uniqueFiles.map((f) => URL.createObjectURL(f)),
      ]);
    }

    // Reset input so the same file can be picked again if removed
    e.target.value = "";
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageToCrop(url);
      setCropModalOpen(true);
    }
  };

  const handleCropComplete = async (croppedUrl: string) => {
    try {
      setBgPreview(croppedUrl);
      const response = await fetch(croppedUrl);
      const blob = await response.blob();
      const file = new File([blob], "cropped_cover.jpg", {
        type: "image/jpeg",
      });
      setBgFile(file);
    } catch (err) {
      console.error("Error handling crop:", err);
      showToast("Error processing cropped image", "error");
    }
  };

  const removePreview = (idx: number) => {
    setPreviews((p) => p.filter((_, i) => i !== idx));
    setFiles((f) => f.filter((_, i) => i !== idx));
  };

  const removeExisting = (idx: number) =>
    setExistingImages((p) => p.filter((_, i) => i !== idx));

  const handleExistingDragStart = (idx: number) => setDragIdx(idx);
  const handleExistingDragOver = (overIdx: number) => {
    if (dragIdx === null || dragIdx === overIdx) return;
    setExistingImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(dragIdx, 1);
      copy.splice(overIdx, 0, item);
      return copy;
    });
    setDragIdx(overIdx);
  };
  const handleExistingDragEnd = () => setDragIdx(null);

  const setAsCover = (idx: number) => {
    setExistingImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let slug = form.slug || post?.slug;
      if (!slug) {
        // Generate slug from title if not manually provided
        slug = form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        if (!slug) slug = "post-" + Date.now();
      }

      await onSave(
        {
          ...form,
          slug,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          images: existingImages,
          cover_image: bgPreview || null,
        },
        files.length > 0 ? files : undefined,
        bgFile || undefined,
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const cls =
    "w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-gold-accent/50 transition-colors placeholder:text-white/20";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl my-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-serif text-white">
            {post ? "Edit Photoshoot" : "New Photoshoot"}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className={cls}
              placeholder="Title (EN)"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
            <input
              className={cls}
              placeholder="Заглавие (BG)"
              value={form.title_bg}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_bg: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              className={cls + " min-h-[80px] resize-none"}
              placeholder="Description (EN)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <textarea
              className={cls + " min-h-[80px] resize-none"}
              placeholder="Описание (BG)"
              value={form.description_bg}
              onChange={(e) =>
                setForm((f) => ({ ...f, description_bg: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
              <input
                className={cls + " pl-10"}
                placeholder="Location"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <input
              type="date"
              className={cls}
              value={form.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                className={cls}
                placeholder="URL Slug (e.g. summer-shoot)"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-"),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="number"
                className={cls}
                placeholder={isBg ? "Приоритет (0)" : "Priority (0)"}
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sort_order: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-white/30">
              Tags (comma separated)
            </p>
            <textarea
              className={cls + " min-h-[60px] resize-none"}
              placeholder="photography, fashion, lifestyle..."
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>

          {/* Post cover image */}
          <div className="border border-white/10 p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-gold-accent font-bold flex items-center gap-2">
              <ImagePlus className="w-3.5 h-3.5" /> Post Cover Image
            </p>
            <div className="flex gap-4 items-center">
              {bgPreview && (
                <div className="relative w-32 aspect-video group shrink-0">
                  <img
                    src={bgPreview}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBgFile(null);
                        setBgPreview(null);
                      }}
                      className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageToCrop(bgPreview!);
                        setCropModalOpen(true);
                      }}
                      className="p-1.5 bg-gold-accent/80 text-black rounded-full hover:bg-gold-accent"
                    >
                      <Crop className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer text-white/50 hover:text-gold-accent transition-colors text-xs border border-dashed border-white/20 hover:border-gold-accent/50 px-4 py-3">
                <Upload className="w-4 h-4" />{" "}
                {bgPreview ? "Change" : "Upload Cover"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgChange}
                />
              </label>
            </div>
          </div>

          <SpotlightCropModal
            isOpen={cropModalOpen}
            onClose={() => setCropModalOpen(false)}
            imageUrl={imageToCrop || ""}
            onCropComplete={handleCropComplete}
            aspectRatio={3 / 1}
          />

          {/* Gallery photos */}
          <div className="border border-white/10 p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-gold-accent font-bold flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Gallery Photos
              <span className="text-white/30 font-normal ml-auto">
                Drag to reorder
              </span>
            </p>
            <label className="flex items-center gap-2 cursor-pointer text-white/50 hover:text-gold-accent transition-colors text-xs border border-dashed border-white/20 hover:border-gold-accent/50 px-4 py-3 w-fit">
              <Upload className="w-4 h-4" /> Add Photos
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {existingImages.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/30 mb-2">
                  Current ({existingImages.length}) — Drag to reorder
                </p>
                <div className="grid grid-cols-5 md:grid-cols-6 gap-1.5">
                  {existingImages.map((src, i) => (
                    <DraggableImage
                      key={(typeof src === "string" ? src : src.url) + i}
                      src={src}
                      index={i}
                      isCover={i === 0}
                      onDragStart={handleExistingDragStart}
                      onDragOver={handleExistingDragOver}
                      onDragEnd={handleExistingDragEnd}
                      onRemove={removeExisting}
                      onSetCover={setAsCover}
                    />
                  ))}
                </div>
              </div>
            )}

            {previews.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/30 mb-2">
                  New uploads ({previews.length})
                </p>
                <div className="grid grid-cols-5 md:grid-cols-6 gap-1.5">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square group">
                      <img
                        src={src}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(i)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_published: e.target.checked }))
                }
                className="accent-gold-accent"
              />
              {form.is_published ? (
                <>
                  <Eye className="w-4 h-4" /> Published
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Draft
                </>
              )}
            </label>
            <button
              type="submit"
              disabled={saving || !form.title}
              className="px-8 py-3 bg-gold-accent text-black text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Photo Item Component                                               */
/* ═══════════════════════════════════════════════════════════════════ */
const PhotoItem: React.FC<{
  img: string | { url: string; span?: number };
  imgIdx: number;
  post: BlogPost;
  isAdmin: boolean;
  setLightbox: (val: { images: string[]; index: number }) => void;
  gridDrag: { postId: string; idx: number } | null;
  handleGridDragStart: (postId: string, idx: number) => void;
  handleGridDragOver: (postId: string, idx: number) => void;
  handleGridDragEnd: () => void;
  onResize?: (postId: string, idx: number) => void;
  onCrop?: (postId: string, idx: number, url: string, span: number) => void;
}> = ({
  img,
  imgIdx,
  post,
  isAdmin,
  setLightbox,
  gridDrag,
  handleGridDragStart,
  handleGridDragOver,
  handleGridDragEnd,
  onResize,
  onCrop,
}) => {
  const url = typeof img === "string" ? img : img.url;
  const span = typeof img === "string" ? 1 : img.span || 1;
  const imagesAsStrings = post.images.map((i) =>
    typeof i === "string" ? i : i.url,
  );

  return (
    <motion.div
      layout
      draggable={isAdmin}
      onDragStart={() => handleGridDragStart(post.id, imgIdx)}
      onDragOver={(e) => {
        e.preventDefault();
        handleGridDragOver(post.id, imgIdx);
      }}
      onDragEnd={handleGridDragEnd}
      className={`blog-photo-item relative overflow-hidden group/img span-${span} ${
        isAdmin ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${gridDrag?.postId === post.id && gridDrag?.idx === imgIdx ? "opacity-40 scale-95" : "opacity-100"}`}
      onClick={() =>
        !isAdmin && setLightbox({ images: imagesAsStrings, index: imgIdx })
      }
    >
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-[1.05] group-hover/img:brightness-110"
        loading="lazy"
      />
      {isAdmin && (
        <div className="absolute top-2 left-2 flex gap-2 z-30 opacity-0 group-hover/img:opacity-100 transition-all duration-300">
          <div className="p-2 bg-black/70 text-white/50 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xl">
            <GripVertical className="w-4 h-4" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResize?.(post.id, imgIdx);
            }}
            className="px-3 py-1.5 bg-gold-accent text-black rounded-full hover:bg-white transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2 group/btn"
          >
            <Settings className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform duration-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {span === 4
                ? "FULL"
                : span === 3
                  ? "WIDE"
                  : span === 2
                    ? "HALF"
                    : "REG"}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCrop?.(post.id, imgIdx, url, span);
            }}
            className="p-1.5 bg-black/70 text-white rounded-full hover:bg-gold-accent hover:text-black transition-all duration-300 backdrop-blur-md shadow-xl border border-white/10"
            title="Crop Photo"
          >
            <Crop className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-all duration-500" />
      {isAdmin && (
        <div
          className="absolute inset-x-0 bottom-0 h-8 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setLightbox({ images: imagesAsStrings, index: imgIdx });
          }}
        >
          <Eye className="w-3 h-3 text-white/70 mr-1" />
          <span className="text-[8px] text-white/70 uppercase tracking-tighter">
            View
          </span>
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Blog Page                                                    */
/* ═══════════════════════════════════════════════════════════════════ */
const Blog: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const isBg = i18n.language === "bg";

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});

  const [hero, setHero] = useState<BlogHeroSettings>(DEFAULT_HERO);
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);

  const [gridDrag, setGridDrag] = useState<{
    postId: string;
    idx: number;
  } | null>(null);
  const [photoToCrop, setPhotoToCrop] = useState<{
    postId: string;
    idx: number;
    url: string;
    span: number;
  } | null>(null);
  const galleryRestoreYRef = useRef<Record<string, number>>({});
  const galleryMenuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );

  // No need for a separate scrollToPost function anymore.
  // We will handle the scroll logic directly in the collapse handlers 
  // or via a dedicated effect if needed, but for now let's clean up the old one.
  /* ── Enhanced Scroll & Collapse Logic (Premium Stability) ── */
  const handleExpandGallery = (postId: string) => {
    galleryRestoreYRef.current[postId] = window.scrollY;
    setExpandedPost(postId);
  };

  const handleCollapseGallery = (
    postId: string,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const currentY = window.scrollY;
    const anchorTop =
      galleryMenuButtonRefs.current[postId]?.getBoundingClientRect().top ??
      event?.currentTarget.getBoundingClientRect().top ??
      Number.POSITIVE_INFINITY;
    const buttonY = Math.max(0, currentY + anchorTop - 120);
    const restoreY = galleryRestoreYRef.current[postId];
    const preferredY =
      typeof restoreY === "number" ? Math.min(buttonY, restoreY) : buttonY;
    const targetY = Math.min(currentY, preferredY);

    if (Number.isFinite(targetY) && targetY < currentY - 1) {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
    setExpandedPost((prev) => (prev === postId ? null : prev));
  };

  const toggleDescription = (postId: string) => {
    setExpandedDesc((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  /* ── Load hero settings ── */
  useEffect(() => {
    const loadHero = async () => {
      try {
        const [heroData, pageBgs] = await Promise.all([
          blogHeroService.get(),
          settingsService.getPageBackgrounds(),
        ]);

        // Prioritize bg_blog from the standalone key if it exists
        setHero((prev) => ({
          ...heroData,
          background_image: pageBgs.bg_blog || heroData.background_image,
        }));
      } catch (err) {
        console.error("Error loading blog hero:", err);
      }
    };
    loadHero();
  }, []);

  /* ── Load posts ── */
  const loadPosts = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const data = isAdmin
          ? await blogService.getAllPosts()
          : await blogService.getPublishedPosts();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    loadPosts(true);
  }, [loadPosts]);

  /* ── Background Real-time Listener ── */
  useEffect(() => {
    const channel = supabase
      .channel("blog_bg_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_settings" },
        (payload: any) => {
          if (payload.new.key === "bg_blog") {
            setHero((prev) => ({
              ...prev,
              background_image: payload.new.value,
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── Real-time ── */
  useEffect(() => {
    const ch = supabase
      .channel("blog_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blog_posts" },
        () => loadPosts(false),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadPosts]);

  /* ── Save hero settings ── */
  const handleSaveHero = async (s: BlogHeroSettings, file?: File) => {
    try {
      let bg = s.background_image;
      if (file) bg = await blogHeroService.uploadBg(file);
      const updated = { ...s, background_image: bg };

      // Update both the JSON object and the standalone background key for consistency
      await Promise.all([
        blogHeroService.set(updated),
        settingsService.setHeroSetting("bg_blog", bg),
      ]);

      setHero(updated);
      showToast("Hero updated!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
      throw err;
    }
  };

  /* ── Save post ── */
  const handleSavePost = async (
    data: Partial<BlogPost>,
    files?: File[],
    bgFile?: File,
  ) => {
    try {
      let images = data.images || editingPost?.images || [];
      const slug = data.slug || editingPost?.slug || "temp";

      if (files && files.length > 0) {
        for (const file of files) {
          const url = await blogService.uploadImage(file, slug);
          images = [...images, url];
        }
      }

      // Final uniqueness check for images (based on URL)
      const seen = new Set();
      images = images.filter((img) => {
        const url = typeof img === "string" ? img : img.url;
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });

      let cover_image = data.cover_image;
      if (bgFile) {
        cover_image = await blogService.uploadImage(bgFile, slug + "/cover");
      }

      if (editingPost) {
        await blogService.updatePost(editingPost.id, {
          ...data,
          images,
          cover_image,
        });
        showToast("Post updated!", "success");
      } else {
        await blogService.createPost({ ...data, images, cover_image });
        showToast("Post created!", "success");
      }
      setEditingPost(null);
      await loadPosts();
    } catch (err: any) {
      if (
        err.code === "23505" &&
        err.message?.includes("blog_posts_slug_key")
      ) {
        showToast(
          isBg
            ? "Вече съществува публикация с това заглавие/slug. Моля, променете заглавието."
            : "A post with this title/slug already exists. Please change the title.",
          "error",
        );
      } else {
        showToast(err.message, "error");
      }
      throw err;
    }
  };

  /* ── Delete post ── */
  const handleDeletePost = async (post: BlogPost) => {
    if (!window.confirm("Delete this photoshoot?")) return;
    try {
      for (const img of post.images) {
        const url = typeof img === "string" ? img : img.url;
        await blogService.deleteImage(url);
      }
      if (post.cover_image) await blogService.deleteImage(post.cover_image);
      await blogService.deletePost(post.id);
      showToast("Post deleted", "success");
      await loadPosts();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  /* ── Grid Drag Handlers ── */
  const handleGridDragStart = (postId: string, idx: number) => {
    if (!isAdmin) return;
    setGridDrag({ postId, idx });
  };

  const handleGridDragOver = (postId: string, overIdx: number) => {
    if (!gridDrag || gridDrag.postId !== postId || gridDrag.idx === overIdx)
      return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const newImages = [...p.images];
        const [removed] = newImages.splice(gridDrag.idx, 1);
        newImages.splice(overIdx, 0, removed);
        return { ...p, images: newImages };
      }),
    );
    setGridDrag({ postId, idx: overIdx });
  };

  const handleResize = async (postId: string, idx: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newImages = [...post.images];
    const current = newImages[idx];
    const url = typeof current === "string" ? current : current.url;
    const currentSpan = typeof current === "string" ? 1 : current.span || 1;
    const nextSpan = currentSpan === 4 ? 1 : currentSpan + 1;

    newImages[idx] = { url, span: nextSpan };

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, images: newImages } : p)),
    );

    try {
      await blogService.updatePost(postId, { images: newImages });
      showToast("Size updated!", "success");
    } catch (err) {
      console.error("Resize failed:", err);
      loadPosts(false);
    }
  };

  const handlePhotoCrop = (
    postId: string,
    idx: number,
    url: string,
    span: number,
  ) => {
    setPhotoToCrop({ postId, idx, url, span });
  };

  const handlePhotoCropComplete = async (croppedUrl: string) => {
    if (!photoToCrop) return;
    const { postId, idx, span } = photoToCrop;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      showToast(
        isBg ? "Качване на изрязаната снимка..." : "Uploading cropped photo...",
        "info",
      );

      // Convert cropped URL to File
      const response = await fetch(croppedUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Build path: blog/post_slug/
      const folder = `blog/${post.slug || "untitled"}`;
      const path = `${folder}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("models")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("models").getPublicUrl(path);

      // Update post images
      const newImages = [...post.images];
      newImages[idx] = { url: publicUrl, span };

      await blogService.updatePost(postId, { images: newImages });

      // Update local state
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, images: newImages } : p)),
      );
      showToast(isBg ? "Снимката е обновена" : "Photo updated", "success");
    } catch (err) {
      console.error("Crop save error:", err);
      showToast("Error saving cropped photo", "error");
    } finally {
      setPhotoToCrop(null);
    }
  };

  const handleGridDragEnd = async () => {
    if (!gridDrag) return;
    const post = posts.find((p) => p.id === gridDrag.postId);
    if (post) {
      try {
        await blogService.updatePost(post.id, { images: post.images });
      } catch (err) {
        console.error("Failed to save order:", err);
        loadPosts(false);
      }
    }
    setGridDrag(null);
  };

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: "easeOut" as const },
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      {/* Fonts are now global in index.css */}

      {/* Inject grid CSS */}
      <style>{gridStyles}</style>

      {/* ══════════ HERO ══════════ */}
      <section className="relative aspect-[21/9] w-full flex items-center justify-center overflow-hidden border-b border-white/5 pt-32 pb-20 md:pt-0 md:pb-0">
        <div className="absolute inset-0 z-0">
          {hero.background_image ? (
            <img
              src={hero.background_image}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: `blur(${hero.bg_blur || 0}px)` }}
            />
          ) : posts[0]?.cover_image ? (
            <img
              src={posts[0].cover_image}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: `blur(${hero.bg_blur || 0}px)` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
          )}
          <div 
            className="absolute inset-0 bg-black" 
            style={{ opacity: hero.bg_opacity ?? 0.4 }}
          />
        </div>

        <div className="relative z-10 text-center space-y-6 md:space-y-8 px-4 max-w-4xl">
          <motion.span
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, letterSpacing: "0.5em" }}
            className="text-gold-accent font-bold uppercase tracking-[0.5em] text-[10px] md:text-xs block"
          >
            {isBg ? "МОДЕН БЛОГ" : "FASHION BLOG"}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-8xl text-white leading-[1.1] md:leading-[0.95]"
            style={{ fontFamily: hero.font_family || DEFAULT_HERO.font_family }}
          >
            {isBg ? hero.title_bg : hero.title_en}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: hero.sub_opacity ?? DEFAULT_HERO.sub_opacity }}
            transition={{ delay: 0.4 }}
            className="tracking-wide max-w-xl mx-auto px-2"
            style={{
              fontFamily: hero.sub_font || DEFAULT_HERO.sub_font,
              fontSize: `clamp(14px, 4vw, ${hero.sub_size || DEFAULT_HERO.sub_size}px)`,
              color: hero.sub_color || DEFAULT_HERO.sub_color,
              fontWeight: hero.sub_weight || DEFAULT_HERO.sub_weight,
            }}
          >
            {isBg ? hero.subtitle_bg : hero.subtitle_en}
          </motion.p>

          {isAdmin && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => {
                  setEditingPost(null);
                  setEditorOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold-accent text-black text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors"
              >
                <Plus className="w-4 h-4" /> New Photoshoot
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => setHeroEditorOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white/70 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors border border-white/10"
              >
                <Settings className="w-4 h-4" /> Hero
              </motion.button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ POSTS ══════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 border-2 border-gold-accent border-t-transparent animate-spin rounded-full" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-accent animate-pulse">
              Loading...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-32">
            <ImageIcon className="w-16 h-16 mx-auto text-white/10 mb-6" />
            <p className="text-text-muted text-sm uppercase tracking-widest">
              {isBg ? "Все още няма публикации" : "No photoshoots yet"}
            </p>
          </div>
        ) : (
          <motion.div 
            layout 
            className="space-y-24 md:space-y-32"
          >
            {posts.map((post) => {
              const isExpanded = expandedPost === post.id;
              const MAX_PREVIEW = 8;
              const displayImages = isExpanded
                ? post.images
                : post.images.slice(0, MAX_PREVIEW);
              const canExpand = post.images.length > MAX_PREVIEW;

              return (
                <motion.article
                  layout
                  transition={{
                    layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
                  }}
                  key={post.id}
                  {...fadeIn}
                  className="group blog-post-article"
                >
                  {/* Post cover banner */}
                  {post.cover_image && (
                    <div
                      className="relative w-full overflow-hidden mb-8 md:mb-10 rounded-sm"
                      style={{ aspectRatio: "3/1", maxHeight: "380px" }}
                    >
                      <img
                        src={post.cover_image}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                  )}

                  {/* Post header */}
                  <div className="mb-6 md:mb-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight">
                          {isBg && post.title_bg ? post.title_bg : post.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs text-white/40 uppercase tracking-widest">
                          {post.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gold-accent" />{" "}
                              {post.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gold-accent" />
                            {new Date(post.date).toLocaleDateString(
                              isBg ? "bg-BG" : "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </span>
                          {!post.is_published && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[9px] font-bold">
                              DRAFT
                            </span>
                          )}
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingPost(post);
                              setEditorOpen(true);
                            }}
                            className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {(post.description || post.description_bg) && (
                      <div className="mt-4">
                        <motion.p
                          layout
                          className="text-base md:text-lg text-text-muted font-light leading-relaxed max-w-3xl"
                        >
                          {(() => {
                            const desc =
                              isBg && post.description_bg
                                ? post.description_bg
                                : post.description;
                            const isLong = desc.length > 300;
                            const isExpanded = expandedDesc[post.id];

                            if (!isLong || isExpanded) return desc;
                            return desc.substring(0, 280) + "...";
                          })()}
                        </motion.p>
                        {(isBg && post.description_bg
                          ? post.description_bg
                          : post.description
                        ).length > 300 && (
                          <button
                            onClick={() => toggleDescription(post.id)}
                            className="mt-2 text-xs font-bold uppercase tracking-widest text-gold-accent hover:text-white transition-colors"
                          >
                            {expandedDesc[post.id]
                              ? isBg
                                ? "← Покажи по-малко"
                                : "← Show less"
                              : isBg
                                ? "Прочети повече →"
                                : "Read more →"}
                          </button>
                        )}
                      </div>
                    )}

                    {post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 px-3 py-1"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 w-20 h-px bg-gold-accent/30" />
                  </div>

                  {/* ── Photo Grid ── */}
                  {post.images.length > 0 && (
                    <div
                      className="space-y-4 md:space-y-5 blog-grid-wrapper"
                    >
                      {/* Initial Grid (Always visible) */}
                      <div className="blog-photo-grid">
                        {post.images
                          .slice(0, MAX_PREVIEW)
                          .map((img, imgIdx) => (
                            <PhotoItem
                              key={imgIdx}
                              img={img}
                              imgIdx={imgIdx}
                              post={post}
                              isAdmin={isAdmin}
                              setLightbox={setLightbox}
                              gridDrag={gridDrag}
                              handleGridDragStart={handleGridDragStart}
                              handleGridDragOver={handleGridDragOver}
                              handleGridDragEnd={handleGridDragEnd}
                              onResize={handleResize}
                              onCrop={handlePhotoCrop}
                            />
                          ))}
                      </div>

                      {canExpand && (
                        <button
                          ref={(el) => {
                            galleryMenuButtonRefs.current[post.id] = el;
                          }}
                          onClick={(e) => {
                            if (isExpanded) {
                              handleCollapseGallery(post.id, e);
                              return;
                            }
                            handleExpandGallery(post.id);
                          }}
                          className="w-full border border-white/10 bg-black/20 px-4 py-3 md:px-5 md:py-4 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                                {isBg ? "Меню галерия" : "Gallery menu"}
                              </span>
                              <span className="text-xs md:text-sm text-white/80">
                                {isExpanded
                                  ? isBg
                                    ? "Скрий допълнителните снимки"
                                    : "Hide extra photos"
                                  : isBg
                                    ? "Покажи още " + (post.images.length - MAX_PREVIEW) + " снимки"
                                    : "Show " + (post.images.length - MAX_PREVIEW) + " more photos"}
                              </span>
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-white/60 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                            />
                          </span>
                        </button>
                      )}

                      {/* Expanded Section (Animated height) */}
                      <AnimatePresence>
                        {isExpanded && canExpand && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.56,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="overflow-hidden border border-t-0 border-white/10 bg-black/15"
                          >
                            <div className="blog-photo-grid p-4 md:p-5">
                              {post.images
                                .slice(MAX_PREVIEW)
                                .map((img, idx) => {
                                  const imgIdx = idx + MAX_PREVIEW;
                                  return (
                                    <PhotoItem
                                      key={imgIdx}
                                      img={img}
                                      imgIdx={imgIdx}
                                      post={post}
                                      isAdmin={isAdmin}
                                      setLightbox={setLightbox}
                                      gridDrag={gridDrag}
                                      handleGridDragStart={handleGridDragStart}
                                      handleGridDragOver={handleGridDragOver}
                                      handleGridDragEnd={handleGridDragEnd}
                                      onResize={handleResize}
                                      onCrop={handlePhotoCrop}
                                    />
                                  );
                                })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  )}
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* Modals */}
      <AnimatePresence>
        {editorOpen && (
          <PostEditorModal
            post={editingPost}
            onSave={handleSavePost}
            onClose={() => {
              setEditorOpen(false);
              setEditingPost(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {heroEditorOpen && (
          <HeroEditorModal
            settings={hero}
            onSave={handleSaveHero}
            onClose={() => setHeroEditorOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lightbox && (
          <PhotoLightbox
            images={lightbox.images}
            startIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>

      {photoToCrop && (
        <SpotlightCropModal
          isOpen={true}
          onClose={() => setPhotoToCrop(null)}
          imageUrl={photoToCrop.url}
          onCropComplete={handlePhotoCropComplete}
          aspectRatio={
            photoToCrop.span === 4
              ? 21 / 9
              : photoToCrop.span === 3
                ? 16 / 9
                : photoToCrop.span === 2
                  ? 3 / 2
                  : 4 / 3
          }
        />
      )}
    </div>
  );
};

export default Blog;

