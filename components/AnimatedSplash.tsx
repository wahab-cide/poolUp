import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface AnimatedSplashProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export default function AnimatedSplash({ onFinish, isReady = false }: AnimatedSplashProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [minimumTimePassed, setMinimumTimePassed] = useState(false);
  const [dotOpacity1] = useState(new Animated.Value(0.3));
  const [dotOpacity2] = useState(new Animated.Value(0.3));
  const [dotOpacity3] = useState(new Animated.Value(0.3));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      setMinimumTimePassed(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  useEffect(() => {
    if (isReady && minimumTimePassed && onFinish) {
      // Immediately transition without fade - let next screen take over
      onFinish();
    }
  }, [isReady, minimumTimePassed, onFinish]);

  useEffect(() => {
    const createPulse = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createPulse(dotOpacity1, 0);
    const anim2 = createPulse(dotOpacity2, 150);
    const anim3 = createPulse(dotOpacity3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.text}>poolUp</Text>
        <Text style={styles.tagline}>Share the ride, split the cost</Text>

        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 56,
    color: '#FFFFFF',
    fontFamily: 'Jua',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    opacity: 0.9,
    marginBottom: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});