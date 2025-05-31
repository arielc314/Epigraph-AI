import React, { useState, useCallback, useRef } from 'react';
import Header from './Header';
import HomePage, { InputData } from './HomePage';
import ResultsPage, { ResultsData } from './ResultsPage';
import AboutPage from './AboutPage';
import { LanguageProvider, useLanguage } from './LanguageContext';

interface LoadingData {
  stage: 'initializing' | 'quick_preview' | 'analyzing' | 'processing' | 'finalizing' | 'complete';
  isProcessing: boolean;
  quickPreview?: string; // Quick preview from Gemini Flash
  stageProgress?: number; // Progress percentage
}

type PageType = 'home' | 'results' | 'about' | 'loading';

// Enhanced loading stages mapping with quick preview stage
const LOADING_STAGES = {
  'initializing': {
    he: 'מתחיל ניתוח...',
    en: 'Initializing analysis...',
    progress: 5
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

// Inner component with parallel processing logic
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
  
  // Enhanced abort controller with proper cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef<boolean>(false);

  const handleSubmit = useCallback(async () => {
    // Cleanup any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Setup new cancellation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    processingRef.current = true;
    
    setCurrentPage('loading');
    
    try {
        // Stage 1: Initializing
        setLoadingData({ 
          stage: 'initializing', 
          isProcessing: true,
          stageProgress: LOADING_STAGES.initializing.progress
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        if (signal.aborted || !processingRef.current) return;

        // Stage 2: Quick Preview - Show immediately when we start the request
        setLoadingData({ 
          stage: 'quick_preview', 
          isProcessing: true,
          stageProgress: LOADING_STAGES.quick_preview.progress
        });

        // Enhanced payload with language preference
        const requestPayload = {
            inputData,
            language: language,
            preferences: {
                outputLanguage: language,
                detailedAnalysis: true,
                quickPreview: true // Request quick preview
            }
        };

        console.log(`[${language.toUpperCase()}] Starting PARALLEL analysis with immediate preview...`);
        
        // Start the request - this will return quick preview FIRST
        const responsePromise = fetch('http://127.0.0.1:5328/api/query', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept-Language': language
            },
            body: JSON.stringify(requestPayload),
            signal
        });

        // Wait for response
        const response = await responsePromise;
        if (signal.aborted || !processingRef.current) return;
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        if (signal.aborted || !processingRef.current) return;
        
        // Stage 3: Show quick preview IMMEDIATELY if available
        if (result.preprocessing?.status === 'success' && result.preprocessing.preview) {
          console.log(`📱 Quick preview received: ${result.preprocessing.preview.substring(0, 100)}...`);
          
          setLoadingData({ 
            stage: 'analyzing', 
            isProcessing: true,
            quickPreview: result.preprocessing.preview,
            stageProgress: LOADING_STAGES.analyzing.progress
          });
          
          // Show the quick preview for a reasonable time
          await new Promise(resolve => {
            const timeout = setTimeout(resolve, 2500);
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              resolve(undefined);
            });
          });
        } else {
          // No quick preview available, continue normally
          setLoadingData({ 
            stage: 'analyzing', 
            isProcessing: true,
            stageProgress: LOADING_STAGES.analyzing.progress
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (signal.aborted || !processingRef.current) return;
        
        // Stage 4: Processing detailed results
        setLoadingData({ 
          stage: 'processing', 
          isProcessing: true,
          quickPreview: result.preprocessing?.preview, // Keep showing preview
          stageProgress: LOADING_STAGES.processing.progress
        });
        
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, 1500);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            resolve(undefined);
          });
        });
        
        if (signal.aborted || !processingRef.current) return;
        
        // Stage 5: Finalizing
        setLoadingData({ 
          stage: 'finalizing', 
          isProcessing: true,
          quickPreview: result.preprocessing?.preview,
          stageProgress: LOADING_STAGES.finalizing.progress
        });
        
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, 800);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            resolve(undefined);
          });
        });
        
        if (signal.aborted || !processingRef.current) return;
        
        // Stage 6: Complete
        setLoadingData({ 
          stage: 'complete', 
          isProcessing: false,
          stageProgress: LOADING_STAGES.complete.progress
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        if (signal.aborted || !processingRef.current) return;
        
        setResults(result);
        setCurrentPage('results');
        
        console.log(`[${language.toUpperCase()}] Parallel analysis completed successfully`);
        
    } catch (error: any) {
        if (error.name === 'AbortError' || signal.aborted || !processingRef.current) {
            console.log('Analysis cancelled successfully');
            return;
        }
        
        console.error('Analysis error:', error);
        
        // Language-aware error messages
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
    
    // Set processing flag to false
    processingRef.current = false;
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Enhanced header with cancel functionality */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-amber-800">{t('loading.title')}</h2>
                <button
                  onClick={handleCancelProcessing}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title={t('common.cancel')}
                >
                  <span className="text-lg font-bold">✕</span>
                </button>
              </div>
              
              {/* Enhanced loading spinner with progress */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mb-4"></div>
                  {loadingData.stageProgress && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-600">
                        {loadingData.stageProgress}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 font-medium text-lg">
                  {LOADING_STAGES[loadingData.stage][language]}
                </p>
              </div>

              {/* ENHANCED Quick Preview - shows as soon as available */}
              {loadingData.quickPreview && (
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 p-6 rounded-xl mb-8 border-2 border-blue-300 shadow-lg animate-slideInUp">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                      <span className="text-white text-2xl">⚡</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-800 mb-3 text-xl flex items-center">
                        🤖 {language === 'he' ? 'תוצאות ראשוניות מהירות' : 'Quick Initial Results'}
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {language === 'he' ? 'חדש' : 'NEW'}
                        </span>
                      </h3>
                      <div className="bg-white p-5 rounded-lg border-2 border-blue-200 mb-3 shadow-inner">
                        <p className="text-gray-800 leading-relaxed text-base font-medium">
                          {loadingData.quickPreview}
                        </p>
                      </div>
                      <div className="text-sm text-blue-700 italic flex items-center bg-blue-50 p-2 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-bounce"></div>
                        {language === 'he' ? 'ממשיך לניתוח מפורט ומעמיק...' : 'Continuing with detailed and deep analysis...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced progress steps */}
              <div className="flex justify-center space-x-2 mb-8 overflow-x-auto">
                {Object.keys(LOADING_STAGES).map((stage, index) => {
                  const currentStageIndex = Object.keys(LOADING_STAGES).indexOf(loadingData.stage);
                  const isActive = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  
                  return (
                    <div key={stage} className={`flex items-center transition-all duration-500 ${
                      isActive ? 'text-green-600 scale-105' : 'text-gray-400'
                    } ${isCurrent ? 'font-bold transform scale-110' : ''}`}>
                      <div className={`w-4 h-4 rounded-full border-2 ml-2 transition-all duration-500 ${
                        isActive
                          ? 'bg-green-600 border-green-600 shadow-lg' 
                          : 'border-gray-300'
                      } ${isCurrent ? 'animate-pulse scale-125 shadow-green-300' : ''}`}></div>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {language === 'he' ? {
                          'initializing': 'התחלה',
                          'quick_preview': 'תצוגה מקדימה',
                          'analyzing': 'ניתוח עמוק',
                          'processing': 'עיבוד מפורט',
                          'finalizing': 'סיום',
                          'complete': 'הושלם'
                        }[stage as keyof typeof LOADING_STAGES] : {
                          'initializing': 'Start',
                          'quick_preview': 'Quick Preview',
                          'analyzing': 'Deep Analysis',
                          'processing': 'Detailed Processing',
                          'finalizing': 'Finalizing',
                          'complete': 'Complete'
                        }[stage as keyof typeof LOADING_STAGES]}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Cancel button at bottom */}
              <div className="text-center">
                <button
                  onClick={handleCancelProcessing}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  {t('common.cancel')}
                </button>
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
      
      {/* Enhanced CSS with animations */}
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
          animation: slideInUp 0.6s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-25%);
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