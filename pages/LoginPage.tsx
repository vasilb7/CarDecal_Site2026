import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignInPage } from '../components/ui/sign-in';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import SEO from '../components/SEO';
import { recordFailedLogin, recordSuccessfulLogin, logSecurityEvent } from '../lib/security';



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



    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        // Record failed login for rate limiting and security logs
        const failResult = await recordFailedLogin(email);
        
        if (failResult.locked) {
            showToast('Твърде много неуспешни опити. Моля, опитайте по-късно.', 'error');
        } else if (error.message.includes("Invalid login credentials")) {
            showToast(t('toast.login_error_credentials'), "error");
        } else {
            showToast(error.message, "error");
        }
      } else {
        // Record successful login + detect suspicious activity
        const loginResult = await recordSuccessfulLogin(data?.user?.id);
        
        // Extract a friendly name
        const md = data?.user?.user_metadata || {};
        const name = md.full_name || md.name || md.first_name || (data?.user?.email?.split('@')[0]) || '';
        showToast(name ? `Добре дошли, ${name}!` : 'Добре дошли!', 'success');

        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          // Log remember-me choice
          logSecurityEvent('remember_me_set', data?.user?.id);
        } else {
          localStorage.setItem('remember_me', 'false');
          sessionStorage.setItem('temp_session', 'true');
        }
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

  const stealthMessage = (location.state as any)?.message || (sessionStorage.getItem('stealth_authorized') ? 'Таен достъп активен. Моля, влезте в профила си.' : null);

  return (
    <>
      <SEO title="Вход" />
      <SignInPage
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        isUpdatingPassword={isUpdatingPassword}
        onUpdatePassword={handleUpdatePassword}
        loading={loading}
        stealthMessage={stealthMessage}
      />
    </>
  );
};

export default LoginPage;
