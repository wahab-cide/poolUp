import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { useState } from "react";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { googleOAuth, appleOAuth } from "@/lib/auth";
import { showErrorToast } from "@/lib/toast";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

interface OAuthProps {
  disabled?: boolean;
}

const OAuth = ({ disabled = false }: OAuthProps) => {
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: "oauth_apple" });
  
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await googleOAuth(startGoogleOAuthFlow);

      if (result.success) {
        // Direct redirect without toast - let main router handle onboarding
        router.replace("/");
      } else if (result.code === "session_exists") {
        // Session already exists, redirect directly - let main router handle onboarding
        router.replace("/");
      } else {
        showErrorToast(result.message, "Error");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const result = await appleOAuth(startAppleOAuthFlow);

      if (result.success) {
        // Direct redirect without toast - let main router handle onboarding
        router.replace("/");
      } else if (result.code === "session_exists") {
        // Session already exists, redirect directly - let main router handle onboarding
        router.replace("/");
      } else {
        showErrorToast(result.message, "Error");
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <View style={{ 
      marginTop: 24, 
      gap: 12,
      width: '100%',
    }}>
      <TouchableOpacity
        onPress={handleAppleSignIn}
        disabled={disabled || googleLoading || appleLoading}
        style={{
          width: '100%',
          height: 54,
          borderRadius: 27,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB',
          opacity: (disabled || googleLoading || appleLoading) ? 0.6 : 1,
        }}
        activeOpacity={0.8}
      >
        {appleLoading ? (
          <Text style={{ color: '#666666', fontSize: 16, fontFamily: 'Inter-Medium' }}>Signing in with Apple...</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome 
              name="apple" 
              size={18} 
              color={isDark ? "#FFFFFF" : "#000000"}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: isDark ? '#FFFFFF' : '#000000',
              fontFamily: 'Inter-Medium',
              marginLeft: 10,
            }}>
              Continue with Apple
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={disabled || googleLoading || appleLoading}
        style={{
          width: '100%',
          height: 54,
          borderRadius: 27,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB',
          opacity: (disabled || googleLoading || appleLoading) ? 0.6 : 1,
        }}
        activeOpacity={0.8}
      >
        {googleLoading ? (
          <Text style={{ color: '#666666', fontSize: 16, fontFamily: 'Inter-Medium' }}>Signing in with Google...</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome 
              name="google" 
              size={18} 
              color="#EA4335"
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: isDark ? '#FFFFFF' : '#000000',
              fontFamily: 'Inter-Medium',
              marginLeft: 10,
            }}>
              Continue with Google
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default OAuth;