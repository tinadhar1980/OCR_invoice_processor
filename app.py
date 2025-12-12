import os
import re
import json
import base64
import time
import easyocr
from io import BytesIO
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from dateutil import parser as dateparse
from openai import OpenAI
from PIL import Image
import fitz  # PyMuPDF for PDF handling

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'temp_uploads'

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize OpenAI and EasyOCR
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

reader = easyocr.Reader(['en', 'sv'], gpu=False)  # Set to True if you have CUDA GPU
MODEL_NAME = "gpt-4o-mini"  # Vision-capable model for better accuracy

# Allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'bmp', 'webp', 'tiff'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_prompt_template():
    prompt_path = "prompts/invoice_prompt.txt"
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        # Default prompt if file doesn't exist
        return """Extract all invoice information from the following OCR text and return it as a JSON object.

Include these fields:
- invoice_number
- invoice_date
- due_date
- vendor_name
- vendor_address
- customer_name
- customer_address
- subtotal
- tax_amount
- tax_rate
- total_amount
- currency
- line_items (array of {description, quantity, unit_price, total})

OCR Text:
<<OCR_TEXT>>

Return only valid JSON."""

def pdf_to_image(pdf_path):
    """Convert PDF to single image (first page or merged)"""
    try:
        doc = fitz.open(pdf_path)
        
        # For simplicity, we'll convert the first page
        # You can modify this to merge multiple pages
        page = doc[0]
        
        # Render page to image at high resolution
        mat = fitz.Matrix(2, 2)  # 2x zoom for better quality
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PIL Image
        img_data = pix.tobytes("png")
        img = Image.open(BytesIO(img_data))
        
        # Save as temporary image
        temp_img_path = pdf_path.replace('.pdf', '_converted.png')
        img.save(temp_img_path, 'PNG')
        
        doc.close()
        return temp_img_path
    except Exception as e:
        print(f"PDF conversion error: {e}")
        return None

def ocr_image(img_path):
    """Extract text from image using EasyOCR"""
    try:
        text = reader.readtext(img_path, detail=0, paragraph=True)
        return "\n".join(text)
    except Exception as e:
        print(f"OCR error: {e}")
        return ""

def clean_ocr_text(s):
    """Clean OCR text"""
    return re.sub(r"[\t\r]", " ", s).strip()

def normalize_amount(val):
    """Normalize amount to float"""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).replace(" ", "").replace(",", ".")
    s = re.sub(r"[^0-9.]", "", s)
    try:
        return float(s)
    except:
        return None

def normalize_date(val):
    """Normalize date to YYYY-MM-DD format"""
    if not val:
        return None
    try:
        dt = dateparse.parse(val, dayfirst=True, fuzzy=True)
        return dt.strftime("%Y-%m-%d")
    except:
        return None

def extract_json(response_text):
    """Extract JSON from OpenAI response"""
    match = re.search(r"\{.*\}", response_text, re.S)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except:
        return None

def call_openai(ocr_text, image_path=None):
    """Call OpenAI API to extract invoice data with vision"""
    template = load_prompt_template()
    prompt = template.replace("<<OCR_TEXT>>", ocr_text)

    for attempt in range(3):
        try:
            # If image provided, use vision capabilities
            if image_path and os.path.exists(image_path):
                # Encode image to base64
                with open(image_path, "rb") as img_file:
                    img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                
                # Get image extension
                ext = image_path.split('.')[-1].lower()
                mime_type = f"image/{ext}" if ext != 'jpg' else "image/jpeg"
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",  # Use vision model
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{img_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    temperature=0.1
                )
            else:
                # Text only fallback
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1
                )
            
            raw = response.choices[0].message.content
            return raw
        except Exception as e:
            print(f"OpenAI error (attempt {attempt+1}/3): {e}")
            time.sleep(2)
    return None

def process_invoice_file(file_path):
    """Process invoice file and extract data"""
    start_time = time.time()
    
    # Convert PDF to image if needed
    if file_path.lower().endswith('.pdf'):
        img_path = pdf_to_image(file_path)
        if not img_path:
            return {'error': 'Failed to convert PDF to image'}
    else:
        img_path = file_path
    
    # Perform OCR
    ocr_text = clean_ocr_text(ocr_image(img_path))
    
    if not ocr_text:
        return {'error': 'No text extracted from image'}
    
    # Calculate OCR confidence (mock for now)
    ocr_confidence = min(95, max(70, len(ocr_text) // 10))
    
    # Call OpenAI with both OCR text and image for better accuracy
    raw_response = call_openai(ocr_text, img_path)
    
    if raw_response is None:
        return {'error': 'Failed to process with OpenAI'}
    
    data = extract_json(raw_response)
    
    if not data:
        return {'error': 'Invalid JSON response from AI'}
    
    # Normalize fields
    data["invoice_date"] = normalize_date(data.get("invoice_date"))
    data["due_date"] = normalize_date(data.get("due_date"))
    data["subtotal"] = normalize_amount(data.get("subtotal"))
    data["tax_amount"] = normalize_amount(data.get("tax_amount"))
    data["tax_rate"] = normalize_amount(data.get("tax_rate"))
    data["total_amount"] = normalize_amount(data.get("total_amount"))
    
    # Calculate processing time
    processing_time = round(time.time() - start_time, 2)
    
    # Return complete result
    return {
        'success': True,
        'invoice_data': data,
        'ocr_text': ocr_text,
        'ocr_confidence': ocr_confidence,
        'processing_time': processing_time,
        'character_count': len(ocr_text)
    }

@app.route('/')
def index():
    return render_template('invoice_index.html')

@app.route('/api/process', methods=['POST'])
def process_invoice():
    """API endpoint to process uploaded invoice"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the invoice
        result = process_invoice_file(filepath)
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
            # Remove converted PDF image if exists
            if filepath.lower().endswith('.pdf'):
                converted_path = filepath.replace('.pdf', '_converted.png')
                if os.path.exists(converted_path):
                    os.remove(converted_path)
        except:
            pass
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)


