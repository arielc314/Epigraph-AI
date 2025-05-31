// Complete LanguageContext with all missing translations

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'he' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

// Enhanced translation keys with complete coverage
type TranslationKey = 
  // Header & Navigation
  | 'app.title' | 'app.subtitle' | 'nav.home' | 'nav.about'
  
  // Hero Section
  | 'hero.title' | 'hero.subtitle' | 'hero.start' 
  
  // Features
  | 'feature.identification' | 'feature.identification.desc'
  | 'feature.dating' | 'feature.dating.desc' 
  | 'feature.insights' | 'feature.insights.desc'
  
  // Upload Section
  | 'upload.title' | 'upload.subtitle' | 'upload.file' | 'upload.file.desc'
  | 'upload.text' | 'upload.text.placeholder' | 'upload.formats'
  | 'upload.start' | 'upload.back' | 'upload.selected'
  | 'upload.text.label' | 'upload.file.label' | 'upload.content'
  | 'upload.camera' | 'upload.camera.desc'
  
  // Loading States
  | 'loading.title' | 'loading.analyzing' | 'loading.summary'
  | 'loading.details' | 'loading.complete' | 'loading.quick.title'
  | 'loading.quick.continue' | 'loading.initial' | 'loading.type'
  | 'loading.period' | 'loading.continuing' | 'loading.steps.analysis'
  | 'loading.steps.content' | 'loading.steps.complete'
  
  // Results - FIXED TRANSLATIONS
  | 'results.summary' | 'results.subject' | 'results.period'
  | 'results.content' | 'results.initial.complete' | 'results.back'
  | 'results.additional' | 'results.add.text' | 'results.add.image' | 'results.add.file'
  | 'results.copy' | 'results.share' | 'results.export' | 'results.translate'
  | 'results.export.pdf' | 'results.language.analyzed'
  
  // About Page
  | 'about.title' | 'about.description' | 'about.hackathon' | 'about.hackathon.desc'
  | 'about.team' | 'about.technologies' | 'about.back'
  
  // Common UI Elements
  | 'common.cancel' | 'common.error' | 'common.unknown' | 'common.available'
  | 'common.processing' | 'common.completed' | 'common.failed' | 'common.copy'
  | 'common.share' | 'common.export' | 'common.translate'
  
  // Error Messages
  | 'error.file.empty' | 'error.file.unreadable' | 'error.network'
  | 'error.processing' | 'error.unknown.type' | 'error.no.text'
  
  // Success Messages
  | 'success.analysis' | 'success.upload' | 'success.processing'
  | 'success.copied' | 'success.exported';

type Translations = Record<TranslationKey, string>;

