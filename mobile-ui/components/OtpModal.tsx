import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Colors from '../constants/Colors';

interface OtpModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  title?: string;
  message?: string;
}

const OtpModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  title = 'Enter OTP', 
  message = 'Please enter the verification code sent to your device' 
}: OtpModalProps) => {
  const [otp, setOtp] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Set up individual OTP digit inputs
  const inputs = Array(4).fill(0).map(() => useRef<TextInput>(null));
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Reset OTP when modal opens
      setOtp('');
      setOtpDigits(['', '', '', '']);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);
  
  const handleOtpChange = (text: string, index: number) => {
    // Update the current digit
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = text;
    setOtpDigits(newOtpDigits);
    
    // Combine all digits to form the complete OTP
    const newOtp = newOtpDigits.join('');
    setOtp(newOtp);
    
    // Move to next input if available
    if (text && index < 3) {
      inputs[index + 1].current?.focus();
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };
  
  const handleSubmit = () => {
    if (otp.length === 4) {
      onSubmit(otp);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1]
            })}] }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalMessage}>{message}</Text>
          
          <View style={styles.otpContainer}>
            {otpDigits.map((digit, index) => (
              <View key={index} style={[
                styles.otpInputWrapper,
                inputFocused && index === otpDigits.findIndex(d => d === '') && styles.otpInputWrapperActive
              ]}>
                <TextInput
                  ref={inputs[index]}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                  keyboardType="numeric"
                  maxLength={1}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  autoFocus={index === 0 && visible}
                />
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.submitButton, otp.length < 4 && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={otp.length < 4}
          >
            <Text style={styles.submitButtonText}>Verify</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.black,
  },
  closeButton: {
    padding: 5,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: Colors.gray,
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  otpInputWrapper: {
    width: '22%',
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.5)',
  },
  otpInputWrapperActive: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(248, 213, 98, 0.1)',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Montserrat_500Medium',
    color: Colors.black,
  },
  submitButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: Colors.lightGray,
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.black,
  },
});

export default OtpModal; 