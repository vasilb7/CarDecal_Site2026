import React from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { Loader2, Camera, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileSettingsProps {
    data: any;
    onChange: (field: string, value: any) => void;
}

/* ───────────────────────────────────────────────────────────
   SECTION LIST GROUP – imitates iOS/Instagram grouped settings
   ─────────────────────────────────────────────────────────── */
const Section = ({ 
    title, 
    children 
}: { 
    title?: string; 
    children: React.ReactNode 
}) => (
    <section className="mb-8">
        {title && (
            <h3 className="px-1 mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
                {title}
            </h3>
        )}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
            {children}
        </div>
    </section>
);

/* ───────────────────────────────────────────────────────────
   FIELD – single row inside Section
   ─────────────────────────────────────────────────────────── */
const Field = ({ 
    label, 
    hint, 
    children,
    fullWidth = false 
}: { 
    label: string; 
    hint?: string; 
    children: React.ReactNode;
    fullWidth?: boolean;
}) => (
    <div className={`flex flex-col gap-2 px-4 py-4 ${fullWidth ? '' : 'md:flex-row md:items-center md:justify-between md:gap-4'}`}>
        <div className="flex-shrink-0">
            <label className="text-sm font-medium text-white/90">{label}</label>
            {hint && <p className="text-xs text-white/40 mt-0.5">{hint}</p>}
        </div>
        <div className={fullWidth ? 'w-full' : 'md:w-1/2'}>
            {children}
        </div>
    </div>
);

/* ───────────────────────────────────────────────────────────
   INPUT STYLES – clean, minimal, dark
   ─────────────────────────────────────────────────────────── */
const inputClass = `
    w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4
    text-sm text-white placeholder:text-white/25
    outline-none focus:border-white/25 focus:ring-2 focus:ring-white/5
    transition-all
`.trim().replace(/\s+/g, ' ');

const textareaClass = `
    w-full rounded-xl border border-white/10 bg-black/40 p-4
    text-sm text-white placeholder:text-white/25
    outline-none focus:border-white/25 focus:ring-2 focus:ring-white/5
    transition-all min-h-[100px] resize-none
`.trim().replace(/\s+/g, ' ');


/* ───────────────────────────────────────────────────────────
   MAIN COMPONENT
   ─────────────────────────────────────────────────────────── */
const ProfileSettings: React.FC<ProfileSettingsProps> = ({ data, onChange }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [uploading, setUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);

    if (!data) return null;

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setUploadProgress(10);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Трябва да изберете снимка за качване.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}/avatar.${fileExt}`;

            // 1. Limit size to 3MB
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 3) {
                throw new Error('Файлът е твърде голям. Максималният размер е 3MB.');
            }

            setUploadProgress(30);

            // 2. Upload to Supabase (upsert: true replaces the file)
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { 
                    upsert: true,
                    cacheControl: '3600'
                });

            if (uploadError) {
                throw uploadError;
            }

            setUploadProgress(70);

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 4. Update parent state
            onChange('avatar_url', publicUrl);
            
            setUploadProgress(100);
            showToast('Снимката е качена успешно!', 'success');

        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 1000);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* ─── AVATAR ─── */}
            <Section title="Профилна снимка">
                <div className="px-6 py-8 flex flex-col items-center justify-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 bg-black/40 relative">
                            {data.avatar_url ? (
                                <img 
                                    src={data.avatar_url} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 uppercase font-black text-2xl">
                                    {data.full_name?.[0] || '?'}
                                </div>
                            )}
                            
                            {/* Loading Overlay */}
                            <AnimatePresence>
                                {uploading && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                                    >
                                        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                            {uploadProgress}%
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <label className="absolute bottom-0 right-0 p-2.5 bg-red-600 text-white rounded-full cursor-pointer shadow-xl hover:bg-white hover:text-black transition-all transform hover:scale-110 active:scale-90 border-2 border-background">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <p className="mt-4 text-[10px] text-white/40 uppercase tracking-[0.2em]">
                        JPG, PNG ИЛИ WEBP • МАКСИМУМ 3MB
                    </p>

                    {/* Simple Progress Bar if uploading */}
                    {uploading && (
                        <div className="w-48 h-1 bg-white/5 rounded-full mt-6 overflow-hidden">
                            <motion.div 
                                className="h-full bg-red-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}
                </div>
            </Section>

            {/* ─── IDENTITY ─── */}
            <Section title="Самоличност">
                <Field label="Показвано име" hint="Вашето публично име">
                    <input
                        className={inputClass}
                        value={data.full_name || ''}
                        onChange={(e) => onChange('full_name', e.target.value)}
                        placeholder="напр. Памела Андерсен"
                    />
                </Field>

                <Field label="Потребителско име" hint="Само латински букви и _">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">@</span>
                        <input
                            className={`${inputClass} pl-9`}
                            value={data.username || ''}
                            onChange={(e) => onChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="username"
                        />
                    </div>
                </Field>

                <Field label="Био" hint="Кратко описание" fullWidth>
                    <textarea
                        className={textareaClass}
                        value={data.bio || ''}
                        onChange={(e) => onChange('bio', e.target.value)}
                        placeholder="Разкажете малко за себе си…"
                        maxLength={160}
                    />
                </Field>

                <Field label="Местоположение">
                    <input
                        className={inputClass}
                        value={data.location || ''}
                        onChange={(e) => onChange('location', e.target.value)}
                        placeholder="София, България"
                    />
                </Field>
            </Section>

            {/* ─── SOCIALS ─── */}
            <Section title="Социални профили">
                <Field label="Instagram">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">@</span>
                        <input
                            className={`${inputClass} pl-9`}
                            value={data.instagram_handle || ''}
                            onChange={(e) => onChange('instagram_handle', e.target.value)}
                            placeholder="instagram_handle"
                        />
                    </div>
                </Field>
                <Field label="Telegram">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">@</span>
                        <input
                            className={`${inputClass} pl-9`}
                            value={data.telegram_handle || ''}
                            onChange={(e) => onChange('telegram_handle', e.target.value)}
                            placeholder="telegram_handle"
                        />
                    </div>
                </Field>
            </Section>
        </div>
    );
};

export default ProfileSettings;
