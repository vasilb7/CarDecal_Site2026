import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ContactPage from './pages/ContactPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LegalPage from './pages/LegalPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import RecoveryPage from './pages/RecoveryPage';
import AdminPage from './pages/AdminPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { ToastProvider } from './components/Toast/ToastProvider';
import { useAuth } from './context/AuthContext';
import { useSiteSettings, SiteSettingsProvider } from './context/SiteSettingsContext';
import { UIProvider } from './context/UIContext';
import { CartProvider } from './context/CartContext';
import MaintenancePage from './pages/MaintenancePage';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CompleteRegistrationModal } from './components/ui/complete-registration';

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function AppContent() {
  const { loading, isAdmin, isEditor } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const location = useLocation();
  
  const isMaintenancePageAllowed = 
    location.pathname.startsWith('/admin') || 
    location.pathname === '/login';

  const showMaintenance = 
    settings.maintenance_mode && 
    !isAdmin && 
    !isEditor && 
    !isMaintenancePageAllowed;

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  // Reactive Maintenance Trigger
  const [isTimeUp, setIsTimeUp] = useState(() => {
    if (!settings.maintenance_auto_start_at) return false;
    return new Date().getTime() >= new Date(settings.maintenance_auto_start_at).getTime();
  });

  useEffect(() => {
    const autoStart = settings.maintenance_auto_start_at;
    if (!autoStart || settings.maintenance_mode) {
      setIsTimeUp(false);
      return;
    }

    const checkTime = () => {
      const now = new Date().getTime();
      const target = new Date(autoStart).getTime();
      if (now >= target) {
        setIsTimeUp(true);
        return true;
      }
      return false;
    };

    if (checkTime()) return;

    const interval = setInterval(() => {
      if (checkTime()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.maintenance_auto_start_at, settings.maintenance_mode]);

  // Double check: if maintenance is ON or scheduled and reached
  if ((settings.maintenance_mode || isTimeUp) && !isAdmin && !isEditor && !isMaintenancePageAllowed) {
    return <MaintenancePage />;
  }

  const isGlobalMaintenanceActive = settings.maintenance_mode || isTimeUp;

  return (
    <>
      <ScrollToTop />
      <Routes location={location}>
        {/* Admin - No Layout */}
        <Route path="/admin/*" element={<AdminPage />} />

        {/* Auth Pages - No Header/Footer */}
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/recovery" element={<PageWrapper><RecoveryPage /></PageWrapper>} />
        <Route path="/checkout" element={<PageWrapper><CheckoutPage /></PageWrapper>} />

        {/* Pages with Layout - Content Animates Inside */}
        <Route path="*" element={
          <Layout>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={location.pathname} className="w-full">
                <Routes location={location}>
                  <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
                  <Route path="/catalog" element={<PageWrapper><CatalogPage /></PageWrapper>} />
                  <Route path="/catalog/category/:category" element={<PageWrapper><CatalogPage /></PageWrapper>} />
                  <Route path="/catalog/:slug" element={<PageWrapper><ProductDetailsPage /></PageWrapper>} />
                  <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                  <Route path="/pricing" element={<PageWrapper><PricingPage /></PageWrapper>} />
                  <Route path="/privacy" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
                  <Route path="/terms" element={<PageWrapper><TermsPage /></PageWrapper>} />
                  <Route path="/legal" element={<PageWrapper><LegalPage /></PageWrapper>} />
                  <Route path="/book-now" element={<PageWrapper><BookingPage /></PageWrapper>} />
                  <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
                  <Route path="/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
            <CompleteRegistrationModal />
          </Layout>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SiteSettingsProvider>
        <UIProvider>
          <CartProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </CartProvider>
        </UIProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}

export default App;
