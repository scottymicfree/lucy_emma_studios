import numpy as np
import io
import cv2

try:
    import pytesseract
except ImportError:
    pytesseract = None

class OCRProcessor:
    """
    Real-time OCR parsing from screen buffers using Tesseract.
    Provides full-screen, region-based, and UI element detection.
    """
    def __init__(self, tesseract_cmd: str = None):
        if pytesseract and tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def extract_text(self, image_buffer: np.ndarray) -> list:
        """
        Parses a raw numpy array screen buffer to extract text bounding boxes.
        Returns a list of dicts with 'text', 'bbox', and 'confidence'.
        """
        if not pytesseract:
            return []
            
        data = pytesseract.image_to_data(image_buffer, output_type=pytesseract.Output.DICT)
        parsed = []
        n_boxes = len(data['level'])
        for i in range(n_boxes):
            text = data['text'][i].strip()
            conf = data['conf'][i]
            if text and float(conf) > 0:
                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                parsed.append({
                    "bbox": [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
                    "text": text,
                    "confidence": float(conf) / 100.0,
                    "center": (x + w // 2, y + h // 2)
                })
        return parsed

    def extract_region(self, image_buffer: np.ndarray, x: int, y: int, w: int, h: int) -> str:
        """Extracts text from a specific screen region."""
        if not pytesseract:
            return ""
        roi = image_buffer[y:y+h, x:x+w]
        return pytesseract.image_to_string(roi).strip()

    def detect_ui_elements(self, image_buffer: np.ndarray) -> list:
        """Detects buttons, text boxes, and UI elements using Canny edge detection."""
        gray = cv2.cvtColor(image_buffer, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        elements = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if 20 < w < 400 and 10 < h < 100: # Typical UI element dimensions
                elements.append({
                    "type": "ui_element",
                    "bbox": [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
                    "center": (x + w // 2, y + h // 2)
                })
        return elements

    def build_prompt_context(self, image_buffer: np.ndarray) -> str:
        """Generates a text-based semantic map of the screen for Llama context."""
        texts = self.extract_text(image_buffer)
        elements = self.detect_ui_elements(image_buffer)
        
        context = "<visual_context>\n"
        context += "Detected Text:\n"
        for t in texts:
            context += f"- \"{t['text']}\" at {t['center']} (conf: {t['confidence']:.2f})\n"
        
        context += f"\nDetected {len(elements)} structural UI elements.\n"
        context += "</visual_context>"
        return context
