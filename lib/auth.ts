import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        if (__DEV__) console.log(`${key} was used`);
      } else {
        if (__DEV__) console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      if (__DEV__) console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const handleOAuth = async (startOAuthFlow: any, provider: string) => {
  try {
    const { createdSessionId, setActive, signUp, signIn } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(root)/(tabs)/home"),
    });

    // Handle sign-in flow
    if (signIn?.status === "complete") {
      await setActive({ session: signIn.createdSessionId });
      
      return {
        success: true,
        code: "success",
        message: `You have successfully signed in with ${provider}`,
      };
    }

    // Handle sign-up flow
    if (signUp?.status === "complete") {
      await setActive({ session: signUp.createdSessionId });

      if (signUp.createdUserId) {
        // Extract fallback name from email if OAuth doesn't provide names
        const emailPrefix = signUp.emailAddress ? signUp.emailAddress.split('@')[0] : '';
        const fallbackFirstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        
        // Create user in database with intelligent fallbacks
        const userData = {
          firstName: signUp.firstName || fallbackFirstName || 'User',
          lastName: signUp.lastName || '',
          email: signUp.emailAddress,
          clerkId: signUp.createdUserId,
          avatarUrl: signUp.imageUrl || null, // Include OAuth provider avatar URL
        };
        
        if (__DEV__) {
          console.log('OAuth user data:', {
            originalFirstName: signUp.firstName,
            originalLastName: signUp.lastName,
            fallbackUsed: !signUp.firstName,
            finalFirstName: userData.firstName
          });
        }
        
        // Create user in database
        try {
          await fetchAPI("/api/user", {
            method: "POST",
            body: JSON.stringify(userData),
          });
          if (__DEV__) console.log('User created in database successfully via OAuth');
        } catch (error) {
          if (__DEV__) console.error('Failed to create user in database via OAuth:', error);
          // Don't fail the OAuth process, but log the error
        }
      }

      return {
        success: true,
        code: "success",
        message: `You have successfully signed up with ${provider}`,
      };
    }

    // If we have a session ID but status isn't complete, try to set it active
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
      
      return {
        success: true,
        code: "success",
        message: `You have successfully signed in with ${provider}`,
      };
    }
    
    return {
      success: false,
      message: `An error occurred while signing in with ${provider}`,
    };
  } catch (err: any) {
    if (__DEV__) console.error(err);
    
    // Handle the case where user is already signed in
    if (err.code === 'session_exists' || err.errors?.[0]?.code === 'session_exists') {
      return {
        success: true,
        code: "session_exists",
        message: "Session already exists",
      };
    }
    
    return {
      success: false,
      code: err.code,
      message: err?.errors?.[0]?.longMessage || "An error occurred during sign in",
    };
  }
};

export const googleOAuth = async (startOAuthFlow: any) => {
  return handleOAuth(startOAuthFlow, "Google");
};

export const appleOAuth = async (startOAuthFlow: any) => {
  return handleOAuth(startOAuthFlow, "Apple");
};