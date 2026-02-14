import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCropModal } from '../components/SpotlightCropModal';
import { ExpandingMenu, MenuItem } from '../components/ExpandingMenu';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Upload, 
  Save, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Camera,
  MapPin,
  Ruler,
  Eye,
  Settings,
  Image as ImageIcon,
  Star,
  AlertTriangle,
  Info,
  MoreVertical, 
  Edit2, 
  Maximize2,
  Crop,
  Lock,
  Unlock,
  Clock,
  ArrowUp,
  ArrowDown,
  LayoutDashboard,
  Briefcase,
  FileImage,
  MessageSquare,
  CreditCard,
  Clapperboard,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  UserPlus,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Gift,
  TreePine,
  Heart,
  Snowflake,
  Tag,
  Percent
} from 'lucide-react';
import { adminService } from '../lib/adminService';
import { modelsService } from '../lib/modelsService';
import type { Model } from '../types';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';
import { dashboardService } from '../lib/dashboardService';



const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const currentLang = i18n.language.split("-")[0] || "bg";

  // State
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'models' | 'castings' | 'clients' | 'content' | 'communication' | 'finance' | 'settings'>(() => {
    return (localStorage.getItem('admin_active_tab') as any) || 'models';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Filtering
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('admin_search') || '');
  const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem('admin_filter_cat') || 'All');
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem('admin_filter_status') || 'All');

  // Form State
  const [editCoverImages, setEditCoverImages] = useState<string[]>([]);
  const [editBackgroundImage, setEditBackgroundImage] = useState<string>('');
  const [editCardImages, setEditCardImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]); // Track indices for bulk actions
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editBio, setEditBio] = useState('');
  const [spotlightBio, setSpotlightBio] = useState('');
  const [spotlightBioBg, setSpotlightBioBg] = useState('');
  const [spotlightProjects, setSpotlightProjects] = useState(0);
  const [spotlightAwards, setSpotlightAwards] = useState(0);
  const [bioLang, setBioLang] = useState<'en' | 'bg'>('bg');
  const [selectedTopModelId, setSelectedTopModelId] = useState<string>('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [maintenanceUpdatesText, setMaintenanceUpdatesText] = useState('');
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; index: number } | null>(null);
  
  // Hero Settings State
  const [heroType, setHeroType] = useState<'video' | 'image'>('video');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageToCrop, setHeroImageToCrop] = useState<string | null>(null);
  const [isHeroUploading, setIsHeroUploading] = useState(false);
  const [modelBgToCrop, setModelBgToCrop] = useState<string | null>(null);
  const [isModelBgUploading, setIsModelBgUploading] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroGrayscale, setHeroGrayscale] = useState(true);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Promo State
  const [activePromo, setActivePromo] = useState<string>('none');
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  // Announcement State
  const [announcement, setAnnouncement] = useState({ text: '', active: false });
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Pricing Config State
  const [pricingConfig, setPricingConfig] = useState<any>(settingsService.getDefaultPricingConfig());
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  const handleResetDatabase = async () => {
    if (!window.confirm("WARNING: ALL MODELS WILL BE DELETED AND RE-UPLOADED FROM SITE_PICS. CONTINUE?")) return;
    
    try {
      setIsUploading(true);
      showToast("Starting database reset...", "info");
      await adminService.reseedDatabase();
      showToast("Database reset complete! Models reseeded.", "success");
      fetchModels();
    } catch (error: any) {
      console.error(error);
      showToast(`Reseed failed: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };


  // Agency Command Center State
  const [agencyKPIs, setAgencyKPIs] = useState({
    newApplicants: 0,
    postsToReview: 0,
    castingsNeedTalent: 0,
    clientRequests: 0
  });
  const [funnelStats, setFunnelStats] = useState({
    applications: 0,
    shortlisted: 0,
    selected: 0,
    booked: 0
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<{ id: string; action: string; description: string; time: string; type: string }[]>([]);

  // Custom Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const AVAILABLE_CATEGORIES = [
    'Top Model', 'New Faces', 'Trending', 'Visiting', 'Young Talents',
    'Editorial', 'Runway', 'Commercial', 'Fashion'
  ];

  const fetchModels = async () => {
    try {
      setLoading(true);
      const data = await modelsService.getAllModels();
      setModels(data);
      const top = data.find((m: any) => m.is_top_model);
      if (top) {
        setSelectedTopModelId(top.id);
        setSpotlightBio(top.spotlight_bio || top.bio || '');
        setSpotlightBioBg(top.spotlight_bio_bg || top.bio_bg || '');
        setSpotlightProjects(top.spotlight_projects || 0);
        setSpotlightAwards(top.spotlight_awards || 0);
        // Sync both naming conventions
        setEditCardImages(top.card_images || top.cardImages || []);
      }
      
      const [maintenance, message, endTime, updateText, hSettings, promo, ann] = await Promise.all([
        settingsService.getMaintenanceMode(),
        settingsService.getMaintenanceMessage(),
        settingsService.getMaintenanceEndTime(),
        settingsService.getMaintenanceUpdatesText(),
        settingsService.getHeroSettings(),
        settingsService.getActivePromo(),
        settingsService.getAnnouncement()
      ]);
      setIsMaintenance(maintenance);
      setMaintenanceMessage(message);
      setMaintenanceEndTime(endTime || '');
      setMaintenanceUpdatesText(updateText);
      setHeroType(hSettings.hero_type as any);
      setHeroImageUrl(hSettings.hero_image_url);
      setHeroVideoUrl(hSettings.hero_video_url);
      setHeroGrayscale(hSettings.hero_grayscale);
      setActivePromo(promo);
      setAnnouncement(ann);

      // Fetch pricing config
      const pConfig = await settingsService.getPricingConfig();
      setPricingConfig(pConfig);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('admin_search', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    // Sync settings in real-time for other admins
    const channel = supabase
      .channel('admin_settings_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload: any) => {
        const { key, value } = payload.new;
        if (key === 'maintenance_mode') setIsMaintenance(value === 'true');
        if (key === 'maintenance_message') setMaintenanceMessage(value);
        if (key === 'maintenance_end_time') setMaintenanceEndTime(value);
        if (key === 'maintenance_updates_text') setMaintenanceUpdatesText(value);
        if (key === 'hero_type') setHeroType(value as any);
        if (key === 'hero_image_url') setHeroImageUrl(value);
        if (key === 'hero_video_url') setHeroVideoUrl(value);
        if (key === 'hero_grayscale') setHeroGrayscale(value === 'true');
        if (key === 'active_promo') setActivePromo(value || 'none');
        if (key === 'site_announcement') {
          try { setAnnouncement(JSON.parse(value)); } catch {}
        }
        if (key === 'pricing_config') {
          try { setPricingConfig(JSON.parse(value)); } catch {}
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Automatic Maintenance Turn-off when timer expires
  useEffect(() => {
    // Only run if maintenance is ON and there is an END TIME set
    if (!isMaintenance || !maintenanceEndTime) return;

    const timer = setInterval(async () => {
      const endsAt = new Date(maintenanceEndTime).getTime();
      const now = new Date().getTime();

      // If time has passed
      if (now > endsAt) {
        // Prevent multiple fires
        clearInterval(timer);

        try {
          // Double check with server to be safe (optional but good practice)
          // For now, we trust the client time relative to the setting
          
          // 1. Update DB to disable maintenance
          await settingsService.setMaintenanceMode(false);
          // 2. Clear the end time in DB so it doesn't auto-trigger again immediately if re-enabled
          await settingsService.setMaintenanceEndTime(''); 
          
          // 3. Update Local State to reflect 'OFF' immediately UI
          setIsMaintenance(false);
          setMaintenanceEndTime('');

          showToast('Maintenance timer expired. Site is now LIVE.', 'success');
        } catch (e) {
          console.error('Error auto-disabling maintenance:', e);
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(timer);
  }, [isMaintenance, maintenanceEndTime]);

  useEffect(() => {
    localStorage.setItem('admin_filter_cat', filterCategory);
  }, [filterCategory]);

  useEffect(() => {
    localStorage.setItem('admin_filter_status', filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    fetchModels();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admin_models_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => {
        fetchModels();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 1) BACKGROUND SCROLL LOCK
  useEffect(() => {
    if (!isModalOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      const y = Math.abs(parseInt(body.style.top || '0', 10)) || scrollY;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
      window.scrollTo(0, y);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (editingModel) {
      setEditCoverImages(editingModel.cover_image || []);
      setEditBackgroundImage(editingModel.background_image || '');
      setSelectedCategories(editingModel.categories || []);
      setEditBio(editingModel.bio || '');
    } else {
  setEditCoverImages([]);
      setEditBackgroundImage('');
      setSelectedCategories([]);
      setEditBio('');
    }
  }, [editingModel]);

  // Instant Top Model Switch
  const handleMakeTopModel = async (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    
    // 1. Optimistic UI Update
    const currentTop = models.find(m => m.is_top_model);
    
    // Allow toggle off if clicking the current top model? 
    // For now, let's assume valid "Top Model" means one exists. 
    // If clicking current, do nothing or toggle off? 
    // Let's allow switching to another model easily.
    
    if (currentTop?.id === modelId) return; 

    setModels(prev => prev.map(m => ({
      ...m,
      is_top_model: m.id === modelId
    })));

    showToast('Updating Top Model...', 'success');

    // 2. Background API Call
    try {
      if (currentTop) {
        await modelsService.updateModel(currentTop.id, { is_top_model: false });
      }
      await modelsService.updateModel(modelId, { is_top_model: true });
      showToast('Top model updated!', 'success');
      
      // Update spotlight editor if open
      if (selectedTopModelId !== modelId) {
         setSelectedTopModelId(modelId);
      }

    } catch (err: any) {
      console.error(err);
      fetchModels(); // Revert on error
      showToast(err.message, 'error');
    }
  };

  // Sync Spotlight Editor Fields — only when the selected model changes
  const prevTopModelIdRef = React.useRef<string>('');
  useEffect(() => {
    if (!selectedTopModelId || !models.length) return;
    // Only re-load fields when the selected model CHANGES, not on every models refresh
    if (prevTopModelIdRef.current === selectedTopModelId) return;
    prevTopModelIdRef.current = selectedTopModelId;
    
    const model = models.find(m => m.id === selectedTopModelId);
    if (model) {
      setSpotlightBio(model.spotlight_bio || model.bio || '');
      setSpotlightBioBg(model.spotlight_bio_bg || '');
      setSpotlightProjects(model.spotlight_projects || 0);
      setSpotlightAwards(model.spotlight_awards || 0);
      setEditCardImages(model.card_images || model.cardImages || []);
      // Reset bulk selection
      setSelectedImages([]);
    }
  }, [selectedTopModelId, models]);

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchStats = async () => {
      if (activeTab === 'dashboard') {
        setDashboardLoading(true);
        try {
          const kpis = await dashboardService.getAgencyKPIs();
          const funnel = await dashboardService.getFunnelStats();
          const activity = await dashboardService.getAuditLog();
          
          setAgencyKPIs(kpis);
          setFunnelStats(funnel);
          setActivityLog(activity);
        } catch (error) {
          console.error("Failed to load dashboard stats", error);
        } finally {
          setDashboardLoading(false);
        }
      }
    };
    fetchStats();
  }, [activeTab]);

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || m.categories?.includes(filterCategory);
    const matchesStatus = filterStatus === 'All' 
      ? true 
      : filterStatus === 'pending' 
        ? m.status === 'pending'
        : m.availability === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* STICKY TOP BAR */}
      <header className="shrink-0 sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-white">Agency <span className="text-gold-accent">Admin</span></h1>
          </div>
          
          <ExpandingMenu 
            className="ml-8"
            items={[
              {
                id: 'dashboard',
                label: 'Dashboard',
                icon: <LayoutDashboard size={18} />,
                active: activeTab === 'dashboard',
                onClick: () => setActiveTab('dashboard')
              },
              {
                id: 'models',
                label: 'Models',
                icon: <Users size={18} />,
                active: activeTab === 'models',
                onClick: () => setActiveTab('models')
              },
              {
                id: 'castings',
                label: 'Castings',
                icon: <Clapperboard size={18} />,
                active: activeTab === 'castings',
                onClick: () => setActiveTab('castings')
              },
              {
                id: 'clients',
                label: 'Clients',
                icon: <Briefcase size={18} />,
                active: activeTab === 'clients',
                onClick: () => setActiveTab('clients')
              },
              {
                id: 'content',
                label: 'Content',
                icon: <FileImage size={18} />,
                active: activeTab === 'content',
                onClick: () => setActiveTab('content')
              },
              {
                id: 'communication',
                label: 'Communication',
                icon: <MessageSquare size={18} />,
                active: activeTab === 'communication',
                onClick: () => setActiveTab('communication')
              },
              {
                id: 'finance',
                label: 'Finance',
                icon: <CreditCard size={18} />,
                active: activeTab === 'finance',
                onClick: () => setActiveTab('finance')
              },
              {
                id: 'settings',
                label: 'Settings',
                icon: <Settings size={18} />,
                active: activeTab === 'settings',
                onClick: () => setActiveTab('settings')
              }
            ]} 
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            disabled={isUpdatingMaintenance}
            onClick={async () => {
              try {
                setIsUpdatingMaintenance(true);
                const newState = !isMaintenance;
                await settingsService.setMaintenanceMode(newState);
                setIsMaintenance(newState);
                showToast(newState ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled', 'success');
              } catch (error: any) {
                showToast(error.message, 'error');
              } finally {
                setIsUpdatingMaintenance(false);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 border transition-all group ${isMaintenance ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'border-white/10 text-white/40 hover:border-gold-accent hover:text-gold-accent'}`}
          >
            {isMaintenance ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="text-[9px] font-bold uppercase tracking-widest">{isMaintenance ? 'Maintenance Active' : 'Maintenance Off'}</span>
          </button>

          <button 
            onClick={() => { setEditingModel(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-white text-black px-5 py-2 hover:bg-gold-accent transition-all group"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">New Profile</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-auto p-5 bg-[#020202] custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-[0.2em] text-white">Agency <span className="text-gold-accent">Overview</span></h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">Real-time performance metrics</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">System Online</span>
                  </div>
                  <button className="bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-accent transition-colors">
                    Download Report
                  </button>
                </div>
              </div>

              {/* Quick Actions Toolbar */}
              <div className="flex items-center gap-3 py-3 overflow-x-auto custom-scrollbar">
                {[
                  { label: 'Create Casting', icon: <Plus size={14} />, action: () => setActiveTab('castings') },
                  { label: 'Invite Models', icon: <UserPlus size={14} />, action: () => setActiveTab('models') },
                  { label: 'Generate Comp Card', icon: <FileImage size={14} />, action: () => setActiveTab('models') },
                  { label: 'Bulk Email', icon: <MessageSquare size={14} />, action: () => setActiveTab('communication') }
                ].map((action, i) => (
                  <button 
                    key={i} 
                    onClick={action.action}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-gold-accent hover:border-gold-accent hover:text-black transition-all group whitespace-nowrap"
                  >
                    <div className="text-gold-accent group-hover:text-black transition-colors">{action.icon}</div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Stats Grid - OPERATIONAL KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    label: 'New Applicants', 
                    value: dashboardLoading ? '...' : agencyKPIs.newApplicants, 
                    trend: 'Action Required', 
                    icon: <UserPlus className="w-5 h-5 text-gold-accent" />,
                    color: 'text-white',
                    action: () => { setActiveTab('models'); setFilterStatus('pending'); }
                  },
                  { 
                    label: 'Posts to Review', 
                    value: dashboardLoading ? '...' : agencyKPIs.postsToReview, 
                    trend: 'Moderation Queue', 
                    icon: <FileImage className="w-5 h-5 text-orange-500" />,
                    color: 'text-orange-500',
                    action: () => { setActiveTab('content'); }
                  },
                  { 
                    label: 'Castings Need Talent', 
                    value: dashboardLoading ? '...' : agencyKPIs.castingsNeedTalent, 
                    trend: 'Urgent', 
                    icon: <Clapperboard className="w-5 h-5 text-red-400" />,
                    color: 'text-white',
                    action: () => { setActiveTab('castings'); }
                  },
                  { 
                    label: 'Client Requests', 
                    value: dashboardLoading ? '...' : agencyKPIs.clientRequests, 
                    trend: 'Inbox', 
                    icon: <MessageSquare className="w-5 h-5 text-blue-400" />,
                    color: 'text-blue-400',
                    action: () => { setActiveTab('communication'); }
                  },
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    onClick={stat.action}
                    className="bg-white/[0.02] border border-white/5 p-4 hover:border-gold-accent/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 bg-white/5 rounded-lg group-hover:bg-gold-accent/10 transition-colors">
                        {stat.icon}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        stat.trend === 'Action Required' ? 'text-gold-accent animate-pulse' : 'text-white/40'
                      }`}>
                        {stat.trend}
                      </span>
                    </div>
                    <h3 className={`text-3xl font-black tracking-tight mb-1 ${stat.color}`}>{stat.value}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts & Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main Funnel Area */}
                <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-gold-accent" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Casting Funnel</h3>
                    </div>
                  </div>
                  
                  {/* Funnel Chart */}
                  <div className="flex-1 flex flex-col justify-end gap-4 h-52 w-full pt-2 relative px-3">
                    {[
                      { label: 'Applications', val: funnelStats.applications, max: 200, color: 'bg-white/10' },
                      { label: 'Shortlisted', val: funnelStats.shortlisted, max: 200, color: 'bg-white/20' },
                      { label: 'Selected', val: funnelStats.selected, max: 200, color: 'bg-white/40' },
                      { label: 'Booked', val: funnelStats.booked, max: 200, color: 'bg-gold-accent' } // Gold for the money goal
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-24 text-[10px] uppercase tracking-widest text-white/40 text-right">{step.label}</div>
                        <div className="flex-1 h-8 bg-white/5 rounded-sm overflow-hidden relative">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(step.val / step.max) * 100}%` }}
                             transition={{ duration: 1, delay: i * 0.1 }}
                             className={`h-full ${step.color}`}
                           />
                           <div className="absolute top-0 right-0 h-full flex items-center px-4 text-xs font-bold text-white">
                             {step.val}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Realtime Activity */}
                <div className="bg-white/[0.02] border border-white/5 flex flex-col">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-gold-accent" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Recent Activity</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar p-4 space-y-4">
                    {/* Pending Approvals */}
                    {models.filter(m => m.status === 'pending').length > 0 ? (
                      <div className="space-y-4">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500">Pending Reviews</span>
                        {models.filter(m => m.status === 'pending').slice(0, 3).map(model => (
                          <div key={model.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => { setActiveTab('models'); setFilterStatus('pending'); }}>
                            <div className="w-10 h-10 bg-white/5 rounded-full overflow-hidden border border-white/10 group-hover:border-gold-accent transition-colors">
                            {model.avatar ? (
                                <img src={model.avatar} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-orange-500/20 text-orange-500">
                                  <Users size={14} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-gold-accent transition-colors">{model.name}</h4>
                              <p className="text-[9px] text-white/40 uppercase tracking-wider truncate">New Registration • {model.location}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold-accent transition-colors" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-white/30 uppercase tracking-widest text-center py-4 border border-dashed border-white/10">
                        No pending reviews
                      </div>
                    )}

                    <div className="h-[1px] bg-white/5 w-full" />

                    {/* System Activity */}
                     <div className="space-y-4">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">System Log</span>
                        {activityLog.length > 0 ? activityLog.map((log) => (
                          <div key={log.id} className="flex items-start gap-4">
                            <div className={`mt-1 w-1.5 h-1.5 rounded-full ${
                              log.type === 'alert' ? 'bg-red-500' : 
                              log.type === 'application' ? 'bg-green-500' : 
                              log.type === 'admin' ? 'bg-gold-accent' : 
                              'bg-white/20'
                            }`} />
                            <div className="flex-1">
                              <h4 className="text-[10px] font-bold text-white/80">{log.action}</h4>
                              <p className="text-[9px] text-white/40">{log.description}</p>
                            </div>
                            <span className="text-[9px] text-white/20 whitespace-nowrap">{log.time}</span>
                          </div>
                        )) : (
                          <div className="text-[10px] text-white/20 text-center">No recent activity</div>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* FILTERS BAR */}
            <div className="shrink-0 bg-surface/30 border-b border-white/5 px-8 py-4 flex items-center gap-6">
              <div className="relative flex-1 max-w-sm group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-gold-accent transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by name or slug..." 
                  className="w-full bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-xs tracking-wider outline-none focus:border-gold-accent focus:bg-white/10 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <Filter className="w-3.5 h-3.5 text-gold-accent" />
                <select 
                  className="bg-black/90 border border-white/10 py-2 px-4 text-xs tracking-wider outline-none focus:border-gold-accent transition-all text-white"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All" className="bg-[#020202] text-white">All Categories</option>
                  {AVAILABLE_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#020202] text-white">{cat}</option>)}
                </select>

                <select 
                  className="bg-black/90 border border-white/10 py-2 px-4 text-xs tracking-wider outline-none focus:border-gold-accent transition-all text-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All" className="bg-[#020202] text-white">Any Status</option>
                  <option value="pending" className="bg-[#020202] text-white">Pending Approval</option>
                  <option value="Available" className="bg-[#020202] text-white">Available</option>
                  <option value="On Option" className="bg-[#020202] text-white">On Option</option>
                  <option value="Booked" className="bg-[#020202] text-white">Booked</option>
                </select>
              </div>

              <div className="ml-auto text-[10px] uppercase tracking-widest text-white/30">
                Total Models: <span className="text-white font-bold">{filteredModels.length}</span>
              </div>
            </div>

            {/* GRID AREA */}
            <div className="flex-1 overflow-auto p-5 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredModels.map(model => (
                  <motion.div 
                    layout
                    key={model.id}
                    className="group relative bg-[#0a0a0a] border border-white/5 overflow-hidden transition-all hover:border-gold-accent/50 shadow-lg"
                  >
                    <div className="aspect-[3/4] overflow-hidden relative">
                      <img src={model.avatar || '/placeholder-avatar.jpg'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={model.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                      
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {model.status === 'pending' && (
                          <div className="bg-orange-500/90 text-white px-2 py-1 shadow-xl backdrop-blur-md">
                            <span className="text-[8px] font-bold uppercase tracking-widest">Pending</span>
                          </div>
                        )}
                        {/* Top Model Toggle */}
                        <button 
                          onClick={(e) => handleMakeTopModel(e, model.id)}
                          className={`p-2 shadow-xl backdrop-blur-md transition-all z-10 ${
                            model.is_top_model 
                              ? 'bg-gold-accent text-black hover:scale-110' 
                              : 'bg-black/60 text-white/40 hover:bg-gold-accent hover:text-black opacity-0 group-hover:opacity-100'
                          }`}
                          title={model.is_top_model ? "Current Top Model" : "Make Top Model"}
                        >
                          <Star className={`w-3.5 h-3.5 ${model.is_top_model ? 'fill-black' : ''}`} />
                        </button>
                        {model.is_verified && (
                          <div className="bg-blue-500/90 text-white p-1.5 shadow-xl backdrop-blur-md">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">{model.name}</h3>
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/60">
                          <MapPin className="w-2.5 h-2.5 text-gold-accent" />
                          {model.location}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] flex items-center justify-between border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-tighter text-white/40">Handle</span>
                        <span className="text-[10px] text-gold-accent">@{model.slug}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingModel(model); setIsModalOpen(true); }}
                          className="p-2 border border-white/10 hover:border-gold-accent hover:bg-gold-accent/10 transition-colors group/edit"
                        >
                          <Settings className="w-3.5 h-3.5 text-white/60 group-hover/edit:text-gold-accent" />
                        </button>
                        <a 
                          href={`/${currentLang}/models/${model.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 border border-white/10 hover:border-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'castings' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#020202] text-white/20">
            <Clapperboard className="w-16 h-16 mb-6 opacity-20" />
            <h2 className="text-xl font-bold uppercase tracking-[0.4em] text-white/40">Castings</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-50">Casting Management Module Coming Soon</p>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#020202] text-white/20">
            <Briefcase className="w-16 h-16 mb-6 opacity-20" />
            <h2 className="text-xl font-bold uppercase tracking-[0.4em] text-white/40">Clients</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-50">Client Portal & CRM Coming Soon</p>
          </div>
        )}

        {activeTab === 'content' && (
          /* REFINED COMPACT SPOTLIGHT TAB */
          <div className="flex-1 overflow-auto p-4 bg-[#020202] custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-3">
              {/* COMPACT TOP BAR */}
              <div className="sticky top-0 z-20 flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 p-4 shadow-2xl">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-white">Spotlight <span className="text-gold-accent">Editor</span></h2>
                    <span className="text-[7px] uppercase tracking-[0.3em] text-white/20 mt-0.5">Vasilb7 Vision Management</span>
                  </div>
                  
                  <div className="h-6 w-[1px] bg-white/10 mx-2" />

                  <div className="flex items-center gap-3">
                    <label className="text-[8px] uppercase tracking-widest text-gold-accent font-bold">Active Model:</label>
                    <select 
                      className="bg-[#0a0a0a] border border-white/10 px-4 py-1.5 text-[10px] uppercase tracking-widest text-white outline-none focus:border-gold-accent min-w-[280px] transition-all hover:bg-white/5 cursor-pointer"
                      value={selectedTopModelId}
                      onChange={(e) => {
                        prevTopModelIdRef.current = ''; // Reset so fields reload
                        setSelectedTopModelId(e.target.value);
                      }}
                    >
                      <option value="" disabled className="bg-[#111] text-white/40">Select a Model</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#111] text-white py-2">
                          {m.name.toUpperCase()} {m.is_top_model ? ' • LIVE' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model Quick Info */}
                  {selectedTopModelId && (() => {
                    const activeModel = models.find(m => m.id === selectedTopModelId);
                    if (!activeModel) return null;
                    return (
                      <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                        <img 
                          src={activeModel.avatar} 
                          alt={activeModel.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-white/80 tracking-wide">{activeModel.name}</span>
                          <span className="text-[7px] text-white/30 tracking-wider">
                            {activeModel.categories?.join(', ') || 'No category'} • {activeModel.location || '—'}
                          </span>
                        </div>
                        {activeModel.is_top_model && (
                          <div className="bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-full">
                            <span className="text-[7px] font-black uppercase tracking-widest text-gold-accent">TOP</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] uppercase tracking-widest text-white/60 font-bold">Live Sync</span>
                  </div>

                  {/* Preview Button */}
                  {selectedTopModelId && (() => {
                    const activeModel = models.find(m => m.id === selectedTopModelId);
                    if (!activeModel) return null;
                    return (
                      <a
                        href={`/bg/models/${activeModel.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.15em] transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </a>
                    );
                  })()}

                  {/* Draft Save — saves without is_top_model */}
                  <button 
                    disabled={isUploading || !selectedTopModelId}
                    onClick={async () => {
                      if (!selectedTopModelId) return;
                      setIsUploading(true);
                      try {
                        await modelsService.updateModel(selectedTopModelId, { 
                          spotlight_bio: spotlightBio,
                          spotlight_bio_bg: spotlightBioBg,
                          spotlight_projects: spotlightProjects,
                          spotlight_awards: spotlightAwards,
                          card_images: editCardImages
                        });
                        showToast('Чернова запазена!', 'success');
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-20"
                  >
                    <Save className="w-3 h-3" />
                    Save Draft
                  </button>

                  {/* Publish — sets is_top_model + all data */}
                  <button 
                    disabled={isUploading || !selectedTopModelId}
                    onClick={async () => {
                      if (!selectedTopModelId) return;
                      
                      // Soft validation — warn but don't block
                      const activeBio = bioLang === 'en' ? spotlightBio : spotlightBioBg;
                      if (activeBio.length > 0 && activeBio.length < 100) {
                        const ok = window.confirm(`Био текстът (${bioLang.toUpperCase()}) е доста кратък (${activeBio.length} символа). Продължаване?`);
                        if (!ok) return;
                      }

                      const currentTop = models.find(m => m.is_top_model);
                      setIsUploading(true);
                      try {
                        if (currentTop && currentTop.id !== selectedTopModelId) {
                          await modelsService.updateModel(currentTop.id, { is_top_model: false });
                        }
                        await modelsService.updateModel(selectedTopModelId, { 
                          is_top_model: true,
                          spotlight_bio: spotlightBio,
                          spotlight_bio_bg: spotlightBioBg,
                          spotlight_projects: spotlightProjects,
                          spotlight_awards: spotlightAwards,
                          card_images: editCardImages
                        });
                        showToast('Промените са публикувани!', 'success');
                        fetchModels();
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    className="flex items-center gap-2 bg-white text-black px-8 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gold-accent transition-all disabled:opacity-20 shadow-xl"
                  >
                    {isUploading ? (
                      <div className="w-2.5 h-2.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : <Save className="w-3.5 h-3.5" />}
                    {isUploading ? 'SAVING...' : 'PUBLISH CHANGES'}
                  </button>
                </div>
              </div>

              {/* SPLIT SCREEN ACTIONS */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 h-[calc(100vh-160px)] min-h-[400px]">
                {/* GALLERY (Left 3/5) */}
                <section className="xl:col-span-3 bg-black/40 border border-white/5 flex flex-col overflow-hidden group hover:border-white/10 transition-colors">
                  <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-3.5 h-3.5 text-gold-accent" />
                      <h3 className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/80">Asset Manager</h3>
                      {selectedImages.length > 0 && (
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
                          <span className="text-[8px] uppercase tracking-widest text-gold-accent font-bold">
                            {selectedImages.length} Selected
                          </span>
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Batch Delete',
                                message: `Remove ${selectedImages.length} selected assets?`,
                                type: 'danger',
                                onConfirm: async () => {
                                  const urlsToDelete = editCardImages.filter((_, i) => selectedImages.includes(i));
                                  const newImages = editCardImages.filter((_, i) => !selectedImages.includes(i));
                                  
                                  setEditCardImages(newImages);
                                  setSelectedImages([]);

                                  try {
                                    await modelsService.updateModel(selectedTopModelId, { 
                                      card_images: newImages
                                    });
                                    
                                    for (const url of urlsToDelete) {
                                      if (url.includes('supabase.co')) {
                                        await modelsService.deleteFile(url);
                                      }
                                    }
                                    showToast('Избраните снимки бяха изтрити!', 'success');
                                  } catch (err: any) {
                                    showToast(err.message, 'error');
                                  }
                                }
                              });
                            }}
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-3 py-1 text-[8px] font-bold uppercase tracking-widest transition-all"
                          >
                            Delete Selected
                          </button>
                          <button 
                            onClick={() => setSelectedImages([])}
                            className="text-[8px] uppercase tracking-widest text-white/40 hover:text-white underline underline-offset-4"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {editCardImages.length > 0 && (
                        <button 
                          onClick={() => {
                            if (selectedImages.length === editCardImages.length) {
                              setSelectedImages([]);
                            } else {
                              setSelectedImages(editCardImages.map((_, i) => i));
                            }
                          }}
                          className="text-[8px] uppercase tracking-widest text-gold-accent hover:text-white transition-colors font-bold px-2 py-1 border border-gold-accent/20 hover:border-white/20"
                        >
                          {selectedImages.length === editCardImages.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                      <span className="text-[8px] text-white/20 uppercase tracking-widest">{editCardImages.length} High-Res Items</span>
                      <span className="ml-2 text-[7px] text-gold-accent uppercase font-black animate-pulse">Натиснете "Publish" за запис</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-black/20">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {editCardImages.map((url, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setSelectedImages(prev => 
                              prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                            );
                          }}
                          className={`relative aspect-[3/4] group overflow-hidden border transition-all cursor-pointer ${
                            selectedImages.includes(idx) ? 'border-gold-accent ring-1 ring-gold-accent shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-white/5 hover:border-white/20'
                          }`}
                        >
                          <img 
                            src={url} 
                            className={`w-full h-full object-cover transition-all duration-700 ${
                              selectedImages.includes(idx) ? 'scale-105' : 'group-hover:scale-105'
                            }`} 
                            alt="" 
                          />
                          
                          {/* Selection Overlay */}
                          <div className={`absolute top-2 right-2 w-5 h-5 border flex items-center justify-center transition-all ${
                            selectedImages.includes(idx) ? 'bg-gold-accent border-gold-accent' : 'bg-black/40 border-white/20'
                          }`}>
                            {selectedImages.includes(idx) && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                          </div>

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageToCrop({ url: url, index: idx });
                                  setCropModalOpen(true);
                                }}
                                className="bg-white/10 hover:bg-white text-white hover:text-black p-2 rounded-full transition-all"
                                title="Adjust Frame"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Remove Asset',
                                    message: 'Are you sure you want to remove this image from the spotlight?',
                                    type: 'danger',
                                    onConfirm: async () => {
                                      const urlToDelete = editCardImages[idx];
                                      const newImages = editCardImages.filter((_, i) => i !== idx);
                                      
                                      setEditCardImages(newImages);
                                      setSelectedImages([]);

                                      try {
                                        // Update database immediately
                                        await modelsService.updateModel(selectedTopModelId, { 
                                          card_images: newImages
                                        });

                                        // Also delete from storage
                                        if (urlToDelete.includes('supabase.co')) {
                                          await modelsService.deleteFile(urlToDelete);
                                        }

                                        showToast('Снимката е изтрита от Supabase!', 'success');
                                      } catch (err: any) {
                                        showToast(err.message, 'error');
                                      }
                                    }
                                  });
                                }}
                                className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-full transition-all"
                                title="Delete Asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[8px] uppercase tracking-widest text-white font-bold bg-black/60 px-2 py-1 backdrop-blur-sm">
                              {selectedImages.includes(idx) ? 'Selected' : 'Click to Select'}
                            </span>
                          </div>
                        </div>
                      ))}

                      <label className="aspect-[3/4] border border-dashed border-white/5 hover:border-gold-accent/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gold-accent/[0.02] transition-all group">
                        <div className="p-3 bg-white/5 rounded-full group-hover:bg-gold-accent/10 transition-all">
                          <Plus className="w-5 h-5 text-white/20 group-hover:text-gold-accent" />
                        </div>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white">Upload Media</span>
                        <input 
                          type="file" multiple className="hidden" 
                          onChange={async (e) => {
                            const fileList = e.target.files;
                            if (!fileList) return;
                            
                            const selectedFiles = Array.from(fileList);
                            setIsUploading(true);

                            try {
                              const duplicates: string[] = [];
                              const seenInBatch = new Set<string>();
                              
                              const uniqueFiles = selectedFiles.filter(file => {
                                const f = file as File;
                                
                                // 1. Check if already in the gallery (URL contains the name)
                                // We check if any URL ends with or contains our filename pattern
                                const isAlreadyInGallery = editCardImages.some(url => {
                                  // Decrypt URL encoding just in case
                                  const decodedUrl = decodeURIComponent(url);
                                  // Our pattern is ..._timestamp_filename
                                  return decodedUrl.includes(`_${f.name}`) || decodedUrl.endsWith(`/${f.name}`);
                                });

                                // 2. Check if we already picked this same file in this specific upload trigger
                                const isDuplicateInBatch = seenInBatch.has(f.name);

                                if (isAlreadyInGallery || isDuplicateInBatch) {
                                  if (!seenInBatch.has(f.name)) {
                                    duplicates.push(f.name);
                                    seenInBatch.add(f.name);
                                  }
                                  return false;
                                }

                                seenInBatch.add(f.name);
                                return true;
                              });

                              if (duplicates.length > 0) {
                                showToast(`Файлът "${duplicates[0]}" ${duplicates.length > 1 ? `и още ${duplicates.length - 1}` : ''} вече е в списъка!`, 'error');
                              }

                              if (uniqueFiles.length === 0) {
                                setIsUploading(false);
                                e.target.value = '';
                                return;
                              }

                              for (const file of uniqueFiles) {
                                const f = file as File;
                                // We include timestamp for unique paths in storage, 
                                // but we checked the original name above
                                const path = `homepage/top_model_${Date.now()}_${f.name}`;
                                const url = await modelsService.uploadFile(f, path);
                                setEditCardImages(prev => Array.from(new Set([...prev, url])));
                              }
                              
                              showToast('Gallery updated', 'success');
                            } catch (err: any) {
                              showToast(err.message, 'error');
                            } finally {
                              setIsUploading(false);
                              e.target.value = ''; // Reset input
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </section>

                {/* MESSAGING (Right 2/5) */}
                <section className="xl:col-span-2 flex flex-col gap-4">
                  
                  {/* METRICS CONFIG */}
                  <div className="bg-black/40 border border-white/5 p-4 grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold pl-1">Projects</label>
                      <input 
                         type="number" 
                         value={spotlightProjects} 
                         onChange={(e) => setSpotlightProjects(parseInt(e.target.value) || 0)}
                         className="w-full bg-white/[0.03] border border-white/10 p-2 text-white text-sm font-mono text-center outline-none focus:border-gold-accent transition-colors rounded-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold pl-1">Awards</label>
                      <input 
                         type="number" 
                         value={spotlightAwards} 
                         onChange={(e) => setSpotlightAwards(parseInt(e.target.value) || 0)}
                         className="w-full bg-white/[0.03] border border-white/10 p-2 text-white text-sm font-mono text-center outline-none focus:border-gold-accent transition-colors rounded-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-2 opacity-50 pointer-events-none grayscale">
                       <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold pl-1">Posts</label>
                       <div className="w-full bg-white/[0.03] border border-white/5 p-2 text-white/50 text-sm font-mono text-center rounded-sm">
                         {models.find(m => m.id === selectedTopModelId)?.posts?.length || 0}
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/40 border border-white/5 flex flex-col overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <Star className="w-3.5 h-3.5 text-gold-accent" />
                        <h3 className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/80">Editorial Bio</h3>
                      </div>
                      <div className="flex items-center gap-1 bg-black/40 rounded border border-white/5 p-0.5">
                        <button 
                          onClick={() => setBioLang('en')}
                          className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded transition-all ${bioLang === 'en' ? 'bg-gold-accent text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                          EN
                        </button>
                        <button 
                          onClick={() => setBioLang('bg')}
                          className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded transition-all ${bioLang === 'bg' ? 'bg-gold-accent text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                          BG
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-1 bg-black/40 relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={bioLang}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full"
                            >
                              <textarea 
                                className="w-full h-full bg-transparent p-5 text-sm tracking-wide leading-relaxed text-white/80 outline-none resize-none placeholder:text-white/5 custom-scrollbar break-words whitespace-pre-wrap"
                                value={bioLang === 'en' ? spotlightBio : spotlightBioBg}
                                onChange={(e) => bioLang === 'en' ? setSpotlightBio(e.target.value) : setSpotlightBioBg(e.target.value)}
                                maxLength={500}
                                placeholder={bioLang === 'en' 
                                  ? 'Write the model editorial biography in English...' 
                                  : 'Напишете биографията на модела на български...'}
                              />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    </div>

                  {(() => {
                    const bioText = bioLang === 'en' ? spotlightBio : spotlightBioBg;
                    const len = bioText.length;
                    const isShort = len < 100;
                    const isGood = len >= 100 && len < 300;
                    const isOptimal = len >= 300;
                    const statusColor = isOptimal ? 'green-500' : isGood ? 'amber-400' : 'red-500';
                    const statusLabel = isOptimal ? 'Отлично' : isGood ? 'Добре' : len === 0 ? 'Празно' : 'Кратко';
                    const statusHint = isOptimal 
                      ? 'Перфектна дължина за всички устройства.' 
                      : isGood 
                        ? 'Добра дължина. За оптимално показване — 300+ символа.' 
                        : 'Препоръчваме поне 100 символа.';

                    return (
                      <div className={`border p-5 transition-all duration-500 bg-${statusColor}/[0.02] border-${statusColor}/20`}
                        style={{ 
                          borderColor: isOptimal ? 'rgba(34,197,94,0.2)' : isGood ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)',
                          background: isOptimal ? 'rgba(34,197,94,0.02)' : isGood ? 'rgba(251,191,36,0.02)' : 'rgba(239,68,68,0.02)'
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase tracking-widest font-black"
                              style={{ color: isOptimal ? '#22c55e' : isGood ? '#fbbf24' : '#ef4444' }}
                            >
                              {statusLabel}
                            </span>
                            <div className="h-[1px] flex-1 mx-4"
                              style={{ background: isOptimal ? 'rgba(34,197,94,0.2)' : isGood ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)' }}
                            />
                            <span className="text-[8px] font-bold"
                              style={{ color: isOptimal ? '#22c55e' : isGood ? '#fbbf24' : '#ef4444' }}
                            >
                              {isOptimal ? `${500 - len} символа remaining` : `${len}/500`}
                            </span>
                          </div>
                          
                          {/* Live Progress Bar */}
                          <div className="relative w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            {/* Zone markers at 100 (20%) and 300 (60%) */}
                            <div className="absolute left-[20%] top-0 bottom-0 w-0.5 bg-white/10 z-10" />
                            <div className="absolute left-[60%] top-0 bottom-0 w-0.5 bg-white/10 z-10" />
                            
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min((len / 500) * 100, 100)}%`,
                                background: isOptimal ? '#22c55e' : isGood ? '#fbbf24' : '#ef4444',
                                boxShadow: isOptimal ? '0 0 10px rgba(34,197,94,0.5)' : isGood ? '0 0 10px rgba(251,191,36,0.5)' : '0 0 10px rgba(239,68,68,0.5)'
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-end">
                            <p className="text-[9px] leading-relaxed text-white/30 uppercase tracking-tight max-w-[80%]">
                              {statusHint}
                            </p>
                            <span className="text-[9px] font-mono"
                              style={{ color: isOptimal ? '#22c55e' : isGood ? '#fbbf24' : '#ef4444' }}
                            >
                              {len}<span className="text-white/20">/500</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#020202] text-white/20">
            <MessageSquare className="w-16 h-16 mb-6 opacity-20" />
            <h2 className="text-xl font-bold uppercase tracking-[0.4em] text-white/40">Communication</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-50">Chat & Messages Module Coming Soon</p>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#020202] text-white/20">
            <CreditCard className="w-16 h-16 mb-6 opacity-20" />
            <h2 className="text-xl font-bold uppercase tracking-[0.4em] text-white/40">Finance</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-50">Invoicing & Contracts Module Coming Soon</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-auto bg-[#020202] custom-scrollbar">
            {/* Sticky Settings Header */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <Settings className="w-4 h-4 text-gold-accent" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white">Global <span className="text-gold-accent">Settings</span></h2>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/30 mt-0.5">Site configuration & maintenance</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Live Status */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ${
                    isMaintenance 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isMaintenance ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {isMaintenance ? 'Maintenance Active' : 'Site Live'}
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-5 space-y-5">

              {/* ═══════ ROW 1: Quick Controls ═══════ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Maintenance Toggle Card */}
                <div className={`relative overflow-hidden border p-5 transition-all duration-500 ${
                  isMaintenance 
                    ? 'bg-red-500/[0.03] border-red-500/20 hover:border-red-500/40' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}>
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: isMaintenance ? '#ef4444' : '#22c55e' }} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg transition-colors ${isMaintenance ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                        {isMaintenance ? <Lock className="w-5 h-5 text-red-400" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Maintenance Mode</h3>
                        <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">
                          {isMaintenance ? 'Site is locked for visitors' : 'Site is publicly accessible'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const newState = !isMaintenance;
                        setConfirmModal({
                          isOpen: true,
                          title: newState ? 'Activate Maintenance?' : 'Go Live?',
                          message: newState 
                            ? 'The site will become inaccessible to the public.' 
                            : 'The site will be live for everyone.',
                          type: newState ? 'danger' : 'info',
                          onConfirm: async () => {
                            try {
                              setIsUpdatingMaintenance(true);
                              await settingsService.setMaintenanceMode(newState);
                              setIsMaintenance(newState);
                              showToast(newState ? 'Maintenance Activated' : 'Site is Live', 'success');
                            } catch (error: any) {
                              showToast(error.message, 'error');
                            } finally {
                              setIsUpdatingMaintenance(false);
                            }
                          }
                        });
                      }}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isMaintenance ? 'bg-red-500' : 'bg-white/10 hover:bg-white/15'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${isMaintenance ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Emergency Reset Card */}
                <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 hover:border-red-500/20 p-5 transition-all group">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-900 group-hover:bg-red-500 transition-colors" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-red-500/5 rounded-lg group-hover:bg-red-500/10 transition-colors">
                        <AlertTriangle className="w-5 h-5 text-red-500/60 group-hover:text-red-500 transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500/80">Emergency Reset</h3>
                        <p className="text-[9px] text-white/20 uppercase tracking-wider mt-0.5">Wipe & reseed DB from Site_Pics</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleResetDatabase}
                      disabled={isUploading}
                      className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white px-5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                    >
                      {isUploading ? 'Reseeding...' : 'Reset'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══════ ROW 2: Maintenance Orchestrator ═══════ */}
              <div className="border border-white/5 bg-white/[0.01]">
                {/* Orchestrator Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <Edit2 className="w-4 h-4 text-gold-accent" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Maintenance Orchestrator</h3>
                      <p className="text-[8px] text-white/25 uppercase tracking-widest mt-0.5">Configure visitor experience during downtime</p>
                    </div>
                  </div>
                  <button 
                    disabled={isSavingMaintenance}
                    onClick={async () => {
                      try {
                        setIsSavingMaintenance(true);
                        await Promise.all([
                          settingsService.setMaintenanceMessage(maintenanceMessage),
                          settingsService.setMaintenanceEndTime(maintenanceEndTime),
                          settingsService.setMaintenanceUpdatesText(maintenanceUpdatesText)
                        ]);
                        showToast('Configuration saved', 'success');
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      } finally {
                        setIsSavingMaintenance(false);
                      }
                    }}
                    className="flex items-center gap-2 bg-white text-black px-6 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-gold-accent transition-all disabled:opacity-20"
                  >
                    <Save className="w-3 h-3" />
                    {isSavingMaintenance ? 'Saving...' : 'Save All'}
                  </button>
                </div>

                {/* Orchestrator Body — 3 column grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-white/5">
                  
                  {/* Col 1: Message */}
                  <div className="p-5 space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-gold-accent/80 font-bold flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" />
                      Headline Message
                    </label>
                    <textarea 
                      rows={5}
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Съобщение за посетителите..."
                      className="w-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs tracking-wide leading-relaxed outline-none focus:border-gold-accent/50 text-white resize-none transition-all placeholder:text-white/10"
                    />
                    <p className="text-[8px] text-white/15 uppercase tracking-wider">Shown as the primary message on maintenance screen</p>
                  </div>



                  {/* Col 3: Timeline */}
                  <div className="p-5 space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-gold-accent/80 font-bold flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Expected Completion
                    </label>
                    <input 
                      type="datetime-local"
                      value={maintenanceEndTime}
                      onChange={(e) => setMaintenanceEndTime(e.target.value)}
                      className="w-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs outline-none focus:border-gold-accent/50 text-white transition-all invert-calendar-icon"
                    />
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: '+30m', mins: 30 },
                        { label: '+1h', mins: 60 },
                        { label: '+6h', mins: 360 },
                        { label: '+24h', mins: 1440 },
                        { label: '+3d', mins: 4320 },
                        { label: '+1w', mins: 10080 },
                      ].map((time) => (
                        <button
                          key={time.label}
                          type="button" 
                          onClick={() => {
                            const now = new Date();
                            now.setMinutes(now.getMinutes() + time.mins);
                            const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                              .toISOString()
                              .slice(0, 16);
                            setMaintenanceEndTime(localIsoString);
                          }}
                          className="bg-white/[0.03] border border-white/5 hover:border-gold-accent/40 hover:bg-gold-accent/5 hover:text-gold-accent text-[9px] uppercase tracking-widest text-white/30 py-2 rounded-md transition-all duration-200"
                        >
                          {time.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 bg-gold-accent/5 border border-gold-accent/10 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-gold-accent/50 shrink-0 mt-0.5" />
                        <p className="text-[8px] text-gold-accent/40 uppercase tracking-wider leading-relaxed">
                          Timer auto-starts when a future date is set. Admin panel stays accessible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════ ROW 3: Hero Media Settings ═══════ */}
              <div className="border border-white/5 bg-white/[0.01]">
                {/* Hero Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-4 h-4 text-gold-accent" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Homepage Hero Media</h3>
                      <p className="text-[8px] text-white/25 uppercase tracking-widest mt-0.5">Background visual for landing page</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        setIsSavingHero(true);
                        await Promise.all([
                          settingsService.setHeroSetting('hero_type', heroType),
                          settingsService.setHeroSetting('hero_image_url', heroImageUrl),
                          settingsService.setHeroSetting('hero_video_url', heroVideoUrl),
                          settingsService.setHeroSetting('hero_grayscale', String(heroGrayscale)),
                        ]);
                        showToast('Hero updated', 'success');
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      } finally {
                        setIsSavingHero(false);
                      }
                    }}
                    disabled={isSavingHero}
                    className="flex items-center gap-2 bg-white text-black px-6 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-gold-accent transition-all disabled:opacity-20"
                  >
                    <Save className="w-3 h-3" />
                    {isSavingHero ? 'Saving...' : 'Save Hero'}
                  </button>
                </div>

                {/* Hero Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                  {/* Media Type */}
                  <div className="p-5 space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Media Type</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setHeroType('video')}
                        className={`flex-1 py-2.5 border rounded-md transition-all text-[10px] uppercase tracking-widest font-bold ${
                          heroType === 'video' 
                            ? 'bg-white text-black border-white' 
                            : 'border-white/10 text-white/30 hover:border-gold-accent/40 hover:text-white/60'
                        }`}
                      >
                        Video
                      </button>
                      <button 
                        onClick={() => setHeroType('image')}
                        className={`flex-1 py-2.5 border rounded-md transition-all text-[10px] uppercase tracking-widest font-bold ${
                          heroType === 'image' 
                            ? 'bg-white text-black border-white' 
                            : 'border-white/10 text-white/30 hover:border-gold-accent/40 hover:text-white/60'
                        }`}
                      >
                        Image
                      </button>
                    </div>
                  </div>

                  {/* Visual Filter */}
                  <div className="p-5 space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Visual Filter</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setHeroGrayscale(true)}
                        className={`flex-1 py-2.5 border rounded-md transition-all text-[10px] uppercase tracking-widest font-bold ${
                          heroGrayscale 
                            ? 'bg-white text-black border-white' 
                            : 'border-white/10 text-white/30 hover:border-gold-accent/40 hover:text-white/60'
                        }`}
                      >
                        Grayscale
                      </button>
                      <button 
                        onClick={() => setHeroGrayscale(false)}
                        className={`flex-1 py-2.5 border rounded-md transition-all text-[10px] uppercase tracking-widest font-bold ${
                          !heroGrayscale 
                            ? 'bg-white text-black border-white' 
                            : 'border-white/10 text-white/30 hover:border-gold-accent/40 hover:text-white/60'
                        }`}
                      >
                        Color
                      </button>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                        {heroType === 'image' ? 'Image Source' : 'Video URL'}
                        </label>
                        {heroType === 'image' && (
                            <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-[9px] uppercase tracking-widest text-gold-accent px-3 py-1 rounded transition-colors flex items-center gap-2">
                                <Upload size={10} />
                                Upload & Crop
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setHeroImageToCrop(url);
                                            e.target.value = ''; // Reset so same file can be selected again
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>
                    <input 
                      type="text"
                      value={heroType === 'image' ? heroImageUrl : heroVideoUrl}
                      onChange={(e) => heroType === 'image' ? setHeroImageUrl(e.target.value) : setHeroVideoUrl(e.target.value)}
                      placeholder={heroType === 'image' ? 'https://... .jpg / .png' : 'https://... .mp4'}
                      className="w-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs outline-none focus:border-gold-accent/50 text-white transition-all placeholder:text-white/10"
                    />
                    <p className="text-[8px] text-white/15 uppercase tracking-wider">
                      {heroType === 'image' ? 'Recommended: 1920×1080 or higher' : 'Direct link to hosted .mp4 file'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ═══════ ROW 3.5: Site Announcement ═══════ */}
              <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: announcement.active ? '#3b82f6' : '#3f3f46' }} />
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-colors ${announcement.active ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                      <MessageSquare className={`w-5 h-5 ${announcement.active ? 'text-blue-400' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Broadcast Message</h3>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">
                        {announcement.active ? 'Message is visible to all visitors' : 'No active broadcast'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const newState = !announcement.active;
                      try {
                        setIsSavingAnnouncement(true);
                        const updated = { ...announcement, active: newState };
                        await settingsService.setAnnouncement(updated);
                        setAnnouncement(updated);
                        showToast(newState ? 'Broadcast Activated! 📢' : 'Broadcast Disabled', 'success');
                      } catch (e: any) {
                        showToast(e.message, 'error');
                      } finally {
                        setIsSavingAnnouncement(false);
                      }
                    }}
                    disabled={isSavingAnnouncement}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${announcement.active ? 'bg-blue-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${announcement.active ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Announcement Text</label>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        value={announcement.text}
                        onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                        placeholder="Type your message here..."
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all"
                      />
                      <button 
                        onClick={async () => {
                          try {
                            setIsSavingAnnouncement(true);
                            await settingsService.setAnnouncement(announcement);
                            showToast('Message text saved!', 'success');
                          } catch (e: any) {
                            showToast(e.message, 'error');
                          } finally {
                            setIsSavingAnnouncement(false);
                          }
                        }}
                        disabled={isSavingAnnouncement}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1 rounded-lg text-[10px] uppercase font-bold text-white transition-all"
                      >
                        {isSavingAnnouncement ? '...' : 'Save Text'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════ ROW 4: Promotions Management ═══════ */}
              <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: activePromo !== 'none' ? '#10b981' : '#3f3f46' }} />
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-colors ${activePromo !== 'none' ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                      <Tag className={`w-5 h-5 ${activePromo !== 'none' ? 'text-emerald-400' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Promotions</h3>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">
                        {activePromo === 'none' ? 'No active promotion' 
                          : activePromo === 'valentines' ? "Valentine's Day promo active" 
                          : activePromo === 'christmas' ? 'Christmas promo active'
                          : 'Photoshoot promo active'}
                      </p>
                    </div>
                  </div>
                  {activePromo !== 'none' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">Live</span>
                    </div>
                  )}
                </div>

                {/* Promo Options */}
                <div className="p-5 space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Banner Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* None */}
                    <button
                      onClick={async () => {
                        try {
                          setIsSavingPromo(true);
                          await settingsService.setActivePromo('none');
                          setActivePromo('none');
                          showToast('Promotion disabled', 'success');
                        } catch (e: any) {
                          showToast(e.message, 'error');
                        } finally {
                          setIsSavingPromo(false);
                        }
                      }}
                      disabled={isSavingPromo}
                      className={`relative flex flex-col items-center gap-3 p-4 border rounded-lg transition-all ${
                        activePromo === 'none'
                          ? 'bg-white/10 border-white/30 ring-2 ring-white/20'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <X className={`w-6 h-6 ${activePromo === 'none' ? 'text-white' : 'text-white/30'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">None</span>
                    </button>

                    {/* Valentines */}
                    <button
                      onClick={async () => {
                        try {
                          setIsSavingPromo(true);
                          await settingsService.setActivePromo('valentines');
                          setActivePromo('valentines');
                          showToast("Valentine's promo activated! 💕", 'success');
                        } catch (e: any) {
                          showToast(e.message, 'error');
                        } finally {
                          setIsSavingPromo(false);
                        }
                      }}
                      disabled={isSavingPromo}
                      className={`relative flex flex-col items-center gap-3 p-4 border rounded-lg transition-all ${
                        activePromo === 'valentines'
                          ? 'bg-pink-500/10 border-pink-500/40 ring-2 ring-pink-500/20'
                          : 'bg-white/[0.02] border-white/5 hover:border-pink-500/20'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${activePromo === 'valentines' ? 'text-pink-400 fill-pink-400' : 'text-pink-400/30'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${activePromo === 'valentines' ? 'text-pink-300' : 'text-white/60'}`}>Valentine's</span>
                    </button>

                    {/* Christmas */}
                    <button
                      onClick={async () => {
                        try {
                          setIsSavingPromo(true);
                          await settingsService.setActivePromo('christmas');
                          setActivePromo('christmas');
                          showToast('Christmas promo activated! 🎄', 'success');
                        } catch (e: any) {
                          showToast(e.message, 'error');
                        } finally {
                          setIsSavingPromo(false);
                        }
                      }}
                      disabled={isSavingPromo}
                      className={`relative flex flex-col items-center gap-3 p-4 border rounded-lg transition-all ${
                        activePromo === 'christmas'
                          ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
                          : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/20'
                      }`}
                    >
                      <TreePine className={`w-6 h-6 ${activePromo === 'christmas' ? 'text-emerald-400' : 'text-emerald-400/30'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${activePromo === 'christmas' ? 'text-emerald-300' : 'text-white/60'}`}>Christmas</span>
                    </button>

                    {/* Photoshoot */}
                    <button
                      onClick={async () => {
                        try {
                          setIsSavingPromo(true);
                          await settingsService.setActivePromo('photoshoot');
                          setActivePromo('photoshoot');
                          showToast('Photoshoot promo activated! 📸', 'success');
                        } catch (e: any) {
                          showToast(e.message, 'error');
                        } finally {
                          setIsSavingPromo(false);
                        }
                      }}
                      disabled={isSavingPromo}
                      className={`relative flex flex-col items-center gap-3 p-4 border rounded-lg transition-all ${
                        activePromo === 'photoshoot'
                          ? 'bg-gold-accent/10 border-gold-accent/40 ring-2 ring-gold-accent/20'
                          : 'bg-white/[0.02] border-white/5 hover:border-gold-accent/20'
                      }`}
                    >
                      <Camera className={`w-6 h-6 ${activePromo === 'photoshoot' ? 'text-gold-accent' : 'text-gold-accent/30'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${activePromo === 'photoshoot' ? 'text-gold-accent' : 'text-white/60'}`}>Photoshoot</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* ═══════ ROW 5: Pricing Configuration ═══════ */}
              <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-yellow-500 to-amber-600" />
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-yellow-500/10">
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Ценоразпис & Отстъпки</h3>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">
                        Базови цени и % отстъпка за всяка промоция
                      </p>
                    </div>
                  </div>
                </div>

                {/* Base Prices */}
                <div className="p-5 space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> Базови цени (€)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Starter */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Стартов</label>
                      <input
                        type="number"
                        min={0}
                        value={pricingConfig.basePrices.starter}
                        onChange={(e) => setPricingConfig({
                          ...pricingConfig,
                          basePrices: { ...pricingConfig.basePrices, starter: Number(e.target.value) }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all text-center"
                      />
                      <p className="text-[8px] text-white/20 text-center">{pricingConfig.basePrices.starter}€</p>
                    </div>
                    {/* Pro */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Про</label>
                      <input
                        type="number"
                        min={0}
                        value={pricingConfig.basePrices.pro}
                        onChange={(e) => setPricingConfig({
                          ...pricingConfig,
                          basePrices: { ...pricingConfig.basePrices, pro: Number(e.target.value) }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all text-center"
                      />
                      <p className="text-[8px] text-white/20 text-center">{pricingConfig.basePrices.pro}€</p>
                    </div>
                    {/* Director */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Директорски</label>
                      <input
                        type="number"
                        min={0}
                        value={pricingConfig.basePrices.director}
                        onChange={(e) => setPricingConfig({
                          ...pricingConfig,
                          basePrices: { ...pricingConfig.basePrices, director: Number(e.target.value) }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all text-center"
                      />
                      <p className="text-[8px] text-white/20 text-center">{pricingConfig.basePrices.director}€</p>
                    </div>
                  </div>
                </div>

                {/* Valentine's Discounts */}
                <div className="p-5 border-t border-white/5 space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-pink-400/70 font-bold flex items-center gap-2">
                    <Heart className="w-3 h-3 fill-pink-400 text-pink-400" /> Valentine's Day отстъпки (%)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['starter', 'pro', 'director'] as const).map((tier) => (
                      <div key={`val-${tier}`} className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
                          {tier === 'starter' ? 'Стартов' : tier === 'pro' ? 'Про' : 'Директорски'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={pricingConfig.promos.valentines[tier]}
                            onChange={(e) => setPricingConfig({
                              ...pricingConfig,
                              promos: {
                                ...pricingConfig.promos,
                                valentines: { ...pricingConfig.promos.valentines, [tier]: Number(e.target.value) }
                              }
                            })}
                            className="w-full bg-pink-500/5 border border-pink-500/20 rounded-lg p-2.5 text-sm font-bold text-pink-300 outline-none focus:border-pink-500/50 transition-all text-center"
                          />
                          <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-pink-400/40" />
                        </div>
                        <p className="text-[8px] text-pink-300/40 text-center">
                          {pricingConfig.promos.valentines[tier] > 0
                            ? `${pricingConfig.basePrices[tier]}€ → ${settingsService.calcDiscountedPrice(pricingConfig.basePrices[tier], pricingConfig.promos.valentines[tier])}€`
                            : 'Без отстъпка'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Christmas Discounts */}
                <div className="p-5 border-t border-white/5 space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-bold flex items-center gap-2">
                    <TreePine className="w-3 h-3 text-emerald-400" /> Christmas отстъпки (%)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['starter', 'pro', 'director'] as const).map((tier) => (
                      <div key={`xmas-${tier}`} className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
                          {tier === 'starter' ? 'Стартов' : tier === 'pro' ? 'Про' : 'Директорски'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={pricingConfig.promos.christmas[tier]}
                            onChange={(e) => setPricingConfig({
                              ...pricingConfig,
                              promos: {
                                ...pricingConfig.promos,
                                christmas: { ...pricingConfig.promos.christmas, [tier]: Number(e.target.value) }
                              }
                            })}
                            className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 text-sm font-bold text-emerald-300 outline-none focus:border-emerald-500/50 transition-all text-center"
                          />
                          <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-400/40" />
                        </div>
                        <p className="text-[8px] text-emerald-300/40 text-center">
                          {pricingConfig.promos.christmas[tier] > 0
                            ? `${pricingConfig.basePrices[tier]}€ → ${settingsService.calcDiscountedPrice(pricingConfig.basePrices[tier], pricingConfig.promos.christmas[tier])}€`
                            : 'Без отстъпка'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photoshoot Discounts */}
                <div className="p-5 border-t border-white/5 space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-gold-accent font-bold flex items-center gap-2">
                    <Camera className="w-3 h-3 text-gold-accent" /> Photoshoot отстъпки (%)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['starter', 'pro', 'director'] as const).map((tier) => (
                      <div key={`photo-${tier}`} className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
                          {tier === 'starter' ? 'Стартов' : tier === 'pro' ? 'Про' : 'Директорски'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={pricingConfig.promos.photoshoot?.[tier] || 0}
                            onChange={(e) => setPricingConfig({
                              ...pricingConfig,
                              promos: {
                                ...pricingConfig.promos,
                                photoshoot: { ...pricingConfig.promos.photoshoot, [tier]: Number(e.target.value) }
                              }
                            })}
                            className="w-full bg-gold-accent/5 border border-gold-accent/20 rounded-lg p-2.5 text-sm font-bold text-gold-accent outline-none focus:border-gold-accent/50 transition-all text-center"
                          />
                          <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-accent/40" />
                        </div>
                        <p className="text-[8px] text-gold-accent/40 text-center">
                          {pricingConfig.promos.photoshoot?.[tier] > 0
                            ? `${pricingConfig.basePrices[tier]}€ → ${settingsService.calcDiscountedPrice(pricingConfig.basePrices[tier], pricingConfig.promos.photoshoot[tier])}€`
                            : 'Без отстъпка'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="p-5 border-t border-white/5 flex justify-end">
                  <button
                    onClick={async () => {
                      setIsSavingPricing(true);
                      try {
                        await settingsService.setPricingConfig(pricingConfig);
                        showToast('Ценоразпис запазен! 💰', 'success');
                      } catch (e: any) {
                        showToast(e.message, 'error');
                      } finally {
                        setIsSavingPricing(false);
                      }
                    }}
                    disabled={isSavingPricing}
                    className="bg-yellow-500 text-black px-6 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-30 rounded-md"
                  >
                    {isSavingPricing ? 'Запазване...' : '💰 Запази ценоразпис'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* REFACTORED EDITOR MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-full max-w-4xl h-[85vh] bg-surface border border-white/10 shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <form 
                className="flex flex-col flex-1 min-h-0"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setIsUploading(true);
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const slug = formData.get('slug') as string;
                    
                    const avatarFile = (form.elements.namedItem('avatar_file') as HTMLInputElement)?.files?.[0];
                    let avatarUrl = formData.get('avatar') as string;
                    if (avatarFile) {
                      const path = `models/${slug}/avatar_${Date.now()}`;
                      avatarUrl = await modelsService.uploadFile(avatarFile, path);
                    }

                    const modelData: any = {
                      name: formData.get('name') as string,
                      name_bg: formData.get('name_bg') as string,
                      slug: slug,
                      gender: formData.get('gender') as any,
                      location: formData.get('location') as string,
                      height: formData.get('height') as string,
                      measurements: formData.get('measurements') as string,
                      hair_color: formData.get('hair_color') as string,
                      eye_color: formData.get('eye_color') as string,
                      bio: editBio,
                      availability: formData.get('availability') as any,
                      is_top_model: selectedCategories.includes('Top Model'),
                      is_verified: formData.get('is_verified') === 'on',
                      categories: selectedCategories,
                      avatar: avatarUrl,
                      cover_image: editCoverImages,
                      card_images: editCardImages, // Also update these to keep sync
                      background_image: editBackgroundImage,
                      nickname: (formData.get('nickname') as string || (formData.get('name') as string).toLowerCase().replace(/\s+/g, '')),
                    };

                    if (editingModel) {
                      await modelsService.updateModel(editingModel.id, modelData);
                      showToast('Profile updated successfully!', 'success');
                    } else {
                      await modelsService.createModel(modelData);
                      showToast('New profile created!', 'success');
                    }
                    setIsModalOpen(false);
                    fetchModels();
                  } catch (err: any) {
                    showToast(err.message, 'error');
                  } finally {
                    setIsUploading(false);
                  }
                }}
              >
                {/* MODAL HEADER */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface/50 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg uppercase tracking-[0.2em] text-white">
                      {editingModel ? 'Edit' : 'Create'} <span className="text-gold-accent">Profile</span>
                    </h2>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* MODAL BODY (SCROLLABLE) */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 custom-scrollbar min-h-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white border-b border-white/5 pb-8">
                    {/* Column 1: Primary Info */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">Primary Information</h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Full Name (EN)</label>
                          <input name="name" type="text" required className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.name} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Full Name (BG)</label>
                          <input name="name_bg" type="text" className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.name_bg} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">URL Slug</label>
                          <input name="slug" type="text" required className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.slug} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Gender</label>
                          <select name="gender" className="w-full bg-[#111] border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.gender || 'Female'}>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Attributes */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">Physical Attributes</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Height</label>
                          <input name="height" type="text" className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.height} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Location</label>
                          <input name="location" type="text" className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.location} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-white/40">Measurements</label>
                        <input name="measurements" type="text" className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.measurements} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Hair</label>
                          <input name="hair_color" type="text" className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.hair_color} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Eyes</label>
                          <input name="eye_color" type="text" className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.eye_color} />
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Categories & Settings */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">Categories & Badges</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pb-4">
                      {AVAILABLE_CATEGORIES.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="hidden peer" 
                            checked={selectedCategories.includes(cat)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCategories(prev => [...prev, cat]);
                              else setSelectedCategories(prev => prev.filter(c => c !== cat));
                            }}
                          />
                          <div className="w-3 h-3 border border-white/20 peer-checked:bg-gold-accent peer-checked:border-gold-accent transition-all flex items-center justify-center">
                            {selectedCategories.includes(cat) && <div className="w-1.5 bg-black h-1.5" />}
                          </div>
                          <span className="text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                            {cat}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-white/40">Availability</label>
                        <select name="availability" className="w-full bg-[#111] border border-white/10 p-2 text-xs outline-none focus:border-gold-accent" defaultValue={editingModel?.availability}>
                          <option value="Available">Available</option>
                          <option value="On Option">On Option</option>
                          <option value="Booked">Booked</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input name="is_verified" type="checkbox" className="hidden peer" defaultChecked={editingModel?.is_verified} />
                        <div className="w-3.5 h-3.5 border border-white/20 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
                          <div className="w-2 h-2 bg-white opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white">Verified Badge</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Biography Section - NOW INSIDE SCROLL AREA */}
                <div className="space-y-3 pt-8 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">Biography (Description)</label>
                    <span className={`text-[9px] font-bold ${editBio.length >= 140 ? 'text-red-500' : 'text-white/40'}`}>
                      {editBio.length} / 150 SYMBOLS
                    </span>
                  </div>
                  <textarea 
                    maxLength={150}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm tracking-wide leading-relaxed outline-none focus:border-gold-accent min-h-[100px] resize-none transition-all"
                    placeholder="Enter a compelling short bio..."
                  />
                </div>

                {/* Media Section - NOW INSIDE SCROLL AREA */}
                <div className="space-y-4 pt-8 border-t border-white/5">
                  <h3 className="text-[10px] uppercase tracking-widest text-gold-accent font-bold">Profile Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Column 1: Avatar */}
                    <div className="space-y-3">
                      <label className="text-[9px] uppercase tracking-widest text-white/40">Avatar Image</label>
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 overflow-hidden shrink-0">
                          {editingModel?.avatar ? <img src={editingModel.avatar} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-full h-full p-4 text-white/10" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input name="avatar" type="text" placeholder="URL" className="w-full bg-white/5 border border-white/10 p-2 text-[10px] outline-none focus:border-gold-accent transition-all" defaultValue={editingModel?.avatar} />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-gold-accent hover:text-black transition-all cursor-pointer text-[9px] uppercase tracking-widest font-bold">
                            <Upload className="w-3 h-3" />
                            Upload New
                            <input name="avatar_file" type="file" className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Background Image (Cover) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] uppercase tracking-widest text-white/40">Profile Background</label>
                            {editBackgroundImage && (
                                <button 
                                    type="button"
                                    onClick={() => setModelBgToCrop(editBackgroundImage)}
                                    className="text-[9px] uppercase tracking-widest text-gold-accent hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <Crop size={10} /> Adjust Crop
                                </button>
                            )}
                        </div>
                        <div className="relative aspect-video bg-black/40 border border-white/10 group overflow-hidden">
                             {editBackgroundImage ? (
                                <img src={editBackgroundImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                             ) : (
                                <ImageIcon className="w-8 h-8 text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                             )}
                             
                             <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                 <span className="text-[10px] uppercase tracking-widest text-white font-bold flex items-center gap-2">
                                     <Upload size={12} /> Upload
                                 </span>
                                 <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setModelBgToCrop(url);
                                            e.target.value = '';
                                        }
                                    }}
                                 />
                             </label>
                        </div>
                        <input name="background_image" type="hidden" value={editBackgroundImage} />
                    </div>

                    {/* Column 2: Portfolio Gallery */}
                    <div className="col-span-1 md:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] uppercase tracking-widest text-white/40">Portfolio Gallery / Портфолио Галерия</label>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">{editCoverImages.length} items</span>
                      </div>
                      
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {editCoverImages.map((url, idx) => (
                          <div key={idx} className="relative aspect-[3/4] group border border-white/10 overflow-hidden">
                            <img src={url} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                              <button 
                                type="button"
                                onClick={async () => {
                                  const urlToDelete = url;
                                  setEditCoverImages(prev => prev.filter((_, i) => i !== idx));
                                  // Optionally delete from storage immediately if desired
                                  if (urlToDelete.includes('supabase.co')) {
                                    await modelsService.deleteFile(urlToDelete);
                                  }
                                }}
                                className="bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <label className="aspect-[3/4] border border-dashed border-white/10 hover:border-gold-accent/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-white/[0.02]">
                          <Plus className="w-4 h-4 text-white/20" />
                          <span className="text-[8px] uppercase tracking-widest text-white/20">Add</span>
                          <input 
                            type="file" multiple className="hidden" 
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files) return;
                              setIsUploading(true);
                              try {
                                const fileArray = Array.from(files) as File[];
                                for (const file of fileArray) {
                                  const path = `gallery/${editingModel?.slug || 'new'}_${Date.now()}_${file.name}`;
                                  const url = await modelsService.uploadFile(file, path);
                                  setEditCoverImages(prev => [...prev, url]);
                                }
                              } catch (err: any) {
                                showToast(err.message, 'error');
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* MODAL FOOTER */}
                <div className="shrink-0 px-6 py-4 border-t border-white/10 bg-surface/80 backdrop-blur-md flex justify-between items-center">
                  <div>
                    {editingModel && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Model Profile',
                            message: `Are you sure you want to permanently delete ${editingModel.name}? This action cannot be undone.`,
                            type: 'danger',
                            onConfirm: async () => {
                              try {
                                await modelsService.deleteModel(editingModel.id);
                                showToast('Profile deleted', 'success');
                                setIsModalOpen(false);
                                fetchModels();
                              } catch (err: any) {
                                showToast(err.message, 'error');
                              }
                            }
                          });
                        }}
                        className="text-red-500 hover:text-red-400 text-[9px] uppercase tracking-[0.2em] font-bold py-1.5 px-3 border border-red-500/10 hover:bg-red-500/5 transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Profile
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white/40 hover:text-white text-[9px] uppercase tracking-widest transition-all">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className="bg-gold-accent text-black px-8 py-2 text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50"
                    >
                      {isUploading ? 'Saving...' : (editingModel ? 'Save Changes' : 'Create Profile')}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spotlight Adjust Modal */}
      {cropModalOpen && imageToCrop && (
        <SpotlightCropModal 
          isOpen={cropModalOpen}
          imageUrl={imageToCrop.url}
          onClose={() => {
            setCropModalOpen(false);
            setImageToCrop(null);
          }}
          onCropComplete={async (croppedUrl) => {
            try {
              setIsUploading(true);
              const res = await fetch(croppedUrl);
              const blob = await res.blob();
              const file = new File([blob], `adjusted_${Date.now()}.jpg`, { type: 'image/jpeg' });
              
              const path = `homepage/top_model_adjusted_${Date.now()}_${file.name}`;
              const publicUrl = await modelsService.uploadFile(file, path);
              
              setEditCardImages(prev => {
                const updated = [...prev];
                updated[imageToCrop.index] = publicUrl;
                return updated;
              });
              
              showToast('Asset updated!', 'success');
            } catch (err: any) {
              showToast(err.message, 'error');
            } finally {
              setCropModalOpen(false);
              setImageToCrop(null);
              setIsUploading(false);
            }
          }}
        />
      )}

      {/* Hero Background Crop Modal */}
      {heroImageToCrop && (
        <SpotlightCropModal 
          isOpen={!!heroImageToCrop}
          imageUrl={heroImageToCrop}
          onClose={() => setHeroImageToCrop(null)}
          aspectRatio={16/9}
          onCropComplete={async (croppedUrl) => {
             try {
               setIsHeroUploading(true);
               const res = await fetch(croppedUrl);
               const blob = await res.blob();
               const file = new File([blob], `hero_bg_${Date.now()}.jpg`, { type: 'image/jpeg' });
               
               const path = `site_assets/hero_bg_${Date.now()}`;
               const publicUrl = await modelsService.uploadFile(file, path);
               
               setHeroImageUrl(publicUrl);
               showToast('Hero background set!', 'success');
             } catch (err: any) {
               showToast(err.message, 'error');
             } finally {
               setHeroImageToCrop(null);
               setIsHeroUploading(false);
             }
          }}
        />
      )}

      {modelBgToCrop && (
        <SpotlightCropModal 
          isOpen={!!modelBgToCrop}
          imageUrl={modelBgToCrop}
          onClose={() => setModelBgToCrop(null)}
          aspectRatio={16/9} // Background should be landscape
          onCropComplete={async (croppedUrl) => {
             try {
               setIsModelBgUploading(true);
               const res = await fetch(croppedUrl);
               const blob = await res.blob();
               const file = new File([blob], `model_bg_${Date.now()}.jpg`, { type: 'image/jpeg' });
               
               const path = `models/${editingModel?.slug || 'new'}/background_${Date.now()}`;
               const publicUrl = await modelsService.uploadFile(file, path);
               
               setEditBackgroundImage(publicUrl);
               showToast('Background updated!', 'success');
             } catch (err: any) {
               showToast(err.message, 'error');
             } finally {
               setModelBgToCrop(null);
               setIsModelBgUploading(false);
             }
          }}
        />
      )}
      
      {/* CUSTOM CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className={`p-4 rounded-full ${
                  confirmModal.type === 'danger' ? 'bg-red-500/10 text-red-500' : 
                  confirmModal.type === 'warning' ? 'bg-gold-accent/10 text-gold-accent' : 
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {confirmModal.type === 'danger' ? <AlertTriangle className="w-8 h-8" /> : 
                   confirmModal.type === 'warning' ? <AlertTriangle className="w-8 h-8" /> : 
                   <Info className="w-8 h-8" />}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg uppercase tracking-widest font-bold text-white">{confirmModal.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider">{confirmModal.message}</p>
                </div>

                <div className="flex w-full gap-3 pt-4">
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-6 py-3 border border-white/10 text-white/40 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className={`flex-1 px-6 py-3 text-black text-[10px] uppercase tracking-widest font-bold transition-all ${
                      confirmModal.type === 'danger' ? 'bg-red-500 hover:bg-red-400' : 'bg-gold-accent hover:bg-white'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
