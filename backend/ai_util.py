import os
from groq import Groq
from dotenv import load_dotenv
import json
import re
from datetime import datetime

# Load environment variables
# Look for .env in current dir and root
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Configure Groq
api_key = os.getenv("GROQ_API_KEY")
if api_key:
    try:
        client = Groq(api_key=api_key)
        # Using Llama 3 for high-speed, reliable extraction
        model = "llama-3.3-70b-versatile"
    except Exception as e:
        print(f"⚠️ Error configuring Groq: {e}")
        client = None
else:
    client = None

def analyze_rental_listing(listing_text):
    """
    Analyzes a rental listing text using Groq to extract costs.
    """
    if not client:
        print("⚠️ Groq API key missing. AI features disabled.")
        return None

    prompt = f"""
Extract rental costs and location details from this text into JSON. 
Rules: Use 0 for "included", -1 for unmentioned. Urban India context.

Schema:
{{
    "baseRent": number, "maintenance": number, "parking": number, "petFee": number,
    "utilities": {{ "water": number, "electricity": "metered"|number, "internet": number, "trash": number }},
    "oneTime": {{ "deposit": number, "appFee": number, "adminFee": number, "moveIn": number }},
    "metadata": {{ 
        "isDepositRefundable": bool, 
        "noticePeriodDays": number, 
        "lockInPeriodMonths": number,
        "neighborhood": string,
        "commuteTime": string
    }},
    "confidenceScore": 0.0-1.0
}}

Listing:
{listing_text}
"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a rental data extraction assistant. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ Error during Groq analysis: {e}")
        
    return None

def scan_lease_agreement(lease_text):
    """
    Analyzes a lease agreement for red flags and state rights using Groq.
    """
    if not client:
        print("⚠️ Groq API key missing. AI features disabled.")
        return None

    prompt = f"""
Analyze the following text from an uploaded document.

Tasks:
1.  **VERIFICATION**: First, determine if this document is a Lease Agreement, Rental Agreement, or Tenancy Contract.
    - If it is NOT a lease agreement (e.g., certificate, invoice, ID card, random text), return `{{"is_valid_lease": false, "message": "This appears to be a [Detected Type], not a lease agreement. Please upload a valid rental contract."}}`.
    - If it IS a lease, proceed to step 2.

2.  **Identify Red Flags**:
    - Arbitrary eviction clauses
    - Rent increases >10%/year
    - Non-refundable deposits
    - Unreasonable restrictions

3.  **Identify Applicable Law**:
    - Extract city/state
    - Map to specific Rent Control Act

Output Schema (for valid lease):
{{
    "is_valid_lease": true,
    "red_flags": ["Description of issue"],
    "law_name": "Applicable Act Name",
    "key_protection": "Key tenant right under this act"
}}

Output Schema (for invalid doc):
{{
    "is_valid_lease": false,
    "message": "Reason for rejection"
}}

Text:
{lease_text}
"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a legal document analyzer. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ Error during Groq lease scan: {e}")
        
    return None

def analyze_bank_loan_terms(bank_name, loan_type="home loan"):
    """
    Analyzes bank-specific loan terms and conditions using Groq AI.
    
    Args:
        bank_name: Name of the bank (e.g., "SBI", "HDFC Bank", "ICICI Bank")
        loan_type: Type of loan (e.g., "home loan", "personal loan", "car loan")
    
    Returns:
        Dictionary with bank-specific loan terms and insights
    """
    if not client:
        print("⚠️ Groq API key missing. AI features disabled.")
        return None

    current_date = datetime.now().strftime("%Y-%m-%d")

    system_prompt = """You are a financial analyst expert in Indian banking products.
    Analyze the provided bank and loan type.
    Provide a structured JSON response with interest rate range, processing fees, tenure options, and key terms.
    Output ONLY valid JSON."""

    user_prompt = f"""
    Analyze the {loan_type} offered by {bank_name} in India.
    Current Date: {current_date}.

    Provide the most up-to-date details available publicly or generally known for this bank as of {current_date}.
    If exact current rates are not available, provide the most recent known rates and explicitly mention they are estimates.

    Return a JSON object with this EXACT structure:
    {{
        "bank_name": "{bank_name}",
        "loan_type": "{loan_type}",
        "interest_rate_range": {{
            "min": number,
            "max": number,
            "typical": number
        }},
        "processing_fee": {{
            "percentage": number,
            "min_amount": number,
            "max_amount": number,
            "description": string
        }},
        "prepayment_charges": {{
            "applicable": boolean,
            "percentage": number,
            "conditions": string
        }},
        "tenure": {{
            "min_months": number,
            "max_months": number
        }},
        "hidden_costs": [
            {{
                "name": string,
                "typical_amount": number,
                "description": string
            }}
        ],
        "favorable_terms": [string],
        "eligibility": {{
            "min_income": number,
            "min_credit_score": number,
            "documents_required": [string]
        }},
        "special_features": [string],
        "last_updated": string
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ Error during bank analysis: {e}")
        
    return None

def generate_loan_recommendations(loan_params, bank_analysis=None, user_profile=None):
    """
    Generate personalized loan recommendations using Groq AI.
    
    Args:
        loan_params: Dictionary with loan calculation results
        bank_analysis: Optional bank-specific analysis results
        user_profile: Optional user financial profile
    
    Returns:
        Dictionary with personalized recommendations
    """
    if not client:
        print("⚠️ Groq API key missing. AI features disabled.")
        return None

    # Build context for AI
    context = f"""
