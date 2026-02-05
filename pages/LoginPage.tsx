import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignInPage, Testimonial } from '../components/ui/sign-in';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

const sampleTestimonials: Testimonial[] = [];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log("Attempting sign in:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        if (error.message.includes("Invalid login credentials")) {
            showToast(t('toast.login_error_credentials'), "error");
        } else {
            showToast(error.message, "error");
        }
      } else {
        console.log("Sign in success:", data);
        const name = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '';
        showToast(t('toast.login_success', { name }), "success");
        const currentLang = i18n.language.split('-')[0];
        navigate(`/${currentLang}/`); 
      }
    } catch (err) {
      showToast(t('toast.login_error_generic'), "error");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    showToast(t('toast.google_not_configured'), "info");
  };

  const handleResetPassword = () => {
    const email = prompt(t('auth.forgot_password_prompt'));
     if (email) {
        supabase.auth.resetPasswordForEmail(email)
          .then(({ error }) => {
             if (error) showToast(error.message, "error");
             else showToast(t('toast.password_reset_sent'), "success");
          });
     }
  };

  return (
    <SignInPage
      heroImageSrc="/Site_Pics/LogReg/Login.jpg"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
    />
  );
};

export default LoginPage;
