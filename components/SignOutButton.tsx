import { useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export const SignOutButton = ({ children }: { children?: React.ReactNode }) => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk()
  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/(root)/(auth)/sign-in')
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }
  return (
    <TouchableOpacity onPress={handleSignOut} className="mr-2">
      {children ?? <Text>Sign out</Text>}
    </TouchableOpacity>
  )
}