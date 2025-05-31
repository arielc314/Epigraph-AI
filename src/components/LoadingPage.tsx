'use client';

import React from 'react';
import { X } from 'lucide-react';

interface LoadingData {
  genre?: string;
  period?: string;
  isProcessing?: boolean;
  stage: 'analyzing' | 'generating_summary' | 'generating_details' | 'complete';
}

interface LoadingPageProps {
  loadingData: LoadingData;
  onCancel?: () => void;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ loadingData, onCancel }) => {
  const getStageText = () => {
    switch (loadingData.stage) {
      case 'analyzing':
        return 'מנתח את הכתובת...';
      case 'generating_summary':
        return 'יוצר סיכום מהיר...';
      case 'generating_details':
        return 'מכין ניתוח מפורט...';
      case 'complete':
        return 'הושלם!';
      default:
        return 'מעבד...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Header with cancel button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-800">
            מעבד את הכתובת
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="ביטול"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Loading Animation */}
        <div className="text-center mb-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
          <p className="text-gray-600">{getStageText()}</p>
        </div>

        {/* Quick Results */}
        {(loadingData.genre || loadingData.period) && (
          <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-3">תוצאות ראשוניות:</h3>
            
            {loadingData.genre && (
              <div className="mb-2">
                <span className="font-medium text-gray-700">סוג הכתובת: </span>
                <span className="text-amber-700">{loadingData.genre}</span>
              </div>
            )}
            
            {loadingData.period && (
              <div className="mb-2">
                <span className="font-medium text-gray-700">תקופה: </span>
                <span className="text-amber-700">{loadingData.period}</span>
              </div>
            )}
            
            <div className="mt-3 text-sm text-gray-600">
              ממשיך לעבד ניתוח מפורט...
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-center space-x-4 space-x-reverse">
          <div className={`flex items-center ${loadingData.stage !== 'analyzing' ? 'text-green-600' : 'text-amber-600'}`}>
            <div className={`w-4 h-4 rounded-full border-2 ml-2 ${loadingData.stage !== 'analyzing' ? 'bg-green-600 border-green-600' : 'border-amber-600'}`}></div>
            <span className="text-sm">ניתוח</span>
          </div>
          
          <div className={`flex items-center ${['generating_details', 'complete'].includes(loadingData.stage) ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-4 h-4 rounded-full border-2 ml-2 ${['generating_details', 'complete'].includes(loadingData.stage) ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}></div>
            <span className="text-sm">יצירת תוכן</span>
          </div>
          
          <div className={`flex items-center ${loadingData.stage === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-4 h-4 rounded-full border-2 ml-2 ${loadingData.stage === 'complete' ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}></div>
            <span className="text-sm">סיום</span>
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="mt-6 text-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg hover:from-amber-700 hover:to-yellow-700 transform hover:scale-105 transition-all duration-200 font-semibold"
            >
              חזור לעמוד הראשי
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingPage;