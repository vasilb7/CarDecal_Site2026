import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // 1. Skip if background location is present (implies we are opening a modal)
    // or if the navigation explicitly requested no scroll
    if (location.state?.backgroundLocation || location.state?.noScroll) {
      return;
    }

    // 2. Skip for POP (back/forward) as browser handles it with scrollRestoration: manual + saved positions
    if (navType === 'POP') return;

    // 3. Special case for catalog: 
    // If it's a DIRECT hit on a product page (no background), we DO want to scroll to top
    // but the CatalogPage/ProductPage might have their own logic.
    // However, if we are going from Home -> Catalog (main), we definitely want scroll to top.
    
    // We only skip if the path is exactly a product page and we don't want it to jump.
    const isProductPage = location.pathname.startsWith('/catalog/') && location.pathname.split('/').length === 3;
    if (isProductPage) return;

    // Scroll to top for everything else (Home, Catalog Root, Contact, etc.)
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.state, navType]);

  return null;
};

export default ScrollToTop;
