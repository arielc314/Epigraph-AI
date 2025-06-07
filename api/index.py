# api/index.py - COMPLETE FIXED VERSION
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import time
import logging
import sys
import os
import base64

def safe_json_text(text):
    if not text:
        return text
    # תיקון Unicode בעייתי
    text = text.replace('\\u', '\\\\u')
    text = text.replace('\x00', '')
    return text

creds_b64 = os.getenv("GOOGLE_CREDENTIALS_B64")
if creds_b64:
    creds_json = base64.b64decode(creds_b64).decode("utf-8")
    with open("/tmp/credentials.json", "w") as f:
        f.write(creds_json)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/tmp/credentials.json"

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add paths for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
server_path = os.path.join(project_root, 'src', 'server')
classifier_path = os.path.join(current_dir, 'Classifier')

sys.path.insert(0, server_path)
sys.path.insert(0, classifier_path)

# Import Gemini
try:
    from gemini import Gemini # type: ignore
    logger.info("✅ Successfully imported Gemini")
except ImportError as e:
    logger.error(f"❌ Failed to import Gemini: {e}")
    logger.error(f"Trying to import from: {server_path}")
    raise

# Import classifier components
try:
    from Classifier.classifier import GenreClassifier, PeriodClassifier
    from Classifier.controller import (
        extract_transliteration, 
        analyze_cuneiform_text, 
        create_structured_summary,
        TransliterationResult
    )
    logger.info("✅ Successfully imported classifier components")
    CLASSIFIER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Classifier import failed: {e}. Using fallback classification.")
    CLASSIFIER_AVAILABLE = False
    
    # Define fallback classes
    class GenreClassifier:
        def classify(self, text):
            if "gur" in text.lower() or "silver" in text.lower():
                return "מסמך כלכלי"
            return "כתובת יתדות כללית"
    
    class PeriodClassifier:
        def classify(self, text):
            if "%sux" in text.lower():
                return "תקופת אור השלישית (2112-2004 לפנה״ס)"
            return "תקופה עתיקה"
    
    class TransliterationResult:
        def __init__(self, text, genre, period, structured_data):
            self.Text = text
            self.Genre = genre
            self.Period = period
            self.StructuredData = structured_data
    
    def extract_transliteration(input_text, input_type):
        return TransliterationResult(
            text=input_text[:500] + "...",
            genre="כתובת יתדות",
            period="מסופוטמיה עתיקה",
            structured_data={"fallback": True}
        )
    
    def analyze_cuneiform_text(text):
        return {"language": "unknown", "content_type": "unknown", "fallback": True}

class AppState:
    def __init__(self):
        self.gemini_available = False
        self.gemini_models = {}
        self.last_error = None
        self.classifier_available = CLASSIFIER_AVAILABLE

    def get_gemini_model(self, model_name):
        try:
            if model_name not in self.gemini_models:
                logger.info(f"Initializing Gemini model: {model_name}")
                self.gemini_models[model_name] = Gemini().init_model(model_name)
                self.gemini_available = True
                logger.info(f"Successfully initialized {model_name}")
            return self.gemini_models[model_name]
        except Exception as e:
            self.gemini_available = False
            self.last_error = str(e)
            logger.error(f"Failed to initialize {model_name}: {e}")
            raise e
    
    def is_gemini_available(self):
        return self.gemini_available
    
    def get_status(self):
        return {
            'gemini_available': self.gemini_available,
            'classifier_available': self.classifier_available,
            'loaded_models': list(self.gemini_models.keys()),
            'last_error': self.last_error
        }

# Global app state
app_state = AppState()

def enhanced_content_analysis(text_data):
    try:
        logger.info("Running cuneiform analysis...")
        cuneiform_analysis = analyze_cuneiform_text(text_data)
        
        logger.info("Extracting transliteration...")
        transliteration_result = extract_transliteration(text_data, "xml" if "<" in text_data else "text")
        
        enhanced_analysis = {
            'language': cuneiform_analysis.get('language', 'unknown'),
            'content_type': cuneiform_analysis.get('content_type', 'unknown'),
            'genre': transliteration_result.Genre,
            'period': transliteration_result.Period,
            'structured_text': transliteration_result.Text,
            'cuneiform_words': cuneiform_analysis.get('cuneiform_words', []),
            'economic_terms': cuneiform_analysis.get('economic_terms', []),
            'xml_content': cuneiform_analysis.get('xml_content', False),
            'analysis_data': cuneiform_analysis
        }
        
        logger.info(f"Enhanced analysis completed: {enhanced_analysis['genre']} from {enhanced_analysis['period']}")
        return enhanced_analysis
        
    except Exception as e:
        logger.error(f"Enhanced analysis failed: {e}")
        return {
            'language': 'unknown',
            'content_type': 'cuneiform inscription',
            'genre': 'כתובת יתדות',
            'period': 'תקופה עתיקה',
            'structured_text': text_data[:500] + "...",
            'cuneiform_words': [],
            'economic_terms': [],
            'xml_content': '<' in text_data,
            'analysis_data': {'error': str(e)}
        }

def create_intelligent_prompt(enhanced_analysis, language='he'):
    structured_text = enhanced_analysis['structured_text']
    
    if language == 'he':
        prompt = f"""
אתה חוקר אקדמי בפיגרפיה (מחקר כתובות עתיקות) ובכתב יתדות. 
ספק ניתוח מקצועי ומדעי של הכתובת הבאה:

{structured_text}

מידע נוסף מהניתוח הטכני:
• ז׳אנר: {enhanced_analysis['genre']}
• תקופה: {enhanced_analysis['period']}
• שפה: {enhanced_analysis['language']}
• סוג תוכן: {enhanced_analysis['content_type']}

אנא ספק:
1. הקשר היסטורי ותרבותי
2. ניתוח לשוני של המילים שזוהו
3. משמעות התוכן והחשיבות הארכיאולוגית
4. פרטים על התקופה והמקום הגיאוגרפי
5. השוואה לכתובות דומות מהתקופה

התייחס לרמה אקדמית אך נגישה לקורא המשכיל. התחל ישירות עם הניתוח ללא נוסחאות פתיחה.
        """
    else:
        prompt = f"""
You are an expert in epigraphy and cuneiform studies.
Provide a professional analysis of this ancient inscription:

{structured_text}

Technical analysis data:
• Genre: {enhanced_analysis['genre']}
• Period: {enhanced_analysis['period']}
• Language: {enhanced_analysis['language']}
• Content type: {enhanced_analysis['content_type']}

Please provide:
1. Historical and cultural context
2. Linguistic analysis of identified terms
3. Content significance and archaeological importance
4. Details about period and geographical location
5. Comparison to similar inscriptions

Academic level but accessible to educated readers.
        """
    
    return prompt

def safe_ai_call(model_name, prompt, fallback_message="Analysis unavailable"):
    try:
        model = app_state.get_gemini_model(model_name)
        result = model.ask(prompt, short_answer=False)
        if result: result = safe_json_text(result)
        return result if result else fallback_message
    except Exception as e:
        logger.error(f"AI call failed for {model_name}: {e}")
        return fallback_message

def create_classification_summary(enhanced_analysis, language='he'):
    if language == 'he':
        summary = f"""סיווג הכתובת:

ז׳אנר: {enhanced_analysis['genre']}
תקופה: {enhanced_analysis['period']}
שפה: {enhanced_analysis['language']}
סוג תוכן: {enhanced_analysis['content_type']}

מידע טכני:
• התוכן כולל XML: {'כן' if enhanced_analysis['xml_content'] else 'לא'}
• מילים בכתב יתדות שזוהו: {len(enhanced_analysis['cuneiform_words'])}
• מונחים כלכליים: {len(enhanced_analysis['economic_terms'])}

{f"מילים שזוהו: {', '.join(enhanced_analysis['cuneiform_words'][:10])}" if enhanced_analysis['cuneiform_words'] else ""}
{f"מונחים כלכליים: {', '.join(enhanced_analysis['economic_terms'])}" if enhanced_analysis['economic_terms'] else ""}
"""
    else:
        summary = f"""Inscription Classification:

Genre: {enhanced_analysis['genre']}
Period: {enhanced_analysis['period']}
Language: {enhanced_analysis['language']}
Content Type: {enhanced_analysis['content_type']}

Technical Information:
• Contains XML: {'Yes' if enhanced_analysis['xml_content'] else 'No'}
• Cuneiform words identified: {len(enhanced_analysis['cuneiform_words'])}
• Economic terms: {len(enhanced_analysis['economic_terms'])}

{f"Identified words: {', '.join(enhanced_analysis['cuneiform_words'][:10])}" if enhanced_analysis['cuneiform_words'] else ""}
{f"Economic terms: {', '.join(enhanced_analysis['economic_terms'])}" if enhanced_analysis['economic_terms'] else ""}
"""
    
    return summary

