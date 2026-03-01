import React, { useState } from 'react';
import { RecoveryPage } from '../components/ui/account-recovery';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

const RecoveryPageContainer: React.FC = () => {
    const { showToast } = useToast();
    const { t } = useTranslation();

    const handleRecover = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });

        if (error) {
            throw error;
        }
    };

    return (
        <RecoveryPage onRecover={handleRecover} />
    );
};

export default RecoveryPageContainer;
