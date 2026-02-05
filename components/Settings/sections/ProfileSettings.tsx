import React from 'react';
import { useTranslation } from 'react-i18next';

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

    if (!data) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            
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

            {/* ─── MEASUREMENTS ─── */}
            <Section title="Професионални мерки">
                <div className="grid grid-cols-2 md:grid-cols-3">
                    <Field label="Височина" hint="cm">
                        <input
                            className={inputClass}
                            type="number"
                            value={data.height || ''}
                            onChange={(e) => onChange('height', e.target.value)}
                        />
                    </Field>
                    <Field label="Бюст">
                        <input
                            className={inputClass}
                            value={data.measurements_bust || ''}
                            onChange={(e) => onChange('measurements_bust', e.target.value)}
                        />
                    </Field>
                    <Field label="Талия">
                        <input
                            className={inputClass}
                            value={data.measurements_waist || ''}
                            onChange={(e) => onChange('measurements_waist', e.target.value)}
                        />
                    </Field>
                    <Field label="Ханш">
                        <input
                            className={inputClass}
                            value={data.measurements_hips || ''}
                            onChange={(e) => onChange('measurements_hips', e.target.value)}
                        />
                    </Field>
                    <Field label="Обувки">
                        <input
                            className={inputClass}
                            value={data.shoe_size || ''}
                            onChange={(e) => onChange('shoe_size', e.target.value)}
                        />
                    </Field>
                    <Field label="Цвят очи">
                        <input
                            className={inputClass}
                            value={data.eye_color || ''}
                            onChange={(e) => onChange('eye_color', e.target.value)}
                        />
                    </Field>
                </div>
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
