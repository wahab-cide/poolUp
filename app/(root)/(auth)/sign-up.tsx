import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { showErrorToast } from "@/lib/toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";
import { validateEmailInput, getCollegeFromEmail } from "@/lib/eduValidation";
import { Ionicons } from "@expo/vector-icons";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message?: string;
    type?: 'error' | 'warning' | 'success';
    collegeName?: string;
  }>({ isValid: false });

  const handleEmailChange = (value: string) => {
    setForm({ ...form, email: value });
    
    if (value.length > 0) {
      const validation = validateEmailInput(value);
      const college = getCollegeFromEmail(value);
      setEmailValidation({
        ...validation,
        collegeName: college?.name
      });
    } else {
      setEmailValidation({ isValid: false });
    }
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    
    const validation = validateEmailInput(form.email);
    if (!validation.isValid) {
      showErrorToast(validation.message || "Please use your college .edu email address", "Invalid Email");
      return;
    }
    
    setLoading(true);
    try {
      const college = getCollegeFromEmail(form.email);
      
      const nameParts = form.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        firstName: firstName,
        lastName: lastName,
        unsafeMetadata: {
          college_id: college?.id,
          college_name: college?.name,
          is_verified_student: college?.verified || false,
        }
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      if (__DEV__) console.log(JSON.stringify(err, null, 2));
      showErrorToast(err.errors[0].longMessage, "Error");
    } finally {
      setLoading(false);
    }
  };
  const onPressVerify = async () => {
    if (!isLoaded) return;
    setVerifying(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
        try {
          const college = getCollegeFromEmail(form.email);
          const nameParts = form.name.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          await fetchAPI("/api/user", {
            method: "POST",
            body: JSON.stringify({
              firstName: firstName,
              lastName: lastName,
              email: form.email,
              clerkId: completeSignUp.createdUserId,
              college: college ? {
                id: college.id,
                name: college.name,
                domain: college.domain,
                type: college.type,
                state: college.state,
              } : null,
              isVerifiedStudent: college?.verified || false,
            }),
          });
          if (__DEV__) console.log('User created in database successfully with college:', college?.name);
        } catch (error) {
          if (__DEV__) console.error('Failed to create user in database:', error);
        }
        return;
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
    } finally {
      setVerifying(false);
    }
  };
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
            paddingTop: 20,
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
              marginBottom: 8,
            }}>
              Happy to have you!
            </Text>
            <Text style={{
              fontSize: 28,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#1F2937',
              fontFamily: 'Inter-Bold',
              textAlign: 'left',
            }}>
              Register in seconds.
            </Text>
          </View>
          
          <View style={{ width: '100%', paddingHorizontal: 24 }}>
            <InputField
              label="Name"
              placeholder="Name"
              value={form.name}
              onChangeText={(value) => setForm({ ...form, name: value })}
            />
            <InputField
              label="College Email"
              placeholder="College Email"
              textContentType="emailAddress"
              value={form.email}
              onChangeText={handleEmailChange}
            />
            
            {form.email.length > 0 && emailValidation.message && (
              <View className="mt-1 flex-row items-center">
                <Ionicons 
                  name={emailValidation.type === 'success' ? 'checkmark-circle' : 'close-circle'} 
                  size={16} 
                  color={emailValidation.type === 'success' ? '#F97316' : '#EF4444'} 
                />
                <Text 
                  className={`ml-1 text-xs font-Inter ${
                    emailValidation.type === 'success' 
                      ? 'text-orange-500' 
                      : 'text-red-500'
                  }`}
                >
                  {emailValidation.message}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              onPress={() => router.push('/(root)/supported-colleges')}
              style={{ marginTop: 8, marginBottom: 8 }}
            >
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter-Regular',
                color: isDark ? '#F97316' : '#EA580C',
                textAlign: 'center',
              }}>
                View supported colleges →
              </Text>
            </TouchableOpacity>
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
                title="Sign Up"
                onPress={onSignUpPress}
                className={`h-16 ${isDark ? 'bg-orange-500' : 'bg-orange-600'}`}
                style={{ width: '100%' }}
                loading={loading}
                disabled={loading || !form.name || !form.email || !form.password || !emailValidation.isValid}
              />
            </View>
            <OAuth disabled={loading || verifying} />
            <Link
              href="/sign-in"
              className={`text-lg text-center ${styles.textSecondary} mt-6`}
            >
              Already have an account?{" "}
              <Text className={isDark ? "text-orange-400" : "text-orange-600"}>Sign In</Text>
            </Link>
            <View className="h-32" />
          </View>
          <ReactNativeModal
            isVisible={verification.state === "pending"}
          >
            <View className={`${styles.card} px-7 py-9 rounded-2xl min-h-[300px]`}>
              <Text className={`font-InterExtraBold text-2xl mb-2 text-center ${styles.textPrimary}`}>
                Verification
              </Text>
              <Text className={`font-InterRegular mb-5 text-center ${styles.textSecondary}`}>
                We&apos;ve sent a verification code to {form.email}.
              </Text>
              <View style={{ width: '100%' }}>
                <InputField
                  label={"Code"}
                  placeholder={"12345"}
                  value={verification.code}
                  keyboardType="numeric"
                  onChangeText={(code) =>
                    setVerification({ ...verification, code })
                  }
                />
                {verification.error && (
                  <Text className="text-red-500 text-sm mt-1 text-center">
                    {verification.error}
                  </Text>
                )}
                <CustomButton
                  title="Verify Email"
                  onPress={onPressVerify}
                  className={`h-16 mt-4 ${isDark ? 'bg-orange-500' : 'bg-orange-600'}`}
                  style={{ width: '100%' }}
                  loading={verifying}
                  disabled={verifying}
                />
              </View>
            </View>
          </ReactNativeModal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default SignUp;