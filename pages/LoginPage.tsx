import React from 'react';
import { SignInPage, Testimonial } from '../components/ui/sign-in';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const sampleTestimonials: Testimonial[] = [];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log("Attempting sign in:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        alert(error.message); // Simple alert for now, can be improved UI-wise
      } else {
        console.log("Sign in success:", data);
        navigate('/'); // Redirect to home or profile
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // console.log("Google Sign In clicked");
    // Implement Google Auth later if configured in Supabase
    alert("Google Sign In not configured yet.");
  };

  const handleResetPassword = () => {
    console.log("Reset Password clicked");
    // Implement password reset logic
    const email = prompt("Enter your email to reset password:");
    if (email) {
       supabase.auth.resetPasswordForEmail(email)
         .then(({ error }) => {
            if (error) alert(error.message);
            else alert("Password reset email sent!");
         });
    }
  };

  return (
    <SignInPage
      heroImageSrc="/Site_Pics/LogReg/Login.jpg"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
    />
  );
};

export default LoginPage;
