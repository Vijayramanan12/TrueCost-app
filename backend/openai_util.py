import os
from openai import OpenAI
from dotenv import load_dotenv
import json
import re

load_dotenv()

# Configure OpenAI
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    try:
        client = OpenAI(api_key=api_key)
        # Using gpt-4o-mini for efficient analysis
        model = "gpt-4o-mini"
    except Exception as e:
        print(f"⚠️ Error configuring OpenAI: {e}")
        client = None
else:
    client = None

def analyze_rental_listing(listing_text):
    """
    Analyzes a rental listing text using OpenAI to extract costs.
    """
    if not client:
        print("⚠️ OpenAI API key missing. AI features disabled.")
        return None

    prompt = f"""
Extract rental costs from this text into JSON. 
Rules: Use 0 for "included", -1 for unmentioned. Urban India context.

Schema:
{{
    "baseRent": number, "maintenance": number, "parking": number, "petFee": number,
    "utilities": {{ "water": number, "electricity": "metered"|number, "internet": number, "trash": number }},
    "oneTime": {{ "deposit": number, "appFee": number, "adminFee": number, "moveIn": number }},
    "metadata": {{ "isDepositRefundable": bool, "noticePeriodDays": number, "lockInPeriodMonths": number }},
    "confidenceScore": 0.0-1.0
}}

Listing:
{listing_text}
"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts rental data into JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ Error during OpenAI analysis: {e}")
        
    return None

def scan_lease_agreement(lease_text):
    """
    Analyzes a lease agreement for red flags and state rights using OpenAI.
    """
    if not client:
        print("⚠️ OpenAI API key missing. AI features disabled.")
        return None

    prompt = f"""
Analyze Indian rental agreement for legal insights.
Identify red flags: arbitrary eviction, rent hikes >10%, non-refundable deposits, guest restrictions.
Map city/property to applicable State Rent Act.

Output Schema:
{{
"red_flags": ["Description of unfair/illegal clause"],
"law_name": "Full name of State Rent Act",
"key_protection": "Main tenant protection under this law"
}}

Text:
{lease_text}
"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a legal document analyzer assistant."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ Error during OpenAI lease scan: {e}")
        
    return None
