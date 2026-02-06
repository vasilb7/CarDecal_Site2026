import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useModels } from "../hooks/useModels";
import ModelCard from "../components/ModelCard";

const ModelsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.split("-")[0];
  const { category: urlCategory } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { getAllModels } = useModels();
  const allModels = getAllModels();

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "All",
    location: "All",
    hairColor: "All",
    eyeColor: "All",
  });

  const categories = useMemo(
    () => [
      {
        id: "top",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 md:w-12 md:h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        ),
        img: "/Site_Pics/Top_models/Top_Models_Cover.png",
        shadow: "group-hover:shadow-[0_0_30px_rgba(201,162,39,0.3)]",
      },
      {
        id: "new",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 md:w-12 md:h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
            />
          </svg>
        ),
        img: "/Site_Pics/New_Faces/101.png",
        shadow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
      },
      {
        id: "trending",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 md:w-12 md:h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
            />
          </svg>
        ),
        img: "/Site_Pics/Trending/Trend.jpeg",
        shadow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
      },
      {
        id: "visiting",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 md:w-12 md:h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        ),
        img: "/Site_Pics/Visiting_models/P.jpeg",
        shadow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
      },
      {
        id: "young",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 md:w-12 md:h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455L18 2.25l.259 1.036a3.375 3.375 0 002.455 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        ),
        img: "/Site_Pics/Young_Talents/Model.png",
        shadow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
      },
      {
        id: "all",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 md:w-12 md:h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        ),
        img: "/Site_Pics/All_models/Models_Cover.png",
        shadow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
      },
    ],
    [],
  );

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === urlCategory),
    [urlCategory, categories],
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const uniqueValues = useMemo(() => {
    const categoriesSet = new Set<string>();
    const locations = new Set<string>();
    const hairColors = new Set<string>();
    const eyeColors = new Set<string>();

    allModels.forEach((model) => {
      model.categories.forEach((cat) => categoriesSet.add(cat));
      locations.add(model.location);
      hairColors.add(model.hairColor);
      eyeColors.add(model.eyeColor);
    });

    return {
      categories: ["All", ...Array.from(categoriesSet)],
      locations: ["All", ...Array.from(locations)],
      hairColors: ["All", ...Array.from(hairColors)],
      eyeColors: ["All", ...Array.from(eyeColors)],
    };
  }, [allModels]);
  const filteredModels = useMemo(() => {
    return allModels.filter((model) => {
      const query = searchTerm.toLowerCase().trim();
      const searchMatch =
        !query ||
        model.name.toLowerCase().includes(query) ||
        (model.nameBg && model.nameBg.toLowerCase().includes(query));
      let quickMatch = true;
      if (urlCategory === "top") quickMatch = model.isTopModel || false;
      if (urlCategory === "new")
        quickMatch =
          model.categories.includes("New Faces") ||
          model.slug === "alexandra-white";
      if (urlCategory === "trending")
        quickMatch = model.categories.includes("Trending");
      if (urlCategory === "visiting")
        quickMatch =
          model.categories.includes("Visiting") || model.slug === "paula-young";
      if (urlCategory === "young")
        quickMatch = model.categories.includes("Young Talents");

      const categoryMatch =
        filters.category === "All" ||
        model.categories.includes(filters.category);
      const locationMatch =
        filters.location === "All" || model.location === filters.location;
      const hairMatch =
        filters.hairColor === "All" || model.hairColor === filters.hairColor;
      const eyeMatch =
        filters.eyeColor === "All" || model.eyeColor === filters.eyeColor;

      return (
        searchMatch &&
        categoryMatch &&
        locationMatch &&
        hairMatch &&
        eyeMatch &&
        quickMatch
      );
    });
  }, [allModels, searchTerm, filters, urlCategory]);

  const FilterSelect: React.FC<{
    name: string;
    label: string;
    options: string[];
  }> = ({ name, label, options }) => {
    const translationKeyMap: { [key: string]: string } = {
      category: "categories",
      location: "locations",
      hairColor: "hair",
      eyeColor: "eyes",
    };
    const attrKey = translationKeyMap[name] || name;

    return (
      <div className="relative group">
        <select
          name={name}
          value={filters[name as keyof typeof filters]}
          onChange={handleFilterChange}
          className="bg-transparent border-0 border-b border-white/20 text-text-primary text-xs md:text-sm uppercase tracking-widest focus:ring-0 focus:border-gold-accent block w-full px-0 py-3 transition-all duration-300 cursor-pointer hover:border-white/40"
        >
          <option value="All" className="bg-background text-text-primary">
            {label}
          </option>
          {options.slice(1).map((opt) => (
            <option
              key={opt}
              value={opt}
              className="bg-background text-text-primary"
            >
              {t(`attributes.${attrKey}.${opt}`, opt)}
            </option>
          ))}
        </select>
        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold-accent transition-all duration-500 group-hover:w-full opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {!urlCategory ? (
        /* Choice Phase */
        <div className="container mx-auto px-4 py-16 md:py-24">
          <h1 className="text-4xl md:text-7xl font-serif text-white text-center mb-4 tracking-tight uppercase drop-shadow-lg">
            {t("models.choice_title")}
          </h1>
          <p className="text-center text-text-muted mb-16 md:mb-24 uppercase tracking-[0.5em] text-[10px] md:text-xs font-semibold">
            {t("models.choice_subtitle")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 max-w-7xl mx-auto">
            {categories.map((mod) => (
              <Link
                key={mod.id}
                to={`/${currentLang}/models/category/${mod.id}`}
                className={`group relative h-72 md:h-[500px] bg-surface border border-white/10 rounded-sm overflow-hidden transition-all duration-1000 flex flex-col items-center justify-center ${mod.shadow}`}
              >
                <div className="absolute inset-0 z-0 scale-105 group-hover:scale-110 transition-transform duration-1000">
                  <img
                    src={mod.img}
                    alt={mod.id}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-1000 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
                </div>

                <div className="relative z-10 flex flex-col items-center p-8 text-center">
                  <div className="text-white group-hover:text-gold-accent transition-all duration-700 mb-8 transform group-hover:scale-110 drop-shadow-2xl">
                    {mod.icon}
                  </div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold uppercase tracking-[0.3em] text-white group-hover:text-gold-accent transition-colors duration-500">
                    {t(`models.welcome_modules.${mod.id}`)}
                  </h2>

                  {i18n.exists(`models.welcome_modules.${mod.id}_desc`) && (
                    <p className="mt-4 text-xs md:text-sm text-white/70 tracking-wide max-w-[85%] leading-relaxed group-hover:text-white transition-all duration-700 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-normal italic">
                      {t(`models.welcome_modules.${mod.id}_desc`)}
                    </p>
                  )}

                  <div className="mt-10 opacity-0 group-hover:opacity-100 transition-all duration-1000 transform translate-y-10 group-hover:translate-y-0">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-[1px] bg-gold-accent" />
                      <span className="text-[10px] md:text-xs text-white uppercase tracking-[0.4em] font-black">
                        {t("models.enter_catalog")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 border border-white/0 group-hover:border-gold-accent/40 transition-all duration-1000 z-20" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* Category Display Phase */
        <>
          {/* Category Hero / Header */}
          <div className="relative h-[40vh] md:h-[50vh] overflow-hidden border-b border-white/5">
            <img
              src={activeCategory?.img}
              alt="Category Banner"
              className="w-full h-full object-cover opacity-30 grayscale blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <Link
                to={`/${currentLang}/models`}
                className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-text-muted hover:text-white transition-all transform hover:-translate-x-2"
              >
                <span className="text-lg">←</span>{" "}
                {t("models.welcome_modules.all")}
              </Link>
              <h1 className="text-4xl md:text-7xl font-serif text-white uppercase tracking-[0.2em] mb-4">
                {t(`models.welcome_modules.${urlCategory}`)}
              </h1>
              {i18n.exists(`models.welcome_modules.${urlCategory}_desc`) && (
                <p className="text-white/80 tracking-wide text-xs md:text-base max-w-2xl mb-12 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] italic font-normal">
                  {t(`models.welcome_modules.${urlCategory}_desc`)}
                </p>
              )}
              <div className="w-24 h-[1px] bg-gold-accent opacity-50" />
            </div>
          </div>

          <div className="container mx-auto px-4 mt-[-40px] relative z-10">
            <div className="bg-surface/90 backdrop-blur-xl border border-white/10 p-4 md:p-8 rounded-sm shadow-2xl mb-12">
              <div className="flex flex-col gap-6">
                <div className="relative group w-full">
                  <input
                    type="text"
                    placeholder={t("models.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-0 border-b border-white/10 text-text-primary text-xs md:text-sm uppercase tracking-[0.2em] focus:ring-0 focus:border-gold-accent block w-full px-0 py-4 transition-all duration-300 placeholder:text-text-muted/40"
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold-accent transition-all duration-500 group-hover:w-full opacity-0 group-hover:opacity-100" />
                </div>

                <div className="flex overflow-x-auto no-scrollbar pb-2 md:grid md:grid-cols-4 gap-6">
                  <div className="min-w-[140px] md:min-w-0 flex-shrink-0">
                    <FilterSelect
                      name="category"
                      label={t("models.all_categories")}
                      options={uniqueValues.categories}
                    />
                  </div>
                  <div className="min-w-[140px] md:min-w-0 flex-shrink-0">
                    <FilterSelect
                      name="location"
                      label={t("models.all_locations")}
                      options={uniqueValues.locations}
                    />
                  </div>
                  <div className="min-w-[140px] md:min-w-0 flex-shrink-0">
                    <FilterSelect
                      name="hairColor"
                      label={t("models.all_hair")}
                      options={uniqueValues.hairColors}
                    />
                  </div>
                  <div className="min-w-[140px] md:min-w-0 flex-shrink-0">
                    <FilterSelect
                      name="eyeColor"
                      label={t("models.all_eyes")}
                      options={uniqueValues.eyeColors}
                    />
                  </div>
                </div>
              </div>
            </div>

            {filteredModels.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
                {filteredModels.map((model) => (
                  <ModelCard key={model.slug} model={model} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-surface/30 border border-dashed border-white/5">
                <p className="text-text-muted uppercase tracking-[0.2em] text-sm">
                  {t("models.no_matches")}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelsPage;
