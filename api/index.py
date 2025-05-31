# Enhanced backend with early quick preview and language-aware classification

from flask import Flask, request, jsonify
import asyncio
import json
from typing import Dict, Any
from flask_cors import CORS
import sys
import os
import signal
import threading

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Global processing tracker for cancellation support
active_requests = {}

try:
    from src.server.controller import extract_transliteration  # Local file
    from src.server.gemini import init_model                   # Local file
    print("✅ Successfully imported modules")
except ImportError as e:
    print(f"⚠️ Import error: {e}")
    # Mock functions for development
    def extract_transliteration(text, input_type):
        class MockResult:
            def __init__(self):
                self.Text = text
                self.Genre = "Mock inscription"
                self.Period = "Mock period"
        return MockResult()
    
    def init_model(model_name):
        class MockModel:
            def ask(self, text):
                if "2.0-flash" in model_name:
                    return f"Mock quick analysis in requested language."
                return f"Mock response from model {model_name}"
        return MockModel()

app = Flask(__name__)
CORS(app)

def generate(input_text, input_type):
    """Generate transliteration using controller"""
    return extract_transliteration(input_text, input_type)

def create_language_aware_prompts(language: str, analysis_type: str = "detailed") -> Dict[str, str]:
    """
    Create prompts based on user's language preference
    Returns dictionary with prompt templates for different analysis stages
    """
    
    if language == 'he':
        # Hebrew prompts
        prompts = {
            "quick_file": """
אתה מומחה בכתובות יתדות עתיקות וארכיאולוגיה. 
נתח במהירות את התוכן הבא ותן תשובה מיידית בעברית (1-2 משפטים):

{content}

זהה:
1. איזה סוג כתובת/תוכן זה
2. מה מעניין או חשוב בממצא הזה
3. איזו תקופה או תרבות (אם ניתן לזהות)

תשובה קצרה, מעניינת ומקצועית בעברית!
""",
            "quick_text": """
אתה מומחה בכתובות יתדות עתיקות וארכיאולוגיה.
נתח במהירות את הטקסט הבא: "{content}"

השב בעברית בקצרה (1-2 משפטים):
- מה זה (סוג כתובת/תוכן)?
- מה המשמעות או החשיבות שלו?

תשובה מקצועית וקצרה בעברית!
""",
            "short_summary": """
אתה מומחה בארכיאולוגיה ובכתובות יתדות עתיקות.
צור סיכום קצר ומעניין (1-2 משפטים) על הטקסט הבא:

{content}

השב בעברית בצורה נגישה וחוויתית.
""",
            "detailed_analysis": """
אתה חוקר מוביל בתחום הארכיאולוגיה והאשורולוגיה.
נתח בפירוט את הטקסט הבא:

{content}

בתגובתך כלול:
• הקשר היסטורי מפורט
• משמעות התוכן והחשיבות שלו
• מידע על התקופה והתרבות
• פרטים מעניינים ורלוונטיים

השב בעברית ברמה אקדמית אך נגישה, באורך של כ-200-300 מילים.
""",
            "genre_classification": """
נתח את הטקסט הבא וסווג אותו לקטגוריה אחת:

{content}

השב בעברית במילה אחת או שתיים בלבד - סוג הכתובת:
למשל: "כתובת מלכותית", "מסמך כלכלי", "טקסט דתי", "רשימה אדמיניסטרטיבית"
""",
            "period_classification": """
נתח את הטקסט הבא וזהה את התקופה ההיסטורית:

{content}

השב בעברית במילים מעטות בלבד - התקופה:
למשל: "תקופת אור השלישית", "התקופה הבבלית העתיקה", "התקופה האשורית"
"""
        }
    else:
        # English prompts
        prompts = {
            "quick_file": """
You are an expert in ancient cuneiform inscriptions and archaeology.
Quickly analyze the following content and provide an immediate response in English (1-2 sentences):

{content}

Identify:
1. What type of inscription/content is this
2. What is interesting or important about this finding
3. What period or culture (if identifiable)

Short, interesting and professional response in English!
""",
            "quick_text": """
You are an expert in ancient cuneiform inscriptions and archaeology.
Quickly analyze the following text: "{content}"

Respond in English briefly (1-2 sentences):
- What is this (type of inscription/content)?
- What is its meaning or significance?

Professional and concise response in English!
""",
            "short_summary": """
You are an expert in archaeology and ancient cuneiform inscriptions.
Create a short and interesting summary (1-2 sentences) about the following text:

{content}

Respond in English in an accessible and engaging manner.
""",
            "detailed_analysis": """
You are a leading researcher in archaeology and Assyriology.
Analyze in detail the following text:

{content}

Include in your response:
• Detailed historical context
• Meaning of the content and its importance
• Information about the period and culture
• Interesting and relevant details

Respond in English at an academic but accessible level, approximately 200-300 words.
""",
            "genre_classification": """
Analyze the following text and classify it into one category:

{content}

Respond in English with only one or two words - the type of inscription:
For example: "Royal inscription", "Economic document", "Religious text", "Administrative record"
""",
            "period_classification": """
Analyze the following text and identify the historical period:

{content}

Respond in English with just a few words - the period:
For example: "Ur III period", "Old Babylonian period", "Neo-Assyrian period"
"""
        }
    
    return prompts

