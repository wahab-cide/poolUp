import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ReactNativeModal } from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { fetchAPI } from '../lib/fetch';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

type VerificationStep = 'welcome' | 'requirements' | 'loading' | 'success' | 'error';

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userClerkId: string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userClerkId
}) => {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('welcome');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleStartVerification = async () => {
    setCurrentStep('loading');
    
    try {
      const data = await fetchAPI('/api/driver/verify', {
        method: 'POST',
        body: JSON.stringify({
          clerkId: userClerkId
        }),
      });

      if (data.success && data.verification_session?.url) {
        // Open Stripe Identity URL
        const supported = await Linking.canOpenURL(data.verification_session.url);
        if (supported) {
          await Linking.openURL(data.verification_session.url);
          setCurrentStep('success');
        } else {
          throw new Error('Cannot open verification URL');
        }
      } else {
        throw new Error(data.error || 'Failed to create verification session');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setCurrentStep('error');
    }
  };

  const handleRetry = () => {
    setCurrentStep('welcome');
    setErrorMessage('');
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
    setCurrentStep('welcome');
  };

  const renderWelcome = () => (
    <View style={{ alignItems: 'center' }}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24
        }}
      >
        <Ionicons name="shield-checkmark" size={40} color="white" />
      </LinearGradient>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 12, textAlign: 'center' }}>
        Verify Your Identity
      </Text>
      
      <Text style={{ fontSize: 16, color: isDark ? '#D1D5DB' : '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
        Complete identity verification to unlock payments and build trust with riders.
      </Text>

      <View style={{ width: '100%', marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 16 }}>
          Benefits of verification:
        </Text>
        
        {[
          { icon: 'wallet', text: 'Receive payments for your rides' },
          { icon: 'shield', text: 'Increase trust with passengers' },
          { icon: 'trending-up', text: 'Get more booking requests' },
          { icon: 'checkmark-circle', text: 'Verified driver badge' }
        ].map((benefit, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ 
              backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', 
              borderRadius: 8, 
              padding: 8, 
              marginRight: 12 
            }}>
              <Ionicons name={benefit.icon as any} size={18} color="#667eea" />
            </View>
            <Text style={{ fontSize: 15, color: isDark ? '#D1D5DB' : '#374151', flex: 1 }}>
              {benefit.text}
            </Text>
          </View>
        ))}
      </View>

      <CustomButton
        title="Continue"
        onPress={() => setCurrentStep('requirements')}
        bgVariant="primary"
        className="w-full mb-4"
      />
      
      <CustomButton
        title="Maybe Later"
        onPress={onClose}
        bgVariant="outline"
        textVariant="primary"
        className="w-full"
      />
    </View>
  );

  const renderRequirements = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        alignItems: 'center'
      }}>
        <Ionicons name="document-text" size={40} color="#F59E0B" />
      </View>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 12, textAlign: 'center' }}>
        What You&apos;ll Need
      </Text>
      
      <Text style={{ fontSize: 16, color: isDark ? '#D1D5DB' : '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
        The verification process takes about 2-3 minutes and requires:
      </Text>

      <View style={{ width: '100%', marginBottom: 32 }}>
        {[
          { 
            icon: 'card', 
            title: 'Government-issued ID',
            subtitle: 'Driver&apos;s license, passport, or national ID card'
          },
          { 
            icon: 'camera', 
            title: 'Take a selfie',
            subtitle: 'We&apos;ll match your face to your ID for security'
          },
          { 
            icon: 'time', 
            title: 'Wait for approval',
            subtitle: 'Usually completed within minutes'
          }
        ].map((requirement, index) => (
          <View key={index} style={{ 
            flexDirection: 'row', 
            alignItems: 'flex-start', 
            marginBottom: 20,
            backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : '#F9FAFB',
            borderRadius: 12,
            padding: 16
          }}>
            <View style={{ 
              backgroundColor: '#667eea', 
              borderRadius: 12, 
              padding: 10, 
              marginRight: 16 
            }}>
              <Ionicons name={requirement.icon as any} size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 4 }}>
                {requirement.title}
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 20 }}>
                {requirement.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <CustomButton
        title="Start Verification"
        onPress={handleStartVerification}
        bgVariant="primary"
        className="w-full mb-4"
        IconLeft={() => <Ionicons name="shield-checkmark" size={20} color="white" style={{ marginRight: 8 }} />}
      />
      
      <TouchableOpacity onPress={() => setCurrentStep('welcome')} style={{ padding: 12 }}>
        <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 16, fontWeight: '500' }}>
          Back
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        backgroundColor: '#DBEAFE',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center'
      }}>
        <Ionicons name="hourglass" size={40} color="#3B82F6" />
      </View>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 12, textAlign: 'center' }}>
        Setting Up Verification
      </Text>
      
      <Text style={{ fontSize: 16, color: isDark ? '#D1D5DB' : '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
        Please wait while we prepare your verification session...
      </Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        backgroundColor: '#D1FAE5',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center'
      }}>
        <Ionicons name="checkmark-circle" size={40} color="#10B981" />
      </View>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 12, textAlign: 'center' }}>
        Verification Started!
      </Text>
      
      <Text style={{ fontSize: 16, color: isDark ? '#D1D5DB' : '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
        Complete the verification in the browser that just opened. We&apos;ll update your status automatically when done.
      </Text>

      <CustomButton
        title="Done"
        onPress={handleSuccess}
        bgVariant="primary"
        className="w-full"
      />
    </View>
  );

  const renderError = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center'
      }}>
        <Ionicons name="alert-circle" size={40} color="#EF4444" />
      </View>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 12, textAlign: 'center' }}>
        Verification Failed
      </Text>
      
      <Text style={{ fontSize: 16, color: isDark ? '#D1D5DB' : '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 8 }}>
        Unable to start verification process.
      </Text>
      
      <Text style={{ fontSize: 14, color: '#EF4444', textAlign: 'center', marginBottom: 32 }}>
        {errorMessage}
      </Text>

      <CustomButton
        title="Try Again"
        onPress={handleRetry}
        bgVariant="primary"
        className="w-full mb-4"
      />
      
      <CustomButton
        title="Cancel"
        onPress={onClose}
        bgVariant="outline"
        textVariant="primary"
        className="w-full"
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcome();
      case 'requirements':
        return renderRequirements();
      case 'loading':
        return renderLoading();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderWelcome();
    }
  };

  return (
    <ReactNativeModal
      isVisible={visible}
      onBackdropPress={currentStep !== 'loading' ? onClose : undefined}
      className="justify-center m-4"
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
    >
      <View style={{
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        maxHeight: '90%'
      }}>
        {/* Handle bar */}
        <View style={{
          width: 40,
          height: 4,
          backgroundColor: isDark ? '#6B7280' : '#E5E7EB',
          borderRadius: 2,
          alignSelf: 'center',
          marginBottom: 20
        }} />

        {renderCurrentStep()}
      </View>
    </ReactNativeModal>
  );
};

export default VerificationModal;