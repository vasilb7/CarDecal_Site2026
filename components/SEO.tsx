import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';

interface SEOProps {
    title?: string;
    description?: string;
    showCartCount?: boolean;
}

const SEO: React.FC<SEOProps> = ({ title, description, showCartCount = true }) => {
    const { itemsCount } = useCart();
    
    useEffect(() => {
        const baseTitle = "CarDecal";
        const savedTitle = document.title;
        
        const cartSuffix = (showCartCount && itemsCount > 0) ? ` (${itemsCount})` : "";
        const finalTitle = (title ? `${baseTitle} - ${title}` : `${baseTitle} - Онлайн Каталог`) + cartSuffix;
        
        document.title = finalTitle;

        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            }
        }

        return () => {
            // Only restore if we are unmounting or if title/description changed significantly
            // In React 18, effect cleanup runs before next effect runs
            document.title = savedTitle;
        };
    }, [title, description, itemsCount, showCartCount]);

    return null;
};

export default SEO;
