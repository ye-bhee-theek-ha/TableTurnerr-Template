"use client";

import React, { useState } from 'react'
import { AnimatedMenuButton } from './Menu_Header_btn'
import { AnimatedCTAButton_LoggedIn, AnimatedCTAButton_LoggedOut } from './CTA_header_btn'
import useAuth from '../hooks/useAuth';
import AuthModal from './Auth/AuthForm';

interface HeaderProps {
  handleOrderNowClick: () => void;
}

function Header(
  { handleOrderNowClick }: HeaderProps
) {

  const { isAuthenticated, authLoading } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  
  const handleSignInClick = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };


  return (
    <div className="p-[20px] w-full">
      
      <div className="w-full grid grid-cols-2 md:grid-cols-3 items-center">
      
        {/* Left Section */}
        <div className="flex justify-start">
          <AnimatedMenuButton
            menuItems={[
              { name: "Home", href: "/" },
              { name: "About", href: "/about" },
              { name: "Services", href: "/services" },
              { name: "Contact", href: "/contact" }
            ]}
          />
        </div>

        {/* Center Section (Always Centered) */}
        <div className="justify-center hidden md:flex">
          <div className="h-[50px] w-[50px] bg-grey text-white">
              {isAuthenticated ? "User Avatar" : "Logo"}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex justify-end flex-row">
          {  
            isAuthenticated ? 
              <AnimatedCTAButton_LoggedIn cart_alerts={3} handelOrderNowClick={handleOrderNowClick}/>
               : 
              <AnimatedCTAButton_LoggedOut onSignInClick={handleSignInClick} handelOrderNowClick={handleOrderNowClick}/>
          }
          {isAuthModalOpen && <AuthModal 
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode='login'
            key={isAuthModalOpen ? 'login' : 'signup'}
          />}
        </div>
      </div>
    </div>
  )
}

export default Header



