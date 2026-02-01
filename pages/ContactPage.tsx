import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { JollyDatePicker } from "../components/ui/date-picker";
import { PinIcon, MailIcon, PhoneIcon, InstagramIcon, TwitterIcon, LinkedInIcon, GlobeIcon } from "../components/IconComponents";

const InputField: React.FC<{
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}> = ({ id, label, type = "text", placeholder, required = true }) => (
  <div className="group">
    <label htmlFor={id} className="block mb-2 text-xs uppercase tracking-widest text-text-muted group-focus-within:text-gold-accent transition-colors">
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      placeholder={placeholder}
      required={required}
      className="bg-surface/50 border border-border text-text-primary text-sm focus:ring-1 focus:ring-gold-accent focus:border-gold-accent block w-full p-4 transition-all outline-none"
    />
  </div>
);

const TextAreaField: React.FC<{
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}> = ({ id, label, placeholder, required = true }) => (
  <div className="group">
    <label htmlFor={id} className="block mb-2 text-xs uppercase tracking-widest text-text-muted group-focus-within:text-gold-accent transition-colors">
      {label}
    </label>
    <textarea
      id={id}
      name={id}
      rows={4}
      placeholder={placeholder}
      required={required}
      className="bg-surface/50 border border-border text-text-primary text-sm focus:ring-1 focus:ring-gold-accent focus:border-gold-accent block w-full p-4 transition-all outline-none resize-none"
    ></textarea>
  </div>
);

