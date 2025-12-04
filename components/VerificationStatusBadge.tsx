import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'small' | 'medium';
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  size = 'medium' 
}) => {
  // Don't render anything for unverified status
  if (status === 'unverified') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          backgroundColor: '#22C55E',
          icon: 'check-circle' as const,
          text: 'ID Verified',
          textColor: '#fff'
        };
      case 'pending':
        return {
          backgroundColor: '#F59E0B',
          icon: 'clock' as const,
          text: 'Verifying',
          textColor: '#fff'
        };
      case 'rejected':
        return {
          backgroundColor: '#EF4444',
          icon: 'x-circle' as const,
          text: 'Verification Failed',
          textColor: '#fff'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const isSmall = size === 'small';
  const iconSize = isSmall ? 12 : 16;
  const fontSize = isSmall ? 10 : 12;
  const paddingHorizontal = isSmall ? 6 : 8;
  const paddingVertical = isSmall ? 1 : 2;

  return (
    <View 
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: config.backgroundColor, 
        borderRadius: 12, 
        paddingHorizontal,
        paddingVertical
      }}
    >
      <Feather name={config.icon} size={iconSize} color={config.textColor} />
      <Text 
        style={{ 
          marginLeft: 4, 
          fontWeight: '600', 
          color: config.textColor,
          fontSize
        }}
      >
        {config.text}
      </Text>
    </View>
  );
};

export default VerificationStatusBadge;