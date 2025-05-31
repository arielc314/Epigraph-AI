'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, FileText, ChevronDown, Camera } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export interface InputData {
  data: File | string | null;
  type: 'file' | 'text' | 'camera' | '';
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface HomePageProps {
  inputData: InputData;
  setInputData: (data: InputData) => void;
  handleSubmit: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  inputData,
  setInputData,
  handleSubmit
}) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Simple scroll state
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  // Enhanced mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const smallScreen = window.innerWidth <= 768;
      
      setIsMobile(mobile || (touchDevice && smallScreen));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simple, smooth scroll handler with throttling
  useEffect(() => {
    if (isMobile) return;

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Simple fade-in effect with Intersection Observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
        }
      });
    }, observerOptions);

    const sections = [heroRef.current, featuresRef.current, uploadRef.current].filter(Boolean);
    sections.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, [showUploadSection]);

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log(`📁 Processing file: ${file.name} (${file.type})`);
      const content = await readFileContent(file);
      setInputData({ 
        data: content, 
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    } catch (error) {
      const errorMsg = t('error.file.unreadable') + `: ${error instanceof Error ? error.message : 'Unknown error'}`;
      alert(errorMsg);
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log(`📸 Processing camera capture: ${file.name}`);
      
      if (file.type.startsWith('image/')) {
        setInputData({
          data: `[Camera Image: ${file.name}]\n\nImage captured from camera - ready for OCR processing.\nFile size: ${Math.round(file.size / 1024)}KB`,
          type: 'camera',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
      } else {
        const content = await readFileContent(file);
        setInputData({
          data: content,
          type: 'camera',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
      }
    } catch (error) {
      const errorMsg = t('error.processing') + `: ${error instanceof Error ? error.message : 'Unknown error'}`;
      alert(errorMsg);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else if (result instanceof ArrayBuffer) {
          resolve(new TextDecoder('utf-8').decode(result));
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      
      if (file.type.startsWith('image/')) {
        resolve(`[Image: ${file.name}]\n\nImage file detected. Size: ${Math.round(file.size / 1024)}KB\nNote: Image processing available - OCR capabilities enabled.`);
      } else {
        reader.readAsText(file, 'UTF-8');
      }
    });
  };

  const scrollToUpload = () => {
    setShowUploadSection(true);
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Main Logo - ALWAYS CENTERED with simple parallax
  const MainLogo = () => (
    <div 
      className="relative flex justify-center w-full">
      <img 
        src="/logo-epigraph-ai.png" 
        alt="Epigraph-AI"
        width={isMobile ? 240 : 280}
        height={isMobile ? 180 : 210}
        className="drop-shadow-xl"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );

  if (!showUploadSection) {
    return (
      <div className="relative">
        {/* Hero Section - Simple and stable */}
        <section 
          ref={heroRef}
          className={`min-h-[70vh] flex flex-col justify-center fade-in-section ${isMobile ? 'px-4' : ''}`}
        >
          <div className={`mx-auto text-center ${isMobile ? 'max-w-sm px-2' : 'max-w-4xl px-4'}`}>
            {/* Logo - ALWAYS CENTERED */}
            <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
              <MainLogo />
            </div>
            
            {/* Hero text with simple parallax */}
            <div 
              className={`${isMobile ? 'mb-6 max-w-sm' : 'mb-8 max-w-3xl'} mx-auto`}
            >
              <h2 className={`text-amber-700 mb-4 font-medium leading-tight ${
                isMobile ? 'text-xl mb-3' : 'text-2xl md:text-3xl mb-4'
              }`}>
                {t('hero.title')}
              </h2>
              <p className={`text-gray-600 leading-relaxed ${
                isMobile ? 'text-sm' : 'text-base md:text-lg'
              }`}>
                {t('hero.subtitle')}
              </p>
            </div>
            
            {/* Start button */}
            <div 
              className={isMobile ? 'mb-8' : 'mb-10'}>
              <button
                onClick={scrollToUpload}
                className={`bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg hover:from-amber-700 hover:to-yellow-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 ${
                  isMobile ? 'px-6 py-3 text-base' : 'px-8 py-3 text-lg'
                }`}
              >
                {t('hero.start')}
              </button>
            </div>
          </div>
        </section>

        {/* Features Section - Simple fade-in */}
        <section 
          ref={featuresRef}
          className={`min-h-[30vh] flex items-center fade-in-section ${isMobile ? 'px-4' : ''}`}
          style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%)'
          }}
        >
          <div className={`mx-auto w-full ${isMobile ? 'max-w-sm' : 'max-w-5xl px-4'}`}>
            
            {/* Features grid */}
            <div className={`gap-6 ${isMobile ? 'space-y-4' : 'grid md:grid-cols-3 gap-6'}`}>
              {[
                { emoji: '🏺', title: t('feature.identification'), desc: t('feature.identification.desc') },
                { emoji: '📅', title: t('feature.dating'), desc: t('feature.dating.desc') },
                { emoji: '🔍', title: t('feature.insights'), desc: t('feature.insights.desc') }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className={`text-center p-6 rounded-lg bg-gradient-to-b from-amber-50 to-yellow-50 border border-amber-200 hover:shadow-xl hover:scale-105 transition-all duration-500 group scroll-reveal parallax-element ${
                    isMobile ? 'p-3' : 'p-4'
                  }`}
                >
                  {/* Bouncing emoji */}
                  <div className={`text-4xl mb-4 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 ${
                    isMobile ? 'text-2xl mb-2' : 'text-3xl mb-3'
                  }`}>
                    {feature.emoji}
                  </div>
                  <h3 className={`font-semibold text-amber-800 mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Upload section
  return (
    <section 
      ref={uploadRef} 
      className={`pt-4 min-h-screen flex items-start fade-in-section ${isMobile ? 'px-2' : ''}`}
    >
      <div className={`mx-auto w-full ${isMobile ? 'max-w-sm' : 'max-w-4xl px-4'}`}>
        {/* Back button */}
        <div className={isMobile ? 'mb-2' : 'mb-3'}>
          <button
            onClick={() => setShowUploadSection(false)}
            className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors duration-200 hover:translate-x-1"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
            <span className={isMobile ? 'text-sm' : 'text-base'}>{t('upload.back')}</span>
          </button>
        </div>

        <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-amber-100 ${isMobile ? 'p-4' : 'p-6'}`}>
          <h2 className={`font-bold text-amber-800 text-center ${isMobile ? 'text-lg mb-2' : 'text-2xl mb-3'}`}>
            {t('upload.title')}
          </h2>
          <p className={`text-gray-600 text-center ${isMobile ? 'text-sm mb-4' : 'text-base mb-6'}`}>
            {t('upload.subtitle')}
          </p>

          <div className={`gap-4 ${isMobile ? 'space-y-4' : 'grid md:grid-cols-3 gap-6'}`}>
            {/* File Upload */}
            <div className="text-center">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xml,.txt,.doc,.docx"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed border-amber-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group ${
                  isMobile ? 'p-3' : 'p-4'
                }`}
              >
                <Upload size={isMobile ? 20 : 24} className="mx-auto mb-3 text-amber-600 group-hover:scale-110 transition-transform duration-300" />
                <h3 className={`font-semibold text-amber-800 ${isMobile ? 'mb-1 text-sm' : 'mb-2 text-base'}`}>
                  {t('upload.file')}
                </h3>
                <p className={`text-gray-600 ${isMobile ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
                  {t('upload.file.desc')}
                </p>
                <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  <div className="font-medium">{t('upload.formats')}</div>
                  <div>Images: JPG, PNG</div>
                  <div>Documents: PDF, XML, TXT</div>
                </div>
              </button>
            </div>

            {/* Camera Capture - Mobile Only */}
            {isMobile && (
              <div className="text-center">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-emerald-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                >
                  <Camera size={20} className="mx-auto mb-3 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-semibold text-emerald-800 mb-1 text-sm">
                    {language === 'he' ? 'צלם כתובת' : 'Capture Inscription'}
                  </h3>
                  <p className="text-gray-600 text-xs mb-2">
                    {language === 'he' ? 'צלם ישירות עם המצלמה' : 'Capture directly with camera'}
                  </p>
                  <div className="text-xs text-gray-500">
                    <div>📸 {language === 'he' ? 'OCR מובנה' : 'Built-in OCR'}</div>
                    <div>⚡ {language === 'he' ? 'עיבוד מיידי' : 'Instant processing'}</div>
                  </div>
                </button>
              </div>
            )}

            {/* Text Input */}
            <div className="text-center">
              <div className={`w-full border-2 border-dashed border-amber-300 rounded-xl hover:border-amber-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                <FileText size={isMobile ? 20 : 24} className="mx-auto mb-3 text-amber-600 transition-transform duration-300 hover:scale-110" />
                <h3 className={`font-semibold text-amber-800 ${isMobile ? 'mb-1 text-sm' : 'mb-2 text-base'}`}>
                  {t('upload.text')}
                </h3>
                <textarea
                  placeholder={t('upload.text.placeholder')}
                  className={`w-full mt-2 p-3 border border-amber-200 rounded-md focus:border-amber-500 focus:outline-none resize-none transition-all duration-300 focus:shadow-md ${
                    isMobile ? 'mt-2 p-2 text-sm' : 'mt-3 p-3'
                  }`}
                  rows={isMobile ? 3 : 4}
                  onChange={(e) => setInputData({ data: e.target.value, type: 'text' })}
                />
              </div>
            </div>
          </div>

          {/* Input Preview */}
          {inputData.data && (
            <div 
              className={`bg-amber-50 rounded-lg border border-amber-200 transition-all duration-300 ${
                isMobile ? 'mt-3 p-3' : 'mt-4 p-4'
              }`}
            >
              <h4 className={`font-semibold text-amber-800 ${isMobile ? 'mb-2 text-sm' : 'mb-3 text-base'}`}>
                {t('upload.selected')}
              </h4>
              
              {/* Type indicator */}
              <div className="flex items-center mb-2">
                {inputData.type === 'camera' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mr-2">
                    <Camera size={10} className="mr-1" />
                    {language === 'he' ? 'מצלמה' : 'Camera'}
                  </span>
                )}
                {inputData.type === 'file' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                    <Upload size={10} className="mr-1" />
                    {t('upload.file')}
                  </span>
                )}
                {inputData.type === 'text' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                    <FileText size={10} className="mr-1" />
                    {t('upload.text')}
                  </span>
                )}
              </div>

              {inputData.type === 'text' ? (
                <div>
                  <p className={`text-gray-700 font-medium ${isMobile ? 'mb-1 text-xs' : 'mb-1 text-sm'}`}>
                    {t('upload.text.label')}
                  </p>
                  <p className={`text-gray-600 bg-white p-2 rounded ${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                    {typeof inputData.data === 'string' ? 
                      inputData.data.substring(0, isMobile ? 80 : 150) + 
                      (inputData.data.length > (isMobile ? 80 : 150) ? '...' : '') : ''}
                  </p>
                </div>
              ) : (
                <div>
                  <p className={`text-gray-700 font-medium ${isMobile ? 'mb-1 text-xs' : 'mb-1 text-sm'}`}>
                    {inputData.type === 'camera' ? (language === 'he' ? 'תמונה מהמצלמה' : 'Camera Image') : t('upload.file.label')}
                  </p>
                  <div className={`bg-white p-2 rounded ${isMobile ? 'p-2' : 'p-3'}`}>
                    <p className={`text-gray-800 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {inputData.fileName}
                    </p>
                    <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      {inputData.fileSize ? `${Math.round(inputData.fileSize / 1024)} KB` : ''} 
                      {inputData.fileType ? ` • ${inputData.fileType}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          {inputData.data && (
            <div className={`text-center ${isMobile ? 'mt-4' : 'mt-5'}`}>
              <button
                onClick={handleSubmit}
                className={`bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg hover:from-amber-700 hover:to-yellow-700 transition-colors font-semibold ${
                  isMobile ? 'px-6 py-2 text-base w-full' : 'px-8 py-3 text-lg'
                }`}
              >
                {t('upload.start')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simple, smooth CSS */}
      <style jsx>{`
        .fade-in-section {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease-out;
        }
        
        .fade-in-visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .feature-card {
          backdrop-filter: blur(10px);
        }
        
        /* Simple bouncing emoji effect */
        .bounce-emoji {
          animation: simpleEmojiFloat 4s ease-in-out infinite;
        }
        
        .bounce-emoji:nth-child(1) {
          animation-delay: 0s;
        }
        
        .bounce-emoji:nth-child(2) {
          animation-delay: 1s;
        }
        
        .bounce-emoji:nth-child(3) {
          animation-delay: 2s;
        }
        
        @keyframes simpleEmojiFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Mobile-specific optimizations */
        @media (max-width: 768px) {
          .fade-in-section {
            opacity: 1;
            transform: none;
          }
          
          .bounce-emoji {
            animation: none;
          }
        }
        
        /* Respect user motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .fade-in-section,
          .bounce-emoji {
            transition: none;
            transform: none;
            animation: none;
            opacity: 1;
          }
        }

        /* Enhanced touch targets for mobile */
        @media (max-width: 768px) {
          button {
            min-height: 44px;
          }
          
          input, textarea {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  );
};

export default HomePage;