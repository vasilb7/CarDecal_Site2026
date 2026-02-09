import React, { useState, useMemo, useEffect } from 'react';
// Booking Page Component
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { modelsData } from '../data/models';
import { Model } from '../types';
import { useToast } from '../hooks/useToast';

const BookingPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    const currentLang = (i18n.language || 'bg').split('-')[0] as 'bg' | 'en';
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModels, setSelectedModels] = useState<Model[]>([]);
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('booking_form_data');
        return saved ? JSON.parse(saved) : {
            companyName: '',
            vatNumber: '',
            contactPerson: '',
            email: '',
            phone: '',
            website: '',
            projectType: '',
            shootDate: '',
            location: '',
            message: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('booking_form_data', JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        const savedModels = localStorage.getItem('booking_selected_models');
        if (savedModels) {
            setSelectedModels(JSON.parse(savedModels));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('booking_selected_models', JSON.stringify(selectedModels));
    }, [selectedModels]);

    const [randomModels, setRandomModels] = useState<Model[]>([]);

    const shuffleModels = () => {
        const shuffled = [...modelsData].sort(() => 0.5 - Math.random());
        setRandomModels(shuffled.slice(0, 2));
    };

    useEffect(() => {
        shuffleModels();
    }, []);

    const filteredModels = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return randomModels;

        return modelsData.filter(model => {
            const nameEn = model.name.toLowerCase();
            const nameBg = (model.nameBg || '').toLowerCase();
            return nameEn.includes(query) || nameBg.includes(query);
        }).slice(0, 4);
    }, [searchQuery, randomModels]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Booking submitted:', { models: selectedModels.map(m => m.name), ...formData });
        showToast(t('toast.booking_success'), "success");
        
        // Clear persistence on success
        localStorage.removeItem('booking_form_data');
        localStorage.removeItem('booking_selected_models');
        
        // Reset local state if needed
        setSelectedModels([]);
        setFormData({
            companyName: '',
            vatNumber: '',
            contactPerson: '',
            email: '',
            phone: '',
            website: '',
            projectType: '',
            shootDate: '',
            location: '',
            message: ''
        });
        shuffleModels();
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Premium Hero Header */}
            <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 scale-105 transform hover:scale-100 transition-transform duration-[10s]"
                    style={{ backgroundImage: `url("/Site_Pics/Model_pics_together/100.jpeg")` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background"></div>
                
                <div className="relative z-10 text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <h1 className="text-5xl md:text-8xl font-serif text-white mb-4 tracking-tight drop-shadow-2xl">
                            {t('booking_page.title')}
                        </h1>
                        <p className="max-w-2xl mx-auto text-gold-accent text-[10px] md:text-xs font-bold uppercase tracking-[0.6em] leading-relaxed opacity-80">
                            {t('booking_page.subtitle')}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 max-w-4xl -mt-10 md:-mt-20 relative z-20">
                <div className="space-y-8 md:space-y-12">
                    {/* Module 1: Model Selection (Centered) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-surface/60 backdrop-blur-2xl border border-white/5 p-5 md:p-12 rounded-2xl md:rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex flex-col items-center text-center mb-10">
                            <span className="text-gold-accent font-serif italic text-lg mb-2">{t('booking_page.step')} 01</span>
                            <h2 className="text-2xl font-serif text-white uppercase tracking-widest">
                                {t('booking_page.select_model')}
                            </h2>
                            <p className="text-text-muted text-[10px] uppercase tracking-widest mt-2 opacity-60">
                                {t('booking_page.selection_limit')}
                            </p>
                            <div className="w-12 h-[1px] bg-gold-accent/40 mt-4" />
                        </div>

                        {/* Search Box */}
                        <div className="max-w-lg mx-auto mb-10">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('booking_page.search_placeholder')}
                                    className="w-full bg-background/80 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder-text-muted focus:outline-none focus:border-gold-accent/50 transition-all shadow-inner"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={handleFocus}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-40">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Results / Selected */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredModels.map((model, index) => (
                                    <motion.div
                                        key={model.slug}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`items-center gap-4 md:gap-5 p-3 md:p-4 rounded-2xl cursor-pointer transition-all border group relative ${
                                            index === 1 && !searchQuery ? 'hidden md:flex' : 'flex'
                                        } ${
                                            selectedModels.some(m => m.slug === model.slug) 
                                            ? 'bg-gold-accent/10 border-gold-accent/40 shadow-[0_0_30px_rgba(201,162,39,0.15)]' 
                                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                        }`}
                                    >
                                        {/* Selection Overlay (to handle selection without triggering link if clicked on other parts) */}
                                        <div 
                                            className="absolute inset-0 z-0" 
                                            onClick={() => {
                                                const isSelected = selectedModels.some(m => m.slug === model.slug);
                                                if (isSelected) {
                                                    setSelectedModels(prev => prev.filter(m => m.slug !== model.slug));
                                                } else if (selectedModels.length < 3) {
                                                    setSelectedModels(prev => [...prev, model]);
                                                    setSearchQuery('');
                                                }
                                            }}
                                        />

                                        <Link to={`/${currentLang}/models/${model.slug}`} className="relative z-10 w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 hover:border-gold-accent transition-colors">
                                            <img src={model.avatar} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </Link>
                                        
                                        <div className="relative z-10 flex-grow pointer-events-none">
                                            <Link to={`/${currentLang}/models/${model.slug}`} className="pointer-events-auto hover:text-gold-accent transition-colors">
                                                <h3 className="text-white text-sm font-medium tracking-wide">{currentLang === 'bg' ? (model.nameBg || model.name) : model.name}</h3>
                                            </Link>
                                            <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mt-1">{model.location}</p>
                                        </div>

                                        {selectedModels.some(m => m.slug === model.slug) && (
                                            <div className="relative z-10 w-2 h-2 rounded-full bg-gold-accent shadow-[0_0_10px_rgba(201,162,39,1)]" />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {selectedModels.length > 0 && !searchQuery && (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedModels.map(model => (
                                    <motion.div 
                                        key={model.slug}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-gold-accent/5 border border-gold-accent/20 rounded-2xl flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <Link to={`/${currentLang}/models/${model.slug}`} className="w-12 h-12 rounded-lg overflow-hidden border border-gold-accent/30 shrink-0 hover:border-gold-accent transition-all">
                                                <img src={model.avatar} alt={model.name} className="w-full h-full object-cover" />
                                            </Link>
                                            <div className="overflow-hidden">
                                                <Link to={`/${currentLang}/models/${model.slug}`} className="block hover:text-gold-accent transition-colors">
                                                    <h3 className="text-sm font-serif text-white truncate">{currentLang === 'bg' ? (model.nameBg || model.name) : model.name}</h3>
                                                </Link>
                                                <p className="text-gold-accent text-[8px] uppercase tracking-[0.2em] font-bold">{model.categories?.[0]}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedModels(prev => prev.filter(m => m.slug !== model.slug))}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Module 2: Company Details (Centered & Symmetrical) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-surface/60 backdrop-blur-2xl border border-white/5 p-5 md:p-12 rounded-2xl md:rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="flex flex-col items-center text-center mb-10">
                            <span className="text-gold-accent font-serif italic text-lg mb-2">{t('booking_page.step')} 02</span>
                            <h2 className="text-2xl font-serif text-white uppercase tracking-widest">
                                {t('booking_page.company_details')}
                            </h2>
                            <div className="w-12 h-[1px] bg-gold-accent/40 mt-4" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <FormGroup label={t('booking_page.form.company_name')}>
                                    <input 
                                        type="text" name="companyName" required
                                        className="form-input-luxury"
                                        placeholder="Company Name"
                                        value={formData.companyName} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    />
                                </FormGroup>
                                <FormGroup label={t('booking_page.form.vat_number')}>
                                    <input 
                                        type="text" name="vatNumber"
                                        className="form-input-luxury"
                                        placeholder="Tax ID"
                                        value={formData.vatNumber} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    />
                                </FormGroup>
                                <FormGroup label={t('booking_page.form.contact_person')}>
                                    <input 
                                        type="text" name="contactPerson" required
                                        className="form-input-luxury"
                                        placeholder="Full Name"
                                        value={formData.contactPerson} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    />
                                </FormGroup>
                                <FormGroup label={t('booking_page.form.email')}>
                                    <input 
                                        type="email" name="email" required
                                        className="form-input-luxury"
                                        placeholder="email@example.com"
                                        value={formData.email} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    />
                                </FormGroup>
                                <FormGroup label={t('booking_page.form.phone')}>
                                    <input 
                                        type="tel" name="phone" required
                                        className="form-input-luxury"
                                        placeholder="+359 ..."
                                        value={formData.phone} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    />
                                </FormGroup>
                                <FormGroup label={t('booking_page.form.website')}>
                                    <input 
                                        type="url" name="website"
                                        className="form-input-luxury"
                                        placeholder="https://..."
                                        value={formData.website} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    />
                                </FormGroup>
                                <FormGroup label={t('booking_page.form.project_type')}>
                                    <select 
                                        name="projectType" required
                                        className="form-input-luxury appearance-none"
                                        value={formData.projectType} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    >
                                        <option value="" disabled>{currentLang === 'bg' ? 'Тип проект' : 'Project Type'}</option>
                                        <option value="editorial">Editorial</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="runway">Runway</option>
                                        <option value="lookbook">Lookbook</option>
                                        <option value="other">Other</option>
                                    </select>
                                </FormGroup>
                                <FormGroup label={t('booking_page.form.shoot_date')}>
                                    <input 
                                        type="date" name="shootDate" required
                                        className="form-input-luxury"
                                        value={formData.shootDate} onChange={handleInputChange}
                                        onFocus={handleFocus}
                                    />
                                </FormGroup>
                            </div>

                            <FormGroup label={t('booking_page.form.location')}>
                                <input 
                                    type="text" name="location" required
                                    className="form-input-luxury"
                                    placeholder="Sofia, London, Paris..."
                                    value={formData.location} onChange={handleInputChange}
                                    onFocus={handleFocus}
                                />
                            </FormGroup>

                            <FormGroup label={t('booking_page.form.message')}>
                                <textarea 
                                    name="message" rows={5}
                                    className="form-input-luxury resize-none"
                                    placeholder={t('booking_page.form.message_placeholder')}
                                    value={formData.message} onChange={handleInputChange}
                                    onFocus={handleFocus}
                                />
                            </FormGroup>

                            <div className="pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: 'var(--gold-accent)' }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full py-5 bg-gold-accent text-background font-bold uppercase tracking-[0.3em] text-xs rounded-2xl transition-all shadow-[0_20px_40px_rgba(201,162,39,0.3)] hover:shadow-[0_25px_50px_rgba(201,162,39,0.5)]"
                                >
                                    {t('booking_page.form.submit')}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .form-input-luxury {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 1.25rem;
                    padding: 1rem 1.25rem;
                    color: white;
                    font-size: 0.9rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    scroll-margin-top: 6rem;
                }
                .form-input-luxury:focus {
                    outline: none;
                    border-color: rgba(201, 162, 39, 0.6);
                    background: rgba(0, 0, 0, 0.5);
                    box-shadow: 0 0 25px rgba(201, 162, 39, 0.1);
                }
                .form-input-luxury::placeholder {
                    color: rgba(255, 255, 255, 0.15);
                }
            `}} />
        </div>
    );
};

const FormGroup: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-text-muted font-bold ml-1">
            {label}
        </label>
        {children}
    </div>
);

export default BookingPage;
