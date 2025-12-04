import { useAuth } from "@clerk/clerk-expo";
import { Feather } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import { fetchAPI } from "@/lib/fetch";
import { showErrorToast } from "@/lib/toast";
import { useLocationStore } from "@/store";
import { useTheme } from "@/contexts/ThemeContext";

interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  rideId: string;
  bookingId?: string;
  driverId?: number;
  rideTime: number;
  seatsRequested?: number;
}

const Payment = ({
  fullName,
  email,
  amount,
  rideId,
  bookingId,
  driverId,
  rideTime,
  seatsRequested = 1,
}: PaymentProps) => {
  const { isDark } = useTheme();
  const {
    userAddress,
    destinationAddress,
  } = useLocationStore();

  const { userId } = useAuth();
  const [success, setSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const confirmBooking = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (__DEV__) {
        console.log('Confirming booking with payment method:', paymentMethod);
      }

      let bookingResult;

      if (bookingId) {
        // Update existing booking (approval flow)
        if (__DEV__) {
          console.log('Updating existing booking:', bookingId);
        }
        bookingResult = await fetchAPI(`/api/bookings/${bookingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: 'confirmed',
            paymentMethod: paymentMethod,
          }),
        });
      } else {
        // Create new booking (direct booking flow)
        if (__DEV__) {
          console.log('Creating new booking with payment method');
        }
        bookingResult = await fetchAPI("/api/bookings/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerkId: userId,
            rideId: rideId,
            seatsRequested: seatsRequested,
            paymentMethod: paymentMethod,
            status: 'confirmed',
          }),
        });
      }

      if (!bookingResult.success) {
        throw new Error(bookingResult.error || 'Failed to process booking');
      }

      if (__DEV__) {
        console.log('Booking confirmed successfully:', bookingResult.bookingId || bookingId);
      }

      setSuccess(true);

    } catch (error) {
      if (__DEV__) {
        console.error('Booking confirmation error:', error);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm booking';
      showErrorToast(errorMessage, 'Booking Failed');

    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="w-full">
      {/* Payment Method Selector */}
      <View className="mb-6 w-full">
        <Text
          className="text-base font-semibold mb-3"
          style={{ color: isDark ? '#FFFFFF' : '#111827' }}
        >
          Payment Method
        </Text>
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onMethodChange={setPaymentMethod}
          disabled={isProcessing}
        />

        {/* Info Box */}
        <View
          className="mt-4 p-4 rounded-xl w-full flex-row items-start"
          style={{ backgroundColor: isDark ? 'rgba(158, 158, 158, 0.1)' : 'rgba(158, 158, 158, 0.05)' }}
        >
          <Feather
            name="info"
            size={18}
            color="#9e9e9e"
            style={{ marginRight: 10, marginTop: 1 }}
          />
          <Text
            className="text-sm flex-1 leading-5"
            style={{ color: isDark ? '#FCA5A5' : '#9A3412' }}
          >
            You&apos;ll coordinate payment details with the driver directly using your selected method.
          </Text>
        </View>
      </View>

      <CustomButton
        title={isProcessing ? "Processing..." : "Confirm Booking"}
        className="mt-4 mb-8 w-full"
        onPress={confirmBooking}
        disabled={isProcessing}
      />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center p-7 rounded-2xl" style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }}>
          <View className="items-center justify-center mt-2 mb-2">
            <Feather name="check-circle" size={90} color="#9e9e9e" />
          </View>

          <Text className="text-2xl text-center font-InterBold mt-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Booking Confirmed!
          </Text>

          <Text className="text-md font-InterRegular text-center mt-3" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
            Your seat{seatsRequested > 1 ? 's have' : ' has'} been reserved.
            Coordinate payment with the driver using{' '}
            <Text className="font-semibold">{paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</Text>.
          </Text>

          <View className="rounded-lg p-4 mt-4 w-full" style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}>
            <Text className="text-sm text-center" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
              <Text className="font-semibold">Pickup:</Text> {userAddress}
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
              <Text className="font-semibold">Destination:</Text> {destinationAddress}
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
              <Text className="font-semibold">Seats booked:</Text> {seatsRequested}
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
              <Text className="font-semibold">Total amount:</Text> ${parseFloat(amount).toFixed(2)}
            </Text>
            <Text className="text-sm text-center mt-2 font-semibold" style={{ color: '#9e9e9e' }}>
              Payment via {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
            </Text>
          </View>

          <CustomButton
            title="View My Bookings"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/rides");
            }}
            className="mt-5 w-full"
          />

          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
            bgVariant="outline"
            className="mt-3 w-full"
          />
        </View>
      </ReactNativeModal>
    </View>
  );
};

export default Payment;
