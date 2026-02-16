import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { NotFoundPage } from './components/ui/not-found-page-2';
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
import PricingRouter from './pages/PricingRouter';
import ChristmasPricingPage from './pages/ChristmasPricingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LegalPage from './pages/LegalPage';
import Blog from './pages/ContributionsPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';

import AdminRoute from './components/AdminRoute';

const LanguageWrapper: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const supportedLangs = ['bg', 'en'];
    if (lang && supportedLangs.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // If language is not supported, show 404
  if (lang !== 'bg' && lang !== 'en') {
    return <NotFoundPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/models" element={<Layout><ModelsPage /></Layout>} />
      <Route path="/models/category/:category" element={<Layout><ModelsPage /></Layout>} />
      <Route path="/models/:slug" element={<Layout><ModelProfilePage /></Layout>} />
      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/services" element={<Layout><ServicesPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/pricing" element={<Layout><PricingRouter /></Layout>} />
      <Route path="/christmas-pricing" element={<Layout><ChristmasPricingPage /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
      <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
      <Route path="/legal" element={<Layout><LegalPage /></Layout>} />
      <Route path="/blog" element={<Layout><Blog /></Layout>} />
      <Route path="/book-now" element={<Layout><BookingPage /></Layout>} />
      <Route path="/checkout/:planId" element={<Layout><CheckoutPage /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      <Route path="/admin" element={
        <AdminRoute>
          <Layout><AdminDashboard /></Layout>
        </AdminRoute>
      } />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function AppContent() {
  const location = useLocation();
  const { isAdmin, loading: authLoading } = useAuth();
  
  // Initialize from localStorage to prevent flicker
  const [isMaintenance, setIsMaintenance] = React.useState(() => {
    return localStorage.getItem('maintenance_mode') === 'true';
  });
  const [maintenanceLoading, setMaintenanceLoading] = React.useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const active = await settingsService.getMaintenanceMode();
        setIsMaintenance(active);
        localStorage.setItem('maintenance_mode', active.toString());
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
            const active = payload.new.value === 'true';
            setIsMaintenance(active);
            localStorage.setItem('maintenance_mode', active.toString());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ... (keyboard blur logic remains the same)
  
  const isManagementRoute = location.pathname.startsWith('/admin') || location.pathname.includes('/login');
  
  // Show maintenance immediately if cached or confirmed
  if (isMaintenance && !isAdmin && !isManagementRoute) {
    return <MaintenancePage />;
  }

  // Prevent main site flicker while definitively checking for the first time
  if (maintenanceLoading && !isMaintenance) {
    return <div className="fixed inset-0 bg-black" />;
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
          <Route path="*" element={<NotFoundPage />} />
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
