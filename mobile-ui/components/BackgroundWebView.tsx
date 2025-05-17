import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface BackgroundWebViewProps {
  urls: string[];
  injectedJs: string;
  onImagesExtracted: (images: string[], isFirstBatch: boolean, currentUrl: string) => void;
  onError: (error: string) => void;
  onComplete: () => void;
  isLoginFlow?: boolean;
  onOtpRequest?: () => void;
  onLoginSuccess?: () => void;
  onMessage?: (message: string) => void;
}

// Define a ref type that exposes our methods
export interface BackgroundWebViewRef {
  injectJavaScript: (script: string) => void;
  injectOtp: (otp: string) => void;
  getWebViewRef: () => WebView | null;
}

// Add forwardRef to expose the WebView ref
const BackgroundWebView = forwardRef<BackgroundWebViewRef, BackgroundWebViewProps>(({
  urls,
  injectedJs,
  onImagesExtracted,
  onError,
  onComplete,
  isLoginFlow = false,
  onOtpRequest,
  onLoginSuccess,
  onMessage
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allImages, setAllImages] = useState<string[]>([]);
  
  // Expose the webViewRef to the parent component
  useImperativeHandle(ref, () => ({
    injectJavaScript: (script: string) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(script);
      }
    },
    injectOtp: (otp: string) => {
      if (webViewRef.current) {
        const fillOtpScript = `
      (function() {
        const digits = "${otp}".split("");
        const otpFields = document.querySelectorAll('input.otp-input-new');
        console.log("Found " + otpFields.length + " OTP fields");
        
        if (otpFields.length >= 4) {
          digits.forEach((digit, idx) => {
            if (otpFields[idx]) {
              otpFields[idx].value = digit;
              console.log("Set field " + idx + " to " + digit);
              // Trigger input event to notify the form
              const event = new Event('input', { bubbles: true });
              otpFields[idx].dispatchEvent(event);
            }
          });
          
          // Small delay before clicking submit to ensure events are processed
          setTimeout(() => {
            const continueBtn = document.querySelector('button[type="submit"]');
            if (continueBtn) {
              console.log("Clicking submit button");
              continueBtn.click();
            } else {
              console.log("Submit button not found");
            }
          }, 500);
        } else {
          console.log("Not enough OTP fields found");
        }
        return true;
      })();
    `;
        
        webViewRef.current.injectJavaScript(fillOtpScript);
        console.log('OTP injection script executed');
      }
    },
    getWebViewRef: () => webViewRef.current
  }));
  
  useEffect(() => {
    console.log('BackgroundWebView initialized with', urls.length, 'URLs');
    console.log('First URL:', urls[0]);
    console.log('Injected JS (first 100 chars):', injectedJs.substring(0, 100) + '...');
    console.log('Is login flow:', isLoginFlow);
  }, []);
  
  // Handle message from WebView
  const handleWebViewMessage = (event: any) => {
    const message = event.nativeEvent.data;
    console.log('Received message from WebView:', message);
    
    // Handle login flow messages
    if (isLoginFlow) {
      // Call the general message handler if provided
      if (onMessage) {
        onMessage(message);
      }
      
      // Handle specific login flow messages
      if (message === 'OTP_SCREEN') {
        console.log('OTP screen detected');
        if (onOtpRequest) {
          onOtpRequest();
        }
        return;
      }
      
      if (message === 'LOGIN_SUCCESS') {
        console.log('Login successful');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        return;
      }
      
      if (message.startsWith('CONSOLE:')) {
        console.log('WebView console:', message.substring(9));
        return;
      }
      
      return;
    }
    
    // Handle product extraction messages (original functionality)
    try {
      console.log('Parsing product data, data length:', message.length);
      const data = JSON.parse(message);
      console.log('Parsed WebView message:', 
        data.success ? 'Success' : 'Failure',
        data.productUrls ? `Found ${data.productUrls.length} product URLs` : 'No product URLs'
      );
      
      if (data.success) {
        // Get product URLs directly from WebView
        if (data.productUrls && Array.isArray(data.productUrls)) {
          // Add new images to our collection
          console.log('Extracted product URLs:', data.productUrls);
          setAllImages(prevImages => [...prevImages, ...data.productUrls]);
          
          // Tell the parent if this is the first URL being processed
          const isFirstBatch = currentUrlIndex === 0;
          const currentUrl = urls[currentUrlIndex];
          onImagesExtracted(data.productUrls, isFirstBatch, currentUrl);
        } else {
          console.warn('No productUrls in WebView response or not an array', data.productUrls);
        }
      } else {
        const errorMsg = `Error extracting content: ${data.error}`;
        console.error(errorMsg);
        onError(errorMsg);
      }
      
      // Move to the next URL or complete
      processNextUrl();
    } catch (e: any) {
      const errorMsg = `Error processing WebView response: ${e.message}`;
      console.error(errorMsg, 'Raw data:', typeof message === 'string' ? (message.substring(0, 100) + '...') : 'not a string');
      onError(errorMsg);
      
      // For login flow, we don't move to next URL on parsing error
      if (!isLoginFlow) {
        processNextUrl();
      }
    }
  };
  
  // Process the next URL in the array
  const processNextUrl = () => {
    // For login flow, we don't move to next URL automatically
    if (isLoginFlow) return;
    
    const nextIndex = currentUrlIndex + 1;
    if (nextIndex < urls.length) {
      console.log(`Moving to next URL (${nextIndex + 1}/${urls.length})`, urls[nextIndex]);
      setCurrentUrlIndex(nextIndex);
    } else {
      // We've processed all URLs
      console.log('Completed processing all URLs, extracted', allImages.length, 'images in total');
      onComplete();
    }
  };
  
  // When the URL changes, reset loading state
  useEffect(() => {
    if (currentUrlIndex < urls.length) {
      console.log(`Processing URL ${currentUrlIndex + 1}/${urls.length}:`, urls[currentUrlIndex]);
      setIsLoading(true);
    }
  }, [currentUrlIndex]);

  return (
    <View style={[styles.container, isLoginFlow && styles.loginFlowContainer]}>
      {currentUrlIndex < urls.length && (
        <WebView
          ref={webViewRef}
          source={{ uri: urls[currentUrlIndex] }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            const errorMsg = `Failed to load webpage: ${urls[currentUrlIndex]}, Error: ${nativeEvent.description}`;
            console.error(errorMsg);
            onError(errorMsg);
            
            // For login flow, we don't move to next URL on error
            if (!isLoginFlow) {
              processNextUrl();
            }
          }}
          onLoadEnd={() => {
            console.log('WebView loaded, injecting JavaScript...');
            setIsLoading(false);
            // Inject the JavaScript after page loads
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(injectedJs);
              console.log('JavaScript injected');
            } else {
              console.error('WebView ref not available, could not inject JavaScript');
            }
          }}
          style={[styles.webView, isLoginFlow && styles.loginFlowWebView]}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 1,
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    opacity: 0,
  },
  webView: {
    width: 1,
    height: 1,
  },
  loginFlowContainer: {
    // For debugging only, remove for production
    // width: '100%',
    // height: 400,
    // opacity: 0.5,
    // position: 'relative',
  },
  loginFlowWebView: {
    // For debugging only, remove for production
    // width: '100%',
    // height: 400,
  }
});

export default BackgroundWebView; 