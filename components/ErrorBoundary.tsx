import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; onRetry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return <FallbackComponent error={this.state.error!} onRetry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 justify-center items-center px-6">
            {/* Error Icon */}
            <View className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-6">
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>

            {/* Error Message */}
            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
              Something went wrong
            </Text>
            <Text className="text-base text-gray-600 text-center mb-8 leading-6">
              We encountered an unexpected error. This helps us improve the app.
            </Text>

            {/* Action Buttons */}
            <View className="w-full space-y-3">
              <TouchableOpacity
                onPress={this.handleRetry}
                className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold text-lg">Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-gray-100 rounded-xl p-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color="#374151" style={{ marginRight: 8 }} />
                <Text className="text-gray-700 font-medium text-lg">Go Back</Text>
              </TouchableOpacity>
            </View>

            {/* Error Details (in development) */}
            {__DEV__ && this.state.error && (
              <ScrollView className="mt-8 w-full max-h-40 bg-gray-100 rounded-lg p-4">
                <Text className="text-xs font-mono text-red-600 mb-2">
                  Error: {this.state.error.message}
                </Text>
                {this.state.errorInfo && (
                  <Text className="text-xs font-mono text-gray-600">
                    {this.state.errorInfo}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;