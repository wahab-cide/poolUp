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

interface BookingRequestProps {
  fullName: string;
  email: string;
  amount: string;
  rideId: string;
  driverId?: number;
  rideTime: number;
  seatsRequested?: number;
}

const BookingRequest = ({
  fullName,
  email,
  amount,
  rideId,
  driverId,
  rideTime,
  seatsRequested = 1,
}: BookingRequestProps) => {
  const { isDark } = useTheme();
  const {
    userAddress,
    destinationAddress,
  } = useLocationStore();

  const { userId } = useAuth();
  const [success, setSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const createBookingRequest = async () => {
    if (isProcessing) return;
    await processBooking();
  };

  const processBooking = async () => {
    setIsProcessing(true);

    try {
      if (__DEV__) console.log('🚀 Starting booking process:', {
        rideId,
        seatsRequested,
        paymentMethod
      });

      // First validate seat availability before attempting booking
      const validationResult = await fetchAPI(`/api/rides/${rideId}/validate-booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatsRequested: seatsRequested,
        }),
      });

      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Unable to validate seat availability');
      }

      if (!validationResult.isValid) {
        const availableSeats = validationResult.availableSeats || 0;
        throw new Error(`Only ${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available. Cannot book ${seatsRequested} seat${seatsRequested !== 1 ? 's' : ''}.`);
      }

      // Create booking request with payment method
      const requestBody = {
        clerkId: userId,
        rideId: rideId,
        seatsRequested: seatsRequested,
        acceptSplitPricing: true,
        status: 'pending',
        paymentMethod: paymentMethod
      };

      const apiEndpoint = "/api/bookings/create-split";

      if (__DEV__) console.log('📡 Making booking request:', {
        endpoint: apiEndpoint,
        requestBody
      });

      const bookingResult = await fetchAPI(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!bookingResult.success) {
        throw new Error(bookingResult.error || 'Failed to create booking request');
      }

      if (__DEV__) console.log('Booking request created successfully:', bookingResult.bookingId);
      setSuccess(true);

    } catch (error) {
      console.error('Booking request error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking request';
      showErrorToast(errorMessage, 'Booking Request Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Payment Method Selector */}
      <View className="mb-6">
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
          className="mt-4 p-4 rounded-xl flex-row items-start"
          style={{ backgroundColor: isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)' }}
        >
          <Feather
            name="info"
            size={18}
            color="#F97316"
            style={{ marginRight: 10, marginTop: 1 }}
          />
          <Text
            className="text-sm flex-1 leading-5"
            style={{ color: isDark ? '#FCA5A5' : '#9A3412' }}
          >
            Driver will approve your request before coordinating payment details.
          </Text>
        </View>
      </View>

      <View className="items-center">
        <CustomButton
          title={isProcessing ? "Sending Request..." : "Request Ride"}
          className="my-10"
          onPress={createBookingRequest}
          disabled={isProcessing}
        />
      </View>

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center p-7 rounded-2xl" style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }}>
          <View className="items-center justify-center mt-2 mb-2">
            <Feather name="check-circle" size={90} color="#F97316" />
          </View>
          <Text className="text-2xl text-center font-InterBold mt-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Request Sent!
          </Text>

          <Text className="text-md font-InterRegular text-center mt-3" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
            Your booking request has been sent to the driver.
            You&apos;ll be notified when they approve. Payment will be coordinated using{' '}
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
              <Text className="font-semibold">Seats requested:</Text> {seatsRequested}
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
              <Text className="font-semibold">Total amount:</Text> ${(parseFloat(amount) * seatsRequested).toFixed(2)}
            </Text>
            <Text className="text-sm text-center mt-2 font-semibold" style={{ color: '#F97316' }}>
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
    </>
  );
};

export default BookingRequest;
