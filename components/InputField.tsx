import { Ionicons } from '@expo/vector-icons';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
  
import { InputFieldProps } from "@/types/type";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

// Extend InputFieldProps to include iconTintColor and password visibility
interface AuthInputFieldProps extends InputFieldProps {
  iconTintColor?: string;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
}

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  iconTintColor,
  className, // keeps custom overrides
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePasswordVisibility,
  ...props
}: AuthInputFieldProps) => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  
  // Use passed iconTintColor or fallback to theme-aware color
  const tintColor = iconTintColor || (isDark ? '#FFFFFF' : '#222');
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          {/* Label */}
          <Text
            className={`${styles.textPrimary} text-lg font-InterSemiBold mb-3 ${labelStyle}`}
          >
            {label}
          </Text>
  
          {/* Input wrapper */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
              borderRadius: 27,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
              height: 54,
            }}
            className={containerStyle}
          >
            {/* Optional icon */}
            {icon && (
              <Image source={icon} className={`w-6 h-6 ml-4 ${iconStyle}`} style={{ tintColor: tintColor }} />
            )}
  
            {/* Text input */}
            <TextInput
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              style={{
                flex: 1,
                paddingHorizontal: 20,
                paddingVertical: 16,
                fontSize: 16,
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                color: isDark ? '#FFFFFF' : '#000000',
              }}
              className={inputStyle}
              secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
              {...props}
            />
            
            {/* Password visibility toggle */}
            {showPasswordToggle && (
              <TouchableOpacity
                onPress={onTogglePasswordVisibility}
                style={{
                  marginRight: 20,
                  padding: 4,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye" : "eye-off"}
                  size={20}
                  color={tintColor}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
  
export default InputField;
  