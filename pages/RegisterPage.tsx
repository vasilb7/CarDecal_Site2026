import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignUpPage, Testimonial } from '../components/ui/sign-up';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { hasProfanity } from '../lib/profanity';
import { useToast } from '../hooks/useToast';

const sampleTestimonials: Testimonial[] = [];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('name') as string;

    if (fullName.length < 4) {
        showToast(t('toast.register_short_name'), "warning");
        setLoading(false);
        return;
    }

    if (hasProfanity(fullName)) {
        showToast(t('toast.register_profanity'), "error");
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user', 
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error.message);
        if (error.message.includes("User already registered")) {
            showToast(t('toast.register_error_exists'), "error");
        } else {
            showToast(error.message, "error");
        }
      } else {
        showToast(t('toast.register_success'), "success");
        const currentLang = i18n.language.split('-')[0];
        navigate(`/${currentLang}/`);
      }
    } catch (err) {
      showToast(t('toast.register_error_generic'), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    showToast(t('auth.google_signup_unavailable'), "info");
  };

  return (
    <SignUpPage
      heroImageSrc="/Site_Pics/LogReg/Registration.jpeg"
      testimonials={sampleTestimonials}
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
    />
  );
};

export default RegisterPage;
