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
  ArrowRight
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
  const [selectedTopModelId, setSelectedTopModelId] = useState<string>('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [maintenancePerks, setMaintenancePerks] = useState('');
  const [maintenanceUpdatesText, setMaintenanceUpdatesText] = useState('');
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; index: number } | null>(null);

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
        // Sync both naming conventions
        setEditCardImages(top.card_images || top.cardImages || []);
      }
      
      const [maintenance, message, endTime, perks, updateText] = await Promise.all([
        settingsService.getMaintenanceMode(),
        settingsService.getMaintenanceMessage(),
        settingsService.getMaintenanceEndTime(),
        settingsService.getMaintenancePerks(),
        settingsService.getMaintenanceUpdatesText()
      ]);
      setIsMaintenance(maintenance);
      setMaintenanceMessage(message);
      setMaintenanceEndTime(endTime || '');
      setMaintenancePerks(perks);
      setMaintenanceUpdatesText(updateText);
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
        if (key === 'maintenance_perks') setMaintenancePerks(value);
        if (key === 'maintenance_updates_text') setMaintenanceUpdatesText(value);
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
      setEditCoverImages(editingModel.cover_image || editingModel.coverImage || []);
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

  // Sync Spotlight Editor Fields
  useEffect(() => {
    if (!selectedTopModelId || !models.length) return;
    
    const model = models.find(m => m.id === selectedTopModelId);
    if (model) {
      setSpotlightBio(model.spotlight_bio || model.bio || '');
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
          <div className="flex-1 overflow-auto p-8 bg-[#020202] custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-8">
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
              <div className="flex items-center gap-4 py-4 overflow-x-auto custom-scrollbar">
                {[
                  { label: 'Create Casting', icon: <Plus size={14} />, action: () => setActiveTab('castings') },
                  { label: 'Invite Models', icon: <UserPlus size={14} />, action: () => setActiveTab('models') },
                  { label: 'Generate Comp Card', icon: <FileImage size={14} />, action: () => setActiveTab('models') },
                  { label: 'Bulk Email', icon: <MessageSquare size={14} />, action: () => setActiveTab('communication') }
                ].map((action, i) => (
                  <button 
                    key={i} 
                    onClick={action.action}
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 hover:bg-gold-accent hover:border-gold-accent hover:text-black transition-all group whitespace-nowrap"
                  >
                    <div className="text-gold-accent group-hover:text-black transition-colors">{action.icon}</div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Stats Grid - OPERATIONAL KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    className="bg-white/[0.02] border border-white/5 p-6 hover:border-gold-accent/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Funnel Area */}
                <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-gold-accent" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Casting Funnel</h3>
                    </div>
                  </div>
                  
                  {/* Funnel Chart */}
                  <div className="flex-1 flex flex-col justify-end gap-6 h-64 w-full pt-4 relative px-4">
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
                  
                  <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar p-6 space-y-6">
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
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="flex-1 overflow-auto p-6 bg-[#020202] custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-4">
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
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] uppercase tracking-widest text-white/60 font-bold">Live Sync Active</span>
                  </div>
                  <button 
                    disabled={isUploading || !selectedTopModelId}
                    onClick={async () => {
                      if (!selectedTopModelId) return;
                      const currentTop = models.find(m => m.is_top_model);
                      setIsUploading(true);
                      try {
                        if (currentTop && currentTop.id !== selectedTopModelId) {
                          await modelsService.updateModel(currentTop.id, { is_top_model: false });
                        }
                                    await modelsService.updateModel(selectedTopModelId, { 
                                      is_top_model: true,
                                      spotlight_bio: spotlightBio,
                                      card_images: editCardImages
                                    });
                                    showToast('Промените са запазени в Supabase!', 'success');
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
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-[calc(100vh-180px)] min-h-[500px]">
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
                  <div className="flex-1 bg-black/40 border border-white/5 flex flex-col overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <Star className="w-3.5 h-3.5 text-gold-accent" />
                        <h3 className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/80">Editorial Bio</h3>
                      </div>
                      <Info className="w-3 h-3 text-white/20" />
                    </div>
                    
                    <div className="flex-1 p-1 bg-black/40">
                      <textarea 
                        className="w-full h-full bg-transparent p-5 text-sm tracking-wide leading-relaxed text-white/80 outline-none resize-none placeholder:text-white/5 custom-scrollbar"
                        value={spotlightBio}
                        onChange={(e) => setSpotlightBio(e.target.value)}
                        placeholder="Define the model's spirit and impact here... Use Markdown for emphasis."
                      />
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-widest text-white/40 font-black">Quality Check</span>
                        <div className="h-[1px] flex-1 bg-white/5 mx-4" />
                        <CheckCircle2 className="w-3 h-3 text-green-500/40" />
                      </div>
                      <p className="text-[9px] leading-relaxed text-white/30 uppercase tracking-tight">
                        Visuals should be 4:5 portrait ratio for optimal display. 
                        Bio text will be overlayed on mobile - keep it concise.
                      </p>
                    </div>
                  </div>
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
          <div className="flex-1 overflow-auto p-8 bg-[#020202] custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12">
              <header className="space-y-2">
                <h2 className="text-xl font-bold uppercase tracking-[0.4em] text-white">Global <span className="text-gold-accent">Settings</span></h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Manage site-wide features and legal requirements</p>
              </header>

              {/* DANGER ZONE - DATABASE RESET */}
              <section>
                <div className="bg-red-900/10 border border-red-500/20 p-6 space-y-4 max-w-md mb-8">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                           <h3 className="text-sm font-bold uppercase tracking-widest text-red-500">Emergency Reset</h3>
                           <p className="text-[10px] text-red-400/60 uppercase tracking-widest leading-relaxed">Wipe DB & Reseed from Site_Pics</p>
                        </div>
                     </div>
                      <button 
                        onClick={handleResetDatabase}
                        disabled={isUploading}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-red-900/20"
                      >
                        {isUploading ? 'Reseeding...' : 'Reset Database'}
                      </button>
                  </div>
                </div>
              </section>

              {/* Maintenance Toggle */}
              <section>
                <div className="bg-white/[0.02] border border-white/5 p-6 space-y-4 hover:border-white/10 transition-all max-w-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-sm">
                        <Lock className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Maintenance Mode</h3>
                        <p className="text-[9px] text-white/30 uppercase tracking-tight">Lock the public site for updates</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const newState = !isMaintenance;
                        setConfirmModal({
                          isOpen: true,
                          title: newState ? 'Activate Maintenance?' : 'Deactivate Maintenance?',
                          message: newState 
                            ? 'This will make the site inaccessible to the public. Are you sure?' 
                            : 'This will make the site live for everyone. Are you sure?',
                          type: newState ? 'danger' : 'info',
                          onConfirm: async () => {
                            try {
                              setIsUpdatingMaintenance(true);
                              await settingsService.setMaintenanceMode(newState);
                              setIsMaintenance(newState);
                              showToast(newState ? 'Maintenance Mode Activated' : 'Maintenance Mode Deactivated', 'success');
                            } catch (error: any) {
                              showToast(error.message, 'error');
                            } finally {
                              setIsUpdatingMaintenance(false);
                            }
                          }
                        });
                      }}
                      className={`w-12 h-6 rounded-full relative transition-all ${isMaintenance ? 'bg-red-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMaintenance ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </section>

              {/* Maintenance Details */}
              <section className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gold-accent/10 rounded-sm">
                      <Settings className="w-5 h-5 text-gold-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-[0.3em] text-white">Maintenance Orchestrator</h3>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Configure the visitor experience during downtime</p>
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
                          settingsService.setMaintenancePerks(maintenancePerks),
                          settingsService.setMaintenanceUpdatesText(maintenanceUpdatesText)
                        ]);
                        showToast('Maintenance configuration deployed', 'success');
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      } finally {
                        setIsSavingMaintenance(false);
                      }
                    }}
                    className="group relative overflow-hidden bg-white text-black px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors disabled:opacity-20"
                  >
                    <div className="absolute inset-0 bg-gold-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10">{isSavingMaintenance ? 'Deploying...' : 'Save Configuration'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Message & Perks */}
                  <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white/[0.02] border border-white/5 p-8 space-y-6">
                      <header className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <Edit2 className="w-3.5 h-3.5 text-gold-accent" />
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Public Manifesto</h4>
                        </div>
                        <span className="text-[9px] text-white/20 uppercase tracking-widest">Main message displayed to visitors</span>
                      </header>
                      
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                            <span>Headline Message</span>
                            <span className="text-[8px] italic">Supports multiple lines</span>
                          </label>
                          <textarea 
                            rows={4}
                            value={maintenanceMessage}
                            onChange={(e) => setMaintenanceMessage(e.target.value)}
                            placeholder="e.g. Сайтът е в процес на профилактика. / Our site is currently undergoing maintenance."
                            className="w-full bg-black/40 border border-white/10 p-4 text-xs tracking-wide outline-none focus:border-gold-accent text-white resize-none transition-all placeholder:text-white/5"
                          />
                        </div>


                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                            <span>Planned Updates & Perks</span>
                            <span className="text-[8px] italic">One benefit per line</span>
                          </label>
                          <div className="space-y-3">
                            {maintenancePerks.split('\n').map((perk, index, arr) => (
                              <div key={index} className="flex gap-2 group">
                                <div className="flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-50 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      if (index === 0) return;
                                      const newPerks = [...arr];
                                      [newPerks[index - 1], newPerks[index]] = [newPerks[index], newPerks[index - 1]];
                                      setMaintenancePerks(newPerks.join('\n'));
                                    }}
                                    disabled={index === 0}
                                    className="hover:text-gold-accent disabled:opacity-30"
                                  >
                                    <ArrowUp size={10} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (index === arr.length - 1) return;
                                      const newPerks = [...arr];
                                      [newPerks[index + 1], newPerks[index]] = [newPerks[index], newPerks[index + 1]];
                                      setMaintenancePerks(newPerks.join('\n'));
                                    }}
                                    disabled={index === arr.length - 1}
                                    className="hover:text-gold-accent disabled:opacity-30"
                                  >
                                    <ArrowDown size={10} />
                                  </button>
                                </div>
                                <input
                                  value={perk}
                                  onChange={(e) => {
                                    const newPerks = [...arr];
                                    newPerks[index] = e.target.value;
                                    setMaintenancePerks(newPerks.join('\n'));
                                  }}
                                  placeholder="Enter update perk..."
                                  className="flex-1 bg-black/40 border border-white/10 p-4 text-xs tracking-wide outline-none focus:border-gold-accent text-white transition-all placeholder:text-white/5"
                                />
                                <button 
                                  onClick={() => {
                                    const newPerks = arr.filter((_, i) => i !== index);
                                    setMaintenancePerks(newPerks.join('\n'));
                                  }}
                                  className="px-3 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-white/20 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newPerks = maintenancePerks ? [...maintenancePerks.split('\n'), ''] : [''];
                                setMaintenancePerks(newPerks.join('\n'));
                              }}
                              className="w-full py-3 border border-dashed border-white/10 hover:border-gold-accent/50 hover:bg-gold-accent/5 text-[10px] uppercase tracking-widest text-white/40 hover:text-gold-accent transition-all flex items-center justify-center gap-2"
                            >
                              <Plus size={12} />
                              Add New Perk
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Tools */}
                  <div className="space-y-8">
                    <div className="bg-white/[0.02] border border-white/5 p-8 space-y-6">
                      <header className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <Clock className="w-3.5 h-3.5 text-gold-accent" />
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Projected Timeline</h4>
                        </div>
                      </header>
                      
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40">Expected Completion</label>
                          <input 
                            type="datetime-local"
                            value={maintenanceEndTime}
                            onChange={(e) => setMaintenanceEndTime(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 p-4 text-xs outline-none focus:border-gold-accent text-white transition-all invert-calendar-icon"
                          />
                          
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                              { label: '+30 Mins', mins: 30 },
                              { label: '+1 Hour', mins: 60 },
                              { label: '+6 Hours', mins: 360 },
                              { label: '+24 Hours', mins: 1440 },
                              { label: '+3 Days', mins: 4320 },
                              { label: '+1 Week', mins: 10080 },
                            ].map((time) => (
                              <button
                                key={time.label}
                                type="button" 
                                onClick={() => {
                                  const now = new Date();
                                  now.setMinutes(now.getMinutes() + time.mins);
                                  // Adjust for local timezone offset to ensure correct datetime-local value
                                  const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                                    .toISOString()
                                    .slice(0, 16);
                                  setMaintenanceEndTime(localIsoString);
                                }}
                                className="bg-white/5 border border-white/10 hover:border-gold-accent/50 hover:bg-gold-accent/10 hover:text-gold-accent text-[9px] uppercase tracking-widest text-white/40 py-2.5 transition-all duration-300"
                              >
                                {time.label}
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-white/20 leading-relaxed uppercase tracking-tight mt-4">
                            The countdown timer will automatically reveal itself if a future date and time is specified.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gold-accent/5 border border-gold-accent/10 p-6">
                      <div className="flex items-start gap-4">
                        <Info className="w-4 h-4 text-gold-accent shrink-0 mt-0.5" />
                        <p className="text-[9px] text-gold-accent/60 uppercase tracking-widest leading-relaxed">
                          Maintenance mode locks the entire public application. Admin panel remains accessible only via direct URL.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
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
