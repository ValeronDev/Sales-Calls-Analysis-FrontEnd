#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    import google.generativeai as genai
    
    # Get API key
    api_key = os.getenv("GEMINI_API_KEY")
    print(f"API Key found: {bool(api_key)}")
    
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in environment variables")
        sys.exit(1)
    
    print(f"API Key starts with: {api_key[:10]}...")
    
    # Configure Gemini
    genai.configure(api_key=api_key)
    
    # Test with a simple model
    model = genai.GenerativeModel('gemini-pro')
    
    # Test generation
    print("Testing Gemini API...")
    response = model.generate_content("Hello, this is a test message. Please respond briefly.")
    
    print("SUCCESS: Gemini API is working!")
    print(f"Response: {response.text[:100]}...")
    
except ImportError as e:
    print(f"Import error: {e}")
    print("Please install the required package: pip install google-generativeai")
    sys.exit(1)
    
except Exception as e:
    print(f"ERROR: Gemini API test failed: {str(e)}")
    
    # Check if it's an API key issue
    if "API_KEY_INVALID" in str(e) or "API key not valid" in str(e):
        print("\nThis appears to be an API key issue.")
        print("Please check:")
        print("1. The API key is correct and not expired")
        print("2. The Generative Language API is enabled in your Google Cloud project")
        print("3. The API key has the correct permissions")
        print("\nYou can get a new API key at: https://makersuite.google.com/app/apikey")
    
    sys.exit(1)