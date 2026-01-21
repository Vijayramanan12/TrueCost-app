import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())

load_dotenv()

from chatbot_service import get_chatbot

def test_chatbot():
    try:
        chatbot = get_chatbot()
        print("Chatbot initialized successfully.")
        
        # Test a simple query
        response = chatbot.chat("Hello! What's the EMI for 10L loan at 12% for 5 years?", user_id="test-user")
        print(f"AI Response (Calculations): {response}")
        
        # Test user loans retrieval
        print("\nTesting user loans retrieval...")
        response = chatbot.chat("What are my current loans?", user_id="test-user")
        print(f"AI Response (User Loans): {response}")

        # Test loan comparison
        print("\nTesting loan comparison...")
        response = chatbot.chat("Compare a 5L loan at 10% for 2 years vs 12% for 2 years.", user_id="test-user")
        print(f"AI Response (Comparison): {response}")

        # Test Bank Terms
        print("\nTesting AnalyzeBankTerms...")
        response = chatbot.chat("What are the current home loan rates for HDFC Bank?", user_id="test-user")
        print(f"AI Response (Bank Terms): {response}")

        # Test Rental Analysis
        print("\nTesting AnalyzeRentalListing...")
        listing = "3BHK for rent in Koramangala, Bangalore. Rent 65k, Maintenance 5k. Deposit 3L. 2 months notice."
        response = chatbot.chat(f"Analyze this listing: {listing}", user_id="test-user")
        print(f"AI Response (Rental): {response}")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_chatbot()
