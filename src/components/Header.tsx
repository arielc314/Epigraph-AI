// Fixed Header.tsx - menu properly positioned for both languages

'use client';

import React from 'react';
import { Menu, X, Home, Info, Globe } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  isMenuOpen,
  setIsMenuOpen,
  currentPage,
  setCurrentPage,
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  // Navigation items with translations
  const navItems = [
    { id: 'home', name: t('nav.home'), icon: Home },
    { id: 'about', name: t('nav.about'), icon: Info }
  ];

  // Header Logo
  const HeaderLogo = () => (
    <svg 
      width="48" 
      height="32" 
      viewBox="0 0 60 40"
      className="drop-shadow-sm group-hover:scale-110 transition-transform duration-200"
    >
      <defs>
        <linearGradient id="headerTabletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4d03f"/>
          <stop offset="100%" stopColor="#d4af37"/>
        </linearGradient>
      </defs>
      
      {/* Left tablet */}
      <path 
        d="M5 8 Q5 5 8 5 L22 5 Q25 5 25 8 L25 25 Q25 28 22 30 L18 32 Q15 35 12 35 L8 35 Q5 35 5 32 Z" 
        fill="url(#headerTabletGrad)" 
        stroke="rgba(255,255,255,0.4)" 
        strokeWidth="1"
        clipPath="polygon(0 0, 100% 0, 85% 80%, 60% 100%, 0 90%)"
      />
      
      {/* Right tablet */}
      <path 
        d="M32 6 Q35 4 38 4 L52 4 Q55 4 55 7 L55 28 Q55 31 52 33 L48 35 Q45 35 42 35 L38 35 Q32 35 32 30 Z" 
        fill="url(#headerTabletGrad)" 
        stroke="rgba(255,255,255,0.4)" 
        strokeWidth="1"
        clipPath="polygon(15% 0, 100% 0, 100% 85%, 80% 100%, 0 80%, 10% 25%)"
      />
      
      {/* Cuneiform marks */}
      <g fill="rgba(120,53,15,0.8)" stroke="none">
        {/* Left tablet marks */}
        <rect x="9" y="10" width="8" height="1" rx="0.5"/>
        <rect x="9" y="13" width="6" height="1" rx="0.5"/>
        <rect x="17" y="12" width="1" height="4" rx="0.5"/>
        <rect x="9" y="17" width="10" height="1" rx="0.5"/>
        <rect x="9" y="21" width="6" height="1" rx="0.5"/>
        <rect x="9" y="25" width="8" height="1" rx="0.5"/>
        
        {/* Right tablet marks */}
        <rect x="36" y="9" width="8" height="1" rx="0.5"/>
        <rect x="36" y="12" width="6" height="1" rx="0.5"/>
        <rect x="44" y="11" width="1" height="4" rx="0.5"/>
        <rect x="36" y="16" width="10" height="1" rx="0.5"/>
        <rect x="36" y="20" width="6" height="1" rx="0.5"/>
        <rect x="36" y="24" width="8" height="1" rx="0.5"/>
      </g>
      
      {/* Crack between tablets */}
      <path 
        d="M28 10 Q29 15 28.5 20 Q28 25 29 30" 
        stroke="rgba(255,255,255,0.3)" 
        strokeWidth="0.5" 
        fill="none"
      />
    </svg>
  );

  const handleLogoClick = () => {
    setCurrentPage('home');
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title - Aligned based on language direction */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-3 hover:bg-amber-500 rounded-lg p-2 transition-all duration-200 group"
          >
            <div className="group-hover:scale-110 transition-transform duration-200">
              <HeaderLogo />
            </div>
            {/* Text alignment fixed based on language */}
            <div className={`${language === 'he' ? 'text-right' : 'text-left'}`}>
              <h1 className="text-xl font-bold tracking-wide">{t('app.title')}</h1>
              <p className="text-xs text-yellow-200 opacity-80">{t('app.subtitle')}</p>
            </div>
          </button>

          {/* Right side with better spaced Language Toggle and Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-md transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              title={language === 'he' ? 'Switch to English' : 'עבור לעברית'}
            >
              <Globe size={16} className="text-white" />
              <span className="text-white font-semibold">
                {language === 'he' ? 'EN' : 'עב'}
              </span>
            </button>

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-amber-700 transition-colors relative z-10"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Fixed Dropdown Menu - ALWAYS within screen bounds */}
              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-20 z-20"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  
                  {/* Dropdown - Smart positioning to prevent overflow */}
                  <div className="absolute top-full mt-2 w-40 bg-white rounded-lg shadow-xl border border-amber-200 z-30 overflow-hidden right-0">
                    {/* Always position from right edge to prevent overflow in both languages */}
                    <div className="py-2">
                      {navItems.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentPage(item.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-3 transition-colors ${
                            language === 'he' ? 'text-right space-x-reverse space-x-3' : 'text-left space-x-3'
                          } ${
                            currentPage === item.id
                              ? `bg-amber-50 text-amber-800 ${language === 'he' ? 'border-r-4' : 'border-l-4'} border-amber-600`
                              : 'text-gray-700 hover:bg-amber-50 hover:text-amber-800'
                          }`}
                        >
                          <item.icon size={18} className="flex-shrink-0" />
                          <span className="font-medium">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;