@app.route('/api/query-stream', methods=['POST'])
def query_stream():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        input_data = data.get('inputData', {})
        language = data.get('language', 'he')
        text_data = input_data.get('data', '')
        if not text_data:
            return jsonify({'error': 'No text data provided'}), 400
    except Exception as e:
        logger.error(f"Request parsing error: {e}")
        return jsonify({'error': 'Invalid request format'}), 400
    
    def generate():
        try:
            # Step 1: Start with initializing
            yield f"data: {json.dumps({'type': 'status', 'stage': 'initializing'})}\n\n"
            time.sleep(0.5)
            
            # Step 2: Enhanced analysis with classifier
            enhanced_analysis = enhanced_content_analysis(text_data)
            
            # Step 3: Quick AI preview
            yield f"data: {json.dumps({'type': 'status', 'stage': 'quick_preview'})}\n\n"
            
            quick_prompt = f"""
            {'בעברית:' if language == 'he' else 'In English:'} 
            ספק הערכה ראשונית קצרה (2-3 משפטים) של כתובת יתדות זו:
            
            ז׳אנר: {enhanced_analysis['genre']}
            תקופה: {enhanced_analysis['period']}
            
            התמקד בסוג הכתובת, התקופה הסבירה, והנושא העיקרי.
            """
            
            quick_result = safe_ai_call("gemini-2.0-flash", quick_prompt, 
                                      "Quick analysis unavailable. Enhanced classification available below.")
            
            yield f"data: {json.dumps({'type': 'quick_preview', 'content': quick_result})}\n\n"
            
            # Step 4: Move to analyzing stage
            yield f"data: {json.dumps({'type': 'status', 'stage': 'analyzing'})}\n\n"
            time.sleep(0.5)
            
            # Step 5: Send classification data
            classification_data = {
                'genre': enhanced_analysis['genre'],
                'period': enhanced_analysis['period'],
                'language_detected': enhanced_analysis['language'],
                'content_type': enhanced_analysis['content_type']
            }
            yield f"data: {json.dumps({'type': 'classification', **classification_data})}\n\n"
            
            # Step 6: Move to processing stage
            yield f"data: {json.dumps({'type': 'status', 'stage': 'processing'})}\n\n"
            
            # Step 7: Deep analysis
            deep_prompt = create_intelligent_prompt(enhanced_analysis, language)
            detailed_analysis = safe_ai_call("gemini-2.5-pro-preview-05-06", deep_prompt,
                                           "Detailed analysis unavailable. Classification provided.")
            
            # Step 8: Finalizing
            yield f"data: {json.dumps({'type': 'status', 'stage': 'finalizing'})}\n\n"
            time.sleep(0.3)
            
            classification_summary = create_classification_summary(enhanced_analysis, language)
            
            final_results = {
                'summary': quick_result,
                'language': language,
                'preprocessing': {
                    'status': 'success',
                    'preview': quick_result,
                    'language': language,
                    'classifier_used': True
                },
                'tabs': [
                    {
                        'name': 'Detailed Analysis' if language == 'en' else 'ניתוח מפורט',
                        'content': detailed_analysis
                    },
                    {
                        'name': 'Advanced Classification' if language == 'en' else 'סיווג מתקדם',
                        'content': classification_summary
                    },
                    {
                        'name': 'Cuneiform Words' if language == 'en' else 'מילים בכתב יתדות',
                        'content': f"{'Identified cuneiform terms:' if language == 'en' else 'מונחים בכתב יתדות שזוהו:'}\n\n" + 
                                 "\n".join([f"• {word}" for word in enhanced_analysis['cuneiform_words'][:20]]) if enhanced_analysis['cuneiform_words'] 
                                 else ('No cuneiform words identified in this text.' if language == 'en' else 'לא זוהו מילים בכתב יתדות בטקסט זה.')
                    },
                    {
                        'name': 'Technical Details' if language == 'en' else 'פרטים טכניים',
                        'content': f"AI Status: {'Available' if app_state.is_gemini_available() else 'Limited'}\n"
                                 f"Classifier: {'Available' if app_state.get_status()['classifier_available'] else 'Limited'}\n"
                                 f"Processed: {len(text_data)} characters\n"
                                 f"Language: {language}\n"
                                 f"Models: {', '.join(app_state.gemini_models.keys())}\n"
                                 f"XML Content: {'Yes' if enhanced_analysis['xml_content'] else 'No'}"
                    }
                ]
            }
            
            yield f"data: {json.dumps({'type': 'final_results', 'results': final_results})}\n\n"
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            logger.error(f"Stream generation error: {e}")
            error_msg = f"Analysis error: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"
    
    return Response(generate(), 
                   content_type='text/plain; charset=utf-8',
                   headers={
                       'Cache-Control': 'no-cache',
                       'Connection': 'keep-alive',
                       'Access-Control-Allow-Origin': '*'
                   })

