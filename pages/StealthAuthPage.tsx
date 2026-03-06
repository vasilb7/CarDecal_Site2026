
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { RefreshCcw, ShieldAlert, ShieldCheck } from 'lucide-react';

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
        setErrorMsg('Липсва име или код.');
        return;
      }

      try {
        // Call the edge function
        const { data, error } = await supabase.functions.invoke('stealth-auth', {
          body: { name, code }
        });

        if (error || !data.success) {
          throw new Error(error?.message || data?.error || 'Невалиден код или име.');
        }

        // The edge function returns a magic link.
        // We could redirect to it, or if it was a session, we'd set it.
        // Actually, since we want immediate login, we follows the action_link.
        // The action_link contains the hashed token that Supabase uses to log in.
        
        if (data.action_link) {
          window.location.href = data.action_link;
        } else {
            throw new Error('Не беше генериран линк за достъп.');
        }

        setStatus('success');
      } catch (err: any) {
        console.error('Stealth auth error:', err);
        setStatus('error');
        setErrorMsg(err.message || 'Възникна грешка при оторизацията.');
        showToast(err.message || 'Грешка при таен вход', 'error');
      }
    };

    handleStealthAuth();
  }, [name, code, navigate, showToast]);

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            {status === 'verifying' && <RefreshCcw className="w-10 h-10 text-red-500 animate-spin" />}
            {status === 'success' && <ShieldCheck className="w-10 h-10 text-green-500" />}
            {status === 'error' && <ShieldAlert className="w-10 h-10 text-red-600" />}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">
            {status === 'verifying' && 'Проверка на таен достъп...'}
            {status === 'success' && 'Достъпът е потвърден!'}
            {status === 'error' && 'Неуспешна проверка!'}
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
            {status === 'verifying' && `Валидиране на ключ за ${name?.toUpperCase()}`}
            {status === 'success' && 'Пренасочване към административен панел...'}
            {status === 'error' && errorMsg}
          </p>
        </div>

        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-white/90 transition-all rounded-full"
          >
            Връщане към начало
          </button>
        )}
      </div>
    </div>
  );
};

export default StealthAuthPage;
