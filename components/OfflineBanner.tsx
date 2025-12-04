import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTheme } from '@/contexts/ThemeContext';

export const OfflineBanner: React.FC = () => {
  const { isConnected } = useNetwork();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (isConnected) {
    return null;
  }

  return (
    <View 
      style={{ 
        backgroundColor: '#DC2626',
        paddingTop: insets.top,
        paddingBottom: 12,
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingTop: 8,
      }}>
        <Feather 
          name="wifi-off" 
          size={16} 
          color="#FFFFFF" 
          style={{ marginRight: 8 }}
        />
        <Text 
          style={{ 
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          No Internet Connection
        </Text>
      </View>
      <Text 
        style={{ 
          color: '#FECACA',
          fontSize: 12,
          textAlign: 'center',
          marginTop: 2,
          opacity: 0.9,
        }}
      >
        Some features may be limited
      </Text>
    </View>
  );
};