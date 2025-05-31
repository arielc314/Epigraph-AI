'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Image, Upload, Copy, Download, Share2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export interface ResultsData {
  summary: string;
  language?: string;
  tabs: Array<{
    name: string;
    content: string;
  }>;
  preprocessing?: {
    status: string;
    preview: string;
    language: string;
  };
}

interface ResultsPageProps {
  results: ResultsData;
  resetToHome: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({
  results,
  resetToHome
}) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<string>('');

  // Enhanced scroll behavior for results sections
  useEffect(() => {
    const sections = document.querySelectorAll('.results-section');
    
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '-50px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          entry.target.classList.remove('section-hidden');
        } else {
          entry.target.classList.add('section-hidden');
          entry.target.classList.remove('section-visible');
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const successMsg = language === 'he' 
        ? `${type} הועתק ללוח`
        : `${type} copied to clipboard`;
      setCopySuccess(successMsg);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      const errorMsg = language === 'he' 
        ? 'שגיאה בהעתקה'
        : 'Copy failed';
      setCopySuccess(errorMsg);
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  // Export results functionality
  const exportResults = () => {
    const exportData = {
      summary: results.summary,
      language: results.language || language,
      timestamp: new Date().toISOString(),
      tabs: results.tabs,
      preprocessing: results.preprocessing
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `epigraph-analysis-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Enhanced Header Section */}
      <div className="results-section bg-white rounded-xl shadow-lg p-6 border border-amber-100">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold text-amber-800">
            {t('results.summary')}
          </h2>
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => copyToClipboard(results.summary, t('results.summary'))}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
              title={language === 'he' ? 'העתק סיכום' : 'Copy summary'}
            >
              <Copy size={18} />
            </button>
            <button
              onClick={exportResults}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
              title={language === 'he' ? 'ייצא תוצאות' : 'Export results'}
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Epigraph-AI Analysis',
                    text: results.summary
                  });
                }
              }}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
              title={language === 'he' ? 'שתף' : 'Share'}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Enhanced Summary Display */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200 shadow-inner">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">🏺</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-800 leading-relaxed text-lg font-medium">
                {results.summary}
              </p>
              {results.language && (
                <div className="mt-3 text-sm text-amber-600">
                  {language === 'he' ? 'ניותח בשפה:' : 'Analyzed in:'} {results.language === 'he' ? 'עברית' : 'English'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copy success notification */}
        {copySuccess && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm text-center">
            {copySuccess}
          </div>
        )}
      </div>

      {/* Enhanced Quick Preview (if available) */}
      {results.preprocessing?.status === 'success' && (
        <div className="results-section bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border-2 border-emerald-200 shadow-lg">
          <h3 className="font-bold text-emerald-800 mb-3 text-lg flex items-center">
            <span className="mr-2">⚡</span>
            {language === 'he' ? 'ניתוח מקדים' : 'Quick Analysis'}
          </h3>
          <div className="bg-white p-4 rounded-lg border border-emerald-200">
            <p className="text-gray-800 leading-relaxed">
              {results.preprocessing.preview}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Tabs Section */}
      <div className="results-section bg-white rounded-xl shadow-lg border border-amber-100">
        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-xl">
          {results.tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-4 font-semibold transition-all duration-200 relative ${
                activeTab === index
                  ? 'text-amber-800 bg-white border-b-2 border-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-100'
              }`}
            >
              {tab.name}
              {activeTab === index && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 to-yellow-600"></div>
              )}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          <div className="relative">
            {results.tabs[activeTab] && (
              <div 
                key={activeTab}
                className="tab-content animate-fadeIn"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-amber-800">
                    {results.tabs[activeTab].name}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(results.tabs[activeTab].content, results.tabs[activeTab].name)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
                    title={language === 'he' ? 'העתק תוכן' : 'Copy content'}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 min-h-48 border border-gray-200">
                  <div className="prose prose-amber max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                      {results.tabs[activeTab].content}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Additional Input Section */}
      <div className="results-section bg-white rounded-xl shadow-lg p-6 border border-amber-100">
        <h3 className="text-xl font-semibold text-amber-800 mb-4 flex items-center">
          <span className="mr-2">➕</span>
          {t('results.additional')}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-3 p-4 border-2 border-amber-300 rounded-xl hover:bg-amber-50 hover:border-amber-500 transition-all duration-200 transform hover:scale-105 group">
            <Plus size={20} className="text-amber-600 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-amber-800 font-medium">{t('results.add.text')}</span>
          </button>
          <button className="flex items-center justify-center space-x-3 p-4 border-2 border-amber-300 rounded-xl hover:bg-amber-50 hover:border-amber-500 transition-all duration-200 transform hover:scale-105 group">
            <Image size={20} className="text-amber-600 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-amber-800 font-medium">{t('results.add.image')}</span>
          </button>
          <button className="flex items-center justify-center space-x-3 p-4 border-2 border-amber-300 rounded-xl hover:bg-amber-50 hover:border-amber-500 transition-all duration-200 transform hover:scale-105 group">
            <Upload size={20} className="text-amber-600 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-amber-800 font-medium">{t('results.add.file')}</span>
          </button>
        </div>
      </div>

      {/* Enhanced Back to Home Button */}
      <div className="results-section text-center pb-8">
        <button
          onClick={resetToHome}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl hover:from-amber-700 hover:to-yellow-700 transform hover:scale-105 hover:-translate-y-1 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
        >
          {t('results.back')}
        </button>
      </div>

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .results-section {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .section-visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .section-hidden {
          opacity: 0.8;
          transform: translateY(10px);
        }
        
        .tab-content {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .prose {
          color: inherit;
        }
        
        .prose p {
          margin-bottom: 1em;
          line-height: 1.7;
        }
        
        /* Auto-appear animation for sections */
        .results-section:nth-child(1) { animation-delay: 0.1s; }
        .results-section:nth-child(2) { animation-delay: 0.2s; }
        .results-section:nth-child(3) { animation-delay: 0.3s; }
        .results-section:nth-child(4) { animation-delay: 0.4s; }
        .results-section:nth-child(5) { animation-delay: 0.5s; }
        
        @media (max-width: 768px) {
          .results-section {
            margin: 0 -1rem;
            border-radius: 0;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .results-section,
          .tab-content,
          .animate-fadeIn {
            animation: none;
            transition: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsPage;