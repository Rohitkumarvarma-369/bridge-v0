import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import CameraView from '../components/CameraView';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function CameraScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle closing the camera
  const handleClose = () => {
    navigation.goBack();
  };
  
  // Handle when an image is captured
  const handleCapture = async (imageUri: string) => {
    try {
      setIsLoading(true);
      
      // Send the image back to the home screen
      navigation.navigate('Home', { capturedImage: imageUri });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert(
        'Error',
        'There was a problem processing your image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  if (isLoading) {
    return <LoadingSkeleton text="Processing your image..." />;
  }
  
  return (
    <View style={styles.container}>
      <CameraView onClose={handleClose} onCapture={handleCapture} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
}); 