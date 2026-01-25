"""
LangChain-based chatbot service with reasoning capabilities for TrueCost
Uses Groq LLM with ReAct agent pattern for financial advice and analysis
"""

import os
import logging
import time
from typing import List, Dict, Any

# Set up logging
logger = logging.getLogger(__name__)

# Ultra-robust direct imports for LangChain
try:
    import langchain
    logger.info(f"⚙️ LangChain version: {getattr(langchain, '__version__', 'unknown')}")
    
    # Try direct submodule imports which are more stable across 0.2/0.3
    try:
        from langchain.agents.agent_executor import AgentExecutor
    except ImportError:
        try:
            from langchain.agents import AgentExecutor
        except ImportError:
            AgentExecutor = None
            
    try:
        from langchain.agents.react.base import create_react_agent
    except ImportError:
        try:
            from langchain.agents import create_react_agent
        except ImportError:
            create_react_agent = None

    from langchain_core.tools import Tool
    from langchain_core.prompts import PromptTemplate
    from langchain_groq import ChatGroq
    
    if AgentExecutor and create_react_agent:
        logger.info("✅ LangChain modules loaded via direct paths")
    else:
        logger.error(f"❌ Missing: AgentExecutor={bool(AgentExecutor)}, create_react_agent={bool(create_react_agent)}")
        
except Exception as e:
    logger.error(f"❌ LangChain core boot failure: {e}")
    AgentExecutor = None
    create_react_agent = None
    Tool = object 
    PromptTemplate = None
    ChatGroq = None

from chat_tools import ChatTools
import json

class TrueCostChatbot:
    def __init__(self, groq_api_key: str = None):
        """Initialize the chatbot with Groq LLM and custom tools"""
        api_key = groq_api_key or os.getenv('GROQ_API_KEY')
        if not api_key:
            logger.error("❌ GROQ_API_KEY not found in environment!")
            raise ValueError("GROQ_API_KEY not found in environment")
        
        logger.info("🔑 GROQ_API_KEY detected.")
        
        # Initialize Groq LLM with faster, rate-limit-friendly model
        # llama-3.1-8b-instant has much higher rate limits than 70b models
        self.llm = ChatGroq(
            api_key=api_key,
            model_name="llama-3.1-8b-instant",
            temperature=0.5,  # Lower temperature for faster, more focused responses
            max_tokens=1024   # Smaller response for speed
        )
        
        # Create tools for the agent
        self.tools = self._create_tools()
        
        # Create agent prompt
        self.agent_prompt = self._create_agent_prompt()
        
        # Rate limiting tracking
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Minimum 1 second between requests
        
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
• If a User ID is provided (e.g., [User ID: 123]) and user asks about "my loans" → Call GetUserLoans with that ID.
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
    
    def create_agent(self, chat_history_str: str = "") -> Any:
        """Create a new agent instance"""
        if not AgentExecutor or not create_react_agent:
            logger.error("🛑 Cannot create agent: LangChain components missing")
            return None

        try:
            agent = create_react_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=self.agent_prompt
            )
            
            return AgentExecutor(
                agent=agent,
                tools=self.tools,
                verbose=True,  # Disable verbose to reduce latency
                max_iterations=5,  # Reduce iterations for faster responses
                handle_parsing_errors=True
            )
        except Exception as e:
            logger.error(f"❌ Failed to initialize AgentExecutor: {e}")
            return None
    
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
            # Rate limiting - wait if needed
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            if time_since_last < self.min_request_interval:
                time.sleep(self.min_request_interval - time_since_last)
            self.last_request_time = time.time()
            
            # Prepare chat history for the prompt
            context = ""
            if conversation_history:
                recent_history = conversation_history[-4:]  # Last 2 rounds
                for msg in recent_history:
                    role = "User" if msg['role'] == 'user' else "AI"
                    context += f"{role}: {msg['content']}\n"
            
            logger.info(f"🤖 Generating AI response for user {user_id}...")
            
            # Create agent executor
            agent_executor = self.create_agent()
            if not agent_executor:
                return "I'm currently having trouble connecting to my reasoning engine. Please try again in a moment."
            
            # Prepare input with user_id context
            user_context = f"[User ID: {user_id}] " if user_id else ""
            agent_input = f"{user_context}{message}"
            
            # Run the agent with timeout
            try:
                response = agent_executor.invoke({
                    "input": agent_input,
                    "chat_history": context
                })
                output = response.get('output', '')
                if "Agent stopped due to iteration limit" in output or not output:
                    return "I'm sorry, I'm having trouble processing that request right now. Could you please rephrase or be more specific?"
                return output
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "rate limit" in error_msg.lower():
                    return "I'm currently receiving high traffic. Please wait a moment before trying again."
                if "iteration limit" in error_msg or "time limit" in error_msg:
                    return "I apologize, but I'm having a bit of trouble with that complex request. Could you try asking in a simpler way?"
                raise e
            
        except Exception as e:
            print(f"Chatbot error: {e}")
            error_msg = str(e)
            if "DAILY_LIMIT_REACHED" in error_msg:
                return "DAILY_LIMIT_REACHED"
            if "429" in error_msg or "rate limit" in error_msg.lower():
                return "I'm currently receiving high traffic. Please wait a moment before trying again."
            return f"I apologize, but I encountered an error. Please try again."

# Singleton instance
_chatbot_instance = None

def get_chatbot() -> TrueCostChatbot:
    """Get or create chatbot singleton instance"""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = TrueCostChatbot()
    return _chatbot_instance
