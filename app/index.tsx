import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";

const Page = () => {
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();

    // Show loading screen while Clerk is initializing
    if (!authLoaded || !userLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#F97316" />
            </View>
        );
    }

    if (isSignedIn && user) {
        const hasCompletedOnboarding = 
            user.publicMetadata?.onboarding_complete === true || 
            user.unsafeMetadata?.onboarding_complete === true;
        
        if (!hasCompletedOnboarding) {
            return <Redirect href='/(root)/onboarding' />;
        }
        
        return <Redirect href='/(root)/(tabs)/home' />;
    }
    
    return <Redirect href='/(root)/(auth)/welcome' />;
};

export default Page;