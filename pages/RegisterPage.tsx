import React from 'react';
import { SignUpPage, Testimonial } from '../components/ui/sign-up';

const sampleTestimonials: Testimonial[] = [];

const RegisterPage: React.FC = () => {
  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Sign Up clicked");
  };

  const handleGoogleSignUp = () => {
    console.log("Google Sign Up clicked");
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
