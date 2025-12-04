import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';

const { width } = Dimensions.get('window');

const CampusIllustration = () => {
  const { isDark } = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation for buildings
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in animation
    const fadeInAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    });

    fadeInAnimation.start();
    floatingAnimation.start();

    return () => {
      floatingAnimation.stop();
      fadeInAnimation.stop();
    };
  }, []);

  const floatingTransform = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <Animated.View
      style={{
        width: width * 0.85,
        height: 280,
        opacity: fadeAnim,
      }}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#1E3A8A', '#3B82F6', '#60A5FA']
            : ['#DBEAFE', '#BFDBFE', '#93C5FD']
        }
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: 24,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Campus Buildings */}
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
        {/* Main Campus Building */}
        <Animated.View
          style={{
            transform: [{ translateY: floatingTransform }],
            alignSelf: 'center',
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 80,
              height: 100,
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Windows */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 }}>
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={{ flexDirection: 'column', alignItems: 'center' }}>
                  {[1, 2, 3].map((_, windowIndex) => (
                    <View
                      key={windowIndex}
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                        borderRadius: 1,
                        marginBottom: 4,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
            
            {/* Building Entrance */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                marginLeft: -8,
                width: 16,
                height: 24,
                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
            />
          </View>

          {/* Campus Label */}
          <View
            style={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 8,
              alignSelf: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#F97316',
                  marginRight: 6,
                }}
              />
              <View style={{ fontSize: 10, color: isDark ? '#FFFFFF' : '#1F2937' }} />
            </View>
          </View>
        </Animated.View>

        {/* Side Buildings */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Left Building */}
          <Animated.View
            style={{
              transform: [{ translateY: floatingTransform }],
            }}
          >
            <View
              style={{
                width: 50,
                height: 70,
                backgroundColor: isDark ? '#374151' : '#F9FAFB',
                borderRadius: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              {/* Windows */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
                {[1, 2].map((_, index) => (
                  <View key={index} style={{ flexDirection: 'column', alignItems: 'center' }}>
                    {[1, 2].map((_, windowIndex) => (
                      <View
                        key={windowIndex}
                        style={{
                          width: 6,
                          height: 6,
                          backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                          borderRadius: 1,
                          marginBottom: 3,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Right Building */}
          <Animated.View
            style={{
              transform: [{ translateY: floatingTransform }],
            }}
          >
            <View
              style={{
                width: 45,
                height: 60,
                backgroundColor: isDark ? '#374151' : '#F9FAFB',
                borderRadius: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              {/* Windows */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
                {[1, 2].map((_, index) => (
                  <View key={index} style={{ flexDirection: 'column', alignItems: 'center' }}>
                    {[1, 2].map((_, windowIndex) => (
                      <View
                        key={windowIndex}
                        style={{
                          width: 5,
                          height: 5,
                          backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                          borderRadius: 1,
                          marginBottom: 3,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Walking Path */}
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            left: 20,
            right: 20,
            height: 3,
            backgroundColor: isDark ? '#374151' : '#E5E7EB',
            borderRadius: 2,
          }}
        />

        {/* Students Walking (moving dots) */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 8,
            left: 40,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#F59E0B',
            transform: [{ translateY: floatingTransform }],
          }}
        />
        
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 8,
            right: 60,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#F97316',
            transform: [{ translateY: floatingTransform }],
          }}
        />
      </View>

      {/* Floating Elements */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 30,
          right: 30,
          transform: [{ translateY: floatingTransform }],
        }}
      >
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
            opacity: 0.7,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 50,
          left: 40,
          transform: [{ translateY: floatingTransform }],
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isDark ? '#FB923C' : '#F97316',
            opacity: 0.6,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};

export default CampusIllustration;