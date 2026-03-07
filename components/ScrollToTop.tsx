import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // 1. Skip if background location is present (modal is open)
    // This handles the transition from Home -> Product Modal
    if (location.state?.backgroundLocation) return;
    
    // 2. Skip for POP (back/forward) as browser handles it
    if (navType === 'POP') return;

    // 3. Skip for catalog paths that handle their own scroll logic
    // (Product pages and filtered catalog views)
    if (location.pathname.startsWith('/catalog')) return;

    // 4. Skip if explicitly told not to scroll (useful for closing modals)
    if (location.state?.noScroll) return;

    // Scroll to top for everything else (Home, Contact, About, etc.)
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.state, navType]);

  return null;
};

export default ScrollToTop;
