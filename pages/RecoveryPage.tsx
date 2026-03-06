import React, { useState } from "react";
import { RecoveryPage } from "../components/ui/account-recovery";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/useToast";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";

const RecoveryPageContainer: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleRecover = async (email: string) => {
    // Първо проверяваме дали имейлът съществува в базата данни
    const { data: emailExists, error: checkError } = await supabase.rpc(
      "check_email_exists",
      {
        lookup_email: email,
      },
    );

    if (checkError) {
      console.error("Грешка при проверка на имейл:", checkError);
      throw new Error("Възникна грешка при проверка на имейла.");
    }

    if (!emailExists) {
      throw new Error("Няма регистриран профил с този имейл адрес.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      throw error;
    }
  };

  return (
    <>
      <SEO title="Възстановяване на профил" />
      <RecoveryPage onRecover={handleRecover} />
    </>
  );
};

export default RecoveryPageContainer;
