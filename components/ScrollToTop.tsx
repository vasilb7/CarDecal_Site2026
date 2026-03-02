
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // If we have a backgroundLocation, we're likely opening a modal over the current page.
    // In this case, we don't want to scroll to the top.
    if (location.state?.backgroundLocation) return;
    
    window.scrollTo(0, 0);
  }, [location.pathname, location.state]);

  return null;
};

export default ScrollToTop;
