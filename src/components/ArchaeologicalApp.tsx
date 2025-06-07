import React, { useState, useCallback, useRef } from 'react';
import Header from './Header';
import HomePage, { InputData } from './HomePage';
import ResultsPage, { ResultsData } from './ResultsPage';
import AboutPage from './AboutPage';
import { LanguageProvider, useLanguage } from './LanguageContext';

interface LoadingData {
  stage: 'initializing' | 'quick_preview' | 'analyzing' | 'processing' | 'finalizing' | 'complete';
  isProcessing: boolean;
  quickPreview?: string;
  stageProgress?: number;
  genre?: string;
  period?: string;
}

type PageType = 'home' | 'results' | 'about' | 'loading';

// Enhanced loading stages with real backend integration
const LOADING_STAGES = {
  'initializing': {
    he: 'מתחיל ניתוח...',
    en: 'Initializing analysis...',
    progress: 10
  },
  'quick_preview': {
    he: 'מקבל תוצאות ראשוניות...',
    en: 'Getting quick preview...',
    progress: 30
  },
  'analyzing': {
    he: 'מנתח לעומק...',
    en: 'Deep analysis...',
    progress: 50
  },
  'processing': {
    he: 'מעבד תוצאות מפורטות...',
    en: 'Processing detailed results...',
    progress: 75
  },
  'finalizing': {
    he: 'משלים את הניתוח...',
    en: 'Finalizing analysis...',
    progress: 90
  },
  'complete': {
    he: 'הושלם!',
    en: 'Complete!',
    progress: 100
  }
} as const;

