import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Image, ImageBackground, Keyboard, Linking, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackgroundWebView, { BackgroundWebViewRef } from '../components/BackgroundWebView';
import OtpModal from '../components/OtpModal';
import Colors from '../constants/Colors';
import * as API from '../services/api';

// Types for chat related data
type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  isHtml?: boolean;
  imageUri?: string;
  isLoading?: boolean;
  productsByUrl?: {[url: string]: string[]};
  isLoadingMoreProducts?: boolean;
};

type Chat = {
  id: string;
  messages: Message[];
  createdAt: number;
};

// Regular expression to find URLs in text
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Function to remove content between <think></think> tags
// and extract special JSON between markers if present
const removeThinkTags = (text: string): string => {
  if (!text) return '';
  
  // Use regex to match and remove anything between <think> and </think>
  const withoutThinkTags = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  
  // Check if there's a special JSON marker
  if (withoutThinkTags.includes('##RAW_JSON_DO_NOT_MODIFY##')) {
    console.log('Found special JSON marker in response');
    
    // Try to extract the JSON between markers
    const startMarker = '##RAW_JSON_DO_NOT_MODIFY##';
    const endMarker = '##END_RAW_JSON##';
    
    const startIndex = withoutThinkTags.indexOf(startMarker) + startMarker.length;
    const endIndex = withoutThinkTags.indexOf(endMarker);
    
    if (startIndex > 0 && endIndex > startIndex) {
      // Extract the JSON string
      const jsonString = withoutThinkTags.substring(startIndex, endIndex).trim();
      console.log('Extracted JSON string length:', jsonString.length);
      
      try {
        // Store the extracted JSON for product extraction
        window.extractedProductData = JSON.parse(jsonString);
        console.log('Successfully parsed extracted JSON with keys:', Object.keys(window.extractedProductData));
        
        // Check if we have injected_js only (no page_urls)
        if (window.extractedProductData.injected_js && !window.extractedProductData.page_urls) {
          console.log('Found injected_js without page_urls, likely a login flow');
          window.extractedProductData.isLoginFlow = true;
        }
      } catch (e) {
        console.error('Failed to parse extracted JSON:', e);
      }
      
      // Remove the JSON markers and content from the displayed text
      return withoutThinkTags.replace(`${startMarker}${jsonString}${endMarker}`, '').trim();
    }
  }
  
  return withoutThinkTags;
};

// Declare a global variable to store extracted product data
declare global {
  interface Window {
    extractedProductData: any;
  }
}

// Initialize the global variable
if (typeof window !== 'undefined') {
  window.extractedProductData = null;
}

// Function to convert text with URLs to array of text and clickable links
const processTextWithLinks = (text: string) => {
  if (!text) return [];
  
  const parts = text.split(URL_REGEX);
  const matches = text.match(URL_REGEX) || [];
  
  const result: Array<{type: string, content: string}> = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      result.push({ type: 'text', content: parts[i] });
    }
    if (i < matches.length && matches[i]) {
      result.push({ type: 'link', content: matches[i] });
    }
  }
  
  return result;
};

// Add a helper function to generate unique IDs
const generateUniqueId = () => {
  return Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9);
};

// Add helper function to extract base domain from URL
const extractBaseDomain = (url: string): string => {
  try {
    // Use URL constructor to parse the URL
    const parsedUrl = new URL(url);
    // Return just the hostname (domain)
    return parsedUrl.hostname;
  } catch (e) {
    console.error('Error parsing URL:', e);
    return url;
  }
};

