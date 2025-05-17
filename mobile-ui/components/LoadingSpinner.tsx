import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingSpinnerProps {
  visible: boolean;
  text?: string;
}

export default function LoadingSpinner({ visible, text = 'Loading...' }: LoadingSpinnerProps) {
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      <View style={[styles.gradient, styles.darkBackground]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6A5ACD" />
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkBackground: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loaderContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 