def immediate_quick_preview(text: str, data_type: str, language: str = 'he') -> Dict[str, Any]:
    """
    IMMEDIATE quick preview - this runs FIRST before any other processing
    """
    try:
        print(f"⚡ IMMEDIATE quick preview starting for {data_type} in {language}...", flush=True)
        
        # Get language-aware prompts
        prompts = create_language_aware_prompts(language)
        
        # Use the fastest model available
        gemini_flash = init_model("gemini-2.0-flash-exp")
        
        # Select appropriate prompt based on data type
        if data_type == 'file':
            quick_prompt = prompts["quick_file"].format(content=text[:800])
        else:
            quick_prompt = prompts["quick_text"].format(content=text[:400])
        
        print(f"📝 Sending IMMEDIATE prompt to Gemini Flash in {language}...", flush=True)
        quick_result = gemini_flash.ask(quick_prompt)
        print(f"✅ Got IMMEDIATE result in {language}: {quick_result[:100]}...", flush=True)
        
        return {
            "status": "success",
            "preview": quick_result,
            "language": language
        }
        
    except Exception as e:
        print(f"❌ IMMEDIATE quick preview error: {e}", flush=True)
        # Language-aware fallback
        fallback_msg = (
            "מתחיל עיבוד מפורט של הכתובת..." 
            if language == 'he' 
            else "Starting detailed processing of the inscription..."
        )
        return {
            "status": "partial", 
            "preview": fallback_msg,
            "language": language
        }

def get_language_aware_classification(result_text: str, language: str) -> Dict[str, str]:
    """
    Get genre and period classification in the correct language
    """
    try:
        prompts = create_language_aware_prompts(language)
        
        # Use Flash model for quick classification
        gemini_flash = init_model("gemini-1.5-flash")
        
        # Get genre classification
        genre_prompt = prompts["genre_classification"].format(content=result_text[:1000])
        genre_result = gemini_flash.ask(genre_prompt)
        
        # Get period classification  
        period_prompt = prompts["period_classification"].format(content=result_text[:1000])
        period_result = gemini_flash.ask(period_prompt)
        
        print(f"🏷️ Got classification in {language} - Genre: {genre_result}, Period: {period_result}", flush=True)
        
        return {
            "genre": genre_result.strip(),
            "period": period_result.strip()
        }
        
    except Exception as e:
        print(f"⚠️ Classification error: {e}", flush=True)
        return {
            "genre": "לא זמין" if language == 'he' else "Not available",
            "period": "לא זמין" if language == 'he' else "Not available"
        }

