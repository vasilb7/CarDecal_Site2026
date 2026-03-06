
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // 1. Skip if we're opening a modal over the current page
    if (location.state?.backgroundLocation) return;
    
    // 2. Skip if it's a back/forward navigation (POP) - let the browser handle it or respect current position
    // Also skip if we are on a catalog-style route where we handle scroll manually
    if (navType === 'POP') return;
    if (location.pathname.startsWith('/catalog')) return;
    
    window.scrollTo(0, 0);
  }, [location.pathname, location.state, navType]);

  return null;
};

export default ScrollToTop;
