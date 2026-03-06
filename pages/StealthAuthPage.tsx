
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { ShieldCheck, ShieldAlert, Key } from 'lucide-react';

const StealthAuthPage: React.FC = () => {
  const { name, code } = useParams<{ name: string; code: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleStealthAuth = async () => {
      if (!name || !code) {
        setStatus('error');
        setErrorMsg('Липсва име или секретен ключ.');
        return;
      }

      try {
        // 1. Verify token directly via RPC
        const { data: profileId, error } = await supabase.rpc('verify_stealth_access', {
          p_stealth_name: name,
          p_code: code
        });

        if (error || !profileId) {
          throw new Error('Невалиден ключ или име. Проверете линка отново.');
        }

        // 2. Clear previous login state and set stealth flag
        // We use sessionStorage so it only applies to this tab/session
        sessionStorage.setItem('stealth_authorized', 'true');
        sessionStorage.setItem('stealth_name', name);

        setStatus('success');
        
        // Small delay to show success icon before redirect
        setTimeout(() => {
          navigate('/login', { 
            state: { from: '/admin', message: 'Таен достъп активиран. Моля, влезте в профила си.' } 
          });
        }, 1500);

      } catch (err: any) {
        console.error('Stealth auth error:', err);
        setStatus('error');
        setErrorMsg(err.message || 'Възникна грешка при оторизацията.');
        showToast(err.message || 'Грешка при таен достъп', 'error');
      }
    };

    handleStealthAuth();
  }, [name, code, navigate, showToast]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 border-2 ${
                status === 'verifying' ? 'bg-white/5 border-white/10' : 
                status === 'success' ? 'bg-green-500/10 border-green-500/30' : 
                'bg-red-500/10 border-red-500/30'
            }`}>
                {status === 'verifying' && <Key className="w-10 h-10 text-white animate-pulse" />}
                {status === 'success' && <ShieldCheck className="w-10 h-10 text-green-500 animate-bounce" />}
                {status === 'error' && <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />}
            </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            {status === 'verifying' && 'Валидиране на ключ...'}
            {status === 'success' && 'Ключът е приет!'}
            {status === 'error' && 'Невалиден достъп!'}
          </h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">
            {status === 'verifying' && `Система за криптиран вход : ${name?.toUpperCase()}`}
            {status === 'success' && 'Оторизацията е успешна. Изчакайте пренасочване към вход...'}
            {status === 'error' && errorMsg}
          </p>
        </div>

        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-all rounded-full shadow-2xl"
          >
            Към сайта
          </button>
        )}
      </div>
    </div>
  );
};

export default StealthAuthPage;
