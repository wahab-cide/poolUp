import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, RefreshControl, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from '@/components/CustomButton';
import { fetchAPI } from '@/lib/fetch';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

type PayoutAccountStatus = 'pending' | 'active' | 'rejected' | 'restricted' | false;
type TransactionStatus = 'pending' | 'processing' | 'in_transit' | 'paid' | 'failed' | 'canceled';

interface PayoutAccount {
  account_status: PayoutAccountStatus;
  payouts_enabled: boolean;
  onboarding_completed: boolean;
  bank_connected: boolean;
  bank_name?: string | null;
  last_four_digits?: string | null;
}

interface EarningsData {
  total_earned: number;
  total_withdrawn: number;
  pending_withdrawal: number;
  available_balance: number;
  current_month_earnings: number;
  last_month_earnings: number;
  total_rides: number;
  total_payouts: number;
  last_payout_at?: string;
}

interface PayoutTransaction {
  id: string;
  amount: number;
  platform_fee: number;
  stripe_fee: number;
  net_amount: number;
  status: TransactionStatus;
  description: string;
  bank_name?: string;
  last_four?: string;
  stripe_transfer_id?: string;
  stripe_payout_id?: string;
  failure_reason?: string;
  failure_code?: string;
  expected_arrival_date?: string;
  processed_at?: string;
  arrived_at?: string;
  created_at: string;
}

export const options = { headerShown: false };

