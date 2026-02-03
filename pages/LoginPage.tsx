import React from 'react';
import { SignInPage, Testimonial } from '../components/ui/sign-in';

const sampleTestimonials: Testimonial[] = [];

const LoginPage: React.FC = () => {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Sign In clicked");
  };

  const handleGoogleSignIn = () => {
    console.log("Google Sign In clicked");
  };

  const handleResetPassword = () => {
    console.log("Reset Password clicked");
  };

  return (
    <SignInPage
      heroImageSrc="/Stock%20Photos/LogReg/Login.jpg"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
    />
  );
};

export default LoginPage;
