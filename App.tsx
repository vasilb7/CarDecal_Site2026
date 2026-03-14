import React, { useState, useEffect, Suspense, useRef, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import { ToastProvider } from "./components/Toast/ToastProvider";
import { useAuth } from "./context/AuthContext";
import {
  useSiteSettings,
  SiteSettingsProvider,
} from "./context/SiteSettingsContext";
import { UIProvider } from "./context/UIContext";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { Loader2 } from "lucide-react";
import { CompleteRegistrationModal } from "./components/ui/complete-registration";
import ReportBugModal from "./components/ReportBugModal";
import UnbanNotification from "./components/UnbanNotification";
import { useToast } from "./hooks/useToast";
import { useTranslation } from "react-i18next";

// Custom lazy loader to handle "dynamically imported module" errors (e.g., after a new deploy clears old chunks)
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('retry-lazy-load') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('retry-lazy-load', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('retry-lazy-load', 'true');
        window.location.reload();
        // Return a promise that never resolves while the page is reloading
        return new Promise<any>(() => {});
      }
      throw error;
    }
  });

// Lazy-loaded pages - only downloaded when navigated to
const CatalogPage = lazyWithRetry(() => import("./pages/CatalogPage"));
const ProductDetailsPage = lazyWithRetry(
  () => import("./pages/ProductDetailsPage"),
);
const ContactPage = lazyWithRetry(() => import("./pages/ContactPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const PricingPage = lazyWithRetry(() => import("./pages/PricingPage"));
const AuthPage = lazyWithRetry(() => import("./pages/AuthPage"));
const PrivacyPage = lazyWithRetry(() => import("./pages/PrivacyPage"));
const TermsPage = lazyWithRetry(() => import("./pages/TermsPage"));
const DeliveryPage = lazyWithRetry(() => import("./pages/DeliveryPage"));
const BookingPage = lazyWithRetry(() => import("./pages/BookingPage"));
const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));

