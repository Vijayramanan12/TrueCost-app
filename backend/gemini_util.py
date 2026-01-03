import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def analyze_rental_listing(listing_text):
    """
    Analyzes a rental listing text to extract costs.
    If no API key is provided, returns demo data.
    """
    if not model:
        # Mock behavior for dev without key
        return {
            "baseRent": 45000,
            "parking": 2000,
            "petFee": 500,
            "utilities": {"water": 400, "electricity": 3500, "internet": 800, "trash": 200},
            "oneTime": {"deposit": 90000, "appFee": 0, "adminFee": 2500, "moveIn": 0}
        }

    prompt = f"""
    Analyze the following rental listing text and extract the cost details in JSON format.
    Return ONLY a JSON object with these exact keys:
    "baseRent" (number), "parking" (number), "petFee" (number), 
    "utilities" (object with "water", "electricity", "internet", "trash" numbers),
    "oneTime" (object with "deposit", "appFee", "adminFee", "moveIn" numbers).
    
    If a value is not found, use a reasonable default based on typical Indian urban rentals.
    
    Listing Text:
    {listing_text}
    """
    
    response = model.generate_content(prompt)
    
    # Extract JSON from response
    try:
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        
    return None

def scan_lease_agreement(lease_text):
    """
    Analyzes a lease agreement for red flags and state rights.
    """
    if not model:
        return {
            "red_flags": ["Excessive security deposit", "Lack of maintenance clauses"],
            "law_name": "Rent Control Act 1999",
            "key_protection": "Standard rent fixation"
        }

    prompt = f"""
    Analyze this Indian rental agreement text for:
    1. Legal 'red flags' or unfair clauses (at least 3).
    2. The applicable state law (e.g., Maharashtra Rent Control Act).
    3. The key legal protection this law provides the tenant.
    
    Return ONLY a JSON object with these keys:
    "red_flags" (list of strings), "law_name" (string), "key_protection" (string).
    
    Lease Text:
    {lease_text}
    """
    
    response = model.generate_content(prompt)
    
    try:
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        
    return None
