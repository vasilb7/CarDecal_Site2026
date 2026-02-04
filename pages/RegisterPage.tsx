import React from 'react';
import { SignUpPage, Testimonial } from '../components/ui/sign-up';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const sampleTestimonials: Testimonial[] = [];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('name') as string;

    console.log("Attempting sign up:", email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user', // Default role
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error.message);
        alert(error.message);
      } else {
        console.log("Sign up success:", data);
        // Assuming email confirmation is disabled in Supabase, user is now logged in.
        navigate('/');
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // console.log("Google Sign Up clicked");
    alert("Google Sign Up not configured yet.");
  };

  return (
    <SignUpPage
      heroImageSrc="/Site_Pics/LogReg/Registration.jpeg"
      testimonials={sampleTestimonials}
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
    />
  );
};

export default RegisterPage;
