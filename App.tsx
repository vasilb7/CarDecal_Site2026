import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import MaintenancePage from './pages/MaintenancePage';
import { settingsService } from './lib/settingsService';
import { supabase } from './lib/supabase';
import { useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ModelsPage from './pages/ModelsPage';
import ModelProfilePage from './pages/ModelProfilePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LegalPage from './pages/LegalPage';
import ContributionsPage from './pages/ContributionsPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

import AdminRoute from './components/AdminRoute';

const LanguageWrapper: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // If language is not supported, redirect to fallback
  if (lang !== 'bg' && lang !== 'en') {
    return <Navigate to="/bg" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/models/category/:category" element={<ModelsPage />} />
        <Route path="/models/:slug" element={<ModelProfilePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/contributions" element={<ContributionsPage />} />
        <Route path="/book-now" element={<BookingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </Layout>
  );
};

function AppContent() {
  const location = useLocation();
  const { isAdmin, loading: authLoading } = useAuth();
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = React.useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const active = await settingsService.getMaintenanceMode();
        setIsMaintenance(active);
      } catch (err) {
        console.error('Maintenance check failed:', err);
      } finally {
        setMaintenanceLoading(false);
      }
    };
    checkMaintenance();

    // Listen for real-time changes
    const channel = supabase
      .channel('site_settings_maintenance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload: any) => {
          if (payload.new && payload.new.value !== undefined) {
            setIsMaintenance(payload.new.value === 'true');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // ONLY apply this on mobile/tablet devices to avoid breaking desktop experience
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    let focusCheckInterval: any = null;

    const performBlurCheck = () => {
      const v = window.visualViewport;
      if (!v) return;

      // Detect if the keyboard is likely gone
      if (v.height >= window.innerHeight - 50) {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || 
            active instanceof HTMLTextAreaElement || 
            active instanceof HTMLSelectElement) {
          (active as HTMLElement).blur();
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement || 
          e.target instanceof HTMLSelectElement) {
        if (focusCheckInterval) clearInterval(focusCheckInterval);
        focusCheckInterval = setInterval(performBlurCheck, 200);
      }
    };

    const handleFocusOut = () => {
      if (focusCheckInterval) {
        clearInterval(focusCheckInterval);
        focusCheckInterval = null;
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (focusCheckInterval) clearInterval(focusCheckInterval);
    };
  }, []);
  
  if (maintenanceLoading) {
    return <div className="fixed inset-0 bg-[#0B0B0C]" />;
  }

  const isManagementRoute = location.pathname.startsWith('/admin') || location.pathname.includes('/login');
  
  // Maintenance mode check - prioritizing it even if auth is still loading for public users
  if (isMaintenance && !isAdmin && !isManagementRoute) {
    return <MaintenancePage />;
  }

  if (authLoading) {
    return <div className="fixed inset-0 bg-[#0B0B0C]" />;
  }

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/bg" replace />} />
          
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          <Route path="/:lang/login" element={
            <motion.div 
              key="login"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.5 }}
            >
              <LoginPage />
            </motion.div>
          } />
          <Route path="/:lang/register" element={
            <motion.div 
              key="register"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.5 }}
            >
              <RegisterPage />
            </motion.div>
          } />
          
          <Route path="/:lang/*" element={<LanguageWrapper />} />
          
          {/* Catch-all for non-prefixed routes */}
          <Route path="*" element={<Navigate to="/bg" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

import { ToastProvider } from './components/Toast/ToastProvider';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
