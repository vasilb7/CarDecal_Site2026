import React from 'react';
import Header from './Header';
import Footer from './Footer';
import ReportBugModal from './ReportBugModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-grow w-full">
        {children}
      </main>
      <Footer />
      <ReportBugModal />
    </div>
  );
};

export default Layout;
