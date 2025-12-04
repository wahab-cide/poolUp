import { ButtonProps } from "@/types/type";
import { useRef } from "react";
import { ActivityIndicator, Animated, Text, TouchableWithoutFeedback } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from 'expo-haptics';

/* ───────────────────────── helpers ───────────────────────── */

const getBgVariantStyle = (variant: ButtonProps["bgVariant"], isDark: boolean) => {
  switch (variant) {
    case "secondary":
      return isDark ? "bg-dark-card" : "bg-neutral-200";     // theme-aware surface
    case "danger":
      return "bg-red-700";
    case "primary":
      return isDark ? "bg-dark-brand-blue" : "bg-brand-600";     // brand blue for primary
    case "success":
      return isDark ? "bg-orange-500" : "bg-orange-600"; // theme-aware purple
    case "outline":
      return isDark 
        ? "bg-transparent border border-dark-border" 
        : "bg-transparent border border-neutral-200";
    default:
      return isDark ? "bg-dark-brand-blue" : "bg-brand-600";  // theme-aware brand blue
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"], bgVariant: ButtonProps["bgVariant"], isDark: boolean) => {
  // Special handling for outline buttons
  if (bgVariant === "outline") {
    switch (variant) {
      case "primary":
        return isDark ? "text-white" : "text-gray-900";  // Dark text in light mode
      case "secondary":
        return isDark ? "text-dark-text-secondary" : "text-gray-600";
      default:
        return isDark ? "text-white" : "text-gray-900";
    }
  }
  
  // Regular button text colors
  switch (variant) {
    case "primary":
      return "text-white";                                  // white text on brand colors
    case "secondary":
      return isDark ? "text-dark-text-secondary" : "text-text-secondary";
    case "danger":
      return "text-red-100";
    case "success":
      return "text-orange-100";
    default:
      return "text-white";                              // default white on colored backgrounds
  }
};

/* ───────────────────────── component ───────────────────────── */

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className = "",
  loading = false,
  style,
  ...props
}: ButtonProps & { loading?: boolean }) => {
  const { isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Call the original onPress handler
    onPress?.();
  };

  return (
  <TouchableWithoutFeedback
    onPress={handlePress}
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}
    disabled={loading || props.disabled}
  >
    <Animated.View
      className={`w-72 max-w-full h-14 rounded-full flex flex-row justify-center items-center shadow-md ${isDark ? 'shadow-black/50' : 'shadow-neutral-700'} ${getBgVariantStyle(
        bgVariant,
        isDark
      )} ${className}`}
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: (loading || props.disabled) ? 0.6 : 1,
        },
        style
      ]}
    >
      {IconLeft && <IconLeft />}
      {loading ? (
        <ActivityIndicator color={bgVariant === 'outline' ? (isDark ? '#fff' : '#000') : (textVariant === 'primary' ? '#fff' : '#fff')} />
      ) : (
        <Text className={`text-lg font-bold ${getTextVariantStyle(textVariant, bgVariant, isDark)}`}>
          {title}
        </Text>
      )}
      {IconRight && <IconRight />}
    </Animated.View>
  </TouchableWithoutFeedback>
  );
};

export default CustomButton;
