import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignUpPage } from '../components/ui/sign-up';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import SEO from '../components/SEO';

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(err.message || t('toast.register_error_generic', 'Възникна грешка при регистрация. Моля, опитайте отново.'), "error");
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Регистрация" />
      <SignUpPage
        onGoogleSignUp={handleGoogleSignUp}
        loading={loading}
      />
    </>
  );
};

export default RegisterPage;
