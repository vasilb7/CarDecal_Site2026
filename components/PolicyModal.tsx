import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PolicyModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('vb-policy-accepted') !== 'true';
        }
        return false;
    });
    
    const [isAgreed, setIsAgreed] = useState(false);
    const [showFullRules, setShowFullRules] = useState(false);
    const [lang, setLang] = useState<'bg' | 'en'>('bg');

    const t = {
        bg: {
            title: "КОДЕКС ЗА ЗАЩИТА",
            effectiveDate: "В сила от 04.02.2026",
            attentionTitle: "ВНИМАНИЕ КЪМ КЛИЕНТИТЕ:",
            attentionText: "\"В VB VISION здравето и достойнството на нашите модели са неприкосновени. Ние не предлагаме просто услуги, ние предлагаме професионализъм, защитен от закона.\"",
            mainInfo: "Поради промени в нашите вътрешни разпоредби, въвеждаме безкомпромисни правила за работа на терен. Прочетете ги внимателно, тъй като съгласието ви е правно обвързващо.",
            readBtn: "ПРОЧЕТИ ОБЩИТЕ УСЛОВИЯ И ПРАВИЛА",
            modalTitle: "Юридически Клаузули",
            article1Title: "ЧЛЕН 1: ЗАЩИТА СРЕЩУ НАСИЛИЕ И ДИСКРИМИНАЦИЯ",
            article1Legal: "Съгласно Наказателния кодекс на РБ (чл. 146-148) и Директива 2006/54/ЕО на Европейския парламент.",
            article1Text: "Всяка форма на психологически натиск, опити за принуда, обидно отношение или физическо посегателство е обект на незабавно наказателно преследване. Моделите имат право да прекратят ангажимента едностранно при най-малкото съмнение за риск.",
            article2Title: "ЧЛЕН 2: ТРУДОВА МЕДИЦИНА И БЕЗОПАСНОСТ",
            article2Legal: "В съответствие със Закона за здравословни и безопасни условия на труд (ЗЗБУТ) и Конвенция 155 на МОТ.",
            article2Text: "Клиентът е за задължен да осигури безопасна среда, периодични почивки и незабавна специализирана медицинска помощ. При неразположение на модела, работата се преустановява до пълното му възстановяване.",
            article3Title: "ЧЛЕН 3: ОТЧЕТНОСТ И НЕЗАБАВЕН ДОКЛАД",
            article3Legal: "Регламентирано от Закона за задълженията и договорите (ЗЗД).",
            article3Text: "Всяко извънредно събитие или медицнска нужда ТРЯБВА да бъде съобщена на администрацията на VB VISION в рамките на 15 минути. Неизпълнението на това условие води до юридически санкции.",
            footerNote: "Ние пазим нашите модели. Те са под постоянна юридическа и административна закрила.",
            understandBtn: "РАЗБРАХ",
            agreeText: "Потвърждавам, че прочетох кодекса и поемам пълна отговорност за спазването му по време на работа с модели на VB VISION.",
            acceptBtn: "ПРИЕМАМ УСЛОВИЯТА"
        },
        en: {
            title: "PROTECTION CODE",
            effectiveDate: "Effective as of 04.02.2026",
            attentionTitle: "ATTENTION TO CLIENTS:",
            attentionText: "\"At VB VISION, the health and dignity of our models are inviolable. We do not just offer services; we offer professionalism protected by law.\"",
            mainInfo: "Due to changes in our internal regulations, we are introducing uncompromising rules for on-site work. Read them carefully, as your consent is legally binding.",
            readBtn: "READ GENERAL TERMS AND CONDITIONS",
            modalTitle: "Legal Clauses",
            article1Title: "ARTICLE 1: PROTECTION AGAINST VIOLENCE AND DISCRIMINATION",
            article1Legal: "Under the Penal Code of RB (Art. 146-148) and Directive 2006/54/EC of the European Parliament.",
            article1Text: "Any form of psychological pressure, coercion attempts, offensive behavior, or physical assault is subject to immediate criminal prosecution. Models have the right to terminate the engagement unilaterally at the slightest suspicion of risk.",
            article2Title: "ARTICLE 2: OCCUPATIONAL MEDICINE AND SAFETY",
            article2Legal: "In accordance with the Health and Safety at Work Act (HSWA) and ILO Convention 155.",
            article2Text: "The client is obliged to ensure a safe environment, regular breaks, and immediate specialized medical assistance. If the model feels unwell, work is suspended until full recovery.",
            article3Title: "ARTICLE 3: ACCOUNTABILITY AND IMMEDIATE REPORTING",
            article3Legal: "Regulated by the Law on Obligations and Contracts (LOC).",
            article3Text: "Any extraordinary event or medical need MUST be reported to the VB VISION administration within 15 minutes. Failure to comply leads to legal sanctions.",
            footerNote: "We protect our models. They are under constant legal and administrative protection.",
            understandBtn: "UNDERSTOOD",
            agreeText: "I confirm that I have read the code and assume full responsibility for compliance while working with VB VISION models.",
            acceptBtn: "I ACCEPT THE TERMS"
        }
    };

    const content = t[lang];

    // Check for existing acceptance on mount
    useEffect(() => {
        const hasAgreed = localStorage.getItem('vb-policy-accepted');
        if (hasAgreed === 'true') {
            setIsOpen(false);
        }
    }, []);

    // Lock scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollBarWidth}px`;
            document.body.style.touchAction = 'none';
            
            return () => {
                const height = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.height = '';
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                document.body.style.touchAction = '';
                window.scrollTo(0, parseInt(height || '0') * -1);
            };
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (isAgreed) {
            localStorage.setItem('vb-policy-accepted', 'true');
            setIsOpen(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-surface border border-white/10 p-5 md:p-10 max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden"
                    >
                        {/* Red/Gold Warning Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-gold-accent to-red-600 z-[11]" />

                        {/* Language Switcher */}
                        <div className="absolute top-4 right-5 flex gap-2 z-20">
                            {['bg', 'en'].map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l as 'bg' | 'en')}
                                    className={`text-[9px] md:text-[10px] uppercase tracking-widest px-2 py-1 border transition-all ${
                                        lang === l 
                                        ? 'bg-gold-accent text-black border-gold-accent font-black' 
                                        : 'text-white/40 border-white/10 hover:border-white/40'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="overflow-y-auto custom-scrollbar flex-grow pr-1 pt-4">
                            <div className="text-center mb-6 mt-4">
                                <div className="inline-block p-3 rounded-full bg-red-600/10 mb-3 animate-pulse">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl md:text-3xl font-serif text-white uppercase tracking-[0.25em] md:tracking-[0.3em] mb-4">
                                    {content.title}
                                </h2>
                                <p className="text-red-500 text-[9px] md:text-xs uppercase tracking-widest font-black">{content.effectiveDate}</p>
                            </div>

                            <div className="space-y-4 md:space-y-6 text-text-muted text-xs md:text-base leading-relaxed">
                                <div className="border-l-4 border-red-600 pl-4 bg-red-600/5 py-3 md:py-4">
                                    <p className="font-bold text-white mb-2 uppercase tracking-wide text-[11px] md:text-sm">{content.attentionTitle}</p>
                                    <p className="text-white/80 italic text-[11px] md:text-sm">
                                        {content.attentionText}
                                    </p>
                                </div>
                                
                                <p className="text-center md:text-left text-[11px] md:text-sm">
                                    {content.mainInfo}
                                </p>

                                <button 
                                    onClick={() => setShowFullRules(true)}
                                    className="w-full text-gold-accent text-[10px] md:text-xs uppercase tracking-[0.25em] md:tracking-[0.3em] border border-gold-accent/40 px-4 py-3 md:px-6 md:py-4 hover:bg-gold-accent hover:text-black transition-all duration-700 font-black"
                                >
                                    {content.readBtn}
                                </button>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <label className="flex items-start gap-3 md:gap-4 cursor-pointer group mb-6 p-3 md:p-4 bg-white/5 border border-white/5 hover:border-red-600/30 transition-all">
                                    <div className="relative mt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={isAgreed}
                                            onChange={(e) => setIsAgreed(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 md:w-6 md:h-6 border-2 transition-all duration-300 ${isAgreed ? 'bg-red-600 border-red-600' : 'border-white/20 bg-transparent'}`}>
                                            {isAgreed && (
                                                <svg className="w-4 h-4 md:w-5 md:h-5 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] md:text-sm uppercase tracking-[0.1em] leading-tight transition-colors ${isAgreed ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>
                                        {content.agreeText}
                                    </span>
                                </label>

                                <button
                                    onClick={handleConfirm}
                                    disabled={!isAgreed}
                                    className={`w-full py-4 md:py-5 text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.4em] transition-all duration-700 rounded-sm ${
                                        isAgreed 
                                        ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:bg-white hover:text-black hover:scale-[1.01]' 
                                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                                    }`}
                                >
                                    {content.acceptBtn}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showFullRules && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-4 bg-black/95 backdrop-blur-2xl"
                                >
                                    <motion.div 
                                        initial={{ scale: 0.95, y: 30 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="bg-surface border border-white/10 w-full max-w-xl max-h-[90vh] md:max-h-[80vh] flex flex-col rounded-sm overflow-hidden"
                                    >
                                        <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                            <h3 className="text-gold-accent font-black uppercase tracking-widest text-[11px] md:text-sm">{content.modalTitle}</h3>
                                            <button 
                                                onClick={() => setShowFullRules(false)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar space-y-6 md:space-y-8 bg-black/40">
                                            <section>
                                                <p className="text-red-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-[10px] md:text-xs">
                                                    <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                                                    {content.article1Title}
                                                </p>
                                                <p className="pl-4 border-l border-white/10 italic text-[10px] md:text-[11px] mb-3 text-white/60">
                                                    {content.article1Legal}
                                                </p>
                                                <p className="pl-4 border-l border-white/10 text-xs md:text-sm leading-relaxed text-text-muted">
                                                    {content.article1Text}
                                                </p>
                                            </section>

                                            <section>
                                                <p className="text-red-500 font-black uppercase tracking-widest mb-2 text-[10px] md:text-xs">{content.article2Title}</p>
                                                <p className="pl-4 border-l border-white/10 italic text-[10px] md:text-[11px] mb-3 text-white/60">
                                                    {content.article2Legal}
                                                </p>
                                                <p className="pl-4 border-l border-white/10 text-xs md:text-sm leading-relaxed text-text-muted">
                                                    {content.article2Text}
                                                </p>
                                            </section>

                                            <section>
                                                <p className="text-red-500 font-black uppercase tracking-widest mb-2 text-[10px] md:text-xs">{content.article3Title}</p>
                                                <p className="pl-4 border-l border-white/10 italic text-[10px] md:text-[11px] mb-3 text-white/60">
                                                    {content.article3Legal}
                                                </p>
                                                <p className="pl-4 border-l border-white/10 text-xs md:text-sm leading-relaxed text-text-muted">
                                                    {content.article3Text}
                                                </p>
                                            </section>

                                            <div className="pt-8 border-t border-white/5 text-center italic text-white/40 text-[10px] md:text-[11px]">
                                                {content.footerNote}
                                            </div>
                                        </div>

                                        <div className="p-5 md:p-6 border-t border-white/10 bg-black/20">
                                            <button 
                                                onClick={() => setShowFullRules(false)}
                                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] md:text-xs uppercase tracking-widest transition-all border border-white/10"
                                            >
                                                {content.understandBtn}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PolicyModal;

