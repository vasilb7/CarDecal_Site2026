import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false, hideHeader = false }) => {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {!hideHeader && <Header />}
      <main className="flex-grow w-full">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
