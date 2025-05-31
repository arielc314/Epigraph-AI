'use client';

import React from 'react';
import { useLanguage } from './LanguageContext';

const AboutPage: React.FC<{ setCurrentPage?: (page: string) => void }> = ({ setCurrentPage }) => {
  const { language, t } = useLanguage();

  // Developer data with language-aware display
  const developers = [
    {
      name: "רחל מירקין",
      nameEn: "Rachel Mirkin",
      study: {
        he: "סטודנטית תואר ראשון - מדעי המחשב וארכיאולוגיה",
        en: "B.Sc Student - CS & Archaeology"
      },
      email: "rachel.mirkin@mail.huji.ac.il",
      icon: "🏺"
    },
    {
      name: "אריאל כהן",
      nameEn: "Ariel Cohen", 
      study: {
        he: "סטודנט תואר ראשון - מדעי המחשב ופילוסופיה",
        en: "B.Sc Student - CS & Philosophy"
      },
      email: "arielcohen314@gmail.com",
      icon: "🤔"
    },
    {
      name: "אור ישראלי",
      nameEn: "Or Israeli",
      study: {
        he: "סטודנט תואר ראשון - מדעי המחשב מורחב",
        en: "B.Sc Student - CS Extended"
      },
      email: "OR.P.ISRAELI@GMAIL.COM",
      icon: "💻"
    },
    {
      name: "תאודורה פלורסקו",
      nameEn: "Teodora Florescu",
      study: {
        he: "סטודנטית תואר ראשון - מדעי המחשב מורחב",
        en: "B.Sc Student - CS Extended"
      },
      email: "teodora.florescu12@gmail.com",
      icon: "🌟"
    },
    {
      name: "איתי מונטנר",
      nameEn: "Itai Muntner",
      study: {
        he: "סטודנט תואר ראשון - מדעי המחשב מורחב",
        en: "B.Sc Student - CS Extended"
      },
      email: "itai.muntner@mail.huji.ac.il",
      icon: "⚡"
    }
  ];

  // Technology stack
  const technologies = [
    { name: "Next.js", icon: "⚛️" },
    { name: "TypeScript", icon: "📘" },
    { name: "Python", icon: "🐍" },
    { name: "Flask", icon: "🌶️" },
    { name: "Google Gemini AI", icon: "🧠" },
    { name: "Tailwind CSS", icon: "🎨" }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main About Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-amber-800 mb-4 text-center">
          {t('about.title')}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {t('about.description')}
        </p>
        
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 mb-6">
          <div className="flex items-center mb-3">
            <span className="text-2xl ml-3">🎓</span>
            <h3 className="text-lg font-semibold text-amber-800">
              {t('about.hackathon')}
            </h3>
          </div>
          <p className="text-gray-700">
            {t('about.hackathon.desc')}
          </p>
        </div>
      </div>

      {/* Developers Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-amber-800 mb-6 text-center">
          {t('about.team')}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {developers.map((dev, index) => (
            <div 
              key={index}
              className="border-2 border-dashed border-amber-300 rounded-lg p-4 hover:border-amber-500 hover:bg-amber-50 transition-all duration-200"
            >
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <span className="text-2xl">{dev.icon}</span>
                </div>
                
                {/* Language-aware name display */}
                {language === 'he' ? (
                  <>
                    <h4 className="font-semibold text-amber-800 mb-1">
                      {dev.name}
                    </h4>
                    <p className="text-gray-500 text-sm mb-3">
                      {dev.nameEn}
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold text-amber-800 mb-1">
                      {dev.nameEn}
                    </h4>
                    {/* No Hebrew name in English version */}
                  </>
                )}
                
                <div className="bg-amber-50 rounded-md p-3 mb-3 border border-amber-200">
                  <p className="text-sm text-gray-700">
                    {dev.study[language]}
                  </p>
                </div>
                
                <a 
                  href={`mailto:${dev.email}`}
                  className="inline-flex items-center text-amber-600 hover:text-amber-700 transition-colors duration-200 text-sm"
                >
                  <span className="ml-2">📧</span>
                  {dev.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-amber-800 mb-6 text-center">
          <span className="ml-3">🛠️</span>
          {t('about.technologies')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {technologies.map((tech, index) => (
            <div 
              key={index}
              className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200 hover:bg-amber-100 transition-colors duration-200"
            >
              <span className="text-lg block mb-1">{tech.icon}</span>
              <span className="text-gray-700 text-sm font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setCurrentPage?.('home')}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg hover:from-amber-700 hover:to-yellow-700 transform hover:scale-105 transition-all duration-200 font-semibold"
          >
            {t('about.back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;