@app.route('/api/query', methods=['POST'])
def query():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        input_data = data.get('inputData', {})
        language = data.get('language', 'he')
        text_data = input_data.get('data', '')
        
        if not text_data:
            return jsonify({'error': 'No text data provided'}), 400
        
        enhanced_analysis = enhanced_content_analysis(text_data)
        analysis_prompt = create_intelligent_prompt(enhanced_analysis, language)
        analysis = safe_ai_call("gemini-2.0-flash", analysis_prompt, 
                              f"Classification: {enhanced_analysis['genre']} from {enhanced_analysis['period']}")
        
        classification_summary = create_classification_summary(enhanced_analysis, language)
        
        return jsonify({
            'summary': analysis,
            'language': language,
            'classification': {
                'genre': enhanced_analysis['genre'],
                'period': enhanced_analysis['period'],
                'language_detected': enhanced_analysis['language']
            },
            'tabs': [
                {'name': 'Analysis', 'content': analysis},
                {'name': 'Classification', 'content': classification_summary},
                {'name': 'Cuneiform Words', 'content': "\n".join([f"• {word}" for word in enhanced_analysis['cuneiform_words'][:10]]) if enhanced_analysis['cuneiform_words'] else 'No words identified'},
                {'name': 'Status', 'content': f"AI: {'Available' if app_state.is_gemini_available() else 'Limited'}\nClassifier: {'Available' if CLASSIFIER_AVAILABLE else 'Limited'}\nProcessed: {len(text_data)} characters"}
            ]
        })
        
    except Exception as e:
        logger.error(f"Query endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    status = app_state.get_status()
    return jsonify({
        'status': 'healthy' if status['gemini_available'] else 'degraded',
        'gemini_available': status['gemini_available'],
        'classifier_available': status['classifier_available'],
        'ai_type': 'Gemini API + Advanced Classifier System',
        'loaded_models': status['loaded_models'],
        'last_error': status['last_error'],
        'timestamp': time.time()
    })

@app.route('/api/test-models', methods=['GET'])
def test_models():
    results = {}
    models_to_test = ["gemini-2.0-flash", "gemini-2.5-pro-preview-05-06"]
    
    for model_name in models_to_test:
        try:
            model = app_state.get_gemini_model(model_name)
            test_result = model.ask("Say 'Hello from " + model_name + "'", short_answer=True)
            results[model_name] = {'status': 'success', 'response': test_result}
        except Exception as e:
            results[model_name] = {'status': 'error', 'error': str(e)}
    
    try:
        genre_classifier = GenreClassifier()
        period_classifier = PeriodClassifier()
        
        test_text = "gur še barley silver"
        genre_result = genre_classifier.classify(test_text)
        period_result = period_classifier.classify(test_text)
        
        results['classifier'] = {
            'status': 'success',
            'genre_test': genre_result,
            'period_test': period_result
        }
    except Exception as e:
        results['classifier'] = {'status': 'error', 'error': str(e)}
    
    return jsonify({
        'overall_status': app_state.is_gemini_available(),
        'classifier_available': CLASSIFIER_AVAILABLE,
        'model_tests': results
    })

@app.route('/api/test-classifier', methods=['POST'])
def test_classifier():
    try:
        data = request.get_json()
        test_text = data.get('text', 'gur še barley silver mu us₂-sa')
        
        enhanced = enhanced_content_analysis(test_text)
        
        return jsonify({
            'status': 'success',
            'input_text': test_text,
            'enhanced_analysis': {
                'genre': enhanced['genre'],
                'period': enhanced['period'],
                'language': enhanced['language'],
                'content_type': enhanced['content_type'],
                'cuneiform_words_count': len(enhanced['cuneiform_words']),
                'economic_terms_count': len(enhanced['economic_terms']),
                'xml_content': enhanced['xml_content']
            },
            'classifier_available': CLASSIFIER_AVAILABLE
        })
        
    except Exception as e:
        logger.error(f"Classifier test error: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'classifier_available': CLASSIFIER_AVAILABLE
        }), 500

if __name__ == '__main__':
    logger.info("🚀 Starting Epigraph-AI server...")
    logger.info(f"🤖 AI Status: Initializing...")
    logger.info(f"📚 Classifier Status: {'Available' if CLASSIFIER_AVAILABLE else 'Fallback mode'}")
    port = int(os.environ.get("PORT", 10000))
    app.run(debug=True, port=port, host='0.0.0.0')