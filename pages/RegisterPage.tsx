import React from 'react';
import { SignUpPage, Testimonial } from '../components/ui/sign-up';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&q=80",
    name: "Sophie Laurent",
    handle: "@sophie_fashion",
    text: "The registration process was seamless. Can't wait to start my journey with VB Models."
  }
];

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
      heroImageSrc="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80"
      testimonials={sampleTestimonials}
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
    />
  );
};

export default RegisterPage;