@app.route("/api/query", methods=['POST']) 
def query():
    """Enhanced main API endpoint with IMMEDIATE quick preview and correct classification"""
    
    # Generate unique request ID for tracking
    import uuid
    request_id = str(uuid.uuid4())
    active_requests[request_id] = True
    
    try:
        data = request
        print(f"🔍 [{request_id}] Received request: {data}", flush=True)
        
        data_json = data.get_json(silent=True)
        if not data_json:
            return jsonify({"error": "Invalid or missing JSON"}), 400
        
        input_data = data_json['inputData']
        
        # Extract language preference (default to Hebrew)
        language = data_json.get('language', 'he')
        preferences = data_json.get('preferences', {})
        output_language = preferences.get('outputLanguage', language)
        
        print(f"📄 [{request_id}] Processing in language: {output_language}", flush=True)
        print(f"📄 [{request_id}] Input data received: {input_data}", flush=True)
        
        data_type = input_data.get('type', '')
        print(f"📋 [{request_id}] Data type: {data_type}", flush=True)
        
        # Check if request was cancelled
        if request_id not in active_requests or not active_requests[request_id]:
            print(f"🚫 [{request_id}] Request cancelled early", flush=True)
            return jsonify({"error": "Request cancelled"}), 499
        
        # Extract text content based on type
        if data_type == 'text':
            text = input_data.get('data', '')
            if not text or not isinstance(text, str):
                error_msg = "אין טקסט להעביר" if output_language == 'he' else "No text provided"
                return jsonify({"error": error_msg}), 400
            print(f"📝 [{request_id}] Processing text input: {text[:100]}...", flush=True)
            
        elif data_type == 'file' or data_type == 'camera':
            text = input_data.get('data', '')
            file_name = input_data.get('fileName', 'unknown_file')
            
            print(f"📁 [{request_id}] Processing file: {file_name}", flush=True)
            print(f"📏 [{request_id}] File content length: {len(text) if text else 0}", flush=True)
            
            if not text or not isinstance(text, str) or len(text.strip()) == 0:
                empty_msg = (
                    f"הקובץ '{file_name}' ריק או לא ניתן לקריאה" 
                    if output_language == 'he' 
                    else f"File '{file_name}' is empty or unreadable"
                )
                error_content = (
                    f"הקובץ '{file_name}' אינו מכיל טקסט הניתן לעיבוד"
                    if output_language == 'he'
                    else f"File '{file_name}' does not contain processable text"
                )
                return jsonify({
                    "summary": empty_msg,
                    "tabs": [
                        {"name": "שגיאה" if output_language == 'he' else "Error", "content": error_content}
                    ]
                })
            
            print(f"👁️ [{request_id}] File content preview: {text[:200]}...", flush=True)
            
        else:
            error_msg = f"סוג קלט לא ידוע: {data_type}" if output_language == 'he' else f"Unknown input type: {data_type}"
            return jsonify({"error": error_msg}), 400
        
        print(f"✅ [{request_id}] Final text for processing: {text[:100]}...", flush=True)
        
        # Check cancellation before IMMEDIATE preview
        if request_id not in active_requests or not active_requests[request_id]:
            print(f"🚫 [{request_id}] Request cancelled before immediate preview", flush=True)
            return jsonify({"error": "Request cancelled"}), 499
        
        # STEP 1: IMMEDIATE QUICK PREVIEW - runs FIRST
        immediate_preview_result = None
        try:
            print(f"⚡ [{request_id}] Starting IMMEDIATE quick preview in {output_language}...", flush=True)
            immediate_preview_result = immediate_quick_preview(text, data_type, output_language)
            print(f"✨ [{request_id}] IMMEDIATE preview completed: {immediate_preview_result}", flush=True)
        except Exception as e:
            print(f"⚠️ [{request_id}] IMMEDIATE preview failed: {e}", flush=True)
            immediate_preview_result = {
                "status": "error",
                "preview": "מתחיל עיבוד..." if output_language == 'he' else "Starting processing...",
                "language": output_language
            }
        
        # Check cancellation before main processing
        if request_id not in active_requests or not active_requests[request_id]:
            print(f"🚫 [{request_id}] Request cancelled before main processing", flush=True)
            return jsonify({"error": "Request cancelled"}), 499
        
        # STEP 2: Continue with main processing pipeline
        try:
            print(f"🔄 [{request_id}] Starting main analysis pipeline...", flush=True)
            result = generate(text, data_type)
            print(f"📊 [{request_id}] Analysis result: {result}", flush=True)
            print(f"🔍 [{request_id}] Result type: {type(result)}", flush=True)
        except Exception as e:
            print(f"❌ [{request_id}] Error in main analysis: {e}", flush=True)
            error_msg = f"שגיאה בעיבוד: {str(e)}" if output_language == 'he' else f"Processing error: {str(e)}"
            return jsonify({"error": error_msg}), 500
        
        # Check cancellation before classification
        if request_id not in active_requests or not active_requests[request_id]:
            print(f"🚫 [{request_id}] Request cancelled before classification", flush=True)
            return jsonify({"error": "Request cancelled"}), 499
        
        # Extract structured text from analysis result
        result_text = ""
        if hasattr(result, 'Text'):
            result_text = result.Text
        elif hasattr(result, 'text'):
            result_text = result.text
        elif isinstance(result, dict) and 'Text' in result:
            result_text = result['Text']
        elif isinstance(result, dict) and 'text' in result:
            result_text = result['text']
        else:
            print(f"⚠️ [{request_id}] Warning: Could not find text field in result: {type(result)}", flush=True)
            result_text = str(result)
        
        print(f"📄 [{request_id}] Extracted text for further processing: {result_text[:200]}...", flush=True)
        
        # STEP 3: Get language-aware classification
        try:
            print(f"🏷️ [{request_id}] Getting classification in {output_language}...", flush=True)
            classification = get_language_aware_classification(result_text, output_language)
            print(f"📋 [{request_id}] Classification completed: {classification}", flush=True)
        except Exception as e:
            print(f"⚠️ [{request_id}] Classification failed: {e}", flush=True)
            classification = {
                "genre": "לא זמין" if output_language == 'he' else "Not available",
                "period": "לא זמין" if output_language == 'he' else "Not available"
            }
        
        # Check cancellation before Gemini processing
        if request_id not in active_requests or not active_requests[request_id]:
            print(f"🚫 [{request_id}] Request cancelled before Gemini processing", flush=True)
            return jsonify({"error": "Request cancelled"}), 499
        
        # STEP 4: Create language-aware specialized prompts for deep analysis
        prompts = create_language_aware_prompts(output_language)
        
        if data_type in ['file', 'camera']:
            file_name = input_data.get('fileName', 'unknown_file')
            short_prompt = prompts["short_summary"].format(content=result_text)
            long_prompt = prompts["detailed_analysis"].format(content=result_text)
        else:
            short_prompt = prompts["short_summary"].format(content=result_text)
            long_prompt = prompts["detailed_analysis"].format(content=result_text)
        
        # Check cancellation before Gemini models
        if request_id not in active_requests or not active_requests[request_id]:
            print(f"🚫 [{request_id}] Request cancelled before Gemini models", flush=True)
            return jsonify({"error": "Request cancelled"}), 499
        
        # STEP 5: Initialize advanced models for comprehensive analysis
        try:
            print(f"🤖 [{request_id}] Initializing Gemini models for deep analysis in {output_language}...", flush=True)
            
            gemini_flash = init_model("gemini-1.5-flash")
            text_content_short = gemini_flash.ask(short_prompt)
            print(f"📝 [{request_id}] Short analysis completed in {output_language}: {text_content_short[:100]}...", flush=True)
            
            # Check cancellation between model calls
            if request_id not in active_requests or not active_requests[request_id]:
                print(f"🚫 [{request_id}] Request cancelled between model calls", flush=True)
                return jsonify({"error": "Request cancelled"}), 499
            
            gemini_pro = init_model("gemini-1.5-pro")
            text_content_long = gemini_pro.ask(long_prompt)
            print(f"📚 [{request_id}] Detailed analysis completed in {output_language}: {text_content_long[:100]}...", flush=True)
            
        except Exception as e:
            print(f"⚠️ [{request_id}] Error with advanced Gemini models: {e}", flush=True)
            # Language-aware fallback
            if output_language == 'he':
                text_content_short = "סיכום זמין"
                text_content_long = "ניתוח מפורט זמין"
            else:
                text_content_short = "Summary available"
                text_content_long = "Detailed analysis available"
        
        # Final cancellation check
        if request_id not in active_requests or not active_requests[request_id]:
            print(f"🚫 [{request_id}] Request cancelled before response", flush=True)
            return jsonify({"error": "Request cancelled"}), 499
        
        # STEP 6: Build comprehensive response with language support
        tab_names = {
            'he': {
                'genre': 'נושא',
                'period': 'תקופה', 
                'content': 'תוכן'
            },
            'en': {
                'genre': 'Subject',
                'period': 'Period',
                'content': 'Content'
            }
        }
        
        current_tab_names = tab_names.get(output_language, tab_names['he'])
        
        response_data = {
            "summary": text_content_short,
            "language": output_language,
            "tabs": [
                {
                    "name": current_tab_names['genre'], 
                    "content": classification["genre"]
                },
                {
                    "name": current_tab_names['period'], 
                    "content": classification["period"]
                },
                {
                    "name": current_tab_names['content'], 
                    "content": text_content_long
                }
            ]
        }
        
        # Include IMMEDIATE preview results
        if immediate_preview_result and immediate_preview_result.get("status") == "success":
            response_data["preprocessing"] = immediate_preview_result
            print(f"✅ [{request_id}] Including IMMEDIATE preview in response: {immediate_preview_result['preview'][:50]}...", flush=True)
        elif immediate_preview_result and immediate_preview_result.get("status") == "partial":
            response_data["preprocessing"] = immediate_preview_result
            print(f"⚠️ [{request_id}] Including partial preview in response", flush=True)
        
        print(f"📤 [{request_id}] Final response prepared in {output_language}: {response_data}", flush=True)
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"💥 [{request_id}] Unexpected error: {e}", flush=True)
        error_msg = f"שגיאה לא צפויה: {str(e)}" if 'he' in str(request.headers.get('Accept-Language', 'he')) else f"Unexpected error: {str(e)}"
        return jsonify({"error": error_msg}), 500
        
    finally:
        # Cleanup request tracking
        if request_id in active_requests:
            del active_requests[request_id]
        print(f"🧹 [{request_id}] Request cleanup completed", flush=True)

@app.route("/api/cancel/<request_id>", methods=['POST'])
def cancel_request(request_id):
    """Cancel a specific request"""
    if request_id in active_requests:
        active_requests[request_id] = False
        print(f"🚫 Request {request_id} marked for cancellation", flush=True)
        return jsonify({"status": "cancelled"})
    else:
        return jsonify({"status": "not_found"}), 404

@app.route("/api/health", methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "active_requests": len(active_requests),
        "server": "Epigraph-AI Backend v2.1 - Early Preview Edition"
    })

@app.route("/", methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({
        "message": "Epigraph-AI API is running",
        "version": "2.1",
        "endpoints": {
            "query": "/api/query",
            "health": "/api/health",
            "cancel": "/api/cancel/<request_id>"
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Enhanced Epigraph-AI server with IMMEDIATE preview...")
    print("📍 Server will run on http://127.0.0.1:5328")
    print("🌐 Language support: Hebrew (default) + English")
    print("🚫 Cancellation support: Enabled")
    print("⚡ IMMEDIATE Quick Preview: Enabled")
    app.run(debug=True, port=5328)