"""
SouledStore toolkit for XAgent.

This module provides tools for searching and interacting with SouledStore fashion products.
"""

import json
from typing import List, Dict, Any

from tools.base import BaseTool
from .search import find_top_matches as search_top_matches
from .utils import generate_injectable_js, generate_login_js

class SouledStoreToolkit(BaseTool):
    """SouledStore toolkit for fashion product search.
    
    This toolkit provides tools to search for fashion products at SouledStore,
    a popular clothing and merchandise retailer specializing in pop culture,
    superhero, and themed apparel.
    """
    
    def __init__(self, **kwargs):
        """Initialize the SouledStore toolkit."""
        super().__init__(
            name="souledstore_tools",
            description="Tools for searching fashion products in the SouledStore catalog",
            tools=[self.find_top_matches, self.checkout_user],
            **kwargs
        )
    


    def find_top_matches(self, query: str, top_k: int = 3, include_images: bool = True) -> str:
        """Find top matching products for a user query.
        
        This tool performs semantic search on the SouledStore product catalog
        to find products that best match the user's description. It uses natural
        language understanding to identify relevant products even when exact keywords
        aren't matched.
        
        Args:
            query: User's product search query (e.g., "black superhero t-shirt with logo")
            top_k: Number of top results to return (default: 3)
            include_images: Whether to include injectable JS for image extraction (default: True)
            
        Returns:
            JSON string containing product URLs and optionally injectable JavaScript for React Native WebView
        """
        try:
            # Call the search function
            results = search_top_matches(query, top_k=top_k)
            
            # Extract only the page_urls from results as plain strings
            page_urls = [result['page_url'] for result in results]
            
            # Create the response object
            if include_images:
                # Generate the injectable JavaScript
                injected_js = generate_injectable_js(page_urls)
                
                # Include both URLs and injectable JS
                response = {
                    "page_urls": page_urls,
                    "injected_js": injected_js
                }
            else:
                # Just return the URLs as an array
                response = page_urls
            
            # Return the response as JSON
            response_json = json.dumps(response)
            
            # Add a special marker to indicate this is the RAW JSON that should be passed through
            return f"##RAW_JSON_DO_NOT_MODIFY##{response_json}##END_RAW_JSON##"
        except Exception as e:
            error_json = json.dumps([f"Error finding matches: {str(e)}"])
            return f"##RAW_JSON_DO_NOT_MODIFY##{error_json}##END_RAW_JSON##"
    
    def checkout_user(self) -> str:
        """Generate injectable JavaScript for SouledStore user login and checkout flow.
        
        This tool creates JavaScript that can be injected into a React Native WebView
        to automate the login process at SouledStore. The script will:
        1. Find and fill in the phone number input field
        2. Click the submit button to send the OTP
        3. Detect when the OTP screen appears
        4. Notify the React Native app when login is successful
        
        Returns:
            JSON string containing injectable JavaScript for React Native WebView
        """
        try:
            # Generate the login JavaScript
            injected_js = generate_login_js()
            
            # Create the response object with just the injectable JS
            response = {
                "injected_js": injected_js
            }
            
            # Return the response as JSON
            response_json = json.dumps(response)
            
            # Add a special marker to indicate this is the RAW JSON that should be passed through
            return f"##RAW_JSON_DO_NOT_MODIFY##{response_json}##END_RAW_JSON##"
        except Exception as e:
            error_json = json.dumps([f"Error generating checkout script: {str(e)}"])
            return f"##RAW_JSON_DO_NOT_MODIFY##{error_json}##END_RAW_JSON##"
