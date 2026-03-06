import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, X, Mail, Phone, User as UserIcon, Lock, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary-utils';
import { isValidBulgarianPhone } from '../lib/utils';
import SEO from '../components/SEO';

const DB_NAME = 'CarDecalBookingDB';
const STORE_NAME = 'booking_photos';
const DB_VERSION = 1;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const savePhotosToDB = async (photos: File[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    if (photos.length > 0) {
      store.put(photos, 'photos_array');
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save photos to DB', err);
  }
};

const loadPhotosFromDB = async (): Promise<File[]> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('photos_array');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load photos from DB', err);
    return [];
  }
};

const clearPhotosFromDB = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.error('Failed to clear photos from DB', err);
  }
};

const BookingPage: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            showToast("Моля, влезте в профила си, за да направите запитване за индивидуален проект.", "info");
            navigate('/login', { state: { from: '/custom-orders' } });
        }
    }, [user, authLoading, navigate]);
    
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('custom_order_form_new');
        return saved ? JSON.parse(saved) : {
            fullName: '',
            phone: '',
            email: '',
            width: '',
            height: '',
            quantity: '',
            description: ''
        };
    });

    const [photos, setPhotos] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load photos from IndexedDB on mount
        loadPhotosFromDB().then((savedPhotos) => {
            if (savedPhotos && savedPhotos.length > 0) {
                setPhotos(savedPhotos);
            }
            setIsLoadingPhotos(false);
        });
    }, []);

    useEffect(() => {
        localStorage.setItem('custom_order_form_new', JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        if (!isLoadingPhotos) {
            savePhotosToDB(photos);
        }
    }, [photos, isLoadingPhotos]);

    // Auto-fill form data with user profile if logged in
    useEffect(() => {
        if (profile && user) {
            setFormData(prev => {
                const metaName = user.user_metadata?.full_name || 
                               (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : '');
                const finalFullName = profile.full_name || metaName || '';
                
                const updates: any = {};
                if (!prev.fullName && finalFullName) updates.fullName = finalFullName;
                if (!prev.phone && (profile.phone || user.user_metadata?.phone)) updates.phone = profile.phone || user.user_metadata?.phone;
                if (!prev.email && (user.email || profile.email)) updates.email = user.email || profile.email;
                
                if (Object.keys(updates).length > 0) {
                    return { ...prev, ...updates };
                }
                return prev;
            });
        }
    }, [profile, user]);

    const handleClearForm = async () => {
        setFormData({
            fullName: '',
            phone: '',
            email: '',
            width: '',
            height: '',
            quantity: '',
            description: ''
        });
        setPhotos([]);
        await clearPhotosFromDB();
        setShowClearConfirm(false);
    };

    // Detect mobile keyboard close effect properly
    useEffect(() => {
        if (typeof window !== 'undefined' && window.visualViewport) {
          let isKeyboardOpen = false;
    
          const handleViewportResize = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const screenHeight = window.innerHeight;
            
            if (currentHeight < screenHeight * 0.8) {
              isKeyboardOpen = true;
            } else if (currentHeight > screenHeight * 0.9 && isKeyboardOpen) {
              isKeyboardOpen = false;
              if (
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement ||
                document.activeElement instanceof HTMLButtonElement
              ) {
                document.activeElement.blur();
              }
            }
          };
    
          window.visualViewport.addEventListener('resize', handleViewportResize);
          return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportResize);
          };
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'description' && value.length > 500) {
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const incomingFiles = Array.from(e.target.files) as File[];
            const validFiles = incomingFiles.filter(f => f.size <= 5 * 1024 * 1024);
            
            if (validFiles.length < incomingFiles.length) {
                showToast("Някои снимки бяха пропуснати (Надхвърлят 5MB)", "error");
            }
            
            setPhotos(prev => {
                const combined = [...prev, ...validFiles];
                return combined.slice(0, 5); // Max 5 total
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isValidBulgarianPhone(formData.phone)) {
            showToast("Невалиден телефон! Въведете коректен български мобилен номер.", "error");
            return;
        }
        
        setShowSubmitConfirm(true);
    };

    const handleActualSubmit = async () => {
        setShowSubmitConfirm(false);
        setIsSubmitting(true);
        
        try {
            const uploadedImages: string[] = [];
            
            for (const file of photos) {
                try {
                    const url = await uploadToCloudinary(file, 'custom_orders');
                    uploadedImages.push(url);
                } catch (uploadError) {
                    console.error("Cloudinary upload error:", uploadError);
                    throw uploadError;
                }
            }

            const fullNameParts = formData.fullName.trim().split(' ');
            const firstName = fullNameParts[0] || '';
            const lastName = fullNameParts.slice(1).join(' ') || '';
            
            const { error: insertError } = await supabase.from('custom_orders').insert({
                 first_name: firstName,
                 last_name: lastName,
                 phone: formData.phone,
                 email: formData.email,
                 user_id: user?.id || null,
                 width: formData.width,
                 height: formData.height,
                 quantity: formData.quantity,
                 description: formData.description,
                 images: uploadedImages
            });
            
            if (insertError) throw insertError;
            
            // Trigger email notification
            if (formData.email) {
                supabase.functions.invoke('send-booking-email', {
                    body: {
                        email: formData.email,
                        firstName: firstName,
                        lastName: lastName,
                        phone: formData.phone,
                        width: formData.width,
                        height: formData.height,
                        quantity: formData.quantity,
                        description: formData.description
                    }
                }).catch(err => console.error("Email notification error:", err));
            }
            
            showToast(t('booking.success'), 'success');
            
            setFormData({
                fullName: '',
                phone: '',
                email: '',
                width: '',
                height: '',
                quantity: '',
                description: ''
            });
            setPhotos([]);
            await clearPhotosFromDB();
            localStorage.removeItem('custom_order_form_new');
        } catch (error) {
            console.error('Submission error:', error);
            showToast(t('booking.error'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || (!user && !authLoading)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] pb-24 relative overflow-hidden font-sans">
            <SEO title="Индивидуални Проекти" />
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-number-input::-webkit-inner-spin-button, 
                .custom-number-input::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .custom-number-input {
                    -moz-appearance: textfield;
                }
                /* Satin background texture */
                .satin-bg {
                    background: radial-gradient(ellipse at 50% 0%, #1a1a1a 0%, #050505 80%);
                }
            `}} />

            <div className="absolute inset-0 pointer-events-none satin-bg opacity-80" />
            
            <div className="relative z-10 pt-16 pb-10 text-center">
                <h1 className="text-3xl md:text-5xl lg:text-5xl font-serif text-[#e0e0e0] tracking-[0.1em] uppercase mb-4 shadow-black drop-shadow-[0_5px_10px_rgba(0,0,0,1)]">
                    Индивидуални Проекти
                </h1>
                <p className="text-[#981b1b] text-xs md:text-sm uppercase tracking-[0.2em] font-medium drop-shadow-md">
                    Изработени специално за теб
                </p>
            </div>

            <div className="container mx-auto px-4 max-w-4xl relative z-20">
                {/* Outer Bezel */}
                <div className="bg-gradient-to-b from-[#404040] via-[#222] to-[#111] p-[3px] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                    {/* Inner Bezel */}
                    <div className="bg-[#111] p-[4px] rounded-[10px]">
                        {/* Main Container */}
                        <div className="bg-gradient-to-br from-[#1d1d1d] to-[#121212] rounded-lg p-5 md:p-8 xl:p-10 border border-black shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                            
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 4px)' }}></div>
                            
                            <div className="relative z-10">
                                {/* Special Offer Banner */}
                                <div className="relative bg-gradient-to-b from-[#3a0a0a] to-[#150202] rounded-md border border-[#551313] p-4 mb-8 flex items-center gap-4 shadow-[inset_0_1px_0_rgba(255,100,100,0.1),0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#7a1818] bg-gradient-to-b from-[#2a0505] to-[#110000] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] shrink-0 relative">
                                        <div className="absolute inset-1 rounded-full border border-red-500/20 border-dashed animate-[spin_10s_linear_infinite]"></div>
                                        <AlertCircle className="text-[#cc2222] w-5 h-5 md:w-6 md:h-6 relative z-10 drop-shadow-[0_0_5px_rgba(200,0,0,0.5)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-[#cebc89] font-semibold uppercase tracking-widest text-xs md:text-sm">Специална Оферта</h3>
                                        <p className="text-gray-300 text-[10px] md:text-xs mt-1">Поръчай <span className="text-white font-bold tracking-wider">50+ БРОЯ</span> за <span className="text-red-500 font-bold uppercase tracking-widest px-1 py-0.5 border border-red-500/30 rounded-sm ml-1 bg-red-500/10">Безплатен</span> проект!</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Full Name Field */}
                                    <GlossyInput 
                                        name="fullName" 
                                        label="ИМЕ И ФАМИЛИЯ" 
                                        placeholder="Име и Фамилия" 
                                        value={formData.fullName} 
                                        onChange={handleInputChange} 
                                        onKeyDown={handleKeyDown} 
                                        icon={<UserIcon size={18} className="text-[#cebc89]" />} 
                                    />
                                    
                                    {/* Full Width: Phone & Email */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <GlossyInput
                                            label="ТЕЛЕФОН"
                                            name="phone"
                                            type="tel"
                                            placeholder="08X XXX XXXX"
                                            icon={<Phone size={18} className="text-[#cebc89]" />}
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <GlossyInput
                                            label="Имейл"
                                            name="email"
                                            type="email"
                                            placeholder="Въведете вашия имейл"
                                            icon={<Mail size={18} className="text-[#cebc89]" />}
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>

                                    {/* Three Columns: Dimensions & Quantity */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <MeasurementInput name="width" label="ШИР." unit="СМ" icon="📏" value={formData.width} onChange={handleInputChange} onKeyDown={handleKeyDown} />
                                        <MeasurementInput name="height" label="ВИС." unit="СМ" icon="📏" value={formData.height} onChange={handleInputChange} onKeyDown={handleKeyDown} />
                                        <MeasurementInput name="quantity" label="БРОЙ" unit="бр." icon="📦" value={formData.quantity} onChange={handleInputChange} min="1" onKeyDown={handleKeyDown} />
                                    </div>

                                    {/* Textarea Description */}
                                    <div className="space-y-1.5 mt-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[#a09060] text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase">Описание</label>
                                            <span className="text-[#777] text-[9px] font-bold bg-[#111] px-2 py-0.5 rounded border border-[#222] shadow-inner">{formData.description.length}/500</span>
                                        </div>
                                        <div className="relative rounded-md p-[1px] bg-gradient-to-b from-[#3a3a3a] to-[#151515]">
                                             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-md mix-blend-overlay z-10"></div>
                                             <textarea
                                                 name="description" required rows={4} maxLength={500}
                                                 placeholder="ОПИШИ ИДЕЯТА (МАКС 500 ЗНАКА)..."
                                                 value={formData.description} onChange={handleInputChange}
                                                 autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                                                 className="w-full bg-[#181818] text-gray-200 placeholder-[#444] text-[13px] md:text-sm p-4 rounded-md border-none focus:ring-1 focus:ring-[#555] resize-none shadow-[inset_0_3px_15px_rgba(0,0,0,0.9)] relative z-20 font-medium"
                                             />
                                             <div className="absolute top-[1px] left-[1px] right-[1px] h-[30%] bg-gradient-to-b from-white/5 to-transparent rounded-t-md pointer-events-none z-30"></div>
                                        </div>
                                    </div>

                                    {/* Photos Section */}
                                    <div className="space-y-1.5 pt-2">
                                        <div className="relative bg-[#1a1a1a] rounded-t-md border-b border-[#333] p-2 flex justify-between items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_5px_10px_rgba(0,0,0,0.3)] z-20">
                                            <label className="text-[#a09060] text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase pl-2">Снимки</label>
                                            <div className="flex items-center">
                                                <span className="text-[#888] text-[9px] font-bold tracking-widest mr-3">ДОБАВИ</span>
                                                <div className="flex gap-1 mr-3">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className={`w-2 h-2 rounded-full shadow-inner border border-black/50 ${i < photos.length ? 'bg-[#cebc89] shadow-[0_0_5px_#cebc89]' : 'bg-[#111] shadow-[inset_0_1px_3px_rgba(0,0,0,1)]'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-gray-400 text-[10px] font-bold">{photos.length}/5</span>
                                            </div>
                                        </div>

                                        <div className="relative rounded-b-md p-[2px] bg-gradient-to-b from-[#2a2a2a] to-[#111] -mt-1 pt-1">
                                            <div className="bg-[#141414] rounded-b-md p-6 shadow-[inset_0_10px_20px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center relative overflow-hidden min-h-[160px]">
                                                <input 
                                                     type="file" multiple accept="image/*" className="hidden" 
                                                     ref={fileInputRef} onChange={handleFileChange} disabled={photos.length >= 5}
                                                 />
                                                 
                                                 {photos.length === 0 ? (
                                                     <div className="flex flex-col items-center justify-center py-4">
                                                         <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 5}
                                                             className="relative group w-20 h-14 md:w-24 md:h-16 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                                                         >
                                                             {/* Outer button rim */}
                                                             <div className="absolute inset-0 bg-gradient-to-b from-[#404040] to-[#111] rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,1)] border border-[#111]"></div>
                                                             {/* Inner depressed area */}
                                                             <div className="absolute inset-1.5 bg-gradient-to-t from-[#151515] to-[#252525] rounded-[1.2rem] shadow-[inset_0_3px_6px_rgba(0,0,0,0.8)] border border-[#000]"></div>
                                                             {/* Glass/metal center */}
                                                             <div className="absolute inset-2.5 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center border border-[#333]">
                                                                 <div className="text-[#a09060] text-2xl font-light drop-shadow-[0_0_5px_rgba(200,180,120,0.4)]">+</div>
                                                             </div>
                                                         </button>
                                                         <p className="mt-5 text-[#555] text-[9px] font-semibold tracking-[0.2em] uppercase cursor-pointer transition-colors hover:text-[#888]" onClick={() => fileInputRef.current?.click()}>
                                                             Прикачи примерни снимки или скици
                                                         </p>
                                                     </div>
                                                 ) : (
                                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full h-full relative z-10 p-2">
                                                         <AnimatePresence mode="popLayout">
                                                             {photos.map((file, idx) => (
                                                                 <motion.div 
                                                                     layout
                                                                     initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                                                     key={`${file.name}-${file.lastModified}-${file.size}`} 
                                                                     className="relative aspect-square rounded-md overflow-hidden bg-black border border-[#333] group shadow-[0_5px_15px_rgba(0,0,0,0.8)]"
                                                                 >
                                                                     <img 
                                                                         src={URL.createObjectURL(file)} alt="Upload"
                                                                         className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                                                     />
                                                                     <button
                                                                         type="button" onClick={() => removePhoto(idx)}
                                                                         className="absolute top-1 right-1 w-6 h-6 bg-[#981b1b] border border-[#ff4444] flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-95"
                                                                     >
                                                                         <span className="text-white text-[10px] font-bold">✕</span>
                                                                     </button>
                                                                 </motion.div>
                                                             ))}
                                                             {photos.length < 5 && (
                                                                 <motion.button layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key="add-button" type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-md border border-[#333] border-dashed bg-[#111] flex flex-col items-center justify-center transition-colors hover:bg-[#1a1a1a] hover:border-[#555] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                                                                     <Plus className="text-[#555] w-5 h-5 mb-1" />
                                                                 </motion.button>
                                                             )}
                                                         </AnimatePresence>
                                                     </div>
                                                 )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Submit Button & Clear Form */}
                                    <div className="pt-6">
                                        <div className="flex justify-end pr-1 mb-2">
                                            <button 
                                                type="button"
                                                onClick={() => setShowClearConfirm(true)}
                                                className="text-[#888] hover:text-[#cebc89] text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 active:scale-95"
                                            >
                                                <X size={14} />
                                                Изчисти формата
                                            </button>
                                        </div>
                                        <div className="relative rounded-md p-[2px] bg-gradient-to-b from-[#888] to-[#222] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                                            <button
                                                type="submit" disabled={isSubmitting}
                                                className="w-full relative overflow-hidden bg-gradient-to-b from-[#b11f1f] to-[#590a0a] rounded-[4px] py-4 md:py-5 flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-70 disabled:filter-none shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] border border-[#330000]"
                                            >
                                                {/* Button glass highlight */}
                                                <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none mix-blend-overlay"></div>
                                                <span className="text-[#f0f0f0] font-semibold text-sm md:text-base tracking-[0.15em] relative z-10 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                                    {isSubmitting ? "ИЗПРАЩАНЕ..." : "ИЗПРАТИ ЗАПИТВАНЕ"}
                                                </span>
                                                {!isSubmitting && <span className="text-[#f0f0f0] text-lg font-bold relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-0.5">→</span>}
                                            </button>
                                        </div>
                                    </div>

                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {showClearConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gradient-to-b from-[#222] to-[#111] p-[2px] rounded-xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                        >
                            <div className="bg-[#111] rounded-[10px] overflow-hidden">
                                <div className="p-6 md:p-8">
                                    <h3 className="text-[#cebc89] font-semibold uppercase tracking-widest text-base md:text-lg mb-2 text-center">
                                        Внимание
                                    </h3>
                                    <p className="text-gray-300 text-sm md:text-base text-center mb-8">
                                        Сигурни ли сте, че искате да изчистите цялата форма и прикачените снимки?
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowClearConfirm(false)}
                                            className="flex-1 bg-[#222] hover:bg-[#333] text-white py-3 rounded-md font-semibold text-xs md:text-sm uppercase tracking-widest transition-colors"
                                        >
                                            Отказ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearForm}
                                            className="flex-1 bg-gradient-to-b from-[#8b1818] to-[#590a0a] hover:from-[#a01c1c] hover:to-[#6b0c0c] text-white py-3 rounded-md font-semibold text-xs md:text-sm uppercase tracking-widest transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_10px_rgba(0,0,0,0.5)] border border-[#300]"
                                        >
                                            Изчисти
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showSubmitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gradient-to-b from-[#222] to-[#111] p-[2px] rounded-xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                        >
                            <div className="bg-[#111] rounded-[10px] overflow-hidden">
                                <div className="p-6 md:p-8">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                        <Mail className="text-red-500" size={30} />
                                    </div>
                                    <h3 className="text-[#cebc89] font-semibold uppercase tracking-widest text-base md:text-lg mb-2 text-center">
                                        Потвърждение
                                    </h3>
                                    <p className="text-gray-300 text-sm md:text-base text-center mb-8">
                                        Готови ли сте да изпратите вашето запитване за индивидуален дизайн?
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowSubmitConfirm(false)}
                                            className="flex-1 bg-[#222] hover:bg-[#333] text-white py-3 rounded-md font-semibold text-xs md:text-sm uppercase tracking-widest transition-colors"
                                        >
                                            Отказ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleActualSubmit}
                                            className="flex-1 bg-gradient-to-b from-[#b11f1f] to-[#590a0a] hover:from-[#a01c1c] hover:to-[#6b0c0c] text-white py-3 rounded-md font-semibold text-xs md:text-sm uppercase tracking-widest transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_10px_rgba(0,0,0,0.5)] border border-[#300]"
                                        >
                                            Изпрати
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const GlossyInput = ({ name, label, placeholder, type = "text", value, onChange, onKeyDown }: any) => (
    <div className="space-y-1.5 flex flex-col">
        <label className="text-[#a09060] text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase px-1">
            {label}
        </label>
        <div className="relative rounded-md p-[1px] bg-gradient-to-b from-[#3a3a3a] to-[#151515]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-md z-10 mix-blend-overlay"></div>
            <input 
                type={type} name={name} required placeholder={placeholder} value={value} onChange={onChange}
                onKeyDown={onKeyDown}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                className="w-full bg-[#181818] text-gray-200 placeholder-[#444] text-[13px] md:text-sm px-4 py-3 min-h-[44px] rounded-md border-none focus:ring-1 focus:ring-[#555] shadow-[inset_0_3px_10px_rgba(0,0,0,0.9)] relative z-20 font-medium"
            />
            <div className="absolute top-[1px] left-[1px] right-[1px] h-[40%] bg-gradient-to-b from-white/5 to-transparent rounded-t-md pointer-events-none z-30"></div>
        </div>
    </div>
);

const MeasurementInput = ({ name, label, unit, value, icon, onChange, min, onKeyDown }: any) => (
    <div className="space-y-1.5 flex flex-col">
        <label className="text-[#a09060] text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase px-1">
            {label}
        </label>
        <div className="relative rounded-md p-[1px] bg-gradient-to-b from-[#3a3a3a] to-[#151515] h-[46px] flex items-center">
            {/* Background */}
            <div className="absolute inset-[1px] rounded-md bg-[#181818] shadow-[inset_0_3px_10px_rgba(0,0,0,0.9)] z-0"></div>
            
            <div className="relative z-10 flex items-center justify-between w-full h-full px-3">
                {/* Left Icon Area */}
                <div className="opacity-40 grayscale sepia contrast-150 brightness-50 text-[18px]">
                    {icon}
                </div>

                {/* Counter Input area */}
                <div className="w-[4.5rem] h-7 bg-[#0a0a0a] border border-black rounded-sm flex items-center justify-center shadow-[inset_0_2px_6px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.05)] relative">
                    <input 
                        type="number" name={name} required min={min} placeholder="0" value={value} onChange={onChange}
                        onKeyDown={onKeyDown}
                        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                        className="w-full h-full bg-transparent text-center text-[#d0d0d0] text-sm md:text-base font-bold border-none focus:ring-0 appearance-none p-0 custom-number-input relative z-10"
                    />
                    {/* Shadow overlay to look like mechanical counter wheel */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/80 via-transparent to-black/80 rounded-sm z-20"></div>
                </div>

                {/* Right Unit Area */}
                <div className="text-[#a09060] text-[10px] md:text-xs font-bold shrink-0 lowercase">
                    {unit}
                </div>
            </div>
            
            {/* Top Gloss */}
            <div className="absolute top-[1px] left-[1px] right-[1px] h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-20 rounded-t-md mix-blend-overlay"></div>
        </div>
    </div>
);

export default BookingPage;
