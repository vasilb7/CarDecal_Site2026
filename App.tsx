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
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import RecoveryPage from './pages/RecoveryPage';
import AdminPage from './pages/AdminPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderReceiptPage from './pages/OrderReceiptPage';
import OrderDetailPage from './pages/OrderDetailPage';
import { ToastProvider } from './components/Toast/ToastProvider';
import { useAuth } from './context/AuthContext';
import { useSiteSettings, SiteSettingsProvider } from './context/SiteSettingsContext';
import { UIProvider } from './context/UIContext';
import { CartProvider } from './context/CartContext';
import MaintenancePage from './pages/MaintenancePage';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CompleteRegistrationModal } from './components/ui/complete-registration';
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
  const { user, loading: authLoading, isAdmin, isEditor } = useAuth();
  const { settings, loading: settingsLoading, serverTimeOffset } = useSiteSettings();
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

  // Early return for loading - AFTER hooks
  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  // Maintenance Check
  if (isGlobalMaintenanceActive && !isAdmin && !isEditor && !isMaintenancePageAllowed) {
    return <MaintenancePage />;
  }

  return (
    <>
      <ScrollToTop />
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
                  <Route path="/book-now" element={<PageWrapper><BookingPage /></PageWrapper>} />
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

      {/* Modal Overlay Section */}
      {backgroundLocation && (
        <React.Suspense fallback={null}>
          <Routes>
            <Route path="/catalog/:slug" element={<ProductQuickViewModal />} />
          </Routes>
        </React.Suspense>
      )}
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
