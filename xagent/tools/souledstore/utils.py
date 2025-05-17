"""
Utility functions for SouledStore toolkit.

This module provides helper functions for the SouledStore toolkit.
"""

import json
import re

def generate_injectable_js(page_urls: list) -> str:
    """Generate injectable JavaScript for React Native WebView.
    
    This creates a JavaScript snippet that can be injected into a React Native
    WebView to extract product images from SouledStore product pages.
    
    Args:
        page_urls: List of product page URLs to visit
        
    Returns:
        JavaScript code that can be injected into a React Native WebView
    """
    # The current page_urls are not used in the new script, but we keep the parameter for backward compatibility
    
    # Return the new self-executing function for product image extraction
    js_code = '''
        (function() {
        // Product URL pattern to match Souled Store product images
        const PRODUCT_URL_PATTERN = 'https://prod-img\\.thesouledstore\\.com/public/theSoul/uploads/catalog/product/[^"\\'\\s)]+'; 
        
        // Wait for the page to be fully loaded
        function waitForPageLoad() {
            return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                setTimeout(resolve, 2000); // Wait for dynamic content
                return;
            }
            
            window.addEventListener('load', () => {
                setTimeout(resolve, 2000);
            });
            });
        }
        
        // Extract product image URLs directly from HTML
        function extractProductUrls(html) {
            if (!html) return [];
            
            const regex = new RegExp(PRODUCT_URL_PATTERN, 'g');
            const matches = html.match(regex) || [];
            
            // Remove duplicates
            return [...new Set(matches)];
        }
        
        // Main extraction function
        async function extractHTML() {
            try {
            await waitForPageLoad();
            const htmlContent = document.documentElement.outerHTML;
            
            // Extract product URLs directly in the WebView
            const productUrls = extractProductUrls(htmlContent);
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                success: true,
                html: htmlContent,
                productUrls: productUrls,
                patternUsed: PRODUCT_URL_PATTERN
            }));
            } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                success: false,
                error: error.toString()
            }));
            }
        }
        
        extractHTML();
        return true;
        })();
    '''
    
    return js_code


def generate_login_js() -> str:
    """Generate injectable JavaScript for user login flow in React Native WebView.
    
    This creates a JavaScript snippet that can be injected into a React Native
    WebView to automate the login process at SouledStore.
    
    Returns:
        JavaScript code that can be injected into a React Native WebView
    """
    js_code = '''
    (function() {
      const phoneInput = document.querySelector('input[type="tel"]');
      if (phoneInput) {
        const phoneNumber = "6281166919"; // replace as needed
        phoneInput.value = phoneNumber;

        // Dispatch input/change/blur events to trigger validation
        ['input', 'change', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          phoneInput.dispatchEvent(event);
        });
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) submitButton.click();
        console.log("Phone number entered and form submitted");
      } else {
        console.log("Phone input field not found");
      }

      // Observe DOM changes to detect OTP screen
      const observer = new MutationObserver(() => {
        const otpFields = document.querySelectorAll('input.otp-input-new');
        if (otpFields.length >= 4) {
          console.log("OTP screen detected");
          window.ReactNativeWebView.postMessage("OTP_SCREEN");
        }

        // Detect successful login by checking for a post-login element
        if (document.body.innerText.includes("Welcome") || window.location.href.includes("home")) {
          console.log("Login success detected");
          window.ReactNativeWebView.postMessage("LOGIN_SUCCESS");
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      
      // Log console messages to ReactNative
      const originalConsoleLog = console.log;
      console.log = function(...args) {
        window.ReactNativeWebView.postMessage("CONSOLE: " + args.join(" "));
        originalConsoleLog.apply(console, args);
      };
      
      console.log("Injection script executed");
      return true;
    })();
    '''
    
    return js_code