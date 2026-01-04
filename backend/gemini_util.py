import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    try:
        genai.configure(api_key=api_key)
        # Trying gemini-2.5-flash which may have separate quota limits
        model = genai.GenerativeModel('gemini-2.5-flash')
    except Exception as e:
        print(f"⚠️ Error configuring Gemini: {e}")
        model = None
else:
    model = None

def analyze_rental_listing(listing_text):
    """
    Analyzes a rental listing text to extract costs.
    If no API key is provided, returns demo data.
    """
    if not model:
        print("⚠️ Gemini API key missing. AI features disabled.")
        return None

    prompt = f"""
    Analyze the following rental listing text and extract cost details into a JSON object.

CONTEXT:
- Location: Urban India
- Standard: If a cost is mentioned as "included," set value to 0. 
- Defaults: If a cost is NOT mentioned, use -1 (this allows the backend to flag it for user input rather than guessing).

STRICT JSON SCHEMA:
{{
    "baseRent": number,
    "maintenance": number,
    "parking": number,
    "petFee": number,
    "utilities": {{
        "water": number,
        "electricity": "metered" | number,
        "internet": number,
        "trash": number
    }},
    "oneTime": {{
        "deposit": number,
        "appFee": number,
        "adminFee": number,
        "moveIn": number
    }},
    "metadata": {{
        "isDepositRefundable": boolean,
        "noticePeriodDays": number,
        "lockInPeriodMonths": number
    }},
    "confidenceScore": 0.0-1.0
}}

INPUT TEXT:
[PASTE LISTING HERE]
Do not infer, estimate, or guess missing values. Only transform explicitly stated information according to the rules above.
Return ONLY the JSON object. Do not include prose or explanations.
    
    Listing Text:
    {listing_text}
    """
    
    try:
        response = model.generate_content(prompt)
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"⚠️ Error during Gemini analysis: {e}")
        
    return None

def scan_lease_agreement(lease_text):
    """
    Analyzes a lease agreement for red flags and state rights.
    """
    if not model:
        print("⚠️ Gemini API key missing. AI features disabled.")
        return None

    prompt = f"""
    Analyze the following Indian rental agreement text and extract legal insights into a structured JSON object.

CONTEXT
	•	Jurisdiction: India
	•	The task is information extraction and legal insight identification, not legal advice.
	•	Do not infer, guess, or invent clauses that are not present in the text.
	•	Identify issues even if they are indirectly or euphemistically phrased (not exact keyword matches).

CRITERIA FOR ANALYSIS
	1.	Red Flags
Identify and list clauses that may be unfair, abusive, or illegal under Indian tenancy laws, including but not limited to:

	•	Arbitrary or unilateral eviction (e.g., "terminate at owner's discretion", "vacate on demand")
	•	Rent increase clauses allowing:
	•	More than 10% per year
	•	Unilateral or undefined increases (e.g., "as per market conditions")
	•	Security deposits that are:
	•	Non-refundable
	•	Disguised as "advance" or "adjustable" without clear refund terms
	•	Unreasonable restrictions on guests, family members, or overnight stays

	2.	Law Identification

	•	Extract the property location from the text.
	•	Map it to the most current applicable State Rent Control / Tenancy Act.
	•	If only a city is mentioned, infer the state from the city.
	•	If the location is insufficient to identify the state, set the law name accordingly.

STRICT JSON SCHEMA
{{
"red_flags": [
"Clause X: Description of why it is unfair or potentially illegal"
],
"law_name": "Full name of the applicable State Rent Act (most recent version)",
"key_protection": "One concise sentence describing the most important tenant protection under this law"
}}

RULES
	•	Do not add explanations, commentary, or suggestions.
	•	Do not provide legal advice.
	•	If no red flags are found, return an empty array for red_flags.
	•	Return ONLY the JSON object.

TEXT TO ANALYZE
[PASTE AGREEMENT TEXT HERE]
    
    Lease Text:
    {lease_text}
    """
    
    try:
        response = model.generate_content(prompt)
        
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"⚠️ Error during Gemini lease scan: {e}")
        
    return None
