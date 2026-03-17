import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';

interface SEOProps {
    title?: string;
    description?: string;
    showCartCount?: boolean;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
    
    useEffect(() => {
        const baseTitle = "CarDecal";
        const finalTitle = title ? `${baseTitle} - ${title}` : `${baseTitle} - Онлайн Каталог`;
        
        if (document.title !== finalTitle) {
            document.title = finalTitle;
        }

        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            }
        }
    }, [title, description]);

    return null;
};

export default SEO;
