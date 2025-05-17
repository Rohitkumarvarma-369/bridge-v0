import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';

export default function WaitlistScreen() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('waitlist'); // 'waitlist' or 'token'
  
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_500Medium,
    Montserrat_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSubmit = () => {
    if (activeTab === 'waitlist' && email.trim()) {
      router.replace('/confirmation');
    } else if (activeTab === 'token' && token.trim()) {
      router.replace('/home');
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Text style={styles.title}>BRIDGE</Text>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'waitlist' && styles.activeTab]}
              onPress={() => setActiveTab('waitlist')}
            >
              <Text style={[styles.tabText, activeTab === 'waitlist' && styles.activeTabText]}>Join Waitlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'token' && styles.activeTab]}
              onPress={() => setActiveTab('token')}
            >
              <Text style={[styles.tabText, activeTab === 'token' && styles.activeTabText]}>Access Token</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {activeTab === 'waitlist' ? (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.gray}
                />
                <TouchableOpacity 
                  style={[styles.button, !email.trim() && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!email.trim()}
                >
                  <Text style={styles.buttonText}>Join Waitlist</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Access Token</Text>
                <TextInput
                  style={styles.input}
                  value={token}
                  onChangeText={setToken}
                  placeholder="Enter your access token"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.gray}
                />
                <TouchableOpacity 
                  style={[styles.button, !token.trim() && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!token.trim()}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: Colors.black,
    marginTop: 30,
    marginBottom: 40,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: Colors.gray,
  },
  activeTabText: {
    color: Colors.black,
  },
  formContainer: {
    marginTop: 10,
  },
  label: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    marginBottom: 24,
    color: Colors.black,
  },
  button: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.yellow,
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    color: Colors.black,
  },
}); 