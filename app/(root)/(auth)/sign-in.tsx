import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons } from "@/constants";
import { showErrorToast } from "@/lib/toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push(`/(root)/(tabs)/home`);
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        showErrorToast("Log in failed. Please try again.", "Error");
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));

      // Handle the case where user is already signed in
      if (err.code === 'session_exists' || err.errors?.[0]?.code === 'session_exists') {
        showErrorToast("You are already signed in. Redirecting to home...", "Already Signed In");
        router.push(`/(root)/(tabs)/home`);
        return;
      }

      const errorMessage = err.errors?.[0]?.longMessage || err.message || "Sign in failed. Please try again.";
      showErrorToast(errorMessage, "Error");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, form, signIn, setActive]);

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          className={`flex-1 ${styles.background}`}
          contentContainerStyle={{ 
            paddingTop: 60,
            paddingBottom: 40,
            paddingHorizontal: 20,
            alignItems: 'center',
            minHeight: '100%'
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <View style={{ 
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
            alignItems: 'flex-start',
            width: '100%'
          }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons 
                name="arrow-back" 
                size={20} 
                color={isDark ? '#FFFFFF' : '#1F2937'} 
              />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 32, paddingHorizontal: 20, width: '100%' }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#1F2937',
              fontFamily: 'Inter-Bold',
              textAlign: 'left',
            }}>
              Hey, welcome back!
            </Text>
          </View>
          
          <View style={{ width: '100%', paddingHorizontal: 24 }}>
            <InputField
              label="College Email"
              placeholder="College Email"
              textContentType="emailAddress"
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
            />
            <InputField
              label="Password"
              placeholder="Password"
              secureTextEntry={true}
              textContentType="password"
              value={form.password}
              onChangeText={(value) => setForm({ ...form, password: value })}
              showPasswordToggle={true}
              isPasswordVisible={isPasswordVisible}
              onTogglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
            />
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <CustomButton
                title="Sign In"
                onPress={onSignInPress}
                className={`h-16 ${isDark ? 'bg-orange-500' : 'bg-orange-600'}`}
                style={{ width: '100%' }}
                loading={loading}
                disabled={loading}
              />
            </View>
            <OAuth title="Log In with Google" />
            <Link
              href="/sign-up"
              className={`text-lg text-center ${styles.textSecondary} mt-6`}
            >
              Don&apos;t have an account?{" "}
              <Text className={isDark ? "text-orange-400" : "text-orange-600"}>Sign Up</Text>
            </Link>
            <TouchableOpacity
              onPress={async () => {
                setForgotLoading(true);
                router.push(`/(root)/(auth)/forgot-password`);
                setForgotLoading(false);
              }}
              disabled={forgotLoading}
              style={{
                marginTop: 24,
                height: 54,
                borderRadius: 27,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: forgotLoading ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                fontFamily: 'Inter-Medium',
              }}>
                {forgotLoading ? 'Redirecting...' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
            <View className="h-32" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;