const ArchaeologicalAppInner: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputData, setInputData] = useState<InputData>({ data: null, type: '' });
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loadingData, setLoadingData] = useState<LoadingData>({
    stage: 'initializing',
    isProcessing: false
  });
  
  // Simple abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef<boolean>(false);

  const handleSubmit = useCallback(async () => {
    // Cancel any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    processingRef.current = true;
    setCurrentPage('loading');

    try {
      // Reset loading state
      setLoadingData({ 
        stage: 'initializing', 
        isProcessing: true,
        stageProgress: LOADING_STAGES.initializing.progress
      });

      // Prepare request payload
      const requestPayload = {
        inputData,
        language: language,
        preferences: {
          outputLanguage: language,
          detailedAnalysis: true,
          quickPreview: true
        }
      };

      console.log(`[${language.toUpperCase()}] Starting streaming analysis...`);
      console.log('processingRef.current:', processingRef.current);
      

      // Create streaming request
      const sseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/query-stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        body: JSON.stringify(requestPayload),
        signal: signal
      });

      if (!sseResponse.ok) {
        throw new Error(`Stream init failed: ${sseResponse.status}`);
      }

      // Get the stream reader
      const reader = sseResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No stream reader available');
      }

      // Process the stream with proper error handling
      try {
        while (processingRef.current && !signal.aborted) {
          const { done, value } = await reader.read();
          
          if (done || signal.aborted) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'status':
                    setLoadingData(prev => ({ 
                      ...prev, 
                      stage: data.stage,
                      stageProgress: LOADING_STAGES[data.stage as keyof typeof LOADING_STAGES]?.progress || prev.stageProgress
                    }));
                  case 'complete':
                    console.log(`[${language.toUpperCase()}] Stream analysis completed successfully`);
                    console.log('processingRef.current on complete:', processingRef.current);
                    break;
                    
                  case 'quick_preview':
                    console.log(`📱 Quick preview received`);
                    setLoadingData(prev => ({ 
                      ...prev,
                      stage: 'analyzing',
                      quickPreview: data.content,
                      stageProgress: LOADING_STAGES.analyzing.progress
                    }));
                    break;
                    
                  case 'classification':
                    console.log(`🏺 Classification received`);
                    setLoadingData(prev => ({ 
                      ...prev,
                      genre: data.genre,
                      period: data.period,
                      stage: 'processing',
                      stageProgress: LOADING_STAGES.processing.progress
                    }));
                    break;
                    
                  case 'final_results':
                    console.log(`✅ Final results received`);
                    console.log('processingRef.current before setting results:', processingRef.current);
                    
                    setLoadingData(prev => ({ 
                      ...prev,
                      stage: 'complete',
                      stageProgress: LOADING_STAGES.complete.progress
                    }));
                    
                    setResults(data.results);
                    
                    console.log('processingRef.current after setting results:', processingRef.current);
                    
                    // Direct navigation without timeout
                    console.log('Navigating to results immediately...');
                    setCurrentPage('results');
                    break;
                    
                  case 'error':
                    console.error('Stream Error:', data.message);
                    setResults({
                      summary: data.message,
                      tabs: [{ 
                        name: t('common.error'), 
                        content: data.message
                      }]
                    });
                    setCurrentPage('results');
                    return;
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      } finally {
        // Always clean up the reader safely
        try {
          reader.releaseLock();
        } catch (error) {
          // Reader was already released, ignore
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError' || signal.aborted) {
        console.log('Analysis cancelled by user');
        return;
      }
      
      console.error('Analysis error:', error);
      
      // Try fallback API
      try {
        const fallbackPayload = {
          inputData,
          language: language,
          preferences: {
            outputLanguage: language,
            detailedAnalysis: true,
            quickPreview: true
          }
        };
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/query`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept-Language': language,
          },
          body: JSON.stringify(fallbackPayload)
        });

        if (response.ok) {
          const result = await response.json();
          setResults(result);
          setCurrentPage('results');
          return;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      // Show error
      const errorMessage = language === 'he' 
        ? `שגיאה בניתוח: ${error.message}`
        : `Analysis error: ${error.message}`;
        
      setResults({
        summary: errorMessage,
        tabs: [{ 
          name: t('common.error'), 
          content: language === 'he' 
            ? 'העיבוד נכשל. אנא נסה שוב.' 
            : 'Processing failed. Please try again.'
        }]
      });
      setCurrentPage('results');
    } finally {
      processingRef.current = false;
    }
  }, [inputData, language, t]);

  const handleCancelProcessing = useCallback(() => {
    console.log('User requested cancellation');
    console.log('Setting processingRef to false');
    
    // Set processing flag to false
    processingRef.current = false;
    
    // Abort the request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset state and return to home
    setCurrentPage('home');
    setInputData({ data: null, type: '' });
    setLoadingData({ stage: 'initializing', isProcessing: false });
    
    console.log('Cancellation completed - returned to home');
  }, []);

  const resetToHome = useCallback(() => {
    // Ensure any background processing is stopped
    processingRef.current = false;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setCurrentPage('home');
    setInputData({ data: null, type: '' });
    setResults(null);
  }, []);

  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page as PageType);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'results':
        return results ? <ResultsPage results={results} resetToHome={resetToHome} /> : null;
      case 'loading':
        return (
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden">
              {/* Enhanced Header with elegant design */}
              <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 px-8 py-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🏺</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{t('loading.title')}</h2>
                      <p className="text-yellow-100 text-sm opacity-90">
                        {language === 'he' ? 'מנתח כתובת עתיקה...' : 'Analyzing ancient inscription...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelProcessing}
                    className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200 hover:scale-110"
                    title={t('common.cancel')}
                  >
                    <span className="text-xl font-bold">✕</span>
                  </button>
                </div>
              </div>
              
              <div className="p-8">
                {/* Enhanced loading spinner with elegant progress */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-6">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-200 border-t-amber-600 shadow-lg"></div>
                    {loadingData.stageProgress && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-amber-700 bg-white rounded-full px-2 py-1 shadow-sm">
                          {loadingData.stageProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 font-medium text-lg mb-2">
                    {LOADING_STAGES[loadingData.stage][language]}
                  </p>
                  <div className="w-full bg-amber-100 rounded-full h-2 mb-4 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                      style={{ width: `${loadingData.stageProgress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Enhanced Quick Preview with sophisticated design */}
                {loadingData.quickPreview && (
                  <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-2xl p-8 border-2 border-red-200 shadow-lg animate-slideInUp">
                    <div className="flex items-start space-x-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-yellow-500 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg spac-x-4 mx-3">
                        <span className="text-white text-2xl">⚡</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-bold text-yellow-900 text-xl flex items-center">
                            {language === 'he' ? 'תוצאות מיידיות' : 'Instant Results'}
                            <span className="ml-3 px-3 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium shadow-sm">
                              {language === 'he' ? 'מיידי' : 'INSTANT'}
                            </span>
                          </h3>
                          <button
                            onClick={() => navigator.clipboard.writeText(loadingData.quickPreview || '')}
                            className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors duration-200 hover:scale-105"
                            title={language === 'he' ? 'העתק' : 'Copy'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-yellow-200 shadow-inner mb-4">
                          <p className="text-gray-800 leading-relaxed text-base font-medium whitespace-pre-wrap">
                            {loadingData.quickPreview}
                          </p>
                        </div>
                        <div className="text-sm text-yellow-700 flex items-center bg-yellow-100 bg-opacity-50 p-3 rounded-lg">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                          <span className="italic">
                            {language === 'he' ? 'ממשיך לניתוח מעמיק עם מודל מתקדם...' : 'Continuing with advanced deep analysis...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Classification Results with elegant styling */}
                {(loadingData.genre || loadingData.period) && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border-2 border-emerald-200 shadow-lg animate-slideInUp">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg mx-3">
                        <span className="text-white text-xl">📊</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-emerald-900 mb-4 text-lg">
                          {language === 'he' ? 'סיווג ראשוני' : 'Initial Classification'}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {loadingData.genre && (
                            <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                              <div className="text-sm text-emerald-600 font-medium mb-1">
                                {language === 'he' ? 'סוג הכתובת' : 'Inscription Type'}
                              </div>
                              <div className="text-emerald-900 font-semibold">{loadingData.genre}</div>
                            </div>
                          )}
                          {loadingData.period && (
                            <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                              <div className="text-sm text-emerald-600 font-medium mb-1">
                                {language === 'he' ? 'תקופה היסטורית' : 'Historical Period'}
                              </div>
                              <div className="text-emerald-900 font-semibold">{loadingData.period}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced progress steps with sophisticated design */}
                <div className="flex justify-center mb-8">
                  <div className="flex items-center space-x-4 bg-gray-50 rounded-2xl p-4 shadow-inner">
                    {Object.keys(LOADING_STAGES).map((stage, index) => {
                      const currentStageIndex = Object.keys(LOADING_STAGES).indexOf(loadingData.stage);
                      const isActive = index <= currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      
                      return (
                        <div key={stage} className={`flex flex-col items-center transition-all duration-500 ${
                          isActive ? 'text-amber-600 scale-105' : 'text-gray-400'
                        } ${isCurrent ? 'font-bold transform scale-110' : ''}`}>
                          <div className={`w-6 h-6 rounded-full border-2 mb-2 transition-all duration-500 ${
                            isActive
                              ? 'bg-amber-500 border-amber-500 shadow-lg' 
                              : 'border-gray-300'
                          } ${isCurrent ? 'animate-pulse scale-125 shadow-amber-300' : ''}`}>
                            {isActive && (
                              <div className="w-full h-full rounded-full bg-white bg-opacity-30"></div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-center leading-tight max-w-16">
                            {language === 'he' ? {
                              'initializing': 'התחלה',
                              'quick_preview': 'תצוגה מקדימה',
                              'analyzing': 'ניתוח',
                              'processing': 'עיבוד',
                              'finalizing': 'סיום',
                              'complete': 'הושלם'
                            }[stage as keyof typeof LOADING_STAGES] : {
                              'initializing': 'Start',
                              'quick_preview': 'Preview',
                              'analyzing': 'Analysis',
                              'processing': 'Processing',
                              'finalizing': 'Finalizing',
                              'complete': 'Complete'
                            }[stage as keyof typeof LOADING_STAGES]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Enhanced cancel button */}
                <div className="text-center">
                  <button
                    onClick={handleCancelProcessing}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'about':
        return <AboutPage setCurrentPage={handlePageChange} />;
      default:
        return <HomePage inputData={inputData} setInputData={setInputData} handleSubmit={handleSubmit} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
      />
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      
      {/* Enhanced CSS with smooth animations */}
      <style jsx>{`
        html {
          scroll-behavior: smooth;
        }
        * {
          scroll-behavior: smooth;
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.8s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .7;
          }
        }
      `}</style>
    </div>
  );
};

// Main wrapper with provider (unchanged)
const ArchaeologicalApp: React.FC = () => (
  <LanguageProvider>
    <ArchaeologicalAppInner />
  </LanguageProvider>
);

export default ArchaeologicalApp;