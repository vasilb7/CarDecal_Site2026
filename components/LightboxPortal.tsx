import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LightboxPortalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
}

export const LightboxPortal: React.FC<LightboxPortalProps> = ({ isOpen, onClose, imageSrc }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
                onClick={onClose}
            >
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-[101]"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    <X className="w-6 h-6 text-white" />
                </motion.button>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative max-w-5xl max-h-[90vh] flex items-center justify-center cursor-default shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={imageSrc}
                        alt="Zoomed Profile"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg lg:rounded-2xl border border-white/5 shadow-2xl"
                    />
                    
                    {/* Subtle Gradient Backlight */}
                    <div className="absolute inset-0 bg-gold-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default LightboxPortal;
