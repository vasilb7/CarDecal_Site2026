
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Trophy, Star, MapPin, Calendar, Award } from 'lucide-react';

const contributions = [
    {
        name: "Pamela Nelson",
        nameBg: "Памела Нелсън",
        image: "/Stock Photos/Contributions/Miami Swim Week/Pamela_Nelson.jpeg",
        role: "Headliner / Top Model",
        roleBg: "Хедлайнер / Топ Модел",
        award: "Global Editorial Excellence Award",
        awardBg: "Награда за глобални едиториални постижения",
        description: "Pamela dominated the main stage, opening for 3 major designers. Her presence was cited as the highlight of the week.",
        descriptionBg: "Памела доминираше на основната сцена, откривайки ревютата на 3-ма големи дизайнери. Нейното присъствие бе посочено като акцента на седмицата."
    },
    {
        name: "Alexandra White",
        nameBg: "Александра Уайт",
        image: "/Stock Photos/Contributions/Miami Swim Week/Alexandra_White.jpeg",
        role: "Lead Runway Specialist",
        roleBg: "Водещ подиумен специалист",
        award: "Best Walk Performance 2026",
        awardBg: "Награда за най-добра подиумна походка 2026",
        description: "Known for her impeccable precision, Alexandra led the finale walk for the luxury swim collection.",
        descriptionBg: "Известна със своята безупречна прецизност, Александра поведе финалното дефиле за луксозната колекция бански костюми."
    },
    {
        name: "Anastasia Victorieva",
        nameBg: "Анастасия Викториева",
        image: "/Stock Photos/Contributions/Miami Swim Week/Anastasia_Victorieva.jpeg",
        role: "Exclusive Feature Talent",
        roleBg: "Ексклузивен талант",
        award: "Rising Star Discovery Award",
        awardBg: "Награда за изгряваща звезда",
        description: "Anastasia's debut at Miami Swim Week captured the attention of international scouts and fashion editors.",
        descriptionBg: "Дебютът на Анастасия на Miami Swim Week привлече вниманието на международни скаути и модни редактори.",
        isGuest: true
    }
];

const ContributionsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isBg = i18n.language === 'bg';

    const fadeIn = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: "easeOut" }
    };

    return (
        <div className="min-h-screen bg-black text-text-primary pt-24 pb-20">
            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    <img 
                        src="/Stock Photos/Contributions/Miami Swim Week/Pamela_Nelson.jpeg" 
                        alt="Miami Swim Week Hero" 
                        className="w-full h-full object-cover grayscale brightness-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>
                
                <div className="relative z-10 text-center space-y-6 px-4">
                    <motion.span 
                        initial={{ opacity: 0, letterSpacing: "0.2em" }}
                        animate={{ opacity: 1, letterSpacing: "0.5em" }}
                        className="text-gold-accent font-bold uppercase tracking-[0.5em] text-xs"
                    >
                        {isBg ? "ЕКСКЛУЗИВНИ ПРЕДСТАВЯНИЯ" : "EXCLUSIVE APPEARANCES"}
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-8xl font-serif leading-tight"
                    >
                        Miami Swim Week
                    </motion.h1>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center space-x-6 text-sm text-text-muted font-light uppercase tracking-widest"
                    >
                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> July 2026</span>
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> Miami, FL</span>
                    </motion.div>
                </div>
            </section>

            {/* Event Info */}
            <section className="max-w-7xl mx-auto px-6 py-24 border-b border-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <motion.div {...fadeIn} className="space-y-8">
                        <h2 className="text-3xl md:text-5xl font-serif leading-tight">
                            {isBg ? "Предефиниране на подиумната елегантност" : "Redefining Runway Elegance"}
                        </h2>
                        <div className="w-20 h-px bg-gold-accent" />
                        <p className="text-xl text-text-muted leading-relaxed font-light">
                            {isBg 
                                ? "Тази година VB Models остави незаличима следа на най-престижното плажно събитие в света. Нашите топ модели бяха избрани да представят водещите дизайнерски къщи, демонстрирайки не само физическо съвършенство, но и артистична увереност."
                                : "This year, VB Models left an indelible mark on the world's most prestigious beachwear event. Our top-tier talent was selected to represent leading design houses, showcasing not just physical perfection, but artistic poise."}
                        </p>
                    </motion.div>
                    
                    <motion.div 
                        {...fadeIn} 
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 gap-8"
                    >
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                            <Trophy className="w-8 h-8 text-gold-accent" />
                            <h3 className="text-2xl font-serif">3</h3>
                            <p className="text-xs text-text-muted uppercase tracking-widest">{isBg ? "ГЛАВНИ НАГРАДИ" : "MAJOR AWARDS"}</p>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                            <Star className="w-8 h-8 text-gold-accent" />
                            <h3 className="text-2xl font-serif">12</h3>
                            <p className="text-xs text-text-muted uppercase tracking-widest">{isBg ? "ДЕФИЛЕТА" : "RUNWAY SHOWS"}</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Models Showcase */}
            <section className="max-w-7xl mx-auto px-6 py-24 space-y-32">
                {contributions.map((model, index) => (
                    <div key={model.name} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-20 items-center`}>
                        <motion.div 
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="w-full lg:w-1/2 aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl relative group"
                        >
                            <img 
                                src={model.image} 
                                alt={model.name} 
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="w-full lg:w-1/2 space-y-8"
                        >
                            <div className="space-y-4">
                                <span className="text-gold-accent font-bold uppercase tracking-[0.3em] text-[10px] flex items-center">
                                    <Award className="w-4 h-4 mr-2" /> {isBg ? model.awardBg : model.award}
                                </span>
                                <h3 className="text-4xl md:text-6xl font-serif">{isBg ? model.nameBg : model.name}</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-white/40">{isBg ? model.roleBg : model.role}</p>
                            </div>
                            
                            <p className="text-lg text-text-muted leading-relaxed font-light">
                                {isBg ? model.descriptionBg : model.description}
                            </p>
                            
                            {!model.isGuest && (
                                <div className="pt-6">
                                    <Link 
                                        to={`/models/${model.name.toLowerCase().replace(' ', '-')}`}
                                        className="inline-flex items-center space-x-4 group text-white hover:text-gold-accent transition-colors"
                                    >
                                        <span className="text-xs font-bold uppercase tracking-[0.3em] border-b border-white/20 group-hover:border-gold-accent pb-1">
                                            {isBg ? "ВИЖ ПРОФИЛА" : "ВИЖ ПРОФИЛА"}
                                        </span>
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </div>
                ))}
            </section>

            {/* Call to Action */}
            <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-12">
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="space-y-6"
                >
                    <h2 className="text-3xl md:text-5xl font-serif">{isBg ? "Разширете своята визия" : "Expand Your Vision"}</h2>
                    <p className="text-text-muted font-light leading-relaxed">
                        {isBg 
                            ? "Нашите таланти са готови да донесат същата енергия и професионализъм на вашия следващ проект. Свържете се с нас днес."
                            : "Our talent is ready to bring the same energy and professionalism to your next project. Connect with us today."}
                    </p>
                </motion.div>
                
                <Link 
                    to="/contact"
                    className="inline-block px-12 py-5 bg-gold-accent text-black font-bold uppercase tracking-[0.3em] text-xs hover:bg-white transition-all transform hover:-translate-y-1"
                >
                    {isBg ? "Резервирай сега" : "Book Talent Now"}
                </Link>
            </section>
        </div>
    );
};

export default ContributionsPage;
