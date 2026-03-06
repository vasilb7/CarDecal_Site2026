import React, { useState, useEffect, Suspense, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { ToastProvider } from './components/Toast/ToastProvider';
import { useAuth } from './context/AuthContext';
import { useSiteSettings, SiteSettingsProvider } from './context/SiteSettingsContext';
import { UIProvider } from './context/UIContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { Loader2 } from 'lucide-react';
import { CompleteRegistrationModal } from './components/ui/complete-registration';
import ReportBugModal from './components/ReportBugModal';
import { useToast } from './hooks/useToast';
import { useTranslation } from 'react-i18next';

// Lazy-loaded pages - only downloaded when navigated to
const CatalogPage = React.lazy(() => import('./pages/CatalogPage'));
const ProductDetailsPage = React.lazy(() => import('./pages/ProductDetailsPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const BookingPage = React.lazy(() => import('./pages/BookingPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const RecoveryPage = React.lazy(() => import('./pages/RecoveryPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage'));
const OrderReceiptPage = React.lazy(() => import('./pages/OrderReceiptPage'));
const OrderDetailPage = React.lazy(() => import('./pages/OrderDetailPage'));
const MaintenancePage = React.lazy(() => import('./pages/MaintenancePage'));
const ProductQuickViewModal = React.lazy(() => import('./components/ProductQuickViewModal'));

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
  const location = useLocation();
  const { user, loading: authLoading, isAdmin, isEditor, profile } = useAuth();
  const { settings, loading: settingsLoading, serverTimeOffset } = useSiteSettings();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [isTimeUp, setIsTimeUp] = useState(false);


  useEffect(() => {
    if (!settings?.maintenance_auto_start_at) {
      setIsTimeUp(false);
      return;
    }

    const checkTime = () => {
      const serverNow = Date.now() + serverTimeOffset;
      const target = new Date(settings.maintenance_auto_start_at).getTime();
      if (serverNow >= target) {
        setIsTimeUp(true);
        return true;
      }
      return false;
    };

    if (checkTime()) return;
    const interval = setInterval(() => { if (checkTime()) clearInterval(interval); }, 1000);
    return () => clearInterval(interval);
  }, [settings?.maintenance_auto_start_at, settings?.maintenance_mode, serverTimeOffset]);

  // Derived state
  const isAuthenticated = !!user;
  const isMaintenancePageAllowed = 
    location.pathname.startsWith('/admin') || 
    location.pathname === '/login';
  const isGlobalMaintenanceActive = settings.maintenance_mode || isTimeUp;
  const backgroundLocation = (location.state as any)?.backgroundLocation;
  
  // Detect transition from maintenance ACTIVE -> INACTIVE to trigger hard refresh
  const wasMaintenanceActive = useRef(isGlobalMaintenanceActive);

  useEffect(() => {
    if (wasMaintenanceActive.current && !isGlobalMaintenanceActive) {
      // Small delay to ensure DB/Settings are synced before reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    wasMaintenanceActive.current = isGlobalMaintenanceActive;
  }, [isGlobalMaintenanceActive]);

  // Early return for loading - AFTER hooks
  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (isGlobalMaintenanceActive && !isAdmin && !isEditor && !isMaintenancePageAllowed) {
    return <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="w-10 h-10 animate-spin text-red-600" /></div>}><MaintenancePage /></Suspense>;
  }

  const LazyFallback = (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-red-600" />
    </div>
  );

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={LazyFallback}>
      <Routes location={backgroundLocation || location}>
        {/* Admin - Protected */}
        <Route path="/admin/*" element={isAdmin || isEditor ? <AdminPage /> : <Navigate to="/login" replace />} />

        {/* Auth Pages - No Header/Footer */}
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/recovery" element={<PageWrapper><RecoveryPage /></PageWrapper>} />
        <Route path="/checkout" element={<PageWrapper><CheckoutPage /></PageWrapper>} />
        <Route path="/order/success/:orderId" element={<PageWrapper><OrderSuccessPage /></PageWrapper>} />
        <Route path="/order/receipt/:orderId" element={<OrderReceiptPage />} />

        {/* Regular Pages with Layout */}
        <Route path="*" element={
          <Layout>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={(backgroundLocation || location).pathname} className="w-full">
                <Routes location={backgroundLocation || location}>
                  <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
                  <Route path="/catalog" element={<PageWrapper><CatalogPage /></PageWrapper>} />
                  <Route path="/catalog/category/:category" element={<PageWrapper><CatalogPage /></PageWrapper>} />
                  <Route path="/catalog/:slug" element={<PageWrapper><ProductDetailsPage /></PageWrapper>} />
                  <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                  <Route path="/pricing" element={<PageWrapper><PricingPage /></PageWrapper>} />
                  <Route path="/privacy" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
                  <Route path="/terms" element={<PageWrapper><TermsPage /></PageWrapper>} />
                  <Route path="/custom-orders" element={<PageWrapper><BookingPage /></PageWrapper>} />
                  <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
                  <Route path="/profile" element={isAuthenticated ? <PageWrapper><ProfilePage /></PageWrapper> : <Navigate to="/login" replace />} />
                  <Route path="/account/orders/:orderId" element={isAuthenticated ? <PageWrapper><OrderDetailPage /></PageWrapper> : <Navigate to="/login" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
            <CompleteRegistrationModal />
          </Layout>
        } />
      </Routes>
      </Suspense>

      {/* Modal Overlay Section */}
      {backgroundLocation && (
        <React.Suspense fallback={null}>
          <Routes>
            <Route path="/catalog/:slug" element={<ProductQuickViewModal />} />
          </Routes>
        </React.Suspense>
      )}

      {/* Global Modals */}
      <ReportBugModal />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SiteSettingsProvider>
        <UIProvider>
          <ProductsProvider>
            <CartProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </CartProvider>
          </ProductsProvider>
        </UIProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}

export default App;
