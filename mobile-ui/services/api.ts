import axios from 'axios';
import { Platform } from 'react-native';

// Make API URL configurable to help with debugging
const API_URL = '';

export const askWithText = async (query: string) => {
  try {
    const response = await axios.get(`${API_URL}/ask`, {
      params: { 
        query,
        debug: true
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error querying API:', error);
    throw error;
  }
};

export const askWithImage = async (query: string, imageUri: string) => {
  try {
    console.log(`Processing image upload to ${API_URL}:`, imageUri);
    
    // Extract filename from the URI
    const originalFilename = imageUri.split('/').pop() || 'image.jpg';
    
    // Create a unique filename to avoid collisions
    const uniqueFilename = `${Date.now()}_${originalFilename}`;
    
    // Determine the image type
    const fileType = originalFilename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    console.log('File type determined as:', fileType);
    
    // Create form data for image upload
    const formData = new FormData();
    
    // Add the image file
    // @ts-ignore - TypeScript doesn't recognize the exact structure needed for React Native form data
    formData.append('file', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      name: originalFilename,
      type: fileType,
    });
    
    // Add the filename parameter
    formData.append('filename', uniqueFilename);
    
    console.log('Uploading image as:', uniqueFilename);
    
    // Step 1: Upload the image with extended timeout
    const uploadResponse = await axios.post(`${API_URL}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    console.log('Upload response:', uploadResponse.data);
    
    if (!uploadResponse.data.success) {
      throw new Error(`Failed to upload image: ${uploadResponse.data.error}`);
    }
    
    console.log('Image uploaded successfully:', uploadResponse.data);
    
    // Step 2: Make the ask query with the uploaded image path
    const imagePath = `uploads/${uniqueFilename}`;
    console.log('Making ask query with image path:', imagePath);
    
    const askResponse = await axios.get(`${API_URL}/ask`, {
      params: { 
        query,
        image_path: imagePath,
        debug: true
      }
    });
    
    return askResponse.data;
  } catch (error) {
    console.error('Error in image processing workflow:', error);
    throw error;
  }
}; 