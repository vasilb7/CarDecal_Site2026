import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
    isMobileNavOpen: boolean;
    setIsMobileNavOpen: (open: boolean) => void;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <UIContext.Provider value={{ isMobileNavOpen, setIsMobileNavOpen, isCartOpen, setIsCartOpen }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