const BookingForm: React.FC = () => {
  const { t } = useTranslation();
  return (
    <form className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InputField id="name" label={t('contact.booking.full_name')} placeholder={t('contact.booking.name_placeholder')} />
        <InputField
          id="email"
          type="email"
          label={t('contact.booking.email_address')}
          placeholder={t('contact.booking.email_placeholder')}
        />
      </div>
      <InputField
        id="brand"
        label={t('contact.booking.brand')}
        placeholder={t('contact.booking.brand_placeholder')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <JollyDatePicker label={t('contact.booking.project_date')} />
        <InputField
          id="location"
          label={t('contact.booking.project_location')}
          placeholder={t('contact.booking.location_placeholder')}
        />
      </div>
      <div>
        <label htmlFor="budget" className="block mb-2 text-xs uppercase tracking-widest text-text-muted">
          {t('contact.booking.budget')}
        </label>
        <select
          id="budget"
          name="budget"
          className="bg-surface/50 border border-border text-text-primary text-sm focus:ring-1 focus:ring-gold-accent focus:border-gold-accent block w-full p-4 outline-none appearance-none"
        >
          <option className="bg-surface">{t('contact.booking.budget_select')}</option>
          <option className="bg-surface">$5,000 - $10,000</option>
          <option className="bg-surface">$10,000 - $25,000</option>
          <option className="bg-surface">$25,000 - $50,000</option>
          <option className="bg-surface">$50,000+</option>
        </select>
      </div>
      <TextAreaField
        id="message"
        label={t('contact.booking.message')}
        placeholder={t('contact.booking.message_placeholder')}
      />
      <button
        type="submit"
        className="w-full px-8 py-4 bg-gold-accent text-background text-sm font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 transform active:scale-[0.98]"
      >
        {t('contact.booking.submit')}
      </button>
    </form>
  );
};

const ApplicationForm: React.FC = () => {
  const { t } = useTranslation();
  return (
    <form className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InputField id="apply_name" label={t('contact.application.full_name')} placeholder={t('contact.application.name_placeholder')} />
        <InputField
          id="apply_email"
          type="email"
          label={t('contact.application.email_address')}
          placeholder={t('contact.application.email_placeholder')}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InputField id="age" type="number" label={t('contact.application.age')} placeholder={t('contact.application.age_placeholder')} />
        <InputField
          id="height"
          label={t('contact.application.height')}
          placeholder={t('contact.application.height_placeholder')}
        />
      </div>
      <InputField
        id="apply_location"
        label={t('contact.application.location')}
        placeholder={t('contact.application.location_placeholder')}
      />
      <InputField
        id="portfolio"
        type="url"
        label={t('contact.application.portfolio')}
        placeholder={t('contact.application.portfolio_placeholder')}
      />
      <p className="text-xs text-text-muted leading-relaxed">
        {t('contact.application.note')}
      </p>
      <button
        type="submit"
        className="w-full px-8 py-4 bg-gold-accent text-background text-sm font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 transform active:scale-[0.98]"
      >
        {t('contact.application.submit')}
      </button>
    </form>
  );
};

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("booking");

  const TabButton: React.FC<{ tabName: string; label: string }> = ({
    tabName,
    label,
  }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`w-1/2 py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === tabName ? "text-gold-accent" : "text-text-muted hover:text-text-primary"}`}
    >
      {label}
      {activeTab === tabName && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-accent" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
          style={{ backgroundImage: `url("/Stock Photos/Agency Models together/Whisk_695ee424952146ea834482a5a91fd447dr.jpeg")` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-8xl font-serif text-text-primary mb-6 animate-fade-in">
            {t('contact.title')}
          </h1>
          <p className="max-w-xl mx-auto text-text-muted text-sm md:text-base uppercase tracking-widest leading-relaxed">
            {t('contact.subtitle')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        
        {/* Visual Spread Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 h-64 md:h-80">
          <div className="overflow-hidden group">
            <img 
              src="/Stock Photos/Agency Models together/Whisk_c9e1d5a71c5586584c6474464b9a88d0dr.jpeg" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
              alt="Model group 1"
            />
          </div>
          <div className="overflow-hidden group hidden md:block">
            <img 
              src="/Stock Photos/Agency Models together/Whisk_823d9f4750d690c8c5e46c3b2014a0b8dr.jpeg" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
              alt="Model group 2"
            />
          </div>
          <div className="overflow-hidden group">
            <img 
              src="/Stock Photos/Agency Models together/Whisk_28bbaafdf0f14aaa3b24524da0015fd5dr.jpeg" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
              alt="Model group 3"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Information Column */}
          <div className="lg:col-span-5 space-y-16">
            
            {/* Direct Contact Info */}
            <section className="space-y-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gold-accent border-b border-border pb-4">
                {t('contact.info.title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8">
                <div className="flex items-start space-x-4">
                  <MailIcon className="w-5 h-5 text-gold-accent mt-0.5" />
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-text-muted mb-1">{t('contact.info.general')}</h3>
                    <p className="text-text-primary text-sm font-medium">info@vbmodels.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <PhoneIcon className="w-5 h-5 text-gold-accent mt-0.5" />
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-text-muted mb-1">{t('contact.info.booking')}</h3>
                    <p className="text-text-primary text-sm font-medium">+359 89 777 7373</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <GlobeIcon className="w-5 h-5 text-gold-accent mt-0.5" />
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-text-muted mb-1">{t('contact.info.hours')}</h3>
                    <p className="text-text-primary text-sm font-medium">{t('contact.info.work_days')}</p>
                    <p className="text-text-muted text-xs mt-1 italic">{t('contact.info.weekend')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Offices Section */}
            <section className="space-y-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gold-accent border-b border-border pb-4">
                {t('contact.offices.title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-12">
                <div className="space-y-3">
                  <h3 className="text-xl font-serif text-text-primary">{t('contact.offices.sofia.city')}</h3>
                  <div className="flex items-start space-x-3 text-text-muted">
                    <PinIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{t('contact.offices.sofia.address')}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-serif text-text-primary">{t('contact.offices.london.city')}</h3>
                  <div className="flex items-start space-x-3 text-text-muted">
                    <PinIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{t('contact.offices.london.address')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Social Connect */}
            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gold-accent border-b border-border pb-4">
                {t('contact.socials.title')}
              </h2>
              <div className="flex flex-wrap gap-8">
                <a href="#" className="flex items-center space-x-3 group transition-all">
                  <InstagramIcon className="w-5 h-5 text-text-muted group-hover:text-gold-accent" />
                  <span className="text-xs font-medium uppercase tracking-widest group-hover:text-gold-accent">{t('contact.socials.instagram')}</span>
                </a>
                <a href="#" className="flex items-center space-x-3 group transition-all">
                  <TwitterIcon className="w-5 h-5 text-text-muted group-hover:text-gold-accent" />
                  <span className="text-xs font-medium uppercase tracking-widest group-hover:text-gold-accent">{t('contact.socials.twitter')}</span>
                </a>
                <a href="#" className="flex items-center space-x-3 group transition-all">
                  <LinkedInIcon className="w-5 h-5 text-text-muted group-hover:text-gold-accent" />
                  <span className="text-xs font-medium uppercase tracking-widest group-hover:text-gold-accent text-nowrap">{t('contact.socials.linkedin')}</span>
                </a>
              </div>
            </section>

          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-surface/30 backdrop-blur-sm border border-border p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-accent/5 blur-[80px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold-accent/5 blur-[80px] rounded-full"></div>
            
            <div className="flex border-b border-border mb-12">
              <TabButton tabName="booking" label={t('contact.tabs.booking')} />
              <TabButton tabName="application" label={t('contact.tabs.application')} />
            </div>
            
            <div className="relative z-10">
              {activeTab === "booking" ? <BookingForm /> : <ApplicationForm />}
            </div>
          </div>

        </div>
      </div>


    </div>
  );
};

export default ContactPage;
