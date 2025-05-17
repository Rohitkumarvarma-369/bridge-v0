import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text } from 'react-native';
import ProductImageExtractor from '../components/ProductImageExtractor';

export default function ProductExtractionScreen({ navigation, route }: any) {
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [hasValidatedData, setHasValidatedData] = useState(false);
  
  // Get response data from route params
  const responseData = route.params?.responseData;
  
  // Validate response data
  useEffect(() => {
    console.log('ProductExtractionScreen - Response Data:', JSON.stringify(responseData, null, 2));
    
    if (!responseData) {
      console.error('No response data provided');
      showErrorAndGoBack('No product data found');
      return;
    }
    
    if (!responseData.page_urls || !Array.isArray(responseData.page_urls)) {
      console.error('Invalid page_urls in response data', responseData.page_urls);
      showErrorAndGoBack('Invalid product URLs provided');
      return;
    }
    
    if (!responseData.injected_js || typeof responseData.injected_js !== 'string') {
      console.error('Invalid injected_js in response data', 
        typeof responseData.injected_js, 
        responseData.injected_js ? responseData.injected_js.substring(0, 100) + '...' : 'null'
      );
      showErrorAndGoBack('Invalid JavaScript for product extraction');
      return;
    }
    
    console.log('Response data validated successfully:',
      responseData.page_urls.length, 'URLs,',
      'injected_js length:', responseData.injected_js.length
    );
    
    setHasValidatedData(true);
  }, [responseData]);
  
  const showErrorAndGoBack = (message: string) => {
    Alert.alert('Error', message, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };
  
  // Handle when extraction is complete
  const handleExtractionComplete = (images: string[]) => {
    console.log('Extraction complete with', images.length, 'images');
    setExtractedImages(images);
    
    // Go back to home with the extracted images
    navigation.navigate('Home', {
      extractedImages: images,
      fromProductExtraction: true
    });
  };
  
  // Handle cancellation
  const handleCancel = () => {
    Alert.alert(
      "Cancel Extraction",
      "Are you sure you want to cancel the product extraction?",
      [
        {
          text: "No, Continue",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          onPress: () => navigation.goBack()
        }
      ]
    );
  };
  
  if (!hasValidatedData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Validating product data...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ProductImageExtractor
        responseData={responseData}
        onComplete={handleExtractionComplete}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  }
}); 