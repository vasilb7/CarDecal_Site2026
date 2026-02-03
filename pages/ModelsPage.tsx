
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useModels } from '../hooks/useModels';
import ModelCard from '../components/ModelCard';

const ModelsPage: React.FC = () => {
    const { t } = useTranslation();
    const { getAllModels } = useModels();
    const allModels = getAllModels();

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
        location: 'All',
        hairColor: 'All',
        eyeColor: 'All',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const uniqueValues = useMemo(() => {
        const categories = new Set<string>();
        const locations = new Set<string>();
        const hairColors = new Set<string>();
        const eyeColors = new Set<string>();

        allModels.forEach(model => {
            model.categories.forEach(cat => categories.add(cat));
            locations.add(model.location);
            hairColors.add(model.hairColor);
            eyeColors.add(model.eyeColor);
        });

        return {
            categories: ['All', ...Array.from(categories)],
            locations: ['All', ...Array.from(locations)],
            hairColors: ['All', ...Array.from(hairColors)],
            eyeColors: ['All', ...Array.from(eyeColors)],
        };
    }, [allModels]);

    const filteredModels = useMemo(() => {
        return allModels.filter(model => {
            const searchMatch = 
                model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (model.nameBg && model.nameBg.toLowerCase().includes(searchTerm.toLowerCase()));
                
            const categoryMatch = filters.category === 'All' || model.categories.includes(filters.category);
            const locationMatch = filters.location === 'All' || model.location === filters.location;
            const hairMatch = filters.hairColor === 'All' || model.hairColor === filters.hairColor;
            const eyeMatch = filters.eyeColor === 'All' || model.eyeColor === filters.eyeColor;
            
            return searchMatch && categoryMatch && locationMatch && hairMatch && eyeMatch;
        });
    }, [allModels, searchTerm, filters]);
    
    const FilterSelect: React.FC<{name: string, label: string, options: string[]}> = ({name, label, options}) => (
        <div className="relative group">
            <select
                name={name}
                value={filters[name as keyof typeof filters]}
                onChange={handleFilterChange}
                className="bg-transparent border-0 border-b border-white/20 text-text-primary text-xs md:text-sm uppercase tracking-widest focus:ring-0 focus:border-gold-accent block w-full px-0 py-3 transition-all duration-300 cursor-pointer hover:border-white/40"
            >
                <option value="All" className="bg-background text-text-primary">{label}</option>
                {options.slice(1).map(opt => (
                    <option key={opt} value={opt} className="bg-background text-text-primary">
                        {t(`filter_values.${opt}`, opt)}
                    </option>
                ))}
            </select>
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold-accent transition-all duration-500 group-hover:w-full opacity-0 group-hover:opacity-100" />
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-12 md:py-20">
            <h1 className="text-4xl md:text-6xl font-serif text-text-primary text-center mb-12">{t('models.title')}</h1>

            <div className="mb-16 md:mb-24 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
                    <div className="relative group md:col-span-1">
                        <input
                            type="text"
                            placeholder={t('models.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-0 border-b border-white/20 text-text-primary text-xs md:text-sm uppercase tracking-widest focus:ring-0 focus:border-gold-accent block w-full px-0 py-3 transition-all duration-300 placeholder:text-text-muted/40"
                        />
                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold-accent transition-all duration-500 group-hover:w-full opacity-0 group-hover:opacity-100" />
                    </div>
                    <FilterSelect name="category" label={t('models.all_categories')} options={uniqueValues.categories} />
                    <FilterSelect name="location" label={t('models.all_locations')} options={uniqueValues.locations} />
                    <FilterSelect name="hairColor" label={t('models.all_hair')} options={uniqueValues.hairColors} />
                    <FilterSelect name="eyeColor" label={t('models.all_eyes')} options={uniqueValues.eyeColors} />
                </div>
            </div>

            {filteredModels.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
                    {filteredModels.map(model => (
                        <ModelCard key={model.slug} model={model} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-text-muted">{t('models.no_matches')}</p>
                </div>
            )}
        </div>
    );
};

export default ModelsPage;
