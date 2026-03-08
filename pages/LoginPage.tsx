import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignInPage } from '../components/ui/sign-in';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import SEO from '../components/SEO';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleGoogleSignIn = async () => {
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
      showToast(err.message || t('toast.login_error_generic', 'Грешка при вход. Моля, опитайте отново.'), "error");
      setLoading(false);
    }
  };

  const stealthMessage = (location.state as any)?.message || (sessionStorage.getItem('stealth_authorized') ? 'Таен достъп активен. Моля, влезте в профила си чрез Google.' : null);

  return (
    <>
      <SEO title="Вход" />
      <SignInPage
        onGoogleSignIn={handleGoogleSignIn}
        loading={loading}
        stealthMessage={stealthMessage}
      />
    </>
  );
};

export default LoginPage;