const PayoutMethods = () => {
  // Helper function to check if payout account setup has been started
  const hasStartedSetup = (account: PayoutAccount | null): boolean => {
    if (!account) return false;
    // When no DB record exists, API returns account_status: false
    // When DB record exists but no Stripe account, API returns account_status: 'pending'
    // If account_status is false, no setup has been started at all
    if (account.account_status === false || account.account_status === undefined) {
      return false;
    }
    return true; // If we have a real account_status, setup has been started
  };
  const { user } = useUser();
  const { isDark } = useTheme();
  const theme = useThemeStyles();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PayoutTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingUpAccount, setSettingUpAccount] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  const fetchPayoutData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // First try to sync account status from Stripe (even if no local record exists)
      try {
        const syncData = await fetchAPI('/api/payout/sync-account-status', {
          method: 'POST',
          body: JSON.stringify({ clerkId: user.id }),
        });
        
        // Only log if there were actual changes and they're not all false
        if (__DEV__ && syncData.status_changed) {
          const hasActualChanges = Object.values(syncData.status_changed).some(value => value === true);
          if (hasActualChanges) {
            console.log('Account status updated:', syncData.status_changed);
          }
        }
      } catch (syncError: any) {
        // 404 means no Stripe account exists yet - this is expected
        // Only log actual errors, not expected 404s
        if (__DEV__ && syncError?.message && !syncError.message.includes('404')) {
          console.log('Account sync error:', syncError);
        }
      }

      // Fetch earnings and payout account info
      const earningsData = await fetchAPI(`/api/payout/earnings?clerkId=${user.id}`);

      if (earningsData.success) {
        setEarnings(earningsData.earnings);
        setPayoutAccount(earningsData.payout_account);
        setRecentTransactions(earningsData.recent_transactions || []);
        setVerificationStatus(earningsData.verification_status);
        
        if (__DEV__) {
          console.log('Payout data loaded successfully');
          console.log('Payout account exists:', !!earningsData.payout_account);
          console.log('Account status:', earningsData.payout_account?.account_status || 'No account');
          console.log('Has started setup:', hasStartedSetup(earningsData.payout_account));
          console.log('Onboarding completed:', earningsData.payout_account?.onboarding_completed || false);
          console.log('Bank connected:', earningsData.payout_account?.bank_connected || false);
          console.log('Payouts enabled:', earningsData.payout_account?.payouts_enabled || false);
        }
      } else {
        console.error('Failed to fetch earnings:', earningsData.error);
        if (Platform.OS === 'android') {
          // Provide more specific error feedback on Android
          Alert.alert('Data Error', earningsData.error || 'Failed to load payout information');
        }
      }
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, payoutAccount?.account_status]);

  useEffect(() => {
    fetchPayoutData();
  }, [fetchPayoutData]);

  const handleSetupPayoutAccount = async () => {
    if (!user?.id) return;

    setSettingUpAccount(true);
    try {
      // First check if there's an existing account that needs onboarding
      try {
        const statusData = await fetchAPI(`/api/payout/onboarding-status?clerkId=${user.id}`);
        
        if (statusData.success && statusData.needs_onboarding && statusData.onboarding_url) {
          // Continue existing onboarding
          const supported = await Linking.canOpenURL(statusData.onboarding_url);
          if (supported) {
            await Linking.openURL(statusData.onboarding_url);
            
            // Set up a timeout to refresh data when user returns
            setTimeout(() => {
              fetchPayoutData();
            }, 3000);
          } else {
            Alert.alert('Error', 'Cannot open onboarding URL');
          }
          return;
        }
      } catch (statusError) {
        // If onboarding status check fails (e.g., no Stripe account found), 
        // continue to create new account
        if (__DEV__) {
          console.log('Onboarding status check failed, will create new account:', statusError);
        }
      }
      
      // Create new account or get onboarding URL
      const data = await fetchAPI('/api/payout/connect-account', {
        method: 'POST',
        body: JSON.stringify({
          clerkId: user.id,
        }),
      });

      if (data.success && data.onboarding_url) {
        // Open Stripe Connect onboarding in browser
        const supported = await Linking.canOpenURL(data.onboarding_url);
        if (supported) {
          await Linking.openURL(data.onboarding_url);
          
          // Set up a timeout to refresh data when user returns
          setTimeout(() => {
            fetchPayoutData();
          }, 3000);
        } else {
          Alert.alert('Error', 'Cannot open onboarding URL');
        }
      } else if (data.verification_required) {
        Alert.alert(
          'Verification Required',
          'You must complete identity verification before setting up payouts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Now', onPress: () => router.push('/(root)/(tabs)/profile') }
          ]
        );
      } else {
        console.error('Payout account setup failed:', data);
        Alert.alert(
          'Setup Failed', 
          data.error || 'Failed to setup payout account. Please try again or contact support.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Retry', onPress: handleSetupPayoutAccount }
          ]
        );
      }
    } catch (error) {
      console.error('Setup account error:', error);
      
      // Extract the actual error message from the API response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check for specific error types to provide better user experience
      if (errorMessage.includes('identity verification') || errorMessage.includes('verification')) {
        Alert.alert(
          'Verification Required',
          'You must complete identity verification before setting up payouts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Now', onPress: () => router.push('/(root)/(tabs)/profile') }
          ]
        );
      } else if (errorMessage.includes('connection') || errorMessage.includes('network') || errorMessage.includes('internet')) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to setup service. Please check your internet connection and try again.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Retry', onPress: handleSetupPayoutAccount }
          ]
        );
      } else {
        // Show the actual error message from the API
        Alert.alert(
          'Setup Error', 
          errorMessage,
          [
            { text: 'OK', style: 'default' },
            { text: 'Retry', onPress: handleSetupPayoutAccount }
          ]
        );
      }
    } finally {
      setSettingUpAccount(false);
    }
  };

  const handleWithdraw = () => {
    if (!earnings || !payoutAccount) return;

    if (verificationStatus !== 'verified') {
      Alert.alert(
        'Verification Required',
        'You must complete identity verification before withdrawing funds.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Now', onPress: () => router.push('/(root)/(tabs)/profile') }
        ]
      );
      return;
    }

    if (!payoutAccount.payouts_enabled) {
      Alert.alert(
        'Account Setup Required',
        'Please complete your payout account setup to withdraw funds.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Setup Account', onPress: handleSetupPayoutAccount }
        ]
      );
      return;
    }

    if (earnings.available_balance < 10.00) {
      Alert.alert(
        'Insufficient Balance',
        `Minimum withdrawal amount is $10.00. You have $${(earnings?.available_balance || 0).toFixed(2)} available.`
      );
      return;
    }

    // Show withdrawal modal (cross-platform)
    setWithdrawalAmount('');
    setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || isNaN(amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (amount < 10.00) {
      Alert.alert('Error', 'Minimum withdrawal amount is $10.00');
      return;
    }
    
    if (amount > (earnings?.available_balance || 0)) {
      Alert.alert('Error', 'Amount exceeds available balance');
      return;
    }
    
    setShowWithdrawModal(false);
    processWithdrawal(amount);
  };

  const processWithdrawal = async (amount: number) => {
    if (!user?.id || !amount) return;

    if (amount < 10.00) {
      Alert.alert('Error', 'Minimum withdrawal amount is $10.00');
      return;
    }

    if (amount > (earnings?.available_balance || 0)) {
      Alert.alert('Error', 'Amount exceeds available balance');
      return;
    }

    setWithdrawing(true);
    try {
      if (__DEV__) {
        console.log('Starting withdrawal request:');
        console.log('- User ID:', user.id);
        console.log('- Amount:', amount);
        console.log('- API URL will be: https://loop-api-gilt.vercel.app/api/payout/withdraw');
      }
      
      const requestBody = {
        clerkId: user.id,
        amount: amount,
        description: `Withdrawal of $${(amount || 0).toFixed(2)}`,
      };
      
      if (__DEV__) {
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
      }
      
      const data = await fetchAPI('/api/payout/withdraw', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      if (__DEV__) {
        console.log('API response received:', JSON.stringify(data, null, 2));
      }

      if (data.success) {
        Alert.alert(
          'Withdrawal Submitted',
          `Your withdrawal of $${(amount || 0).toFixed(2)} has been submitted. You'll receive $${(data.transaction?.net_amount || 0).toFixed(2)} after fees in 1-2 business days.`
        );
        // Refresh data
        fetchPayoutData();
      } else {
        const errorMessage = data.error || 'Failed to process withdrawal';
        if (__DEV__) {
          console.error('Withdrawal failed:', errorMessage);
          console.error('Full API response:', JSON.stringify(data, null, 2));
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      console.error('Withdrawal error details:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process withdrawal';
      Alert.alert('Error', `Withdrawal failed: ${errorMessage}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayoutData();
  };

  const getStatusColor = (status: PayoutAccountStatus | TransactionStatus) => {
    switch (status) {
      case 'active':
      case 'paid':
        return '#22C55E';
      case 'pending':
      case 'processing':
      case 'in_transit':
        return '#F59E0B';
      case 'failed':
      case 'rejected':
      case 'canceled':
        return '#EF4444';
      case 'restricted':
        return '#F97316';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: PayoutAccountStatus | TransactionStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'in_transit':
        return 'In Transit';
      case 'paid':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'rejected':
        return 'Rejected';
      case 'canceled':
        return 'Canceled';
      case 'restricted':
        return 'Restricted';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background}`}>
        <View className="flex-1 items-center justify-center">
          <View 
            className="flex-row items-center rounded-xl px-6 py-4 shadow-lg" 
            style={{ 
              backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#E5E7EB',
              shadowColor: isDark ? '#000000' : '#111827',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 8
            }}
          >
            <Ionicons name="wallet" size={24} color="#22C55E" />
            <Text className={`text-sm font-medium ${theme.textPrimary} ml-3`}>Loading payout data...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.background}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View 
          className={`flex-row items-center justify-between px-6 py-4 ${theme.background}`} 
          style={{ 
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#374151' : '#E5E7EB',
            shadowColor: isDark ? '#000000' : '#111827',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.1 : 0.05,
            shadowRadius: 4,
            elevation: 2
          }}
        >
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${theme.textPrimary}`}>Payout methods</Text>
          <TouchableOpacity 
            onPress={onRefresh} 
            className="p-2 rounded-full"
            style={{ backgroundColor: refreshing ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)') : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') }}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "sync" : "refresh"} 
              size={20} 
              color={refreshing ? '#22C55E' : (isDark ? '#FFFFFF' : '#111827')} 
            />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-4">
          <View 
            className="flex-row items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(156, 163, 175, 0.05)' }}
          >
            <Ionicons 
              name={refreshing ? "sync" : "refresh"} 
              size={16} 
              color={refreshing ? '#22C55E' : (isDark ? '#9CA3AF' : '#6B7280')} 
              style={{ 
                marginRight: 8,
                transform: refreshing ? [{ rotate: '0deg' }] : [{ rotate: '0deg' }]
              }}
            />
            <Text 
              className="text-sm font-medium" 
              style={{ color: refreshing ? '#22C55E' : (isDark ? '#9CA3AF' : '#6B7280') }}
            >
              {refreshing ? 'Refreshing...' : 'Pull down to refresh'}
            </Text>
          </View>
        </View>

        <View className="px-6 py-6">
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white/80 text-base font-medium">Available Balance</Text>
              <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.8)" />
            </View>
            <Text className="text-white text-4xl font-bold mb-2">
              ${(earnings?.available_balance || 0).toFixed(2)}
            </Text>
            <Text className="text-white/80 text-sm">
              Total earned: ${(earnings?.total_earned || 0).toFixed(2)}
            </Text>
          </LinearGradient>

          <View className="flex-row mb-6">
            <View className="flex-1 rounded-xl p-4 mr-3" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4' }}>
              <Text className="text-2xl font-bold" style={{ color: isDark ? '#4ADE80' : '#16A34A' }}>
                ${(earnings?.current_month_earnings || 0).toFixed(2)}
              </Text>
              <Text className="text-sm font-medium" style={{ color: isDark ? '#22C55E' : '#15803D' }}>This Month</Text>
            </View>
            <View className="flex-1 rounded-xl p-4 ml-3" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' }}>
              <Text className="text-2xl font-bold" style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
                {earnings?.total_rides || 0}
              </Text>
              <Text className="text-sm font-medium" style={{ color: isDark ? '#3B82F6' : '#1D4ED8' }}>Total Rides</Text>
            </View>
          </View>

          {/* Bank Account Section */}
          <View className="mb-6">
            <Text className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Bank Account</Text>
            
            {payoutAccount && payoutAccount.bank_connected && payoutAccount.payouts_enabled ? (
              <View className={`${theme.card} rounded-xl p-4`} style={{ borderWidth: 1, borderColor: isDark ? '#374151' : '#E5E7EB' }}>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="rounded-full p-2 mr-3" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }}>
                      <Ionicons name="card" size={20} color="#22C55E" />
                    </View>
                    <View>
                      <Text className={`${theme.textPrimary} font-semibold`}>
                        {payoutAccount.bank_name || 'Bank Account'}
                      </Text>
                      <Text className={`${theme.textSecondary} text-sm`}>
                        ••••{payoutAccount.last_four_digits || '****'}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: getStatusColor(payoutAccount.account_status) + '15' }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: getStatusColor(payoutAccount.account_status) }}
                    >
                      {getStatusText(payoutAccount.account_status)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : hasStartedSetup(payoutAccount) && !payoutAccount!.onboarding_completed ? (
              <View className="rounded-xl p-6" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEFCE8', borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE047' }}>
                <View className="flex-row items-center mb-4">
                  <View className="rounded-full p-3 mr-3" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FEF3C7' }}>
                    <Ionicons name="time" size={24} color="#F59E0B" />
                  </View>
                  <View className="flex-1">
                    <Text className={`${theme.textPrimary} font-semibold text-lg mb-1`}>
                      Complete Setup
                    </Text>
                    <Text className={`${theme.textSecondary} text-sm`}>
                      Finish adding your bank account details
                    </Text>
                  </View>
                </View>
                <CustomButton
                  title="Continue Setup"
                  onPress={handleSetupPayoutAccount}
                  loading={settingUpAccount}
                  disabled={settingUpAccount}
                  bgVariant="primary"
                  className="w-full"
                  IconLeft={() => <Ionicons name="arrow-forward" size={20} color="white" style={{ marginRight: 8 }} />}
                />
              </View>
            ) : hasStartedSetup(payoutAccount) && payoutAccount!.onboarding_completed && !payoutAccount!.bank_connected ? (
              <View className="rounded-xl p-6" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF', borderWidth: 1, borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#DBEAFE' }}>
                <View className="flex-row items-center mb-4">
                  <View className="rounded-full p-3 mr-3" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#DBEAFE' }}>
                    <Ionicons name="card" size={24} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className={`${theme.textPrimary} font-semibold text-lg mb-1`}>
                      Add Bank Account
                    </Text>
                    <Text className={`${theme.textSecondary} text-sm`}>
                      Connect a bank account to receive payments
                    </Text>
                  </View>
                </View>
                <CustomButton
                  title="Add Bank Account"
                  onPress={handleSetupPayoutAccount}
                  loading={settingUpAccount}
                  disabled={settingUpAccount}
                  bgVariant="primary"
                  className="w-full"
                  IconLeft={() => <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />}
                />
              </View>
            ) : (
              <View className="rounded-xl p-6 items-center" style={{ backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#4B5563' : '#E5E7EB' }}>
                <View className="rounded-full p-4 mb-4" style={{ backgroundColor: isDark ? 'rgba(107, 114, 128, 0.3)' : '#F3F4F6' }}>
                  <Ionicons name="card-outline" size={32} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </View>
                <Text className={`${theme.textPrimary} font-semibold text-center mb-2`}>
                  No Payout Account
                </Text>
                <Text className={`${theme.textSecondary} text-center text-sm mb-4`}>
                  Set up a payout account to receive your earnings
                </Text>
                <CustomButton
                  title="Setup Payout Account"
                  onPress={handleSetupPayoutAccount}
                  loading={settingUpAccount}
                  disabled={settingUpAccount}
                  bgVariant="primary"
                  className="w-full"
                  IconLeft={() => <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />}
                />
              </View>
            )}
          </View>

          {/* Withdraw Button - Only show when bank account is connected and payouts enabled */}
          {payoutAccount && payoutAccount.payouts_enabled && payoutAccount.bank_connected && (
            <CustomButton
              title={`Withdraw $${(earnings?.available_balance || 0).toFixed(2)}`}
              onPress={handleWithdraw}
              loading={withdrawing}
              disabled={withdrawing || !earnings || earnings.available_balance < 10.00}
              bgVariant="primary"
              className="w-full mb-6"
              IconLeft={() => <Ionicons name="arrow-down" size={20} color="white" style={{ marginRight: 8 }} />}
            />
          )}

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className={`text-xl font-bold ${theme.textPrimary}`}>Recent Transactions</Text>
                <View className="rounded-full px-3 py-1" style={{ backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(156, 163, 175, 0.1)' }}>
                  <Text className={`text-xs font-medium ${theme.textSecondary}`}>
                    Last {Math.min(recentTransactions.length, 5)}
                  </Text>
                </View>
              </View>
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <TouchableOpacity
                  key={transaction.id}
                  className={`${theme.card} rounded-xl p-5 mb-4 shadow-sm`}
                  style={{ 
                    borderWidth: 1, 
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    shadowColor: isDark ? '#000000' : '#111827',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 6,
                    elevation: 3
                  }}
                  activeOpacity={0.95}
                  onPress={() => {
                    // TODO: Navigate to transaction details
                    console.log('Transaction pressed:', transaction.id);
                  }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1">
                      <View 
                        className="w-8 h-8 rounded-full mr-3 items-center justify-center"
                        style={{ backgroundColor: getStatusColor(transaction.status) + (isDark ? '20' : '15') }}
                      >
                        <Ionicons 
                          name={transaction.status === 'paid' ? 'checkmark' : transaction.status === 'failed' ? 'close' : 'time'} 
                          size={16} 
                          color={getStatusColor(transaction.status)} 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-2xl font-bold mb-1" style={{ color: '#22C55E' }}>
                          ${(transaction.net_amount || 0).toFixed(2)}
                        </Text>
                        <Text className={`${theme.textMuted} text-xs`}>
                          From ${(transaction.amount || 0).toFixed(2)} (${(transaction.platform_fee || 0).toFixed(2)} fee)
                        </Text>
                      </View>
                    </View>
                    <View
                      className="px-3 py-2 rounded-xl"
                      style={{ 
                        backgroundColor: getStatusColor(transaction.status) + (isDark ? '20' : '15'),
                        borderWidth: 1,
                        borderColor: getStatusColor(transaction.status) + (isDark ? '40' : '30')
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: getStatusColor(transaction.status) }}
                      >
                        {getStatusText(transaction.status)}
                      </Text>
                    </View>
                  </View>
                  <Text className={`${theme.textSecondary} text-sm mb-3 font-medium`}>
                    {transaction.description}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      {transaction.bank_name && (
                        <View className="flex-row items-center mb-2">
                          <View className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }}>
                            <Ionicons name="card" size={10} color="#22C55E" style={{ marginLeft: 1, marginTop: 1 }} />
                          </View>
                          <Text className={`${theme.textSecondary} text-xs font-medium`}>
                            To {transaction.bank_name} ••••{transaction.last_four}
                          </Text>
                        </View>
                      )}
                      <View className="flex-row items-center">
                        <View className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }}>
                          <Ionicons name="time" size={10} color="#3B82F6" style={{ marginLeft: 1, marginTop: 1 }} />
                        </View>
                        <Text className={`${theme.textSecondary} text-xs font-medium`}>
                          {new Date(transaction.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity className="p-2 rounded-full" style={{ backgroundColor: isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(156, 163, 175, 0.1)' }}>
                      <Ionicons 
                        name="chevron-forward" 
                        size={14} 
                        color={isDark ? '#9CA3AF' : '#6B7280'} 
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View className="flex-1 justify-center px-6" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <View 
            className="rounded-2xl p-6 shadow-2xl" 
            style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? '#374151' : 'transparent',
              shadowColor: isDark ? '#000000' : '#111827',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.4 : 0.2,
              shadowRadius: 16,
              elevation: 20
            }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`text-xl font-bold ${theme.textPrimary}`}>Withdraw Funds</Text>
              <TouchableOpacity 
                onPress={() => setShowWithdrawModal(false)}
                className="p-2 rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(107, 114, 128, 0.1)' }}
              >
                <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            
            <View className="mb-6">
              <View 
                className="rounded-xl p-4 mb-4"
                style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}
              >
                <Text className={`${theme.textSecondary} text-sm mb-1`}>
                  Available balance:
                </Text>
                <Text className={`text-2xl font-bold mb-2`} style={{ color: '#22C55E' }}>
                  ${(earnings?.available_balance || 0).toFixed(2)}
                </Text>
                <Text className={`${theme.textTertiary} text-xs`}>
                  Minimum withdrawal: $10.00
                </Text>
              </View>
              
              <View className="relative">
                <Text className="mb-2 text-sm font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>Enter amount</Text>
                <View className="relative">
                  <Text className={`absolute left-4 top-4 text-xl font-bold z-10`} style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>$</Text>
                  <TextInput
                    value={withdrawalAmount}
                    onChangeText={setWithdrawalAmount}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    keyboardType="numeric"
                    className="rounded-xl p-4 pl-10 text-xl font-bold"
                    style={{
                      backgroundColor: isDark ? 'rgba(55, 65, 81, 0.8)' : '#F9FAFB',
                      borderWidth: 2,
                      borderColor: isDark ? '#4B5563' : '#E5E7EB',
                      color: isDark ? '#FFFFFF' : '#111827'
                    }}
                    autoFocus={true}
                  />
                </View>
              </View>
            </View>
            
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => setShowWithdrawModal(false)}
                className="flex-1 rounded-xl p-4 border mr-3"
                style={{ 
                  backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : '#F9FAFB',
                  borderColor: isDark ? '#4B5563' : '#E5E7EB'
                }}
              >
                <Text className={`${theme.textPrimary} font-semibold text-center`}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleWithdrawSubmit}
                disabled={withdrawing}
                className={`flex-1 rounded-xl p-4 ml-3 ${withdrawing ? 'opacity-50' : ''}`}
                style={{ backgroundColor: '#22C55E' }}
              >
                <View className="flex-row items-center justify-center">
                  {withdrawing && (
                    <Ionicons name="sync" size={16} color="white" style={{ marginRight: 8 }} />
                  )}
                  <Text className="text-white font-bold text-center">
                    {withdrawing ? 'Processing...' : 'Withdraw'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PayoutMethods;