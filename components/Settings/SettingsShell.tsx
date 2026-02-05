import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, Save, Loader2, Check } from 'lucide-react';

interface SettingsShellProps {
  title: string;
  onBack?: () => void;
  onSave?: () => void;
  isDirty?: boolean;
  isSaving?: boolean;
  children: React.ReactNode;
}

const SettingsShell: React.FC<SettingsShellProps> = ({
  title,
  onBack,
  onSave,
  isDirty = false,
  isSaving = false,
  children,
}) => {
  const { t } = useTranslation();

  const canSave = Boolean(onSave) && isDirty && !isSaving;

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Sticky TopBar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-4 md:px-6 h-14">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
                       text-white/80 hover:bg-white/5 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('common.back') || 'Назад'}
          </button>

          <div className="min-w-0 flex flex-col items-center">
            <div className="text-sm font-semibold text-white truncate max-w-[220px]">
              {title}
            </div>
            <div className="text-[11px] leading-4 text-white/50">
              {isSaving ? (t('common.saving') || 'Запазване…') : isDirty ? (t('common.unsaved') || 'Незаписани промени') : (t('common.saved') || 'Запазено')}
            </div>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold
                       border border-white/10 bg-white/5 text-white hover:bg-white/10
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition active:scale-[0.98]"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isDirty ? (
              <Save className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {t('common.save') || 'Запази'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow w-full max-w-[760px] mx-auto px-4 md:px-6 py-6 pb-24 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsShell;
