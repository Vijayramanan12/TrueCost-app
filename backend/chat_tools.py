from typing import List
try:
    from langchain.tools import Tool
except ImportError:
    from langchain.tools.base import Tool
from loan_calculator import calculate_loan
from storage import storage
from ai_util import (
    analyze_rental_listing, 
    analyze_bank_loan_terms, 
    generate_loan_recommendations
)

class ChatTools:
    """
    Collection of financial analysis tools for the TrueCost AI Chatbot.
    """
    
    def get_tools(self) -> List[Tool]:
        """Return a list of LangChain Tools"""
        return [
            Tool(
                name="CalculateEMI",
                func=self.calculate_emi_tool,
                description="Calculate EMI for a loan. Input: 'amount,rate,tenure_months' (e.g., '500000,8.5,240' for ₹5L at 8.5% for 20 years)"
            ),
            Tool(
                name="GetUserLoans",
                func=self.get_user_loans_tool,
                description="Retrieve user's saved loan calculations. Input: user_id"
            ),
            Tool(
                name="CompareLoans",
                func=self.compare_loans_tool,
                description="Compare two loan options. Input: 'amount1,rate1,tenure1|amount2,rate2,tenure2'"
            ),
            Tool(
                name="FinancialAdvice",
                func=self.financial_advice_tool,
                description="Get general financial advice on topics like home loans, personal loans, credit scores, prepayments"
            ),
            Tool(
                name="AnalyzeRentalListing",
                func=self.analyze_rental_listing_tool,
                description="Analyze a rental property listing text to extract costs and details. Input: full listing text"
            ),
            Tool(
                name="AnalyzeBankTerms",
                func=self.analyze_bank_terms_tool,
                description="Get current interest rates and terms for a specific bank and loan type. Input: 'bank_name,loan_type' (e.g., 'SBI,home loan')"
            ),
            Tool(
                name="GenerateLoanTips",
                func=self.generate_loan_tips_tool,
                description="Generate personalized tips to save money on a loan. Input: 'principal,rate,tenure_months,emi' (e.g., '500000,9.5,180,5221')"
            ),
            Tool(
                name="SearchDocuments",
                func=self.search_documents_tool,
                description="Search user's uploaded documents (leases, agreements, etc.) for specific information. Input: 'user_id|search_query' (e.g., '123|rent increase clause')"
            )
        ]

    def calculate_emi_tool(self, input_str: str) -> str:
        """Calculate EMI for a loan. Input format: 'amount,rate,tenure_months'"""
        try:
            parts = input_str.split(',')
            amount = float(parts[0].strip())
            rate = float(parts[1].strip())
            tenure = int(parts[2].strip())
            
            result = calculate_loan({
                'principal': amount,
                'annual_rate': rate,
                'tenure_months': tenure
            })
            
            summary = result['summary']
            return f"EMI: ₹{summary['regular_payment']:,.2f}, Total Interest: ₹{summary['total_interest']:,.2f}, Total Payable: ₹{summary['total_cost']:,.2f}"
        except Exception as e:
            return f"Error calculating EMI: {str(e)}"

    def get_user_loans_tool(self, input_str: str) -> str:
        """Get user's saved loan calculations. Input: user_id"""
        try:
            user_id = input_str.strip()
            loans = storage.get_loan_calculations(user_id)
            if not loans:
                return "No saved loan calculations found."
            
            summary = f"Found {len(loans)} saved loan calculation(s):\n"
            for loan in loans[:5]:
                summary += f"- ₹{loan['amount']:,.0f} at {loan['rate']}% for {loan['tenure']} mo (EMI: ₹{loan['emi']:,.2f})\n"
            return summary
        except Exception as e:
            return f"Error: {str(e)}"

    def compare_loans_tool(self, input_str: str) -> str:
        """Compare two loan options. Input format: 'amount1,rate1,tenure1|amount2,rate2,tenure2'"""
        try:
            loan1_str, loan2_str = input_str.split('|')
            parts1 = [p.strip() for p in loan1_str.split(',')]
            parts2 = [p.strip() for p in loan2_str.split(',')]
            
            res1 = calculate_loan({'principal': float(parts1[0]), 'annual_rate': float(parts1[1]), 'tenure_months': int(parts1[2])})
            res2 = calculate_loan({'principal': float(parts2[0]), 'annual_rate': float(parts2[1]), 'tenure_months': int(parts2[2])})
            
            s1, s2 = res1['summary'], res2['summary']
            diff = abs(s1['total_interest'] - s2['total_interest'])
            
            return (f"Option 1: EMI ₹{s1['regular_payment']:,.2f}, Interest ₹{s1['total_interest']:,.2f}\n"
                    f"Option 2: EMI ₹{s2['regular_payment']:,.2f}, Interest ₹{s2['total_interest']:,.2f}\n"
                    f"Difference: ₹{diff:,.2f} in total interest.")
        except Exception as e:
            return f"Error: {str(e)}"

    def financial_advice_tool(self, input_str: str) -> str:
        """Provide general financial advice"""
        advice_db = {
            "home_loan": "Home loans in India range from 8-9.5%. Tenure can be up to 30 years. Tax benefits under 80C and 24b apply.",
            "personal_loan": "Personal loans are 10-20%. Short tenure (1-5 years). Use only for emergencies.",
            "credit_score": "Maintain 750+ for best loan rates. Avoid frequent inquiries and pay on time.",
            "prepayment": "Prepaying even 1 extra EMI per year can reduce tenure by years and save lakhs in interest."
        }
        query = input_str.lower()
        for key, val in advice_db.items():
            if key in query: return val
        return "Focus on minimizing total cost and maintaining a healthy debt-to-income ratio (<40%)."

    def analyze_rental_listing_tool(self, input_str: str) -> str:
        """Analyze a rental property listing"""
        try:
            result = analyze_rental_listing(input_str)
            if not result: return "Could not analyze listing."
            
            resp = f"Analysis of Rental Listing:\n"
            resp += f"- Rent: ₹{result.get('baseRent', 0):,.0f}\n"
            resp += f"- Maintenance: ₹{result.get('maintenance', 0):,.0f}\n"
            resp += f"- Deposit: ₹{result.get('oneTime', {}).get('deposit', 0):,.0f}\n"
            resp += f"- Notice Period: {result.get('metadata', {}).get('noticePeriodDays', 'N/A')} days\n"
            return resp
        except Exception as e:
            return f"Error: {str(e)}"

    def analyze_bank_terms_tool(self, input_str: str) -> str:
        """Analyze bank specific terms"""
        try:
            parts = input_str.split(',')
            bank = parts[0].strip()
            loan_type = parts[1].strip() if len(parts) > 1 else "home loan"
            
            result = analyze_bank_loan_terms(bank, loan_type)
            if not result: return f"Could not find specific terms for {bank}."
            
            rates = result.get('interest_rate_range', {})
            fees = result.get('processing_fee', {})
            return f"{bank} {loan_type}: Rate {rates.get('min')}-{rates.get('max')}% (Typical: {rates.get('typical')}%). Processing fee: {fees.get('description', 'N/A')}."
        except Exception as e:
            return f"Error: {str(e)}"

    def generate_loan_tips_tool(self, input_str: str) -> str:
        """Generate savings tips for a loan"""
        try:
            parts = input_str.split(',')
            params = {
                'principal': float(parts[0].strip()),
                'annual_rate': float(parts[1].strip()),
                'tenure_months': int(parts[2].strip()),
                'regular_payment': float(parts[3].strip())
            }
            result = generate_loan_recommendations(params)
            if not result: return "Could not generate recommendations."
            
            tips = "Loan Optimization Tips:\n"
            for tip in result.get('interest_savings_tips', [])[:3]:
                tips += f"- {tip['strategy']}: Save approx ₹{tip['potential_savings']:,.0f}\n"
            return tips
        except Exception as e:
            return f"Error: {str(e)}"
    
    def search_documents_tool(self, input_str: str) -> str:
        """Search user's uploaded documents using RAG"""
        try:
            # Import here to avoid circular dependency
            from rag_service import get_rag_service
            
            # Parse input: user_id|query
            if '|' not in input_str:
                return "Invalid input format. Expected 'user_id|search_query'"
            
            parts = input_str.split('|', 1)
            user_id = parts[0].strip()
            query = parts[1].strip()
            
            if not query:
                return "Search query cannot be empty"
            
            # Get RAG service and search
            rag = get_rag_service()
            chunks = rag.search_documents(user_id, query, top_k=3)
            
            if not chunks:
                return "No relevant information found in your uploaded documents. Please ensure you have uploaded documents to search through."
            
            # Format results with sources
            response = "Here's what I found in your documents:\n\n"
            for i, chunk in enumerate(chunks, 1):
                doc_name = chunk['metadata'].get('doc_name', 'Unknown')
                text = chunk['text'][:300] + ('...' if len(chunk['text']) > 300 else '')
                similarity = chunk.get('similarity', 0)
                
                response += f"{i}. From '{doc_name}' (relevance: {similarity:.1%}):\n{text}\n\n"
            
            return response
        except Exception as e:
            return f"Error searching documents: {str(e)}"
