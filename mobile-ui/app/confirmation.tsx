import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Montserrat_700Bold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { router } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function ConfirmationScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_500Medium,
    Montserrat_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Animated.View 
              entering={ZoomIn.duration(800)}
              style={styles.checkmarkContainer}
            >
              <View style={styles.checkmarkBg}>
                <Ionicons name="checkmark" size={50} color="white" />
              </View>
            </Animated.View>
            
            <Animated.Text 
              entering={FadeIn.delay(600).duration(800)}
              style={styles.title}
            >
              Thank You!
            </Animated.Text>
            
            <Animated.Text 
              entering={FadeIn.delay(900).duration(800)}
              style={styles.message}
            >
              We are thrilled to have you here, we would review and share an access token soon, hold tight!
            </Animated.Text>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.replace('/waitlist')}
          >
            <Text style={styles.buttonText}>Back to Waitlist</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  checkmarkContainer: {
    marginBottom: 32,
  },
  checkmarkBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: Colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    color: Colors.black,
  },
}); 