Loan Details:
- Principal: ₹{loan_params.get('principal', 0):,.2f}
- Interest Rate: {loan_params.get('annual_rate', 0)}% per annum
- Tenure: {loan_params.get('tenure_months', 0)} months
- Payment Frequency: {loan_params.get('payment_frequency', 'monthly')}
- Monthly Payment: ₹{loan_params.get('regular_payment', 0):,.2f}
- Total Interest: ₹{loan_params.get('total_interest', 0):,.2f}
- Total Cost: ₹{loan_params.get('total_cost', 0):,.2f}
"""

    if bank_analysis:
        context += f"""
Bank Information ({bank_analysis.get('bank_name', 'N/A')}):
- Typical Interest Range: {bank_analysis.get('interest_rate_range', {}).get('min', 0)}-{bank_analysis.get('interest_rate_range', {}).get('max', 0)}%
- Processing Fee: {bank_analysis.get('processing_fee', {}).get('percentage', 0)}%
- Prepayment Allowed: {'Yes' if not bank_analysis.get('prepayment_charges', {}).get('applicable', True) else 'Yes, with charges'}
"""

    if user_profile:
        context += f"""
User Profile:
- Monthly Income: ₹{user_profile.get('monthly_income', 0):,.2f}
- Credit Score: {user_profile.get('credit_score', 'Not provided')}
- Loan Purpose: {user_profile.get('loan_purpose', 'Not specified')}
"""

    prompt = f"""
Based on the following loan scenario, provide personalized financial recommendations:

{context}

Provide actionable advice on:
1. **Interest Savings**: How to reduce total interest paid
2. **Tenure Optimization**: Should they increase/decrease tenure?
3. **Extra Payments**: Impact of making extra payments
4. **Refinancing**: When to consider refinancing
5. **Affordability**: Is this loan comfortable for their income?
6. **Prepayment Strategy**: Optimal prepayment approach
7. **Red Flags**: Any concerns with current terms
8. **Alternative Options**: Better loan structures to consider

Output Schema:
{{
    "overall_assessment": {{
        "affordability_rating": "excellent|good|moderate|risky",
        "recommendation": "proceed|reconsider|negotiate",
        "key_concern": string
    }},
    "interest_savings_tips": [
        {{
            "strategy": string,
            "potential_savings": number,
            "difficulty": "easy|moderate|hard"
        }}
    ],
    "tenure_recommendation": {{
        "current_tenure_months": number,
        "recommended_tenure_months": number,
        "reasoning": string,
        "impact": string
    }},
    "extra_payment_analysis": {{
        "recommended_extra_monthly": number,
        "time_saved_months": number,
        "interest_saved": number,
        "reasoning": string
    }},
    "prepayment_strategy": {{
        "when_to_prepay": string,
        "how_much": number,
        "expected_benefit": string
    }},
    "refinancing_advice": {{
        "should_consider": boolean,
        "when": string,
        "potential_rate": number,
        "reasoning": string
    }},
    "red_flags": [string],
    "quick_wins": [string],
    "long_term_strategy": string
}}
"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a certified financial advisor specializing in loan optimization for Indian consumers. Provide practical, actionable advice. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ Error generating recommendations: {e}")
        
    return None
