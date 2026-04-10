import json
import logging
from typing import Dict, Any, List
from pathlib import Path

import pdfplumber
from docx import Document

from utils.groq_engine import get_client
import config
from utils.retry_handler import retry_call

logger = logging.getLogger(__name__)

def extract_text(file_path: str) -> str:
    """Extract raw text from PDF or DOCX."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Resume file not found at {path}")
        
    ext = path.suffix.lower()
    text = ""
    
    if ext == ".pdf":
        try:
            with pdfplumber.open(str(path)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.error("Failed to parse PDF resume: %s", e)
            raise
            
    elif ext in [".docx", ".doc"]:
        try:
            doc = Document(str(path))
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            logger.error("Failed to parse DOCX resume: %s", e)
            raise
            
    else:
        raise ValueError(f"Unsupported resume format: {ext}. Only PDF and DOCX permitted.")
        
    return text.strip()

def parse_resume(file_path: str) -> Dict[str, Any]:
    """
    Extract text and use Groq to structure it into JSON.
    Expected output keys: name, email, phone, skills, experience, education, total_years_experience
    """
    raw_text = extract_text(file_path)
    if not raw_text:
        raise ValueError("No text could be extracted from the provided resume.")
        
    logger.info("Extracted %d characters of text from resume. Sending to AI for structurising...", len(raw_text))
    
    client = get_client()

    system_prompt = (
        "You are an expert resume parser. Extract the user's details from the given text "
        "and return a STRICT JSON object with these keys:\n"
        "- \"name\": String.\n"
        "- \"email\": String.\n"
        "- \"phone\": String.\n"
        "- \"skills\": List of core technical and soft skills.\n"
        "- \"experience\": List of objects (title, company, duration, description).\n"
        "- \"education\": List of objects (degree, institution, year).\n"
        "- \"total_years_experience\": Float indicating total years of professional experience."
    )

    def _call_groq():
        response = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Resume Text:\n{raw_text}"}
            ],
            temperature=0.1,  # Low temp for deterministic extraction
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        if not content:
             raise ValueError("Empty response from Groq parsing resume")
        return json.loads(content)

    try:
        result = retry_call(
            _call_groq,
            attempts=int(config.GROQ_RETRY_ATTEMPTS),
            backoff=config.GROQ_RETRY_BACKOFF,
            exceptions=(Exception,)
        )
        if result is None:
            raise ValueError("Groq failed to parse the resume after multiple attempts.")
        logger.info("✅ Successfully parsed resume for %s", result.get("name", "Unknown user"))
        return result
    except Exception as e:
        logger.error("Failed to parse resume with AI: %s", e)
        raise
