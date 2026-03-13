import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignInPage } from '../components/ui/sign-in';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import SEO from '../components/SEO';
import { recordFailedLogin, recordSuccessfulLogin, logSecurityEvent } from '../lib/security';
import { validatePassword } from '../lib/passwordUtils';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';
  
  const [loading, setLoading] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { t } = useTranslation();
  const { showToast } = useToast();

  React.useEffect(() => {
    // Check if we are in recovery mode from the URL hash or Supabase event
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      setIsUpdatingPassword(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>, captchaToken?: string) => {
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
        options: {
          captchaToken
        }
      });

      if (error) {
        console.error("Sign in error:", error.message);
        const failResult = await recordFailedLogin(email);
        
        if (failResult.locked) {
            showToast('Твърде много неуспешни опити. Моля, опитайте по-късно.', 'error');
        } else if (error.message.includes("Invalid login credentials")) {
            showToast(t('toast.login_error_credentials', 'Невалидни данни за вход.'), "error");
        } else {
            showToast(error.message, "error");
        }
      } else {
        recordSuccessfulLogin(data?.user?.id).catch(console.error);
        
        const md = data?.user?.user_metadata || {};
        const name = md.full_name || md.name || md.first_name || (data?.user?.email?.split('@')[0]) || '';
        
        showToast(t('toast.login_success', 'Добре дошли, {{name}}!', { name: name || '!' }), 'success');

        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          logSecurityEvent('remember_me_set', data?.user?.id).catch(console.error);
        } else {
          localStorage.setItem('remember_me', 'false');
          sessionStorage.setItem('temp_session', 'true');
        }
        
        navigate(from, { replace: true });
      }
    } catch (err) {
      showToast(t('toast.login_error_generic', 'Грешка при вход.'), "error");
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
      showToast(err.message || t('toast.login_error_generic', 'Грешка при вход.'), "error");
    }
  };

  const handleResetPassword = () => {
    navigate('/recovery');
  };

  const handleUpdatePassword = async (password: string) => {
    const validation = validatePassword(password);
    if (!validation.isValid) {
      showToast('Паролата трябва да е поне 8 символа и само на латиница.', "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      showToast(t('toast.password_update_success', 'Паролата е обновена успешно!'), "success");
      setIsUpdatingPassword(false);
      navigate('/');
    } catch (err: any) {
      showToast(err.message || t('toast.error_generic', 'Възникна грешка.'), "error");
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
