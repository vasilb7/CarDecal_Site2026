import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2, Mail, Loader2, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface RecoveryPageProps {
  onRecover?: (email: string) => Promise<void>;
}

export const RecoveryPage: React.FC<RecoveryPageProps> = ({ onRecover }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Detect mobile keyboard close effect properly
    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.visualViewport) {
          let isKeyboardOpen = false;
          const handleViewportResize = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const screenHeight = window.innerHeight;
            if (currentHeight < screenHeight * 0.8) {
              isKeyboardOpen = true;
            } else if (currentHeight > screenHeight * 0.9 && isKeyboardOpen) {
              isKeyboardOpen = false;
              if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
                document.activeElement.blur();
              }
            }
          };
          window.visualViewport.addEventListener('resize', handleViewportResize);
          return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
        }
    }, []);

const FloatingInput = ({ 
    label, 
    name, 
    type = "text", 
    required = false, 
    icon: Icon,
    ...props 
}: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState("");

    return (
        <div className="relative group">
            <motion.label
                initial={false}
                animate={{
                    y: (isFocused || value) ? -40 : 0,
                    x: (isFocused || value) ? -4 : 0,
                    scale: (isFocused || value) ? 0.82 : 1,
                    color: isFocused ? "#ef4444" : (value ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)")
                }}
                className="absolute left-6 top-3.5 pointer-events-none transition-all duration-300 z-10 px-1"
            >
                {label}
            </motion.label>
            <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
                <input 
                    {...props}
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (props.onChange) props.onChange(e);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full bg-white/[0.03] border ${isFocused ? 'border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-xl px-6 py-3.5 md:py-4 shadow-sm outline-none text-white placeholder:text-transparent backdrop-blur-md transition-all`}
                    required={required}
                    placeholder=" "
                />
            </div>
        </div>
    );
};

    const handleClose = () => {
        if (window.history.length > 2) navigate(-1);
        else navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            if (onRecover) {
                await onRecover(email);
                setIsSubmitted(true);
            } else {
                // Simulate an API call if no prop is provided for the preview
                await new Promise(resolve => setTimeout(resolve, 1500));
                setIsSubmitted(true);
            }
        } catch (err: any) {
            setError(err.message || 'Възникна грешка при изпращането на имейла');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center font-sans text-white p-4 sm:p-6 relative overflow-hidden bg-[#000000]">
            
            {/* Deep Abstract Background Gradient */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,_#3D0000_0%,_#000000_75%)] opacity-90" />

            {/* Subtle Grid Pattern for extra detail */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3D000015_1px,transparent_1px),linear-gradient(to_bottom,#3D000015_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* Animated Ambient Light/Smoke - Very subtle and clean */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.15, 1],
                        opacity: [0.1, 0.25, 0.1],
                        rotate: [0, 5, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-5%] left-[-15%] w-[70%] h-[70%] md:w-[60%] md:h-[60%] bg-[#950101] blur-[140px] md:blur-[180px] rounded-full"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.05, 0.15, 0.05],
                        rotate: [0, -5, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] md:w-[50%] md:h-[50%] bg-[#FF0000] blur-[150px] md:blur-[200px] rounded-full"
                />
            </div>


            {/* Centered Glassmorphism Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[540px] bg-[#000000]/70 backdrop-blur-2xl border border-[#3D0000]/60 rounded-[32px] md:rounded-[40px] p-6 sm:p-10 md:p-14 shadow-[0_10px_50px_0_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(149,1,1,0.2)] relative z-10"
            >
                {/* Back Link */}
                <button 
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#FF0000] transition-colors duration-300 text-[14px] md:text-[15px] font-medium mb-6 md:mb-8 group w-fit"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1.5 transition-transform duration-300" />
                    <span>Назад</span>
                </button>

                {!isSubmitted ? (
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-[36px] font-bold text-white mb-4 md:mb-6 tracking-tight drop-shadow-sm leading-tight">
                                Възстановете акаунта си
                            </h1>
                            
                            <div className="space-y-3 md:space-y-4 text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-gray-300 font-light">
                                <p className="font-medium text-white text-base md:text-lg">
                                    Избрали сте опцията за забравена парола.
                                </p>
                                <p>
                                    За да възстановите достъпа до Вашия профил, моля, въведете Вашия имейл адрес, който сте използвали при регистрация.
                                </p>
                                <p>
                                    Препоръчваме Ви да използвате сигурна и лесна за запомняне от Вас парола, за да гарантирате безопасността на Вашия акаунт.
                                </p>
                                <p>
                                    След като изпратите заявката, ще получите инструкции на Вашия имейл как да зададете нова парола.
                                </p>
                            </div>
                        </div>

                        <form className="space-y-8 pt-4" onSubmit={handleSubmit}>
                            <FloatingInput 
                                label="Имейл адрес"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                required
                            />

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -5, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    className="text-[#FF0000] text-[13px] md:text-sm bg-[#3D0000]/20 p-3.5 md:p-4 rounded-xl border border-[#950101]/30 font-medium flex items-start gap-2"
                                >
                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#FF0000] shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.985 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full relative overflow-hidden bg-gradient-to-r from-[#950101] to-[#3D0000] hover:from-[#FF0000] hover:to-[#950101] text-white font-bold py-3.5 md:py-4.5 rounded-xl text-[16px] md:text-[18px] shadow-[0_4px_20px_rgba(149,1,1,0.2)] hover:shadow-[0_6px_25px_rgba(255,0,0,0.4)] transition-all duration-300 disabled:opacity-70 mt-2 md:mt-4 border border-[#FF0000]/20 hover:border-[#FF0000]/50 tracking-wide group"
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin text-white/80" />
                                            <span>Изпращане...</span>
                                        </>
                                    ) : (
                                        'Възстанови акаунта ми'
                                    )}
                                </div>
                            </motion.button>
                        </form>

                        <div className="pt-5 md:pt-6 space-y-3.5 md:space-y-4 border-t border-[#3D0000]/60 mt-4 md:mt-6">
                            <p className="text-[13px] md:text-[14px] text-gray-300 text-center sm:text-left">
                                Проблеми? <Link to="/contact" className="text-[#FF0000] hover:text-[#950101] font-medium hover:underline transition-colors duration-300">Свържете се с нас</Link>.
                            </p>
                        </div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 md:py-12 px-2"
                    >
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                            className="w-20 h-20 md:w-24 md:h-24 bg-[#000000]/60 border border-[#950101] rounded-full flex items-center justify-center mb-6 md:mb-8 mx-auto shadow-[0_0_40px_rgba(149,1,1,0.5)] relative overflow-hidden"
                        >
                            {/* Inner glowing effect for the circle */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF0000]/20 to-transparent opacity-50" />
                            <div className="absolute inset-0 rounded-full bg-[#FF0000]/10 blur-md animate-pulse" />
                            <CheckCircle2 size={40} className="text-[#FF0000] relative z-10 w-10 h-10 md:w-12 md:h-12" />
                        </motion.div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 md:mb-4 tracking-tight">
                            Проверете имейла си
                        </h2>
                        <p className="text-gray-300 text-[15px] md:text-lg mb-8 md:mb-10 leading-relaxed px-4">
                            Изпратихме линк за възстановяване на паролата до <br className="hidden sm:block"/>
                            <span className="text-white font-semibold mt-1 block sm:inline">{email}</span>
                        </p>
                        <a href="/login" onClick={(e) => e.preventDefault()}>
                            <motion.button 
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-[#3D0000]/30 hover:bg-[#950101]/80 border border-[#950101]/80 hover:border-[#FF0000] rounded-xl text-white font-medium transition-all duration-300 shadow-[0_0_15px_rgba(149,1,1,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.4)] text-[15px] md:text-[16px]"
                            >
                                Обратно към входа
                            </motion.button>
                        </a>
                    </motion.div>
                )}
            </motion.div>

            {/* Custom Keyframes for animations */}
            <style>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
};

export default function App() {
    return <RecoveryPage />;
}