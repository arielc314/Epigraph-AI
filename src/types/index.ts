export interface InscriptionAnalysis {
    text: string;
    translation: string;
    period: string;
    confidence: number;
    metadata: Record<string, any>;
  }
  
  export interface ClassificationResult {
    category: string;
    confidence: number;
    details: string[];
  }