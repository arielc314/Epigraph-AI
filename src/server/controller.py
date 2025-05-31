# api/Classifier/controller.py

from classifier import GenreClassifier, PeriodClassifier
import re
import xml.etree.ElementTree as ET


class TransliterationResult:
    def __init__(self, text, genre, period, structured_data):
        self.Text = text
        self.Genre = genre
        self.Period = period
        self.StructuredData = structured_data
    
    def __str__(self):
        return f"Genre: {self.Genre}, Period: {self.Period}, Data: {self.StructuredData}"

def analyze_cuneiform_text(text):
    """
    ניתוח מעמיק של טקסט כתובת יתדות כולל ניתוח XML
    """
    analysis = {
        "language": "unknown",
        "script_type": "cuneiform",
        "content_type": "unknown",
        "key_terms": [],
        "names": [],
        "numbers": [],
        "dates": [],
        "economic_terms": [],
        "administrative_terms": [],
        "cuneiform_words": [],
        "xml_content": False
    }
    
    # בדוק אם זה XML
    if text.strip().startswith('<?xml') or '<TEI' in text:
        analysis["xml_content"] = True
        extracted_words = extract_words_from_xml(text)
        analysis["cuneiform_words"] = extracted_words
        
        # נתח את המילים שחילצנו
        analysis = analyze_extracted_words(analysis, extracted_words)
    
    # זיהוי שפה
    if "%sux" in text:
        analysis["language"] = "שומרית"
    elif "%akk" in text:
        analysis["language"] = "אכדית"
    elif any(word in text.lower() for word in ["neo-assyrian", "assyrian"]):
        analysis["language"] = "אשורית"
    elif "babylonian" in text.lower():
        analysis["language"] = "בבלית"
    
    # חיפוש מונחים כלכליים
    economic_terms = ["gur", "še", "barley", "silver", "gold", "iku", "maš", "HA.LAM"]
    for term in economic_terms:
        if term in text:
            analysis["economic_terms"].append(term)
    
    # חיפוש מספרים
    numbers = re.findall(r'\b\d+(?:\.\d+)*\b', text)
    analysis["numbers"] = numbers
    
    # זיהוי סוג תוכן מתקדם
    if analysis["cuneiform_words"]:
        analysis["content_type"] = determine_content_type_from_words(analysis["cuneiform_words"])
    elif analysis["economic_terms"]:
        analysis["content_type"] = "כלכלי"
    
    return analysis

def extract_words_from_xml(xml_text):
    """
    חילוץ מילים מקובץ XML TEI
    """
    words = []
    try:
        # נקה את ה-XML מרווחים מיותרים
        cleaned_xml = re.sub(r'\s+', ' ', xml_text)
        
        # חלץ כל התוכן של תגי <w>
        word_pattern = r'<w[^>]*>(.*?)</w>'
        found_words = re.findall(word_pattern, cleaned_xml, re.DOTALL)
        
        for word in found_words:
            # נקה מתגי HTML ותווים מיותרים
            clean_word = re.sub(r'<[^>]+>', '', word).strip()
            # הסר סוגריים מרובעים ונקודות
            clean_word = re.sub(r'[\[\]\.]+', '', clean_word)
            if clean_word and clean_word not in ['...', 'x', '']:
                words.append(clean_word)
        
        # אם לא מצאנו מילים בתגי <w>, נחפש בתגי <l>
        if not words:
            line_pattern = r'<l[^>]*>(.*?)</l>'
            found_lines = re.findall(line_pattern, cleaned_xml, re.DOTALL)
            for line in found_lines:
                # חלץ טקסט מבין התגים
                text_only = re.sub(r'<[^>]+>', ' ', line)
                line_words = text_only.split()
                for word in line_words:
                    clean_word = re.sub(r'[\[\]\.]+', '', word).strip()
                    if clean_word and len(clean_word) > 1:
                        words.append(clean_word)
        
    except Exception as e:
        print(f"Error parsing XML: {e}")
    
    return words

def analyze_extracted_words(analysis, words):
    """
    ניתוח המילים שחולצו מה-XML
    """
    # בדוק מונחים אשוריים/אכדיים
    assyrian_terms = ["šu₂", "TUK", "KUR", "IGI", "DAM", "TUR₃", "UMUŠ"]
    sumerian_terms = ["NIG₂", "HA.LAM", "ME", "TI"]
    
    for word in words:
        if any(term in word for term in assyrian_terms):
            analysis["language"] = "אשורית/אכדית"
        if any(term in word for term in sumerian_terms):
            if analysis["language"] == "unknown":
                analysis["language"] = "שומרית"
            else:
                analysis["language"] = "אשורית-שומרית מעורבת"
    
    return analysis

