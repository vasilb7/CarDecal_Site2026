import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

interface AboutSectionProps {
  title: string;
  description: string;
  imageUrl: string;
  imagePosition: "left" | "right";
  delay?: number;
}

const AboutSection: React.FC<AboutSectionProps> = ({
  title,
  description,
  imageUrl,
  imagePosition,
  delay = 0,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 w-full max-w-6xl mx-auto my-8 md:my-12 px-4 overflow-hidden">
      {/* Image Container */}
      <motion.div
        initial={{ opacity: 0, x: imagePosition === "left" ? -50 : 50, scale: 0.9 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: delay, ease: "easeOut" }}
        className={`w-full max-w-[280px] sm:max-w-[400px] md:w-1/2 aspect-square rounded-full overflow-hidden border-[4px] border-white/5 shadow-2xl relative group shrink-0 ${
          imagePosition === "right" ? "md:order-2" : "md:order-1"
        }`}
      >
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
          loading="lazy"
        />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-20 pointer-events-none" />
      </motion.div>

      {/* Text Container */}
      <motion.div
        initial={{ opacity: 0, x: imagePosition === "left" ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
        className={`w-full md:w-1/2 flex flex-col justify-center text-center md:text-left ${
          imagePosition === "right" ? "md:order-1 md:items-end md:text-right" : "md:order-2 md:items-start"
        }`}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
          {title.split(" ").map((word, i, arr) => (
            <React.Fragment key={i}>
              {i === arr.length - 1 ? (
                <span className="text-red-600">{word}</span>
              ) : (
                word + " "
              )}
            </React.Fragment>
          ))}
        </h2>
        <div className={`w-16 h-1 bg-red-600 mb-8 mx-auto ${imagePosition === "right" ? "md:mx-0 md:ml-auto" : "md:mx-0"}`} />
        <p className="text-white/70 text-base sm:text-lg font-light leading-relaxed whitespace-pre-line tracking-wide">
          {description}
        </p>
      </motion.div>
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pt-10">
      <SEO title="За Нас" />

      {/* Hero Section */}
      <section className="relative w-full pt-8 pb-10 md:pt-12 md:pb-16 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            Историята на <br className="md:hidden" />
            <span className="text-red-600">CarDecal</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base md:text-lg font-medium tracking-[0.2em] sm:tracking-[0.3em] uppercase max-w-2xl mx-auto">
            Повече от просто стикери. Ние сме страст към детайла и перфекционизъм в изработката.
          </p>
        </motion.div>
      </section>

      {/* Sections */}
      <div className="pb-16">
        <AboutSection
          title="Историята на CarDecal"
          description={"CarDecal не е просто бранд за стикери. За нас това е работа, в която сме вложили време, постоянство и много натрупан опит.\n\nОт дълго време се занимаваме със стикери и през годините сме научили едно много важно нещо – качеството не става случайно. То се изгражда с труд, внимание към всеки детайл и желание да даваш на клиента нещо, което наистина си заслужава."}
          imageUrl="https://images.unsplash.com/photo-1541443131876-44b03de101c5?q=80&w=1000&auto=format&fit=crop"
          imagePosition="left"
          delay={0.1}
        />

        <AboutSection
          title="Пътят Към Перфекционизма"
          description={"В началото не винаги беше лесно. Стремяхме се към качество, което трудно се постига, но не се отказахме. Работихме, тествахме различни варианти и постоянно търсехме как да ставаме по-добри.\n\nДнес можем уверено да кажем, че предлагаме възможно най-доброто качество на пазара. Използваме качествени материали и мастила, защото вярваме, че добрият краен резултат започва от правилния избор на основата."}
          imageUrl="https://images.unsplash.com/photo-1626017128189-e1ae6e10cbd5?q=80&w=1000&auto=format&fit=crop"
          imagePosition="right"
          delay={0.2}
        />

        <AboutSection
          title="Началото: 13.06.2022"
          description={"Фирмата ни официално стартира на 13.06.2022 г. в 11:05 ч. Това е дата, която има специално значение за нас, защото отбелязва началото на името, което градим с труд и коректност.\n\nОт този ден до днес нашата цел е една и съща – да създаваме продукти, които отговарят на очакванията на клиентите ни и дори ги надминават."}
          imageUrl="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop"
          imagePosition="left"
          delay={0.3}
        />

        <AboutSection
          title="Нашата Мисия"
          description={"Нашето първо правило е просто: клиентът да бъде доволен от това, което е поръчал. Това е в основата на всичко, което правим.\n\nЗа нас най-важни не са просто продажбите, а доверието, което печелим с времето. Подхождаме с еднакво внимание към всяка поръчка, независимо от нейния мащаб."}
          imageUrl="https://images.unsplash.com/photo-1620882669485-649ecb2dada7?q=80&w=1000&auto=format&fit=crop"
          imagePosition="right"
          delay={0.4}
        />
      </div>
    </div>
  );
};

export default AboutPage;
