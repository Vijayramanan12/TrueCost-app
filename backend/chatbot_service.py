"""
LangChain-based chatbot service with reasoning capabilities for TrueCost
Uses Groq LLM with ReAct agent pattern for financial advice and analysis
"""

import os
import logging
from typing import List, Dict, Any

# Set up logging
logger = logging.getLogger(__name__)

try:
    from langchain_groq import ChatGroq
    from langchain.agents import AgentExecutor, create_react_agent
    from langchain.tools import Tool
    from langchain.prompts import PromptTemplate
except ImportError as e:
    logger.error(f"❌ LangChain/Groq Import Error: {e}")
    # Direct fallback paths
    from langchain_groq.chat_models import ChatGroq
    from langchain.agents.agent_executor import AgentExecutor
    from langchain.agents.react.base import create_react_agent
    from langchain.tools.base import Tool
    from langchain.prompts.prompt import PromptTemplate

from langchain.memory import ConversationBufferWindowMemory
from chat_tools import ChatTools
import json

class TrueCostChatbot:
    def __init__(self, groq_api_key: str = None):
        """Initialize the chatbot with Groq LLM and custom tools"""
        api_key = groq_api_key or os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment")
        
        # Initialize Groq LLM
        self.llm = ChatGroq(
            api_key=api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=2000
        )
        
        # Create tools for the agent
        self.tools = self._create_tools()
        
        # Create agent prompt
        self.agent_prompt = self._create_agent_prompt()
        
    def _create_tools(self) -> List[Tool]:
        """Create custom tools for financial analysis"""
        chat_tools = ChatTools()
        return chat_tools.get_tools()
    
    def _create_agent_prompt(self) -> PromptTemplate:
        """Create the agent prompt template"""
        template = """You are **TrueCost AI**, a financial advisor for the Indian market. 
Focus: loans, rental property analysis, financial planning.

TOOLS
-----
Available tools:
{tools}

Tool Call Protocol:
Thought: do I need a tool?
Action: one of [{tool_names}]
Action Input: <input>
Observation: <tool output>

Response Protocol (no tool or final answer):
Thought: I now know the final answer
Final Answer: <response to user>

OPERATIONAL RULES
-----------------
• STRICTLY LIMIT scope to financial topics (Loans, Rent, Personal Finance, Indian Market).
• If the user asks a non-financial question (e.g., "What is ML?", "Write a poem", "Coding help"), politely decline.
  - Example Rejection: "I specialize exclusively in financial planning, loans, and rental analysis for the Indian market. How can I assist you with your finances today?"
• For loan calculations → Always call CalculateEMI.
• If a User ID is provided (e.g., [User ID: 123]) and user asks about “my loans” → Call GetUserLoans with that ID.
• If user mentions a specific bank (SBI, HDFC, ICICI, etc.) → Call AnalyzeBankTerms.
• If user provides a rental property listing text → Call AnalyzeRentalListing.
• Use Indian Rupees (₹) and Indian numbering conventions (lakhs, crores).

CONTEXTUAL EXPECTATIONS
-----------------------
• Indian context for regulations, lending practices, and terminology.
• Be professional, focused, and polite.
don't provide user_id in the response
• Begin execution immediately.

{chat_history}
Question: {input}
Thought: {agent_scratchpad}"""

        return PromptTemplate(
            template=template,
            input_variables=["input", "agent_scratchpad", "tools", "tool_names", "chat_history"]
        )
    
    def create_agent(self, chat_history_str: str = "") -> AgentExecutor:
        """Create a new agent instance"""
        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.agent_prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5,
            handle_parsing_errors=True
        )
    
    def chat(self, message: str, user_id: str = None, conversation_history: List[Dict] = None) -> str:
        """
        Process a user message and return AI response
        
        Args:
            message: User's message
            user_id: Optional user ID for personalized responses
            conversation_history: Optional previous messages for context
        
        Returns:
            AI response string
        """
        try:
            # Prepare chat history for the prompt
            context = ""
            if conversation_history:
                recent_history = conversation_history[-6:]  # Last 3 rounds
                for msg in recent_history:
                    role = "User" if msg['role'] == 'user' else "AI"
                    context += f"{role}: {msg['content']}\n"
            
            # Create agent executor
            agent_executor = self.create_agent()
            
            # Prepare input with user_id context
            user_context = f"[User ID: {user_id}] " if user_id else ""
            agent_input = f"{user_context}{message}"
            
            # Run the agent
            try:
                response = agent_executor.invoke({
                    "input": agent_input,
                    "chat_history": context
                })
                output = response.get('output', '')
                if "Agent stopped due to iteration limit" in output:
                    return "I'm sorry, I'm having trouble processing that request right now. Could you please rephrase or be more specific?"
                return output
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "rate limit" in error_msg.lower():
                     return "I'm currently receiving high traffic. Please wait a moment before trying again."
                if "Agent stopped due to iteration limit" in error_msg or "time limit" in error_msg:
                     return "I apologize, but I'm having a bit of trouble with that complex request. Could you try asking in a simpler way?"
                raise e
            
        except Exception as e:
            print(f"Chatbot error: {e}")
            error_msg = str(e)
            if "DAILY_LIMIT_REACHED" in error_msg:
                return "DAILY_LIMIT_REACHED"
            return f"I apologize, but I encountered an error. Please try again."

# Singleton instance
_chatbot_instance = None

def get_chatbot() -> TrueCostChatbot:
    """Get or create chatbot singleton instance"""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = TrueCostChatbot()
    return _chatbot_instance