const translations: Record<Language, Translations> = {
  he: {
    // Header & Navigation
    'app.title': 'Epigraph-AI',
    'app.subtitle': 'ניתוח כתובות עתיקות בעזרת בינה מלאכותית',
    'nav.home': 'בית',
    'nav.about': 'אודות',
    
    // Hero Section
    'hero.title': 'כתובות עתיקות מחכות לגילוי',
    'hero.subtitle': 'גלה את הסודות הנסתרים בכתב היתדות, היירוגליפים וכתבים עתיקים נוספים בעזרת בינה מלאכותית מתקדמת',
    'hero.start': 'בואו נגלה את סודות העבר',
    
    // Features
    'feature.identification': 'זיהוי מדויק',
    'feature.identification.desc': 'ניתוח אוטומטי של כתב יתדות, היירוגליפים וכתבים עתיקים',
    'feature.dating': 'תיארוך חכם',
    'feature.dating.desc': 'קביעת תקופה היסטורית והקשר תרבותי מלא',
    'feature.insights': 'תובנות עמוקות',
    'feature.insights.desc': 'פרשנות מקצועית והבנה מלאה של המשמעות',
    
    // Upload Section
    'upload.title': 'העלה חומר לניתוח ארכיאולוגי',
    'upload.subtitle': 'הכנס תמונה, קובץ PDF, XML או טקסט כדי לקבל ניתוח מקצועי ותובנות היסטוריות',
    'upload.file': 'העלה קובץ',
    'upload.file.desc': 'תמונה (JPG, PNG), PDF, XML או מסמך טקסט',
    'upload.text': 'הכנס טקסט',
    'upload.text.placeholder': 'הכנס כאן את הטקסט לניתוח...',
    'upload.formats': 'פורמטים נתמכים:',
    'upload.start': 'התחל ניתוח',
    'upload.back': 'חזור למסך הראשי',
    'upload.selected': 'קלט שנבחר:',
    'upload.text.label': 'טקסט:',
    'upload.file.label': 'קובץ:',
    'upload.content': 'תוכן:',
    'upload.camera': 'צלם כתובת',
    'upload.camera.desc': 'צלם ישירות עם המצלמה',
    
    // Loading States
    'loading.title': 'מעבד את הכתובת',
    'loading.analyzing': 'מנתח את הכתובת...',
    'loading.summary': 'יוצר סיכום מהיר...',
    'loading.details': 'מכין ניתוח מפורט...',
    'loading.complete': 'הושלם!',
    'loading.quick.title': 'ניתוח מקדים',
    'loading.quick.continue': 'ממשיך לעיבוד מפורט...',
    'loading.initial': 'תוצאות ראשוניות:',
    'loading.type': 'סוג הכתובת:',
    'loading.period': 'תקופה:',
    'loading.continuing': 'ממשיך לעבד ניתוח מפורט...',
    'loading.steps.analysis': 'ניתוח',
    'loading.steps.content': 'יצירת תוכן',
    'loading.steps.complete': 'סיום',
    
    // Results - FIXED TRANSLATIONS
    'results.summary': 'סיכום',
    'results.subject': 'נושא',
    'results.period': 'תקופה',
    'results.content': 'תוכן מפורט',
    'results.initial.complete': 'ניתוח ראשוני הושלם',
    'results.back': 'חזור לעמוד הראשי',
    'results.additional': 'הוסף מידע נוסף לשיפור הניתוח',
    'results.add.text': 'הוסף טקסט',
    'results.add.image': 'הוסף תמונה',
    'results.add.file': 'הוסף קובץ',
    'results.copy': 'העתק',
    'results.share': 'שתף',
    'results.export': 'ייצא',
    'results.translate': 'תרגם',
    'results.export.pdf': 'ייצא ל-PDF',
    'results.language.analyzed': 'נותח בשפה:',
    
    // About Page
    'about.title': 'אודות Epigraph-AI',
    'about.description': 'מערכת מתקדמת לניתוח כתובות יתדות וטקסטים ארכיאולוגיים באמצעות בינה מלאכותית',
    'about.hackathon': 'הקאתון האוניברסיטה העברית 2025',
    'about.hackathon.desc': 'פרויקט זה פותח במסגרת האקתון השנתי של האוניברסיטה העברית בירושלים. האפליקציה משלבת טכנולוגיות מתקדמות של בינה מלאכותית עם מחקר ארכיאולוגי.',
    'about.team': 'צוות הפיתוח',
    'about.technologies': 'טכנולוגיות בפרויקט',
    'about.back': 'חזור לעמוד הראשי',
    
    // Common UI Elements
    'common.cancel': 'ביטול',
    'common.error': 'שגיאה',
    'common.unknown': 'לא ידוע',
    'common.available': 'זמין',
    'common.processing': 'מעבד',
    'common.completed': 'הושלם',
    'common.failed': 'נכשל',
    'common.copy': 'העתק',
    'common.share': 'שתף',
    'common.export': 'ייצא',
    'common.translate': 'תרגם',
    
    // Error Messages
    'error.file.empty': 'הקובץ ריק או לא ניתן לקריאה',
    'error.file.unreadable': 'לא ניתן לקרוא את הקובץ',
    'error.network': 'שגיאת רשת - בדוק את החיבור לאינטרנט',
    'error.processing': 'שגיאה בעיבוד הנתונים',
    'error.unknown.type': 'סוג קובץ לא ידוע',
    'error.no.text': 'לא נמצא טקסט לעיבוד',
    
    // Success Messages
    'success.analysis': 'הניתוח הושלם בהצלחה',
    'success.upload': 'הקובץ הועלה בהצלחה',
    'success.processing': 'העיבוד הושלם בהצלחה',
    'success.copied': 'הועתק ללוח בהצלחה',
    'success.exported': 'הקובץ יוצא בהצלחה'
  },
  en: {
    // Header & Navigation
    'app.title': 'Epigraph-AI',
    'app.subtitle': 'Ancient inscription analysis using artificial intelligence',
    'nav.home': 'Home',
    'nav.about': 'About',
    
    // Hero Section
    'hero.title': 'Ancient inscriptions await discovery',
    'hero.subtitle': 'Discover the hidden secrets in cuneiform, hieroglyphs and other ancient scripts using advanced artificial intelligence',
    'hero.start': 'Let\'s discover the secrets of the past',
    
    // Features
    'feature.identification': 'Accurate Identification',
    'feature.identification.desc': 'Automatic analysis of cuneiform, hieroglyphs and ancient scripts',
    'feature.dating': 'Smart Dating',
    'feature.dating.desc': 'Determining historical period and complete cultural context',
    'feature.insights': 'Deep Insights',
    'feature.insights.desc': 'Professional interpretation and complete understanding of meaning',
    
    // Upload Section
    'upload.title': 'Upload material for archaeological analysis',
    'upload.subtitle': 'Enter image, PDF file, XML or text to get professional analysis and historical insights',
    'upload.file': 'Upload File',
    'upload.file.desc': 'Image (JPG, PNG), PDF, XML or text document',
    'upload.text': 'Enter Text',
    'upload.text.placeholder': 'Enter text here for analysis...',
    'upload.formats': 'Supported formats:',
    'upload.start': 'Start Analysis',
    'upload.back': 'Back to main screen',
    'upload.selected': 'Selected Input:',
    'upload.text.label': 'Text:',
    'upload.file.label': 'File:',
    'upload.content': 'Content:',
    'upload.camera': 'Capture Inscription',
    'upload.camera.desc': 'Capture directly with camera',
    
    // Loading States
    'loading.title': 'Processing the inscription',
    'loading.analyzing': 'Analyzing the inscription...',
    'loading.summary': 'Creating quick summary...',
    'loading.details': 'Preparing detailed analysis...',
    'loading.complete': 'Complete!',
    'loading.quick.title': 'Quick Analysis',
    'loading.quick.continue': 'Continuing with detailed processing...',
    'loading.initial': 'Initial Results:',
    'loading.type': 'Inscription Type:',
    'loading.period': 'Period:',
    'loading.continuing': 'Continuing to process detailed analysis...',
    'loading.steps.analysis': 'Analysis',
    'loading.steps.content': 'Content Generation',
    'loading.steps.complete': 'Complete',
    
    // Results - FIXED TRANSLATIONS
    'results.summary': 'Summary',
    'results.subject': 'Subject',
    'results.period': 'Period',
    'results.content': 'Detailed Content',
    'results.initial.complete': 'Initial analysis completed',
    'results.back': 'Back to home page',
    'results.additional': 'Add additional information to improve analysis',
    'results.add.text': 'Add Text',
    'results.add.image': 'Add Image',
    'results.add.file': 'Add File',
    'results.copy': 'Copy',
    'results.share': 'Share',
    'results.export': 'Export',
    'results.translate': 'Translate',
    'results.export.pdf': 'Export to PDF',
    'results.language.analyzed': 'Analyzed in:',
    
    // About Page
    'about.title': 'About Epigraph-AI',
    'about.description': 'Advanced system for analyzing cuneiform inscriptions and archaeological texts using artificial intelligence',
    'about.hackathon': 'Hebrew University Hackathon 2025',
    'about.hackathon.desc': 'This project was developed as part of the annual hackathon at the Hebrew University of Jerusalem. The application combines advanced AI technologies with archaeological research.',
    'about.team': 'Development Team',
    'about.technologies': 'Project Technologies',
    'about.back': 'Back to home page',
    
    // Common UI Elements
    'common.cancel': 'Cancel',
    'common.error': 'Error',
    'common.unknown': 'Unknown',
    'common.available': 'Available',
    'common.processing': 'Processing',
    'common.completed': 'Completed',
    'common.failed': 'Failed',
    'common.copy': 'Copy',
    'common.share': 'Share',
    'common.export': 'Export',
    'common.translate': 'Translate',
    
    // Error Messages
    'error.file.empty': 'File is empty or unreadable',
    'error.file.unreadable': 'Cannot read the file',
    'error.network': 'Network error - check your internet connection',
    'error.processing': 'Data processing error',
    'error.unknown.type': 'Unknown file type',
    'error.no.text': 'No text found for processing',
    
    // Success Messages
    'success.analysis': 'Analysis completed successfully',
    'success.upload': 'File uploaded successfully',
    'success.processing': 'Processing completed successfully',
    'success.copied': 'Successfully copied to clipboard',
    'success.exported': 'File exported successfully'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('he');

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'he' ? 'en' : 'he';
      console.log(`🌐 Language switched to: ${newLang}`);
      return newLang;
    });
  };

  const t = (key: string): string => {
    const langTranslations = translations[language];
    if (key in langTranslations) {
      return langTranslations[key as TranslationKey];
    }
    
    // Fallback: try the other language
    const fallbackLang = language === 'he' ? 'en' : 'he';
    const fallbackTranslations = translations[fallbackLang];
    if (key in fallbackTranslations) {
      console.warn(`⚠️ Translation missing for key "${key}" in ${language}, using ${fallbackLang} fallback`);
      return fallbackTranslations[key as TranslationKey];
    }
    
    // Final fallback: return the key itself
    console.warn(`⚠️ Translation missing for key "${key}" in both languages`);
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};