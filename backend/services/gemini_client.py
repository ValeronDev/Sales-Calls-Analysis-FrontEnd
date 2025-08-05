import google.generativeai as genai
import os
from typing import Optional, Dict, Any
from datetime import datetime
import json

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
            print("Warning: GEMINI_API_KEY not found in environment variables")
    
    def is_configured(self) -> bool:
        """Check if Gemini API is properly configured"""
        return self.model is not None
    
    def chat_about_call(self, message: str, call_analysis: Dict[Any, Any]) -> str:
        """
        Chat about a specific call analysis
        
        Args:
            message: User's question about the call
            call_analysis: The call analysis data from database
            
        Returns:
            AI response as string
        """
        if not self.is_configured():
            return "Sorry, the AI chatbot is not configured. Please contact your administrator to set up the Gemini API key."
        
        try:
            # Prepare context from call analysis
            context = self._prepare_call_context(call_analysis)
            
            # Create prompt
            prompt = f"""
You are an AI sales coach analyzing a sales call. Here's the call information:

{context}

User Question: {message}

Please provide helpful, specific advice based on the call analysis. Focus on:
- Actionable insights
- Specific improvements the rep could make
- Recognition of what went well
- Context-aware recommendations

Keep your response conversational and supportive.
"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Sorry, I encountered an error while processing your question: {str(e)}"
    
    def general_sales_chat(self, message: str, user_role: str = "rep") -> str:
        """
        General sales coaching chat without specific call context
        
        Args:
            message: User's question
            user_role: User's role (rep or manager)
            
        Returns:
            AI response as string
        """
        if not self.is_configured():
            return "Sorry, the AI chatbot is not configured. Please contact your administrator to set up the Gemini API key."
        
        try:
            role_context = "sales representative" if user_role == "rep" else "sales manager"
            
            prompt = f"""
You are an AI sales coach helping a {role_context}. 

User Question: {message}

Please provide helpful sales advice and insights. Focus on:
- Best practices in sales
- Communication techniques
- Objection handling strategies
- Performance improvement tips

Keep your response practical and actionable.
"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Sorry, I encountered an error while processing your question: {str(e)}"
    
    def _prepare_call_context(self, call_analysis: Dict[Any, Any]) -> str:
        """Prepare call context for AI prompting"""
        analysis = call_analysis.get("analysis", {})
        
        context = f"""
Call Title: {call_analysis.get('call_title', 'N/A')}
Sales Rep: {call_analysis.get('rep_name', 'N/A')}
Call Date: {call_analysis.get('call_date', 'N/A')}

Call Summary: {analysis.get('summary', 'No summary available')}

Key Objections Raised:
{self._format_list(analysis.get('key_objections', []))}

Buying Signals:
{self._format_list(analysis.get('buying_signals', []))}

Recommendations:
{self._format_list(analysis.get('recommendations', []))}

Overall Feedback: {analysis.get('overall_feedback', 'No feedback available')}
"""
        return context
    
    def _format_list(self, items: list) -> str:
        """Format list items for better readability"""
        if not items:
            return "- None noted"
        return "\n".join(f"- {item}" for item in items)

# Singleton instance
gemini_client = GeminiClient()