import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CameraViewProps {
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export default function CameraView({ onClose, onCapture }: CameraViewProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Request permissions and launch camera automatically when component mounts
  useEffect(() => {
    const initializeCamera = async () => {
      setIsLoading(true);
      if (await requestPermissions()) {
        // Automatically launch the camera after permission is granted
        setTimeout(() => {
          takePicture();
        }, 500); // Small delay to ensure component is fully mounted
      }
    };
    
    initializeCamera();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'We need camera permissions to take photos. You can still select from gallery.');
        setIsLoading(false);
        return false;
      }
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const takePicture = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. You can try again or pick from gallery.');
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  // Loading screen while camera is initializing
  if (isLoading && !capturedImage) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <MaterialIcons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Opening Camera...</Text>
          <View style={styles.iconButton} />
        </View>
        
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.galleryButtonDuringLoading} 
          onPress={pickImage}
        >
          <MaterialIcons name="photo-library" size={24} color="white" />
          <Text style={styles.galleryButtonText}>Or select from gallery</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.preview} />
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.button} onPress={() => {
              setCapturedImage(null);
              takePicture(); // Relaunch camera when retaking
            }}>
              <MaterialIcons name="replay" size={24} color="white" />
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <MaterialIcons name="check" size={24} color="white" />
              <Text style={styles.buttonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={onClose}>
              <MaterialIcons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Take a photo</Text>
            <View style={styles.iconButton} />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={28} color="white" />
              <Text style={styles.smallButtonText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.iconButton} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginBottom: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  preview: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 30,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#2E8B57',
  },
  buttonText: {
    color: 'white',
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'space-between',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  galleryButtonDuringLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 40,
    marginBottom: 30,
  },
  galleryButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
}); 