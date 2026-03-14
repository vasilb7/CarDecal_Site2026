import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, UploadCloud, MessageSquareWarning, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary-utils';
import { useToast } from './Toast/ToastProvider';

const ReportBugModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [formData, setFormData] = useState({
        category: 'other',
        description: '',
        email: ''
    });
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user, profile } = useAuth();
    const { showToast } = useToast();

    const userRef = useRef(user);
    const profileRef = useRef(profile);

    useEffect(() => {
        userRef.current = user;
        profileRef.current = profile;
    }, [user, profile]);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setFormData(prev => ({
                ...prev,
                email: userRef.current?.email || profileRef.current?.email || prev.email
            }));
        };
        const handleClose = () => setIsOpen(false);
        
        window.addEventListener('open-bug-report', handleOpen);
        window.addEventListener('close-bug-report', handleClose);
        
        return () => {
            window.removeEventListener('open-bug-report', handleOpen);
            window.removeEventListener('close-bug-report', handleClose);
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            // Disable scroll
            document.documentElement.classList.add('scroll-locked');
            
            // Handle mobile back button
            window.history.pushState({ modal: 'bug-report' }, '');
            const handlePopState = () => {
                setIsOpen(false);
                setFormData(prev => ({ ...prev, category: 'other', description: '' }));
                setScreenshot(null);
            };
            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
                document.documentElement.classList.remove('scroll-locked');
            };
        } else {
            // Re-enable scroll
            document.documentElement.classList.remove('scroll-locked');
        }
    }, [isOpen]);

    const handleCloseModal = () => {
        if (window.history.state?.modal === 'bug-report') {
            window.history.back();
        }
        setIsOpen(false);
        setFormData({ category: 'other', description: '', email: user?.email || profile?.email || '' });
        setScreenshot(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!screenshot) {
            showToast('Моля, качете снимка на проблема задължително.', 'error');
            return;
        }

        setStatus('submitting');
        
        try {
            let uploadedImages: string[] = [];
            if (screenshot) {
                const url = await uploadToCloudinary(screenshot, 'bug_reports');
                uploadedImages.push(url);
            }

            const currentUrl = window.location.pathname;
            
            // Get user agent and IP
            const userAgent = navigator.userAgent;
            let userIP = 'Unknown';
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                userIP = ipData.ip;
            } catch (e) {
                console.error('Failed to fetch IP:', e);
            }
            
            const { error } = await supabase.from('bug_reports').insert({
                category: formData.category,
                description: formData.description,
                email: formData.email,
                images: uploadedImages,
                url: currentUrl,
                user_id: user?.id || null,
                device_info: userAgent,
                ip_address: userIP
            });

            if (error) throw error;

            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                setFormData({ category: 'other', description: '', email: userRef.current?.email || profileRef.current?.email || '' });
                setScreenshot(null);
            }, 2500);
        } catch (error: any) {
            console.error('Submission error:', error);
            setStatus('idle');
            showToast('Грешка при изпращане: ' + (error.message || 'Възникна проблем'), 'error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Dark Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseModal}
                        className="fixed inset-0 bg-black/80 z-[100]"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#0f0f0f] w-full sm:w-[500px] sm:rounded-2xl border-t sm:border border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                        <Bug size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Съобщи за проблем</h3>
                                        <p className="text-xs text-white/40">Помогни ни да подобрим сайта</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            {status === 'success' ? (
                                <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-10 flex flex-col items-center justify-center text-center"
                                    >
                                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h4 className="text-xl font-bold text-white mb-2">Благодарим ти!</h4>
                                        <p className="text-white/50 text-sm">Твоят сигнал е изпратен успешно.<br/>Ще го разгледаме възможно най-скоро.</p>
                                    </motion.div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                                    <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
                                        
                                        {/* Category */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Къде възникна проблемът?</label>
                                            <select 
                                                value={formData.category}
                                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
                                            >
                                                <option value="catalog">Разглеждане на продукти</option>
                                                 <option value="checkout">Проблем с завършване на поръчка</option>
                                                <option value="cart">Количка и поръчка</option>
                                                <option value="login">Проблем с Влизане</option>
                                                <option value="register">Проблем с Регистрация</option>
                                                <option value="other">Друго</option>
                                            </select>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Какво точно се случи?</label>
                                            <textarea 
                                                required
                                                placeholder="Опиши проблема накратко..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors min-h-[100px] resize-y"
                                            />
                                        </div>

                                        <div className="flex gap-4 sm:flex-row flex-col">
                                            {/* Email */}
                                            <div className="relative flex-1 group" style={{ marginTop: 'auto' }}>
                                                <input 
                                                    type="email"
                                                    id="bug_email"
                                                    required
                                                    readOnly={Boolean(user || profile)}
                                                    placeholder=" "
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                    className={`peer w-full h-[46px] bg-[#151515] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none transition-colors ${Boolean(user || profile) ? 'opacity-60 cursor-not-allowed' : 'focus:border-red-500/50'}`}
                                                />
                                                <label 
                                                    htmlFor="bug_email"
                                                    className="absolute left-3 -top-2.5 bg-[#151515] px-1 text-xs text-white/40 uppercase tracking-widest font-semibold transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-[13px] peer-placeholder-shown:left-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:left-3 peer-focus:text-white/40 pointer-events-none"
                                                >
                                                    Твоят Имейл
                                                </label>
                                            </div>

                                            {/* File Upload (Actual UI) */}
                                            <div className="space-y-1.5 sm:w-1/3">
                                                 <label className="text-xs font-semibold uppercase tracking-wider text-white/40 opacity-0 hidden sm:block">Файл</label>
                                                 <input 
                                                     type="file" 
                                                     ref={fileInputRef} 
                                                     accept="image/*" 
                                                     onChange={handleFileChange} 
                                                     className="hidden" 
                                                 />
                                                 {screenshot ? (
                                                     <div className="w-full h-[46px] border border-green-500/50 text-green-500 bg-green-500/5 rounded-xl flex items-center justify-between px-3 text-sm transition-all overflow-hidden">
                                                         <div className="flex items-center gap-2 overflow-hidden">
                                                             <ImageIcon size={16} className="flex-shrink-0" />
                                                             <span className="truncate max-w-[80px] sm:max-w-[100px]">{screenshot.name}</span>
                                                         </div>
                                                         <button 
                                                             type="button" 
                                                             onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 setScreenshot(null);
                                                                 if (fileInputRef.current) fileInputRef.current.value = '';
                                                             }}
                                                             className="p-1 hover:bg-green-500/20 rounded-md transition-colors flex-shrink-0 ml-1"
                                                         >
                                                             <X size={14} />
                                                         </button>
                                                     </div>
                                                 ) : (
                                                     <button 
                                                        type="button" 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full h-[46px] border border-dashed rounded-xl flex items-center justify-center gap-2 text-sm transition-all focus:outline-none border-white/20 text-white/40 hover:text-white/80 hover:border-white/40 hover:bg-white/5"
                                                     >
                                                        <UploadCloud size={16} />
                                                        <span>Снимка</span>
                                                     </button>
                                                 )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer / Buttons */}
                                    <div className="p-5 sm:p-6 border-t border-white/5 bg-[#0a0a0a] flex gap-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-6">
                                        <button 
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm"
                                        >
                                            Отказ
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={status === 'submitting'}
                                            className="flex-[2] py-3.5 px-4 bg-white hover:bg-gray-200 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed leading-none"
                                        >
                                            {status === 'submitting' ? (
                                                <><Loader2 size={16} className="animate-spin" /> Изпращане...</>
                                            ) : (
                                                'Изпрати сигнал'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReportBugModal;
