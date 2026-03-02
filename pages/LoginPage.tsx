import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignInPage } from '../components/ui/sign-in';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';



const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';
  
  const [loading, setLoading] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  React.useEffect(() => {
    // Check if we are in recovery mode from the URL hash or Supabase event
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      setIsUpdatingPassword(true);
      // Clean the hash for a cleaner URL but keep the session (Supabase handles it)
      // Actually we should keep it for Supabase to pick up if it hasn't yet, 
      // but usually by the time this mounts, the session is already in memory if redirect was quick
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';

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
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.setItem('remember_me', 'false');
          sessionStorage.setItem('temp_session', 'true');
        }
        const name = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '';
        showToast(t('toast.login_success', { name }), "success");
        navigate(from, { replace: true });
      }
    } catch (err) {
      showToast(t('toast.login_error_generic'), "error");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(err.message || t('toast.login_error_generic'), "error");
    }
  };

  const handleResetPassword = () => {
    navigate('/recovery');
  };

  const handleUpdatePassword = async (password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      showToast(t('toast.password_update_success', 'Паролата е обновена успешно!'), "success");
      setIsUpdatingPassword(false);
      navigate('/');
    } catch (err: any) {
      showToast(err.message || t('toast.error_generic'), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      isUpdatingPassword={isUpdatingPassword}
      onUpdatePassword={handleUpdatePassword}
      loading={loading}
    />
  );
};

export default LoginPage;
