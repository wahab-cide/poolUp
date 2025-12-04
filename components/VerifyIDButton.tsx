import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerifyIDButtonProps {
  onPress: () => void;
  loading?: boolean;
  status: VerificationStatus;
  style?: any;
}

const VerifyIDButton: React.FC<VerifyIDButtonProps> = ({ 
  onPress, 
  loading = false, 
  status,
  style 
}) => {
  // Don't render for verified status
  if (status === 'verified') {
    return null;
  }

  const getButtonConfig = () => {
    switch (status) {
      case 'unverified':
        return {
          colors: ['#667eea', '#764ba2'],
          text: 'Verify Your Identity',
          icon: 'shield-checkmark' as const,
          subtitle: 'Unlock payments and build trust'
        };
      case 'pending':
        return {
          colors: ['#F59E0B', '#D97706'],
          text: 'Verification in Progress',
          icon: 'time' as const,
          subtitle: 'We\'ll notify you when complete'
        };
      case 'rejected':
        return {
          colors: ['#EF4444', '#DC2626'],
          text: 'Retry Verification',
          icon: 'refresh' as const,
          subtitle: 'Try again with valid documents'
        };
      default:
        return {
          colors: ['#667eea', '#764ba2'],
          text: 'Verify Your Identity',
          icon: 'shield-checkmark' as const,
          subtitle: 'Unlock payments and build trust'
        };
    }
  };

  const config = getButtonConfig();
  const isDisabled = loading || status === 'pending';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        {
          marginHorizontal: 24,
          marginVertical: 16,
          borderRadius: 16,
          opacity: isDisabled ? 0.7 : 1
        },
        style
      ]}
    >
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          padding: 16,
          shadowColor: config.colors[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Icon/Loading */}
          <View 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 12, 
              padding: 8, 
              marginRight: 12 
            }}
          >
            {loading ? (
              <ActivityIndicator size={20} color="white" />
            ) : (
              <Ionicons name={config.icon} size={20} color="white" />
            )}
          </View>
          
          {/* Text Content */}
          <View style={{ flex: 1 }}>
            <Text 
              style={{ 
                color: 'white', 
                fontSize: 16, 
                fontWeight: 'bold',
                marginBottom: 2
              }}
            >
              {loading ? 'Setting up verification...' : config.text}
            </Text>
            <Text 
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: 13,
                fontWeight: '500'
              }}
            >
              {config.subtitle}
            </Text>
          </View>

          {/* Arrow */}
          {!loading && (
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="rgba(255, 255, 255, 0.8)" 
            />
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default VerifyIDButton;