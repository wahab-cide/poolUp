import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
 Modal } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useUser } from "@clerk/clerk-expo";

import { useTheme } from "@/contexts/ThemeContext";
import GoogleTextInput from "./GoogleTextInput";
import { fetchAPI } from "@/lib/fetch";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import {
  calculateSuggestedPrice,
  fetchDistanceAndDuration,
} from "@/lib/pricing";

interface DirectRideRequestModalProps {
  visible: boolean;
  onClose: () => void;
  driverClerkId: string;
  driverName: string;
}

const DirectRideRequestModal = ({
  visible,
  onClose,
  driverClerkId,
  driverName,
}: DirectRideRequestModalProps) => {
  const { user } = useUser();
  const { isDark } = useTheme();

  // Form state
  const [origin, setOrigin] = useState({
    latitude: 0,
    longitude: 0,
    address: "",
  });
  const [destination, setDestination] = useState({
    latitude: 0,
    longitude: 0,
    address: "",
  });
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [seatsRequested, setSeatsRequested] = useState("1");
  const [message, setMessage] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pricing state
  const [distanceInMiles, setDistanceInMiles] = useState<number | null>(null);
  const [durationInMinutes, setDurationInMinutes] = useState<number | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOriginSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setOrigin(location);
  };

  const handleDestinationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestination(location);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setDepartureTime(selectedTime);
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeForDisplay = (date: Date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    const minuteStr = String(minute).padStart(2, "0");
    return `${hour12}:${minuteStr} ${ampm}`;
  };

  // Calculate price when origin and destination are set
  useEffect(() => {
    const calculatePrice = async () => {
      if (
        origin.latitude &&
        origin.longitude &&
        destination.latitude &&
        destination.longitude
      ) {
        setCalculatingPrice(true);

        const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

        if (!googleApiKey) {
          console.error("Google Maps API key not found");
          setCalculatingPrice(false);
          return;
        }

        const result = await fetchDistanceAndDuration(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude,
          googleApiKey
        );

        if (result) {
          setDistanceInMiles(result.distanceInMiles);
          setDurationInMinutes(result.durationInMinutes);

          const pricing = calculateSuggestedPrice(
            result.distanceInMiles,
            result.durationInMinutes
          );

          setSuggestedPrice(pricing.suggestedPrice);

          // Auto-fill max price if empty
          if (!maxPrice.trim()) {
            setMaxPrice(pricing.suggestedPrice.toFixed(2));
          }
        }

        setCalculatingPrice(false);
      }
    };

    calculatePrice();
  }, [origin.latitude, origin.longitude, destination.latitude, destination.longitude]);

  const handleSubmit = async () => {
    // Validation
    if (!origin.address) {
      showErrorToast("Please select a pickup location", "Missing Information");
      return;
    }

    if (!destination.address) {
      showErrorToast("Please select a destination", "Missing Information");
      return;
    }

    if (!seatsRequested || parseInt(seatsRequested) < 1) {
      showErrorToast("Please enter number of seats needed", "Invalid Seats");
      return;
    }

    if (!maxPrice || parseFloat(maxPrice) <= 0) {
      showErrorToast("Please enter your maximum price", "Missing Price");
      return;
    }

    if (!user?.id) {
      showErrorToast("You must be logged in to request a ride", "Not Authenticated");
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time
      const requestDateTime = new Date(departureDate);
      requestDateTime.setHours(departureTime.getHours());
      requestDateTime.setMinutes(departureTime.getMinutes());

      const response = await fetchAPI("/api/ride-requests", {
        method: "POST",
        body: JSON.stringify({
          requesterClerkId: user.id,
          driverClerkId,
          originAddress: origin.address,
          originLatitude: origin.latitude,
          originLongitude: origin.longitude,
          destinationAddress: destination.address,
          destinationLatitude: destination.latitude,
          destinationLongitude: destination.longitude,
          requestedDateTime: requestDateTime.toISOString(),
          seatsRequested: parseInt(seatsRequested),
          maxPricePerSeat: parseFloat(maxPrice),
          message: message.trim() || null,
        }),
      });

      if (response.success) {
        showSuccessToast(
          `Request sent to ${driverName}!`,
          "Ride Request Sent"
        );
        handleClose();
      } else {
        showErrorToast(
          response.error || "Failed to send ride request",
          "Request Failed"
        );
      }
    } catch (error) {
      console.error("Error submitting ride request:", error);
      showErrorToast(
        "Unable to send request. Please try again.",
        "Network Error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setOrigin({ latitude: 0, longitude: 0, address: "" });
    setDestination({ latitude: 0, longitude: 0, address: "" });
    setDepartureDate(new Date());
    setDepartureTime(new Date());
    setSeatsRequested("1");
    setMessage("");
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: isDark ? "#000000" : "#FFFFFF" }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                if (Platform.OS === "android") {
                  Keyboard.dismiss();
                }
              }}
            >
              <View className="w-full">
                {/* Header */}
                <View className="mb-8">
                  <TouchableOpacity
                    onPress={handleClose}
                    className="flex-row items-center mb-6"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={24}
                      color={isDark ? "#FFFFFF" : "#000000"}
                    />
                    <Text
                      className={`text-lg ml-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      Back
                    </Text>
                  </TouchableOpacity>
                  <Text
                    className={`text-3xl ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-2`}
                    style={{ fontFamily: "Inter-Bold" }}
                  >
                    Request a Ride
                  </Text>
                  <Text
                    className={`text-base ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                    style={{ fontFamily: "Inter-Medium" }}
                  >
                    Request a ride from {driverName}
                  </Text>
                </View>

                {/* Location Section */}
                <View className="mb-8">
                  <Text
                    className={`text-lg ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-4`}
                    style={{ fontFamily: "Inter-SemiBold" }}
                  >
                    Where are you going?
                  </Text>

                  {/* From Location */}
                  <View className="mb-4">
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-2 ml-1`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      From
                    </Text>
                    <View
                      className={`${
                        isDark ? "border-gray-600" : "bg-gray-50 border-gray-200"
                      } rounded-xl border flex-row items-center px-4 py-4`}
                      style={{
                        minHeight: 56,
                        zIndex: 1000,
                        overflow: "visible",
                        backgroundColor: isDark ? "#161616" : undefined,
                      }}
                    >
                      <Ionicons
                        name="radio-button-on"
                        size={18}
                        color={isDark ? "#F97316" : "#EA580C"}
                        style={{ marginRight: 12 }}
                      />
                      <View className="flex-1" style={{ zIndex: 1000, overflow: "visible" }}>
                        <GoogleTextInput
                          icon=""
                          initialLocation={origin.address || undefined}
                          containerStyle=""
                          textInputBackgroundColor="transparent"
                          placeholder="Starting location"
                          handlePress={handleOriginSelect}
                        />
                      </View>
                    </View>
                  </View>

                  {/* To Location */}
                  <View className="mb-6">
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-2 ml-1`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      To
                    </Text>
                    <View
                      className={`${
                        isDark ? "border-gray-600" : "bg-gray-50 border-gray-200"
                      } rounded-xl border flex-row items-center px-4 py-4`}
                      style={{
                        minHeight: 56,
                        zIndex: 999,
                        overflow: "visible",
                        backgroundColor: isDark ? "#161616" : undefined,
                      }}
                    >
                      <Ionicons
                        name="location"
                        size={18}
                        color={isDark ? "#EF4444" : "#DC2626"}
                        style={{ marginRight: 12 }}
                      />
                      <View className="flex-1" style={{ zIndex: 999, overflow: "visible" }}>
                        <GoogleTextInput
                          icon=""
                          initialLocation={destination.address || undefined}
                          containerStyle=""
                          textInputBackgroundColor="transparent"
                          placeholder="Destination"
                          handlePress={handleDestinationSelect}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Date & Time Section */}
                <View className="mb-8">
                  <Text
                    className={`text-lg ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-4`}
                    style={{ fontFamily: "Inter-SemiBold" }}
                  >
                    When?
                  </Text>

                  {/* Date */}
                  <View className="mb-4">
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-2 ml-1`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      Date *
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      className={`${
                        isDark ? "border-gray-600" : "bg-gray-50 border-gray-200"
                      } rounded-xl border px-4 py-4 flex-row items-center justify-between`}
                      style={{
                        minHeight: 56,
                        backgroundColor: isDark ? "#161616" : undefined,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-base ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                        style={{ fontFamily: "Inter-Medium" }}
                      >
                        {formatDateForDisplay(departureDate)}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Time */}
                  <View>
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-2 ml-1`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      Time *
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(true)}
                      className={`${
                        isDark ? "border-gray-600" : "bg-gray-50 border-gray-200"
                      } rounded-xl border px-4 py-4 flex-row items-center justify-between`}
                      style={{
                        minHeight: 56,
                        backgroundColor: isDark ? "#161616" : undefined,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-base ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                        style={{ fontFamily: "Inter-Medium" }}
                      >
                        {formatTimeForDisplay(departureTime)}
                      </Text>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Trip Details Section */}
                <View className="mb-8">
                  <Text
                    className={`text-lg ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-4`}
                    style={{ fontFamily: "Inter-SemiBold" }}
                  >
                    Trip details
                  </Text>

                  {/* Seats */}
                  <View className="mb-4">
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-2 ml-1`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      Seats needed *
                    </Text>
                    <TextInput
                      placeholder="How many seats?"
                      placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                      value={seatsRequested}
                      onChangeText={setSeatsRequested}
                      className={`${
                        isDark
                          ? "border-gray-600 text-white"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      } rounded-xl border px-4 py-4 text-base`}
                      keyboardType="numeric"
                      style={{
                        fontFamily: "Inter-Medium",
                        minHeight: 56,
                        backgroundColor: isDark ? "#161616" : undefined,
                      }}
                    />
                  </View>

                  {/* Optional Message */}
                  <View>
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-2 ml-1`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      Message (Optional)
                    </Text>
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Add a note for the driver..."
                      placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      className={`${
                        isDark
                          ? "border-gray-600 text-white"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      } rounded-xl border px-4 py-4 text-base`}
                      style={{
                        fontFamily: "Inter-Medium",
                        minHeight: 100,
                        backgroundColor: isDark ? "#161616" : undefined,
                      }}
                    />
                  </View>
                </View>

                {/* Pricing Section */}
                <View className="mb-8">
                  <Text
                    className={`text-lg ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-4`}
                    style={{ fontFamily: "Inter-SemiBold" }}
                  >
                    Pricing
                  </Text>

                  {/* Distance and Duration Info */}
                  {distanceInMiles && durationInMinutes && (
                    <View
                      className="flex-row justify-between mb-4 px-4 py-3 rounded-xl border"
                      style={{
                        backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#DBEAFE",
                        borderColor: isDark ? "rgba(96, 165, 250, 0.3)" : "transparent"
                      }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="navigate" size={16} color={isDark ? "#60A5FA" : "#3B82F6"} />
                        <Text className={`text-sm ml-2 ${isDark ? "text-white" : "text-blue-700"}`} style={{ fontFamily: "Inter-Medium" }}>
                          {distanceInMiles} miles
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="time" size={16} color={isDark ? "#60A5FA" : "#3B82F6"} />
                        <Text className={`text-sm ml-2 ${isDark ? "text-white" : "text-blue-700"}`} style={{ fontFamily: "Inter-Medium" }}>
                          {durationInMinutes} min
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Suggested Price */}
                  {suggestedPrice && (
                    <View className="mb-4">
                      <View
                        className="flex-row justify-between items-center px-4 py-3 rounded-xl border"
                        style={{
                          backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#DCFCE7",
                          borderColor: isDark ? "rgba(74, 222, 128, 0.3)" : "transparent"
                        }}
                      >
                        <Text className={`text-sm ${isDark ? "text-white" : "text-green-700"}`} style={{ fontFamily: "Inter-Medium" }}>
                          Suggested price per seat
                        </Text>
                        <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-green-700"}`} style={{ fontFamily: "Inter-Bold" }}>
                          ${suggestedPrice.toFixed(2)}
                        </Text>
                      </View>

                      {/* Use Suggested Button */}
                      {!calculatingPrice && maxPrice !== suggestedPrice.toFixed(2) && (
                        <TouchableOpacity
                          onPress={() => {
                            setMaxPrice(suggestedPrice.toFixed(2));
                          }}
                          className={`${isDark ? 'bg-orange-600' : 'bg-orange-500'} rounded-xl py-3 px-6 mt-3`}
                          activeOpacity={0.85}
                          style={{
                            shadowColor: '#F97316',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 4,
                          }}
                        >
                          <View className="flex-row items-center justify-center">
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="white"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-white text-sm" style={{ fontFamily: "Inter-Bold" }}>
                              Use Suggested Price per Seat
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Max Price Input */}
                  <View className="mb-2">
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-2 ml-1`}
                      style={{ fontFamily: "Inter-Medium" }}
                    >
                      Your maximum price per seat *
                    </Text>
                    <View className="flex-row items-center">
                      <Text className={`text-2xl mr-2 ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: "Inter-Bold" }}>
                        $
                      </Text>
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                        value={maxPrice}
                        onChangeText={setMaxPrice}
                        className={`flex-1 ${
                          isDark
                            ? "border-gray-600 text-white"
                            : "bg-gray-50 border-gray-200 text-gray-900"
                        } rounded-xl border px-4 py-4 text-base`}
                        keyboardType="decimal-pad"
                        style={{
                          fontFamily: "Inter-Medium",
                          minHeight: 56,
                          backgroundColor: isDark ? "#161616" : undefined,
                        }}
                      />
                    </View>
                    {calculatingPrice && (
                      <View className="flex-row items-center mt-2 ml-1">
                        <ActivityIndicator size="small" color={isDark ? "#60A5FA" : "#3B82F6"} />
                        <Text className={`text-xs ml-2 ${isDark ? "text-gray-400" : "text-gray-600"}`} style={{ fontFamily: "Inter-Medium" }}>
                          Calculating suggested price...
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  className="rounded-full py-4 mt-4 items-center justify-center"
                  style={{
                    backgroundColor: submitting
                      ? isDark
                        ? "#4B5563"
                        : "#D1D5DB"
                      : isDark
                      ? "#3B82F6"
                      : "#000000",
                    minHeight: 56,
                  }}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      className="text-white text-center"
                      style={{ fontFamily: "Inter-Bold", fontSize: 18 }}
                    >
                      Send Request
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          {/* Date Picker Modal */}
          {Platform.OS === 'ios' ? (
            <ReactNativeModal
              isVisible={showDatePicker}
              onBackdropPress={() => setShowDatePicker(false)}
              className="justify-center items-center m-0"
              backdropOpacity={0.6}
              animationIn="fadeInUp"
              animationOut="fadeOutDown"
              animationInTiming={400}
              animationOutTiming={300}
            >
              <View className="w-full max-w-md mx-4 rounded-3xl overflow-hidden" style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF' }}>
                {/* Header */}
                <View className="px-6 py-4 border-b" style={{ backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB', borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB' }}>
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Inter-SemiBold' }}>
                      Select Date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: isDark ? '#3B82F6' : '#F97316' }}
                      activeOpacity={0.7}
                    >
                      <Text className="text-white font-semibold" style={{ fontFamily: 'Inter-SemiBold' }}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Date Picker */}
                <View className="px-4 py-6" style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF' }}>
                  <DateTimePicker
                    value={departureDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    style={{
                      backgroundColor: 'transparent',
                      height: 180,
                      width: '100%',
                      alignSelf: 'center',
                    }}
                    textColor={isDark ? '#FFFFFF' : '#1F2937'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    accentColor="#3B82F6"
                  />
                </View>
              </View>
            </ReactNativeModal>
          ) : (
            showDatePicker && (
              <DateTimePicker
                value={departureDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )
          )}

          {/* Time Picker Modal */}
          {Platform.OS === 'ios' ? (
            <ReactNativeModal
              isVisible={showTimePicker}
              onBackdropPress={() => setShowTimePicker(false)}
              className="justify-center items-center m-0"
              backdropOpacity={0.6}
              animationIn="fadeInUp"
              animationOut="fadeOutDown"
              animationInTiming={400}
              animationOutTiming={300}
            >
              <View className="w-full max-w-md mx-4 rounded-3xl overflow-hidden" style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF' }}>
                {/* Header */}
                <View className="px-6 py-4 border-b" style={{ backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB', borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB' }}>
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Inter-SemiBold' }}>
                      Select Time
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(false)}
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: isDark ? '#3B82F6' : '#F97316' }}
                      activeOpacity={0.7}
                    >
                      <Text className="text-white font-semibold" style={{ fontFamily: 'Inter-SemiBold' }}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Time Picker */}
                <View className="px-4 py-6" style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF' }}>
                  <DateTimePicker
                    value={departureTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    style={{
                      backgroundColor: 'transparent',
                      height: 180,
                      width: '100%',
                      alignSelf: 'center',
                    }}
                    textColor={isDark ? '#FFFFFF' : '#000000'}
                    themeVariant={isDark ? "dark" : "light"}
                    accentColor="#3B82F6"
                  />
                </View>
              </View>
            </ReactNativeModal>
          ) : (
            showTimePicker && (
              <DateTimePicker
                value={departureTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default DirectRideRequestModal;
