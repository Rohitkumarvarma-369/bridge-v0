import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import BackgroundWebView from './BackgroundWebView';
import ProductImagesCarousel from './ProductImagesCarousel';

interface ProductImageExtractorProps {
  responseData: {
    page_urls: string[];
    injected_js: string;
  };
  onComplete: (extractedImages: string[]) => void;
  onCancel: () => void;
}

export default function ProductImageExtractor({ 
  responseData, 
  onComplete, 
  onCancel 
}: ProductImageExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  // Handle when new images are extracted
  const handleImagesExtracted = (newImages: string[]) => {
    setExtractedImages(prevImages => {
      // Filter out duplicates
      const allImages = [...prevImages, ...newImages];
      return [...new Set(allImages)];
    });
  };

  // Handle extraction completion
  const handleExtractionComplete = () => {
    setIsExtracting(false);
    // Pass extracted images back to parent component
    onComplete(extractedImages);
  };

  // Handle extraction error
  const handleExtractionError = (errorMessage: string) => {
    setError(errorMessage);
    // We continue extraction even if there are errors
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Finding Products</Text>
        <View style={styles.placeholder} />
      </View>

      {isExtracting ? (
        <>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.yellow} />
            <Text style={styles.loadingText}>
              Browsing {responseData.page_urls.length} pages to find products...
            </Text>
            {extractedImages.length > 0 && (
              <Text style={styles.foundText}>
                Found {extractedImages.length} product images so far
              </Text>
            )}
          </View>
          
          {extractedImages.length > 0 && (
            <ProductImagesCarousel images={extractedImages} />
          )}
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          {/* Hidden background WebView that does the extraction */}
          <BackgroundWebView
            urls={responseData.page_urls}
            injectedJs={responseData.injected_js}
            onImagesExtracted={handleImagesExtracted}
            onError={handleExtractionError}
            onComplete={handleExtractionComplete}
          />
        </>
      ) : (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            {extractedImages.length > 0
              ? `Found ${extractedImages.length} product images!`
              : 'No product images found.'}
          </Text>
          
          <ProductImagesCarousel 
            images={extractedImages} 
          />
          
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => onComplete(extractedImages)}
          >
            <Text style={styles.doneButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.black,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: Colors.coral,
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  placeholder: {
    width: 70, // To balance the header
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.black,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
  },
  foundText: {
    marginTop: 8,
    color: Colors.yellow,
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
  errorText: {
    color: Colors.coral,
    padding: 16,
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
  },
  completedContainer: {
    flex: 1,
    padding: 16,
  },
  completedText: {
    fontSize: 18,
    color: Colors.black,
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
    marginVertical: 16,
  },
  doneButton: {
    backgroundColor: Colors.yellow,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  doneButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
}); 