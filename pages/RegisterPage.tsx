import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignUpPage } from '../components/ui/sign-up';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { hasProfanity } from '../lib/profanity';
import { useToast } from '../hooks/useToast';
import { validatePassword, translateAuthError } from '../lib/passwordUtils';
import { isValidBulgarianPhone } from '../lib/utils';
import SEO from '../components/SEO';


const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';
  
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
    const phone = formData.get('phone') as string;

    if (fullName.trim().split(' ').length < 2) {
        showToast(t('toast.register_full_name_required', 'Моля, въведете две имена!'), "warning");
        setLoading(false);
        return;
    }

    if (!isValidBulgarianPhone(phone)) {
        showToast(t('toast.register_phone_required', 'Моля, въведете валиден телефонен номер!'), "warning");
        setLoading(false);
        return;
    }

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
      // Frontend password validation
      const pwdValidation = validatePassword(password);
      if (!pwdValidation.isValid) {
          showToast('Паролата не отговаря на изискванията. Минимум 10 символа с главна буква, малка буква, цифра и специален символ.', 'error');
          setLoading(false);
          return;
      }

      // Confirm password check
      const confirmPassword = formData.get('confirmPassword') as string;
      if (password !== confirmPassword) {
          showToast('Паролите не съвпадат.', 'error');
          setLoading(false);
          return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: 'user', 
          },
        },
      });

      if (error) {
        showToast(translateAuthError(error), 'error');
      } else {
        showToast(t('toast.register_success'), 'success');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      showToast(translateAuthError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(err.message || t('toast.register_error_generic'), "error");
    }
  };

  return (
    <>
      <SEO title="Регистрация" />
      <SignUpPage
        onSignUp={handleSignUp}
        onGoogleSignUp={handleGoogleSignUp}
        loading={loading}
      />
    </>
  );
};

export default RegisterPage;