def determine_content_type_from_words(words):
    """
    קביעת סוג התוכן על בסיס המילים
    """
    # מונחים משפטיים
    legal_terms = ["DAM", "TUK", "NU"]  # אישה, יש, לא
    
    # מונחים דתיים
    religious_terms = ["DINGIR", "AN", "EN"]
    
    # מונחים כלכליים
    economic_terms = ["HA.LAM", "NIG₂", "GUR"]
    
    word_text = " ".join(words).upper()
    
    if any(term in word_text for term in legal_terms):
        return "משפטי/משפחתי"
    elif any(term in word_text for term in economic_terms):
        return "כלכלי"
    elif any(term in word_text for term in religious_terms):
        return "דתי"
    else:
        return "אדמיניסטרטיבי"

def extract_transliteration(input_text, input_type):
    """
    חילוץ מידע מכתובת יתדות עם ניתוח מעמיק
    """
    print(f"מעבד סוג קלט: {input_type}")
    print(f"אורך טקסט: {len(input_text)}")
    
    try:
        # ניתוח מעמיק של הטקסט
        analysis = analyze_cuneiform_text(input_text)
        
        # יצירת מודלים (mock לעת עתה)
        genre_classifier = GenreClassifier()
        period_classifier = PeriodClassifier()
        
        # סיווג
        genre = genre_classifier.classify(input_text)
        period = period_classifier.classify(input_text)
        
        # יצירת טקסט מובנה לGemini
        structured_summary = create_structured_summary(analysis, input_text)
        
        result = TransliterationResult(
            text=structured_summary,  # כאן אנו שולחים את הסיכום המובנה
            genre=genre,
            period=period,
            structured_data=analysis
        )
        
        print(f"סיווג הושלם - ז׳אנר: {genre}, תקופה: {period}")
        
        return result
        
    except Exception as e:
        print(f"שגיאה ב-extract_transliteration: {e}")
        return TransliterationResult(
            text="שגיאה בעיבוד הטקסט",
            genre="שגיאה בסיווג",
            period="תקופה לא ידועה",
            structured_data={}
        )

def create_structured_summary(analysis, original_text):
    """
    יצירת סיכום מובנה משופר
    """
    summary_parts = []
    
    # מידע על שפה וסקריפט
    if analysis["language"] != "unknown":
        summary_parts.append(f"שפת הכתובת: {analysis['language']}")
    
    # מידע על מילים שחולצו מה-XML
    if analysis["cuneiform_words"]:
        words_sample = ", ".join(analysis["cuneiform_words"][:10])
        summary_parts.append(f"מילים בכתב יתדות שזוהו: {words_sample}")
        
        if len(analysis["cuneiform_words"]) > 10:
            summary_parts.append(f"סה\"כ {len(analysis['cuneiform_words'])} מילים זוהו בכתובת")
    
    # מידע על תוכן כלכלי
    if analysis["economic_terms"]:
        terms_str = ", ".join(analysis["economic_terms"])
        summary_parts.append(f"מונחים כלכליים: {terms_str}")
    
    # סוג התוכן
    if analysis["content_type"] != "unknown":
        summary_parts.append(f"סוג התוכן: {analysis['content_type']}")
    
    # הוספת המילים לטקסט הסופי
    if analysis["cuneiform_words"]:
        cuneiform_text = "\n".join([f"• {word}" for word in analysis["cuneiform_words"]])
        structured_text = f"""
כתובת יתדות אמיתית לניתוח:

מילים בכתב יתדות שזוהו:
{cuneiform_text}

מידע מובנה:
""" + "\n".join([f"• {part}" for part in summary_parts])
    else:
        structured_text = """
כתובת יתדות לניתוח:

מידע מובנה:
""" + "\n".join([f"• {part}" for part in summary_parts])
    
    structured_text += f"""

בקשה: אנא ספק ניתוח מקצועי ומפורט של כתובת יתדות זו בעברית, כולל:
1. הקשר היסטורי ותרבותי
2. ניתוח לשוני של המילים האכדיות/שומריות
3. משמעות התוכן והחשיבות הארכיאולוגית
4. פרטים על התקופה והמקום
5. השוואה לכתובות דומות
"""
    
    return structured_text