export default function HomeScreen({ navigation, route }: any) {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_500Medium,
    Montserrat_400Regular,
  });

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  
  // Camera state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Add state for product extraction
  const [isExtractingProducts, setIsExtractingProducts] = useState(false);
  const [productExtractionData, setProductExtractionData] = useState<{
    page_urls: string[],
    injected_js: string,
    messageId: string,
    currentUrlIndex: number,
    login_url?: string
  } | null>(null);
  
  // Global selected product URL state
  const [selectedProductUrl, setSelectedProductUrl] = useState<string | null>(null);
  
  // Add state for image modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Add state for login flow
  const [isLoginFlow, setIsLoginFlow] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  const loginWebViewRef = useRef<BackgroundWebViewRef>(null);
  
  // Initialize with a default chat if none exists
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Clear chats on app load (as specified in requirements)
        await AsyncStorage.removeItem('chats');
        createNewChat();
      } catch (error) {
        console.error('Error clearing chats:', error);
        createNewChat();
      }
    };
    
    loadChats();
  }, []);

  // Save chats to AsyncStorage whenever they change
  useEffect(() => {
    const saveChats = async () => {
      if (chats.length > 0) {
        try {
          await AsyncStorage.setItem('chats', JSON.stringify(chats));
        } catch (error) {
          console.error('Error saving chats:', error);
        }
      }
    };
    
    saveChats();
  }, [chats]);

  // Check for extracted images from ProductExtractionScreen
  useEffect(() => {
    if (route.params?.extractedImages && route.params?.fromProductExtraction) {
      const images = route.params.extractedImages;
      
      // Add a message with the extracted images
      if (currentChat && images.length > 0) {
        const carouselMessage: Message = {
          id: Date.now().toString(),
          text: `I found ${images.length} products that match what you're looking for:`,
          isUser: false,
          timestamp: Date.now(),
          productsByUrl: {
            [images[0]]: images.slice(0, 3),
          },
        };
        
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === currentChat
              ? { ...chat, messages: [...chat.messages, carouselMessage] }
              : chat
          )
        );
        
        // Clear route params to prevent duplicate messages
        navigation.setParams({ extractedImages: undefined, fromProductExtraction: undefined });
      }
    }
    
    // Check for captured image from camera
    if (route.params?.capturedImage) {
      setCapturedImage(route.params.capturedImage);
      navigation.setParams({ capturedImage: undefined });
    }
  }, [route.params?.extractedImages, route.params?.fromProductExtraction, route.params?.capturedImage]);

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      messages: [],
      createdAt: Date.now(),
    };
    
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChat(newChatId);
    setSidebarVisible(false);
  };

  const handleCameraCapture = (uri: string) => {
    setCapturedImage(uri);
  };

  // Update handleImagesExtracted to use the new message format
  const handleImagesExtracted = (
    images: string[], 
    isFirstBatch: boolean,
    messageId: string,
    currentUrl: string
  ) => {
    if (!images.length) return;
    
    console.log(`Received ${images.length} images from ${currentUrl}`);
    
    setChats(prevChats => 
      prevChats.map(chat => {
        if (chat.id === currentChat) {
          // Find the specific message to update
          const updatedMessages = chat.messages.map(msg => {
            if (msg.id === messageId) {
              // Get existing products by URL or initialize empty object
              const existingProductsByUrl = msg.productsByUrl || {};
              
              // Take only first 3 images for this URL
              const urlImages = images.slice(0, 3);
              
              // Update products for this URL
              const updatedProductsByUrl = {
                ...existingProductsByUrl,
                [currentUrl]: urlImages,
              };
              
              // Count total URL groups (products)
              const totalProducts = Object.keys(updatedProductsByUrl).length;
              
              return {
                ...msg,
                isLoading: false,
                isLoadingMoreProducts: false,
                productsByUrl: updatedProductsByUrl,
                text: `Found ${totalProducts} products matching your request.`
              };
            }
            return msg;
          });
          
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      })
    );
  };
  
  // Update the message component to use the global selectedProductUrl
  const renderMessageItem = ({ item }: { item: Message }) => {
    // Loading message with skeleton animation
    if (item.isLoading) {
      return <LoadingSkeleton />;
    }
    
    // Message with product images grouped by URL
    if (item.productsByUrl && Object.keys(item.productsByUrl).length > 0) {
      // Create a typed array of entries with explicit type mapping
      const entries: [string, string[]][] = [];
      
      // Safely populate the entries with explicit string casting
      Object.keys(item.productsByUrl).forEach(url => {
        const urlImages = item.productsByUrl?.[url];
        if (Array.isArray(urlImages)) {
          // Map each item to ensure it's a string
          const stringImages = urlImages.map(img => String(img));
          entries.push([url, stringImages]);
        }
      });
      
      return (
        <View style={[styles.messageBubble, styles.systemBubble, styles.productBubble]}>
          <Text style={[styles.messageText, styles.systemText]}>
            {item.text}
          </Text>
          
          {entries.map(([url, images], urlIndex) => (
            <View key={`url-group-${urlIndex}-${url.substring(0, 20)}`} style={styles.productUrlGroup}>
              <TouchableOpacity 
                style={[
                  styles.urlHeader,
                  selectedProductUrl === url && styles.selectedUrlHeader
                ]}
                onPress={() => {
                  // Toggle selection using the global state
                  if (selectedProductUrl === url) {
                    console.log('Deselected product URL:', url);
                    setSelectedProductUrl(null);
                  } else {
                    console.log('Selected product URL:', url);
                    setSelectedProductUrl(url);
                  }
                }}
              >
                <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
                  {url}
                </Text>
                {selectedProductUrl === url && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.yellow} />
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.productImagesRow}>
                {images.map((imageUrl, imgIndex) => (
                  <View
                    key={`image-${urlIndex}-${imgIndex}`}
                    style={styles.productImageContainer}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImage(imageUrl);
                        setModalVisible(true);
                      }}
                      style={styles.productImageTouchable}
                    >
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}
          
          {/* Add the "freshly bridged from" text */}
          {entries.length > 0 && (
            <View style={styles.bridgedFromContainer}>
              <Text style={styles.bridgedFromText}>
                freshly bridged from{' '}
                <Text 
                  style={styles.bridgedFromSiteUrl}
                  onPress={() => Linking.openURL(entries[0][0])}
                >
                  {extractBaseDomain(entries[0][0])}
                </Text>
              </Text>
            </View>
          )}
          
          {item.isLoadingMoreProducts && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={Colors.yellow} />
              <Text style={styles.loadingMoreText}>Looking for more products...</Text>
            </View>
          )}
        </View>
      );
    }
    
    // Message with image
    if (item.imageUri) {
      return (
        <View style={[
          styles.messageBubble, 
          item.isUser ? styles.userBubble : styles.systemBubble,
          styles.imageBubble
        ]}>
          <Image source={{ uri: item.imageUri }} style={styles.messageImage} />
          {item.text && (
            <Text style={[
              styles.messageText, 
              item.isUser ? styles.userText : styles.systemText
            ]}>
              {item.text}
            </Text>
          )}
        </View>
      );
    }
    
    // HTML content message (from WebView)
    if (item.isHtml) {
      return (
        <View style={[styles.messageBubble, styles.systemBubble, styles.htmlBubble]}>
          <Text style={[styles.messageText, styles.systemText]}>
            HTML content retrieved from souledstore.com (truncated):
          </Text>
          <View style={styles.htmlContainer}>
            <Text style={styles.htmlText}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    }
    
    // Regular message bubble with possible links
    const textParts = processTextWithLinks(item.text);
    
    return (
      <View style={[
        styles.messageBubble, 
        item.isUser ? styles.userBubble : styles.systemBubble
      ]}>
        <Text style={[
          styles.messageText, 
          item.isUser ? styles.userText : styles.systemText
        ]}>
          {textParts.map((part, index) => {
            if (part.type === 'link') {
              return (
                <Text 
                  key={index}
                  style={styles.linkText}
                  onPress={() => Linking.openURL(part.content)}
                >
                  {part.content}
                </Text>
              );
            } else {
              return <Text key={index}>{part.content}</Text>;
            }
          })}
        </Text>
      </View>
    );
  };

  // Update handleExtractionComplete to reset selection if the selected URL is no longer available
  const handleExtractionComplete = () => {
    setIsExtractingProducts(false);
    setProductExtractionData(null);
    
    // Update the message to show it's no longer loading more products
    if (currentChat && productExtractionData?.messageId) {
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.id === currentChat) {
            const updatedMessages = chat.messages.map(msg => {
              if (msg.id === productExtractionData.messageId) {
                // Count total products (URL groups)
                const totalProducts = msg.productsByUrl ? Object.keys(msg.productsByUrl).length : 0;
                
                return {
                  ...msg,
                  isLoadingMoreProducts: false,
                  text: totalProducts > 0
                    ? `Found ${totalProducts} products matching your request.`
                    : 'No products found that match your request.'
                };
              }
              return msg;
            });
            
            return { ...chat, messages: updatedMessages };
          }
          return chat;
        })
      );
      
      // Reset selectedProductUrl if it's no longer in any productsByUrl
      let selectedUrlExists = false;
      if (selectedProductUrl) {
        const allChats = [...chats];
        for (const chat of allChats) {
          for (const msg of chat.messages) {
            if (msg.productsByUrl && msg.productsByUrl[selectedProductUrl]) {
              selectedUrlExists = true;
              break;
            }
          }
          if (selectedUrlExists) break;
        }
        
        if (!selectedUrlExists) {
          console.log('Selected product URL no longer exists, resetting selection');
          setSelectedProductUrl(null);
        }
      }
    }
  };
  
  // Handle extraction error
  const handleExtractionError = (error: string) => {
    console.error('Product extraction error:', error);
    // We continue extraction even if there are errors
  };
  
  // Process product data from response
  const processProductData = (productData: any) => {
    if (!currentChat) return;
    
    // Check if this is a login flow (injected_js without page_urls)
    if (productData.isLoginFlow || (productData.injected_js && !productData.page_urls)) {
      console.log('Detected login flow with injected JavaScript');
      setIsLoginFlow(true);
      setLoginStatus('Starting login flow...');
      
      // Create a loading message for the login flow
      const messageId = generateUniqueId();
      const loginMessage: Message = {
        id: messageId,
        text: 'Initiating secure login...',
        isUser: false,
        timestamp: Date.now(),
        isLoading: true,
      };
      
      // Add the message to the chat
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChat
            ? { ...chat, messages: [...chat.messages, loginMessage] }
            : chat
        )
      );
      
      // Use empty array for URLs since we'll specify the login URL directly
      // or use a default URL if none is specified
      const loginUrl = productData.login_url || 'https://www.thesouledstore.com/login';
      
      // Set up extraction data with login URL
      setProductExtractionData({
        page_urls: [],
        injected_js: productData.injected_js,
        messageId,
        currentUrlIndex: 0,
        login_url: loginUrl
      });
      
      return {
        isLoginFlow: true,
        injected_js: productData.injected_js,
        login_url: loginUrl,
        messageId
      };
    }
    
    // Regular product extraction flow (existing code)
    // Create a loading message for products
    const messageId = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9);
    const productLoadingMessage: Message = {
      id: messageId,
      text: 'Looking for products...',
      isUser: false,
      timestamp: Date.now(),
      isLoading: true,
      productsByUrl: {} // Initialize with empty object
    };
    
    // Add the message to the chat
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChat
          ? { ...chat, messages: [...chat.messages, productLoadingMessage] }
          : chat
      )
    );
    
    // Deduplicate URLs before processing with proper typing
    const urlsToProcess: string[] = [];
    if (Array.isArray(productData.page_urls)) {
      productData.page_urls.forEach((url: any) => {
        if (typeof url === 'string' && !urlsToProcess.includes(url)) {
          urlsToProcess.push(url);
        }
      });
    }
    console.log(`Deduplicated URLs: ${Array.isArray(productData.page_urls) ? productData.page_urls.length : 0} → ${urlsToProcess.length}`);
    
    // Set up extraction state with deduplicated URLs
    setProductExtractionData({
      page_urls: urlsToProcess,
      injected_js: productData.injected_js,
      messageId,
      currentUrlIndex: 0
    });
    
    setIsExtractingProducts(true);
    
    return {
      isLoginFlow: false,
      urlsToProcess,
      injected_js: productData.injected_js,
      messageId
    };
  };
  
  // Handler when extraction for a URL is complete
  const handleUrlExtractionComplete = () => {
    // Move to next URL if available
    if (productExtractionData && productExtractionData.currentUrlIndex < productExtractionData.page_urls.length - 1) {
      setProductExtractionData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentUrlIndex: prev.currentUrlIndex + 1
        };
      });
    } else {
      // All URLs processed, extraction complete
      handleExtractionComplete();
    }
  };
  
  // Modify the handleTextQuery function to process products in-chat
  const handleTextQuery = async (query: string) => {
    // Add loading message to chat
    if (currentChat) {
      const loadingMessage: Message = {
        id: `loading-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: '',
        isUser: false,
        timestamp: Date.now(),
        isLoading: true,
      };
      
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChat
            ? { ...chat, messages: [...chat.messages, loadingMessage] }
            : chat
        )
      );
    }
    
    try {
      const response = await API.askWithText(query);
      console.log('API Response:', JSON.stringify(response, null, 2));
      
      // Process the response to remove <think> tags
      // This also extracts any special JSON data from markers
      let processedResponse = '';
      
      if (typeof response === 'string') {
        processedResponse = removeThinkTags(response);
      } else if (response && response.response) {
        processedResponse = removeThinkTags(response.response);
      } else {
        processedResponse = JSON.stringify(response);
      }
      
      // Check if we have extracted product data from the markers
      if (window.extractedProductData) {
        console.log('Found extracted data with keys:', Object.keys(window.extractedProductData));
        
        // Replace loading message with a regular text response
        if (currentChat) {
          setChats(prevChats => 
            prevChats.map(chat => {
              if (chat.id === currentChat) {
                const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
                return { 
                  ...chat, 
                  messages: [
                    ...filteredMessages, 
                    {
                      id: generateUniqueId(),
                      text: processedResponse || "Processing your request...",
                      isUser: false,
                      timestamp: Date.now(),
                      productsByUrl: window.extractedProductData.productsByUrl,
                    }
                  ] 
                };
              }
              return chat;
            })
          );
        }
        
        // Process the data based on type (login flow or product extraction)
        const result = processProductData(window.extractedProductData);
        
        // Clear the extracted data after using it
        window.extractedProductData = null;
        
        // If it's a login flow, set up the login WebView
        if (result && result.isLoginFlow) {
          // Login flow handling will be done by the BackgroundWebView component
        }
      } else {
        // Check if response has page_urls and injected_js directly
        // First check if the response might be a string that needs parsing
        let parsedResponse = response;
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
            console.log('Parsed response from string:', parsedResponse);
          } catch (e) {
            // Not valid JSON, continue with original response
            console.log('Response is not valid JSON string');
          }
        }
        
        if (parsedResponse && (parsedResponse.page_urls || parsedResponse.injected_js)) {
          console.log('Product extraction or login flow response detected');
          
          // Replace loading message with a regular text response
          if (currentChat) {
            setChats(prevChats => 
              prevChats.map(chat => {
                if (chat.id === currentChat) {
                  const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
                  return { 
                    ...chat, 
                    messages: [
                      ...filteredMessages, 
                      {
                        id: generateUniqueId(),
                        text: processedResponse || "Processing your request...",
                        isUser: false,
                        timestamp: Date.now(),
                        productsByUrl: parsedResponse.productsByUrl,
                      }
                    ] 
                  };
                }
                return chat;
              })
            );
          }
          
          // Process the data based on type (login flow or product extraction)
          const result = processProductData(parsedResponse);
          
          // If it's a login flow, setup is handled by processProductData
        } else {
          // Regular response handling
          if (currentChat) {
            // Replace the loading message with the actual response
            setChats(prevChats => 
              prevChats.map(chat => {
                if (chat.id === currentChat) {
                  const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
                  return { 
                    ...chat, 
                    messages: [
                      ...filteredMessages, 
                      {
                        id: generateUniqueId(),
                        text: processedResponse,
                        isUser: false,
                        timestamp: Date.now(),
                        productsByUrl: {},
                      }
                    ] 
                  };
                }
                return chat;
              })
            );
          }
        }
      }
    } catch (error) {
      console.error('Error with text query:', error);
      if (currentChat) {
        // Replace loading message with error message
        setChats(prevChats => 
          prevChats.map(chat => {
            if (chat.id === currentChat) {
              const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
              return { 
                ...chat, 
                messages: [
                  ...filteredMessages, 
                  {
                    id: generateUniqueId(),
                    text: "Sorry, there was an error processing your request.",
                    isUser: false,
                    timestamp: Date.now(),
                    productsByUrl: {},
                  }
                ] 
              };
            }
            return chat;
          })
        );
      }
    }
  };

  const handleImageQuery = async (imageUri: string, query: string) => {
    // Add loading message to chat
    if (currentChat) {
      const loadingMessage: Message = {
        id: `loading-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: '',
        isUser: false,
        timestamp: Date.now(),
        isLoading: true,
      };
      
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChat
            ? { ...chat, messages: [...chat.messages, loadingMessage] }
            : chat
        )
      );
    }
    
    try {
      console.log(`Sending image to API: ${imageUri}`);
      const response = await API.askWithImage(query, imageUri);
      console.log('API Response (image):', JSON.stringify(response, null, 2));
      
      // Process the response to remove <think> tags
      // This also extracts any special JSON data from markers
      let processedResponse = '';
      
      if (typeof response === 'string') {
        processedResponse = removeThinkTags(response);
      } else if (response && response.response) {
        processedResponse = removeThinkTags(response.response);
      } else {
        processedResponse = JSON.stringify(response);
      }
      
      // Check if we have extracted product data from the markers
      if (window.extractedProductData && window.extractedProductData.page_urls && window.extractedProductData.injected_js) {
        console.log('Found product data in extracted JSON (image query)');
        
        // Replace loading message with a regular text response
        if (currentChat) {
          setChats(prevChats => 
            prevChats.map(chat => {
              if (chat.id === currentChat) {
                const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
                return { 
                  ...chat, 
                  messages: [
                    ...filteredMessages, 
                    {
                      id: generateUniqueId(),
                      text: processedResponse || "Let me find products like this image...",
                      isUser: false,
                      timestamp: Date.now(),
                      productsByUrl: window.extractedProductData.productsByUrl,
                    }
                  ] 
                };
              }
              return chat;
            })
          );
        }
        
        // Process the product data in-chat
        processProductData(window.extractedProductData);
        
        // Clear the extracted data after using it
        window.extractedProductData = null;
      } else {
        // Check if response has page_urls and injected_js directly
        let parsedResponse = response;
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
            console.log('Parsed response from string (image):', parsedResponse);
          } catch (e) {
            // Not valid JSON, continue with original response
            console.log('Response is not valid JSON string (image)');
          }
        }
        
        if (parsedResponse && parsedResponse.page_urls && parsedResponse.injected_js) {
          console.log('Product extraction response detected (image):', parsedResponse.page_urls.length, 'URLs');
          
          // Replace loading message with a regular text response
          if (currentChat) {
            setChats(prevChats => 
              prevChats.map(chat => {
                if (chat.id === currentChat) {
                  const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
                  return { 
                    ...chat, 
                    messages: [
                      ...filteredMessages, 
                      {
                        id: generateUniqueId(),
                        text: processedResponse || "Let me find products like this image...",
                        isUser: false,
                        timestamp: Date.now(),
                        productsByUrl: parsedResponse.productsByUrl,
                      }
                    ] 
                  };
                }
                return chat;
              })
            );
          }
          
          // Process the product data in-chat
          processProductData(parsedResponse);
        } else {
          // Regular response handling
          if (currentChat) {
            // Replace loading message with actual response
            setChats(prevChats => 
              prevChats.map(chat => {
                if (chat.id === currentChat) {
                  const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
                  return { 
                    ...chat, 
                    messages: [
                      ...filteredMessages, 
                      {
                        id: generateUniqueId(),
                        text: processedResponse,
                        isUser: false,
                        timestamp: Date.now(),
                        productsByUrl: {},
                      }
                    ] 
                  };
                }
                return chat;
              })
            );
          }
        }
      }
    } catch (error) {
      console.error('Error with image query:', error);
      if (currentChat) {
        // Replace loading message with error message
        setChats(prevChats => 
          prevChats.map(chat => {
            if (chat.id === currentChat) {
              const filteredMessages = chat.messages.filter(msg => !msg.isLoading);
              return { 
                ...chat, 
                messages: [
                  ...filteredMessages, 
                  {
                    id: generateUniqueId(),
                    text: "Sorry, there was an error analyzing your image.",
                    isUser: false,
                    timestamp: Date.now(),
                    productsByUrl: {},
                  }
                ] 
              };
            }
            return chat;
          })
        );
      }
    }
  };

  const sendMessage = () => {
    Keyboard.dismiss();
    if ((!messageInput.trim() && !capturedImage) || !currentChat) return;
    
    // Save current image URI before using it
    const currentImageUri = capturedImage ? capturedImage : null;
    
    const newMessage: Message = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
      text: messageInput || (capturedImage ? "📷 Image upload" : ""),
      isUser: true,
      timestamp: Date.now(),
      imageUri: capturedImage || undefined,
      productsByUrl: {},
    };
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChat
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      )
    );
    
    const userInput = messageInput.toLowerCase().trim();
    setMessageInput('');
    
    if (currentImageUri) {
      // First clear the captured image to allow another to be selected
      setCapturedImage(null);
      
      // Then handle the image query with the saved URI
      handleImageQuery(currentImageUri, messageInput || "any products like this?");
    } else if (userInput === 'souledstore') {
      // Handle original souledstore command
      handleTextQuery(userInput);
    } else {
      // Normal text query to API
      handleTextQuery(userInput);
    }
  };

  const openCamera = () => {
    navigation.navigate('Camera');
  };

  if (!fontsLoaded) {
    return null;
  }

  const currentChatData = chats.find(chat => chat.id === currentChat);
  
  const formatChatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'This would normally sign you out. For this demo, we\'ll just close the sidebar.');
    setSidebarVisible(false);
  };

  // Create an image modal component
  const ImageModal = () => {
    if (!selectedImage) return null;
    
    // Create animation value for modal entry
    const [modalAnimation] = useState(new Animated.Value(0));
    
    // Start animation when the modal opens
    useEffect(() => {
      if (modalVisible) {
        Animated.spring(modalAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        }).start();
      } else {
        modalAnimation.setValue(0);
      }
    }, [modalVisible]);
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.imageModalContainer,
              {
                transform: [
                  { scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })},
                  { translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })}
                ],
                opacity: modalAnimation
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedImage(null);
              }}
            >
              <Ionicons name="close-circle" size={36} color={Colors.white} />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Update the loading skeleton with glassmorphism effect
  const LoadingSkeleton = () => {
    // Create animation values for each dot
    const [dot1] = useState(new Animated.Value(0));
    const [dot2] = useState(new Animated.Value(0));
    const [dot3] = useState(new Animated.Value(0));

    useEffect(() => {
      // Create sequence animation
      const animateDots = () => {
        Animated.sequence([
          // Animate first dot
          Animated.timing(dot1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          // Animate second dot
          Animated.timing(dot2, {
            toValue: 1, 
            duration: 300,
            useNativeDriver: true
          }),
          // Animate third dot
          Animated.timing(dot3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          // Reset all dots
          Animated.parallel([
            Animated.timing(dot1, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true
            }),
            Animated.timing(dot2, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true
            }),
            Animated.timing(dot3, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true
            })
          ])
        ]).start(() => {
          // Restart animation
          animateDots();
        });
      };

      // Start the animation
      animateDots();

      // Cleanup function
      return () => {
        dot1.setValue(0);
        dot2.setValue(0);
        dot3.setValue(0);
      };
    }, []);

    return (
      <View style={[styles.messageBubble, styles.systemBubble, styles.glassBubble]}>
        <View style={styles.skeletonContainer}>
          <Animated.View 
            style={[
              styles.skeletonDot, 
              { transform: [{ scale: dot1.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5]
              })}] 
            }]} 
          />
          <Animated.View 
            style={[
              styles.skeletonDot, 
              { transform: [{ scale: dot2.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5]
              })}] 
            }]} 
          />
          <Animated.View 
            style={[
              styles.skeletonDot, 
              { transform: [{ scale: dot3.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5]
              })}] 
            }]} 
          />
        </View>
      </View>
    );
  };

  // Add function to handle OTP submit
  const handleOtpSubmit = (otp: string) => {
    console.log('Submitting OTP:', otp);
    setLoginStatus('Submitting OTP...');
    
    if (loginWebViewRef.current) {
      loginWebViewRef.current.injectOtp(otp);
    }
    
    setShowOtpModal(false);
  };

  // Add function to handle login flow messages
  const handleLoginMessage = (message: string) => {
    console.log('Login message:', message);
    
    if (message.startsWith('CONSOLE:')) {
      console.log('WebView console:', message.substring(9));
    } else if (message === 'OTP_SCREEN') {
      setShowOtpModal(true);
      setLoginStatus('OTP verification required');
    } else if (message === 'LOGIN_SUCCESS') {
      setLoginStatus('Login successful!');
      
      // Add a success message to the chat
      if (currentChat) {
        const successMessage: Message = {
          id: generateUniqueId(),
          text: 'Login successful! Your account is now connected.',
          isUser: false,
          timestamp: Date.now(),
          productsByUrl: {},
        };
        
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === currentChat
              ? { ...chat, messages: [...chat.messages, successMessage] }
              : chat
          )
        );
      }
      
      // Reset login flow
      setIsLoginFlow(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSidebarVisible(true)}>
              <Ionicons name="chatbubble-outline" size={24} color={Colors.black} />
            </TouchableOpacity>
            
            <Text style={styles.headerText}>Bridge.</Text>
            
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>R</Text>
            </View>
          </View>
          
          {/* Main Content */}
          <View style={styles.content}>
            {currentChatData && currentChatData.messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <View style={styles.welcomeOuterCircle}>
                  <ImageBackground 
                    source={require('../assets/images/noise-texture.png')} 
                    style={styles.grainOverlay}
                    imageStyle={{ opacity: 0.1, borderRadius: 88 }}
                  >
                    <View style={styles.welcomeMiddleCircle}>
                      <ImageBackground 
                        source={require('../assets/images/noise-texture.png')} 
                        style={styles.grainOverlay}
                        imageStyle={{ opacity: 0.2, borderRadius: 72 }}
                      >
                        <LinearGradient
                          colors={['#FFE97A', '#FFD800', '#FFC700']}
                          style={styles.welcomeInnerCircle}
                        >
                          <ImageBackground 
                            source={require('../assets/images/noise-texture.png')} 
                            style={styles.grainOverlay}
                            imageStyle={{ opacity: 0.25, borderRadius: 60 }}
                          >
                            <Text style={styles.welcomeText}>Hi, Rohit.</Text>
                          </ImageBackground>
                        </LinearGradient>
                      </ImageBackground>
                    </View>
                  </ImageBackground>
                </View>
              </View>
            ) : (
              <FlatList
                data={currentChatData?.messages || []}
                keyExtractor={item => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.messageList}
              />
            )}
          </View>
          
          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.inputIcon}
              onPress={openCamera}
            >
              <Ionicons 
                name="camera-outline" 
                size={24} 
                color={Colors.gray} 
              />
            </TouchableOpacity>
            
            {capturedImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setCapturedImage(null)}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : null}
            
            <TextInput
              style={[styles.input, capturedImage ? styles.inputWithImage : null]}
              placeholder={capturedImage ? "Ask about this image..." : "What's on your mind?"}
              placeholderTextColor={Colors.gray}
              value={messageInput}
              onChangeText={setMessageInput}
              onSubmitEditing={sendMessage}
            />
            
            <TouchableOpacity 
              onPress={sendMessage} 
              style={[styles.sendButton, !messageInput && !capturedImage && styles.disabledButton]}
              disabled={!messageInput && !capturedImage}
            >
              <Ionicons name="send" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Add the image modal */}
        <ImageModal />
      </SafeAreaView>
      
      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Chats</Text>
              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.newChatButton}
              onPress={createNewChat}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.black} />
              <Text style={styles.newChatText}>New Chat</Text>
            </TouchableOpacity>
            
            <FlatList
              data={chats.slice().reverse()} // Show newest first
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.chatItem, item.id === currentChat && styles.activeChatItem]}
                  onPress={() => {
                    setCurrentChat(item.id);
                    setSidebarVisible(false);
                  }}
                >
                  <Text style={styles.chatItemDate}>{formatChatDate(item.createdAt)}</Text>
                  <Text style={styles.chatItemPreview}>
                    {item.messages.length > 0 
                      ? item.messages[item.messages.length - 1].text.slice(0, 30) + (item.messages[item.messages.length - 1].text.length > 30 ? '...' : '')
                      : 'New conversation'}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* OTP Modal */}
      <OtpModal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSubmit={handleOtpSubmit}
        title="Enter Verification Code"
        message={`Please enter the OTP sent to your device for secure login.${loginStatus ? ' ' + loginStatus : ''}`}
      />

      {/* Login WebView */}
      {isLoginFlow && productExtractionData && (
        <BackgroundWebView
          ref={loginWebViewRef}
          urls={productExtractionData.login_url ? [productExtractionData.login_url] : ['https://www.thesouledstore.com/login']}
          injectedJs={productExtractionData.injected_js}
          onImagesExtracted={() => {}} // No images to extract in login flow
          onError={(error) => console.error('Login flow error:', error)}
          onComplete={() => {
            console.log('Login flow completed');
            setIsLoginFlow(false);
          }}
          isLoginFlow={true}
          onOtpRequest={() => setShowOtpModal(true)}
          onLoginSuccess={() => {
            setLoginStatus('Login successful!');
            setIsLoginFlow(false);
            
            // Add a success message to the chat
            if (currentChat) {
              const successMessage: Message = {
                id: generateUniqueId(),
                text: 'Login successful! Your account is now connected.',
                isUser: false,
                timestamp: Date.now(),
                productsByUrl: {},
              };
              
              setChats(prevChats => 
                prevChats.map(chat => 
                  chat.id === currentChat
                    ? { ...chat, messages: [...chat.messages, successMessage] }
                    : chat
                )
              );
            }
          }}
          onMessage={handleLoginMessage}
        />
      )}

      {/* Background WebView for product extraction */}
      {isExtractingProducts && !isLoginFlow && productExtractionData && (
        <BackgroundWebView
          urls={productExtractionData.page_urls.slice(productExtractionData.currentUrlIndex)}
          injectedJs={productExtractionData.injected_js}
          onImagesExtracted={(images, isFirstBatch, currentUrl) => 
            handleImagesExtracted(
              images, 
              isFirstBatch, 
              productExtractionData.messageId,
              currentUrl
            )
          }
          onError={handleExtractionError}
          onComplete={handleUrlExtractionComplete}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: '#F5F5F5',
    borderBottomWidth: 1,
  },
  headerText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: Colors.black,
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileInitial: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    color: Colors.black,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none', // Allow interaction with elements below
  },
  welcomeOuterCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(255, 237, 160, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeMiddleCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'rgba(255, 232, 117, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  welcomeInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  welcomeText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
  },
  messageList: {
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginVertical: 5,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.yellow,
    marginLeft: 50,
  },
  systemBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    marginRight: 50,
  },
  htmlBubble: {
    maxWidth: '90%',
  },
  imageBubble: {
    width: 240,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: Colors.black,
    fontFamily: 'Montserrat_400Regular',
  },
  systemText: {
    color: Colors.black,
    fontFamily: 'Montserrat_400Regular',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  htmlContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  htmlText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: Colors.gray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopColor: '#F5F5F5',
    borderTopWidth: 1,
  },
  inputIcon: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
  },
  inputWithImage: {
    flex: 0.7,
  },
  previewContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    marginHorizontal: 5,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.yellow,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
  },
  sendButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: '80%',
    height: '100%',
    backgroundColor: Colors.white,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomColor: '#F5F5F5',
    borderBottomWidth: 1,
  },
  sidebarTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: Colors.black,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  newChatText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    color: Colors.black,
    marginLeft: 8,
  },
  chatItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  activeChatItem: {
    backgroundColor: '#E8E8E8',
    borderLeftWidth: 3,
    borderLeftColor: Colors.yellow,
  },
  chatItemDate: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: Colors.black,
    marginBottom: 5,
  },
  chatItemPreview: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: Colors.gray,
  },
  signOutButton: {
    backgroundColor: Colors.coral,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  signOutText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    color: Colors.white,
  },
  linkText: {
    color: '#007BFF',
    textDecorationLine: 'underline',
    fontFamily: 'Montserrat_500Medium',
  },
  productBubble: {
    maxWidth: '95%',
    width: '95%',
    backgroundColor: Colors.white,
    borderColor: Colors.lightGray,
    borderWidth: 1,
    padding: 12,
    paddingBottom: 6,
  },
  productUrlGroup: {
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urlHeader: {
    backgroundColor: 'rgba(255, 255, 237, 0.85)',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedUrlHeader: {
    backgroundColor: 'rgba(255, 251, 204, 0.95)',
  },
  urlText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: Colors.black,
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: 10,
  },
  productImagesRow: {
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  productImageContainer: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: 'white',
    margin: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 5,
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Montserrat_400Regular',
  },
  glassBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: '90%',
    height: '70%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  skeletonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  skeletonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.yellow,
    marginHorizontal: 5,
    opacity: 0.7,
  },
  productImageTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  grainOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bridgedFromContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    marginTop: 5,
  },
  bridgedFromText: {
    fontSize: 10,
    color: Colors.gray,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
  },
  bridgedFromSiteUrl: {
    textDecorationLine: 'underline',
    fontFamily: 'Montserrat_500Medium',
  },
}); 