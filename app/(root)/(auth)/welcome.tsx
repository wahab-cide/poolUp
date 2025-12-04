import { router } from "expo-router";
import { useRef, useState, useEffect } from "react";
import { Text, TouchableOpacity, View, Animated, Dimensions, StatusBar, Platform, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import { onboarding } from "@/constants";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const { width } = Dimensions.get('window');

const Welcome = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const slideAnimations = useRef(
    onboarding.map(() => ({
      titleFadeAnim: new Animated.Value(1),
      descriptionSlideAnim: new Animated.Value(0),
      buttonScaleAnim: new Animated.Value(1),
    }))
  ).current;
  
  const { isDark } = useTheme();

  const isLastSlide = activeIndex === onboarding.length - 1;

  useEffect(() => {
    slideAnimations.forEach((anims, index) => {
      if (index === 0) {
        anims.titleFadeAnim.setValue(1);
        anims.descriptionSlideAnim.setValue(0);
        anims.buttonScaleAnim.setValue(1);
      } else {
        anims.titleFadeAnim.setValue(0);
        anims.descriptionSlideAnim.setValue(20);
        anims.buttonScaleAnim.setValue(0.9);
      }
    });
  }, []);

  useEffect(() => {
    slideAnimations.forEach((anims, index) => {
      if (index === activeIndex) {
        Animated.parallel([
          Animated.timing(anims.titleFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anims.descriptionSlideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(anims.buttonScaleAnim, {
            toValue: 1,
            tension: 120,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(anims.titleFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anims.descriptionSlideAnim, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anims.buttonScaleAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: activeIndex * width, y: 0, animated: true });
    }
  }, [activeIndex]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    if (index !== activeIndex && index >= 0 && index < onboarding.length) {
      setActiveIndex(index);
    }
  };

  const getImageSource = (imageName: string) => {
    switch (imageName) {
      case "students":
        return require("@/assets/images/students.jpeg");
      case "carpool_with_others":
        return require("@/assets/images/carpool_with_others.jpg");
      case "happy_passenger3":
        return require("@/assets/images/happy_passenger3.jpeg");
      default:
        return require("@/assets/images/students.jpeg");
    }
  };

  const getStaticBackgroundColor = () => {
    return isDark ? '#1F2937' : '#F8FAFC';
  };

  return (
    <View style={{ flex: 1, backgroundColor: getStaticBackgroundColor() }}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={getStaticBackgroundColor()}
        translucent={false}
      />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: 24, 
          paddingTop: Platform.OS === 'android' ? 16 : 12,
          paddingBottom: 20,
          backgroundColor: getStaticBackgroundColor() 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {onboarding.map((_, index) => (
              <View
                key={index}
                style={{
                  width: activeIndex === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: activeIndex === index 
                    ? (isDark ? '#F97316' : '#EA580C')
                    : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text 
              style={{ 
                fontSize: 20, 
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#1F2937',
                fontFamily: 'Jua-Regular',
                letterSpacing: -0.3,
              }}
            >
              poolUp
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/sign-up")}
            style={{ 
              paddingVertical: 8, 
              paddingHorizontal: 16,
              ...Platform.select({
                ios: {
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                },
                android: {
                  borderRadius: 20,
                },
              }),
            }}
            activeOpacity={0.8}
          >
            <Text 
              style={{ 
                fontSize: 14, 
                fontWeight: '600',
                color: isDark ? '#F97316' : '#EA580C',
                fontFamily: 'Inter-SemiBold',
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={{ flex: 1 }}
            bounces={false}
          >
            {onboarding.map((item, index) => (
              <View key={item.id} style={{ 
                width: width,
                flex: 1, 
                backgroundColor: getStaticBackgroundColor(),
                paddingHorizontal: 24,
                paddingTop: 32,
                paddingBottom: 24,
                justifyContent: 'space-between'
              }}>
                <View style={{ 
                  flex: 1, 
                  justifyContent: 'center',
                  maxWidth: width - 48,
                  alignSelf: 'center',
                }}>
                  {index === 1 ? (
                    <View style={{ alignItems: 'center' }}>
                      <Animated.View
                        style={{
                          opacity: slideAnimations[index].titleFadeAnim,
                          transform: [{ translateY: slideAnimations[index].descriptionSlideAnim }],
                          marginBottom: 32,
                        }}
                      >
                        <Text 
                          style={{
                            fontSize: 42,
                            fontWeight: '800',
                            textAlign: 'center',
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontFamily: 'Inter-ExtraBold',
                            lineHeight: 48,
                            letterSpacing: -1,
                            marginBottom: 16,
                          }}
                        >
                          {item.title}
                        </Text>
                        <View style={{
                          width: 60,
                          height: 4,
                          backgroundColor: isDark ? '#F97316' : '#EA580C',
                          borderRadius: 2,
                          alignSelf: 'center',
                        }} />
                      </Animated.View>

                      <Animated.View
                        style={{
                          transform: [{ translateY: slideAnimations[index].descriptionSlideAnim }],
                          opacity: slideAnimations[index].titleFadeAnim,
                          ...Platform.select({
                            ios: {
                              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(124, 58, 237, 0.06)',
                              borderRadius: 20,
                              paddingHorizontal: 32,
                              paddingVertical: 28,
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.15)',
                              shadowColor: isDark ? '#F97316' : '#EA580C',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.08,
                              shadowRadius: 12,
                            },
                            android: {
                              paddingHorizontal: 32,
                              paddingVertical: 28,
                            },
                          }),
                        }}
                      >
                        <Text 
                          style={{
                            fontSize: 17,
                            textAlign: 'center',
                            color: isDark ? '#F3F4F6' : '#374151',
                            fontFamily: 'Inter-Medium',
                            lineHeight: 26,
                            letterSpacing: 0.1,
                          }}
                        >
                          {item.description}
                        </Text>
                      </Animated.View>
                    </View>
                  ) : (
                    <>
                      <View style={{ alignItems: 'center', marginBottom: 48 }}>
                        <Animated.View
                          style={{
                            opacity: slideAnimations[index].titleFadeAnim,
                            transform: [{ scale: slideAnimations[index].buttonScaleAnim }],
                          }}
                        >
                          <View style={{
                            borderRadius: 24,
                            overflow: 'hidden',
                            ...Platform.select({
                              ios: {
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 12 },
                                shadowOpacity: 0.15,
                                shadowRadius: 24,
                              },
                              android: {
                              },
                            }),
                          }}>
                            <Image
                              source={getImageSource(item.image)}
                              style={{
                                width: width * 0.8,
                                height: 240,
                                resizeMode: 'cover',
                              }}
                            />
                          </View>
                        </Animated.View>
                      </View>

                      <View style={{ alignItems: 'center' }}>
                        <Animated.View
                          style={{
                            opacity: slideAnimations[index].titleFadeAnim,
                            marginBottom: 24,
                          }}
                        >
                          <Text 
                            style={{
                              fontSize: 36,
                              fontWeight: '800',
                              textAlign: 'center',
                              color: isDark ? '#FFFFFF' : '#0F172A',
                              fontFamily: 'Inter-ExtraBold',
                              lineHeight: 42,
                              letterSpacing: -0.5,
                              marginBottom: 8,
                            }}
                          >
                            {item.title}
                          </Text>
                          <View style={{
                            width: 40,
                            height: 3,
                            backgroundColor: isDark ? '#F97316' : '#EA580C',
                            borderRadius: 2,
                            alignSelf: 'center',
                          }} />
                        </Animated.View>

                          <Animated.View
                          style={{
                            transform: [{ translateY: slideAnimations[index].descriptionSlideAnim }],
                            opacity: slideAnimations[index].titleFadeAnim,
                          }}
                        >
                          <Text 
                            style={{
                              fontSize: 18,
                              textAlign: 'center',
                              color: isDark ? '#D1D5DB' : '#4B5563',
                              fontFamily: 'Inter-Medium',
                              lineHeight: 28,
                              letterSpacing: 0.2,
                              paddingHorizontal: 8,
                            }}
                          >
                            {item.description}
                          </Text>
                        </Animated.View>
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ 
          backgroundColor: getStaticBackgroundColor(),
          paddingHorizontal: 24,
          paddingBottom: Platform.OS === 'ios' ? 48 : 36,
          paddingTop: 32,
        }}>

          <Animated.View
            style={{
              transform: [{ scale: slideAnimations[activeIndex].buttonScaleAnim }],
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                if (isLastSlide) {
                  router.replace("/(auth)/sign-up");
                } else {
                  const nextIndex = activeIndex + 1;
                  setActiveIndex(nextIndex);
                }
              }}
              style={{
                backgroundColor: isDark ? '#F97316' : '#EA580C',
                paddingVertical: 18,
                paddingHorizontal: 48,
                borderRadius: 28,
                minWidth: width * 0.65,
                alignItems: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: isDark ? '#F97316' : '#EA580C',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              }}
              activeOpacity={0.8}
            >
              <Text 
                style={{
                  color: '#FFFFFF',
                  fontSize: 17,
                  fontWeight: '700',
                  textAlign: 'center',
                  fontFamily: 'Inter-Bold',
                  letterSpacing: 0.5,
                }}
              >
                {isLastSlide ? "Start Riding Today" : "Continue"}
              </Text>
            </TouchableOpacity>

            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center', 
              marginTop: 24,
              gap: 8,
            }}>
              {onboarding.map((_, index) => (
                <Animated.View
                  key={index}
                  style={{
                    width: activeIndex === index ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: activeIndex === index 
                      ? (isDark ? '#F97316' : '#EA580C')
                      : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'),
                    opacity: activeIndex === index ? 1 : 0.6,
                  }}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Welcome;