const AdminPage = lazyWithRetry(() => import("./pages/AdminPage"));
const CartPage = lazyWithRetry(() => import("./pages/CartPage"));
const CheckoutPage = lazyWithRetry(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazyWithRetry(() => import("./pages/OrderSuccessPage"));
const OrderReceiptPage = lazyWithRetry(() => import("./pages/OrderReceiptPage"));
const OrderDetailPage = lazyWithRetry(() => import("./pages/OrderDetailPage"));
const MaintenancePage = lazyWithRetry(() => import("./pages/MaintenancePage"));
const RestrictedPage = lazyWithRetry(() => import("./pages/RestrictedPage"));
const StealthAuthPage = lazyWithRetry(() => import("./pages/StealthAuthPage"));
const PromosPage = lazyWithRetry(() => import("./pages/PromosPage"));
const ProductQuickViewModal = lazyWithRetry(
  () => import("./components/ProductQuickViewModal"),
);

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
  const { user, loading: authLoading, isAdmin, isEditor, isBanned, moderationStatus, profile } = useAuth();
  const {
    settings,
    loading: settingsLoading,
    serverTimeOffset,
    isMaintenanceActive,
  } = useSiteSettings();
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Derived state
  const isAuthenticated = !!user;
  const isMaintenancePageAllowed =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/s/");
  const isGlobalMaintenanceActive = isMaintenanceActive;
  const isProductPage =
    location.pathname.startsWith("/catalog/") &&
    location.pathname.split("/").length === 3;

  // Logic to determine if we should render a background page (for modals)
  // We MUST preserve search params and existing state to prevent CatalogPage from resetting filters/scroll
  const backgroundLocation = useMemo(() => {
    const stateLoc = (location.state as any)?.backgroundLocation;
    if (stateLoc) return stateLoc;
    
    if (isProductPage) {
      return { pathname: "/catalog", search: location.search, state: location.state };
    }
    return null;
  }, [isProductPage, location.state, location.search]);

  // Set scroll restoration to manual globally at app start
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Maintenance logic handles automatically via React state

  // Early return for loading - AFTER hooks
  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  // Ban/restriction check - redirect banned users (except admins)
  const isRestricted = isAuthenticated && isBanned && !isAdmin && !isEditor;
  const isAllowedPathForRestricted = 
    location.pathname === '/restricted' || 
    location.pathname.startsWith('/terms') || 
    location.pathname.startsWith('/privacy') ||
    location.pathname.startsWith('/contact') ||
    location.pathname.startsWith('/s/');

  // If user is restricted and NOT on an allowed page, show RestrictedPage
  if (isRestricted && !isAllowedPathForRestricted) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-black">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          </div>
        }
      >
        <RestrictedPage />
      </Suspense>
    );
  }

  if (
    isGlobalMaintenanceActive &&
    !isAdmin &&
    !isEditor &&
    !isMaintenancePageAllowed
  ) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-black">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          </div>
        }
      >
        <MaintenancePage />
      </Suspense>
    );
  }

  // Onboarding block - strictly force completion before using the site
  const isOnboardingRequired = isAuthenticated && profile?.onboarding_completed === false;

  if (isOnboardingRequired) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <div className="min-h-screen bg-zinc-950">
           <CompleteRegistrationModal />
        </div>
      </Suspense>
    );
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
          {/* Admin - Protected - Stealth redirect to home for unauthorized users */}
          <Route
            path="/admin/*"
            element={
              isAdmin || isEditor ? <AdminPage /> : <Navigate to="/" replace />
            }
          />

          {/* Unified Auth Page for Login, Register, Recovery */}
          <Route
            path="/login"
            element={
              <PageWrapper>
                <AuthPage />
              </PageWrapper>
            }
          />
          <Route
            path="/register"
            element={
              <PageWrapper>
                <AuthPage />
              </PageWrapper>
            }
          />
          <Route
            path="/recovery"
            element={
              <PageWrapper>
                <AuthPage />
              </PageWrapper>
            }
          />

          <Route
            path="/s/:name/:code"
            element={
              <PageWrapper>
                <StealthAuthPage />
              </PageWrapper>
            }
          />
          <Route
            path="/checkout"
            element={
              isAuthenticated && isBanned ? (
                <Navigate to="/restricted" replace />
              ) : (
                <PageWrapper>
                  <CheckoutPage />
                </PageWrapper>
              )
            }
          />
          <Route
            path="/order/success/:orderId"
            element={
              <PageWrapper>
                <OrderSuccessPage />
              </PageWrapper>
            }
          />
          <Route
            path="/order/receipt/:orderId"
            element={<OrderReceiptPage />}
          />

          {/* Regular Pages with Layout */}
          <Route
            path="*"
            element={
              <Layout 
                hideHeader={isRestricted}
                hideFooter={isRestricted || location.pathname === '/profile' || location.pathname.startsWith('/account/orders/')}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={(backgroundLocation || location).pathname}
                    className="w-full"
                  >
                    <Routes location={backgroundLocation || location}>
                      <Route
                        path="/"
                        element={
                          <PageWrapper>
                            <HomePage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/catalog"
                        element={
                          <PageWrapper>
                            <CatalogPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/catalog/category/:category"
                        element={
                          <PageWrapper>
                            <CatalogPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/catalog/:slug"
                        element={
                          <PageWrapper>
                            <ProductDetailsPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/contact"
                        element={
                          <PageWrapper>
                            <ContactPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/about"
                        element={
                          <PageWrapper>
                            <AboutPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/pricing"
                        element={
                          <PageWrapper>
                            <PricingPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/promos"
                        element={
                          <PageWrapper>
                            <PromosPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/privacy"
                        element={
                          <PageWrapper>
                            <PrivacyPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/terms"
                        element={
                          <PageWrapper>
                            <TermsPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/delivery"
                        element={
                          <PageWrapper>
                            <DeliveryPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/custom-orders"
                        element={
                          <PageWrapper>
                            <BookingPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/cart"
                        element={
                          <PageWrapper>
                            <CartPage />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          isAuthenticated ? (
                            isBanned ? (
                              <Navigate to="/restricted" replace />
                            ) : (
                              <PageWrapper>
                                <ProfilePage />
                              </PageWrapper>
                            )
                          ) : (
                            <Navigate to="/" replace />
                          )
                        }
                      />
                      <Route
                        path="/account/orders/:orderId"
                        element={
                          isAuthenticated ? (
                            isBanned ? (
                              <Navigate to="/restricted" replace />
                            ) : (
                              <PageWrapper>
                                <OrderDetailPage />
                              </PageWrapper>
                            )
                          ) : (
                            <Navigate to="/" replace />
                          )
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </motion.div>
                </AnimatePresence>
              </Layout>
            }
          />
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
      <UnbanNotification />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SiteSettingsProvider>
        <UIProvider>
          <ProductsProvider>
          <ToastProvider>
            <CartProvider>
                <AppContent />
            </CartProvider>
          </ToastProvider>
          </ProductsProvider>
        </UIProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}

export default App;
