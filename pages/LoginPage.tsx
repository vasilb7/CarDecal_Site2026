import React from 'react';
import { SignInPage, Testimonial } from '../components/ui/sign-in';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&q=80",
    name: "Elena Rossi",
    handle: "@elenadigital",
    text: "Being part of the VB Models roster has been a transformative experience for my career."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&q=80",
    name: "Marco Silva",
    handle: "@marcomodel",
    text: "The most professional agency I've worked with. The platform is truly state-of-the-art."
  }
];

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
      heroImageSrc="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
    />
  );
};

export default LoginPage;
