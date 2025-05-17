import { Montserrat_400Regular, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Colors from '../constants/Colors';

export default function SplashScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Navigate to waitlist screen after 3 seconds
      const timer = setTimeout(() => {
        router.replace('/waitlist');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Animated.Text 
            entering={FadeIn.duration(800)}
            style={styles.title}
          >
            BRIDGE.
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(800).duration(1200)}
            style={styles.tagline}
          >
            You need it, you bridge it.
          </Animated.Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 42,
    color: Colors.white,
    marginBottom: 20,
  },
  tagline: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 18,
    color: Colors.white,
    opacity: 0.8,
    fontStyle: 'italic',
  },
}); 