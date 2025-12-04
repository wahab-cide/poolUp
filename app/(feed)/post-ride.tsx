import FareSplitPricingDisplay from '@/components/FareSplitPricingDisplay';
import GoogleTextInput from '@/components/GoogleTextInput';
import RecurringRideOptions, { RecurringRideSettings } from '@/components/RecurringRideOptions';
import { useTheme } from '@/contexts/ThemeContext';
import { calculateFareSplit } from '@/lib/fareSplitting';
import { fetchAPI } from '@/lib/fetch';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ReactNativeModal } from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RideFormData {
  originLabel: string;
  destinationLabel: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  departureDate: string;
  departureTime: string;
  seatsTotal: string; // For posts
  seatsRequired: string; // For requests
  price: string;
  fareSplittingEnabled: boolean; // For fare splitting
}

interface DistanceData {
  distanceInMiles: number;
  durationInMinutes: number;
  suggestedPrice: number;
  priceBreakdown: {
    baseFee: number;
    distanceFee: number;
    timeFee: number;
    gasFee: number;
    peakMultiplier: number;
  };
  isLoading: boolean;
  error: string | null;
}


export default function PostRideScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isDark } = useTheme();
  const params = useLocalSearchParams();

  // Check if user is a driver to determine if this is a post or request
  const isDriver = user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true;
  
  // Use passed mode parameter if available, otherwise fallback to user type logic
  const mode = (params.mode as 'post' | 'request' | 'edit') || (isDriver ? 'post' : 'request');
  const isEditMode = mode === 'edit';
  const requestType = isEditMode ? 'request' : mode;

  const [formData, setFormData] = useState<RideFormData>({
    originLabel: '',
    destinationLabel: '',
    originLat: null,
    originLng: null,
    destinationLat: null,
    destinationLng: null,
    departureDate: '',
    departureTime: '',
    seatsTotal: '',
    seatsRequired: '',
    price: '',
    fareSplittingEnabled: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  
  // Recurring ride settings (only available for drivers posting rides, not editing)
  const [recurringSettings, setRecurringSettings] = useState<RecurringRideSettings>({
    isRecurring: false,
    templateName: '',
    recurrencePattern: 'weekdays',
    recurrenceDays: [1, 2, 3, 4, 5], // Default to weekdays
    activeUntil: null,
    generateRidesImmediately: true,
    daysToGenerate: 7
  });
  const [distanceData, setDistanceData] = useState<DistanceData>({
    distanceInMiles: 0,
    durationInMinutes: 0,
    suggestedPrice: 0,
    priceBreakdown: {
      baseFee: 0,
      distanceFee: 0,
      timeFee: 0,
      gasFee: 0,
      peakMultiplier: 1,
    },
    isLoading: false,
    error: null,
  });

  // Pre-fill form data from navigation parameters
  useEffect(() => {
    if (params.originAddress && params.destinationAddress) {
      setFormData(prev => ({
        ...prev,
        originLabel: params.originAddress as string,
        destinationLabel: params.destinationAddress as string,
        originLat: params.originLatitude ? parseFloat(params.originLatitude as string) : null,
        originLng: params.originLongitude ? parseFloat(params.originLongitude as string) : null,
        destinationLat: params.destinationLatitude ? parseFloat(params.destinationLatitude as string) : null,
        destinationLng: params.destinationLongitude ? parseFloat(params.destinationLongitude as string) : null,
      }));
    }
  }, [
    params.originAddress,
    params.destinationAddress,
    params.originLatitude,
    params.originLongitude,
    params.destinationLatitude,
    params.destinationLongitude
  ]);

  // Pre-fill form data for edit mode
  useEffect(() => {
    if (isEditMode && params.requestId) {
      const departureDateTime = new Date(params.departureTime as string);
      const departureDate = departureDateTime.toISOString().split('T')[0];
      const departureTime = departureDateTime.toTimeString().slice(0, 5);

      setFormData(prev => ({
        ...prev,
        originLabel: params.originLabel as string || '',
        destinationLabel: params.destinationLabel as string || '',
        originLat: params.originLat ? parseFloat(params.originLat as string) : null,
        originLng: params.originLng ? parseFloat(params.originLng as string) : null,
        destinationLat: params.destinationLat ? parseFloat(params.destinationLat as string) : null,
        destinationLng: params.destinationLng ? parseFloat(params.destinationLng as string) : null,
        departureDate: departureDate,
        departureTime: departureTime,
        seatsRequired: params.seatsRequired as string || '',
        price: params.maxPricePerSeat as string || '',
      }));

      // Set the date and time pickers
      setSelectedDate(departureDateTime);
      setSelectedTime(departureDateTime);
    }
  }, [
    isEditMode,
    params.requestId,
    params.originLabel,
    params.destinationLabel,
    params.originLat,
    params.originLng,
    params.destinationLat,
    params.destinationLng,
    params.departureTime,
    params.seatsRequired,
    params.maxPricePerSeat
  ]);


  const validateForm = (): string | null => {
    const {
      originLabel,
      destinationLabel,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      departureDate,
      departureTime,
      seatsTotal,
      price,
    } = formData;

    if (!originLabel.trim()) return 'Origin location is required';
    if (!destinationLabel.trim()) return 'Destination location is required';
    if (originLat === null || originLng === null) return 'Please select a valid origin location';
    if (destinationLat === null || destinationLng === null) return 'Please select a valid destination location';
    // Validate seats based on mode
    const seatsField = requestType === 'request' ? formData.seatsRequired : seatsTotal;
    if (!seatsField.trim()) return 'Number of seats is required';
    if (!price.trim()) return 'Price is required';

    // Validate seats
    const seats = parseInt(seatsField);
    if (isNaN(seats) || seats < 1 || seats > 8) {
      return 'Seats must be between 1 and 8';
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return 'Price must be a positive number';
    }

    // Validate date and time are selected
    if (!departureDate) {
      return 'Please select a departure date';
    }
    
    if (!departureTime) {
      return 'Please select a departure time';
    }
    
    // Validate departure time is in the future
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    if (departureDateTime <= new Date()) {
      return 'Departure time must be in the future';
    }

    return null;
  };

  const createRide = async (): Promise<void> => {
    const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`);
    
    // Use the price entered by the user 
    const pricePerSeat = parseFloat(formData.price);
    const seatsRequested = requestType === 'request' ? parseInt(formData.seatsRequired) || 1 : 1;
    
    if (isEditMode) {
      // Update existing request (no recurring ride support for editing)
      const updateBody = {
        clerkId: user?.id,
        originLabel: formData.originLabel.trim(),
        originLat: formData.originLat,
        originLng: formData.originLng,
        destinationLabel: formData.destinationLabel.trim(),
        destinationLat: formData.destinationLat,
        destinationLng: formData.destinationLng,
        departureTime: departureDateTime.toISOString(),
        seatsRequired: seatsRequested,
        maxPricePerSeat: pricePerSeat,
        currency: params.currency as string || 'USD',
      };

      try {
        const data = await fetchAPI(`/api/requests/${params.requestId}`, {
          method: 'PUT',
          body: JSON.stringify(updateBody),
        });

        if (!data.success) {
          throw new Error(data.error || 'Failed to update ride request');
        }
      } catch (error) {
        console.error('Update ride request failed:', error);
        throw error;
      }
    } else {
      // Check if this should be a recurring ride
      const isRecurringRide = requestType === 'post' && recurringSettings.isRecurring;
      
      if (isRecurringRide) {
        // Create recurring ride template
        const defaultTemplateName = `Recurring ride - ${formData.originLabel} to ${formData.destinationLabel}`;
        const templateName = recurringSettings.templateName || defaultTemplateName;
        // Truncate to 100 characters to fit database constraint
        const truncatedTemplateName = templateName.length > 100 ? templateName.substring(0, 97) + '...' : templateName;
        
        const recurringBody = {
          clerkId: user?.id,
          templateName: truncatedTemplateName,
          originLabel: formData.originLabel.trim(),
          originLat: formData.originLat,
          originLng: formData.originLng,
          destinationLabel: formData.destinationLabel.trim(),
          destinationLat: formData.destinationLat,
          destinationLng: formData.destinationLng,
          departureTime: departureDateTime.toISOString(), // Full UTC datetime 
          seatsAvailable: parseInt(formData.seatsTotal),
          price: pricePerSeat,
          recurrencePattern: recurringSettings.recurrencePattern,
          recurrenceDays: recurringSettings.recurrenceDays,
          activeUntil: recurringSettings.activeUntil,
          fareSplittingEnabled: formData.fareSplittingEnabled,
          generateRidesImmediately: recurringSettings.generateRidesImmediately,
          daysToGenerate: recurringSettings.daysToGenerate,
        };

        try {
          const data = await fetchAPI('/api/recurring-rides/create', {
            method: 'POST',
            body: JSON.stringify(recurringBody),
          });

          if (!data.success) {
            throw new Error(data.error || 'Failed to create recurring ride template');
          }
          
          // Store some info about the created template for success message
          (window as any).recurringRideResult = {
            templateName: data.data.template.name,
            ridesGenerated: data.data.ridesGenerated || 0
          };
        } catch (error) {
          console.error('Create recurring ride failed:', error);
          throw error;
        }
      } else {
        // Create single ride/request (existing logic)
        const requestBody = {
          clerkId: user?.id,
          type: requestType,
          originLabel: formData.originLabel.trim(),
          originLat: formData.originLat,
          originLng: formData.originLng,
          destinationLabel: formData.destinationLabel.trim(),
          destinationLat: formData.destinationLat,
          destinationLng: formData.destinationLng,
          departureTime: departureDateTime.toISOString(),
          seatsTotal: requestType === 'post' ? parseInt(formData.seatsTotal) : undefined,
          seatsRequired: requestType === 'request' ? seatsRequested : undefined,
          price: pricePerSeat, // Always store per-seat price in the price field
          pricePerSeat: requestType === 'request' ? pricePerSeat : undefined,
          fareSplittingEnabled: requestType === 'post' ? formData.fareSplittingEnabled : undefined,
        };

        try {
          const data = await fetchAPI('/api/rides/create', {
            method: 'POST',
            body: JSON.stringify(requestBody),
          });

          if (!data.success) {
            throw new Error(data.error || 'Failed to create ride');
          }
        } catch (error) {
          console.error('Create ride failed:', error);
          throw error;
        }
      }
    }
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      showErrorToast(validationError, 'Validation Error');
      return;
    }

    if (!user?.id) {
      showErrorToast('User not authenticated', 'Error');
      return;
    }

    setIsLoading(true);

    try {
      await createRide();

      // Check if this was a recurring ride creation
      const recurringResult = (window as any).recurringRideResult;
      const isRecurringRide = requestType === 'post' && recurringSettings.isRecurring;
      
      let successMessage = '';
      if (isEditMode) {
        successMessage = 'Your ride request has been updated successfully.';
      } else if (isRecurringRide && recurringResult) {
        successMessage = `Recurring ride template "${recurringResult.templateName}" created successfully! ${recurringResult.ridesGenerated} rides have been generated for the coming days.`;
      } else if (requestType === 'post') {
        successMessage = 'Your ride has been posted successfully.';
      } else {
        successMessage = 'Your ride request has been submitted successfully.';
      }

      showSuccessToast(successMessage, 'Success!');

      // Clean up temporary result data
      if ((window as any).recurringRideResult) {
        delete (window as any).recurringRideResult;
      }
      router.push(isEditMode ? '/(root)/(tabs)/rides' : '/(root)/(tabs)/home');
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : 'Failed to create ride. Please try again.',
        'Failed to Post Ride'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormField = (field: keyof RideFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOriginSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      originLabel: location.address,
      originLat: location.latitude,
      originLng: location.longitude,
    }));
  };

  const handleDestinationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      destinationLabel: location.address,
      destinationLat: location.latitude,
      destinationLng: location.longitude,
    }));
  };

  // Unified pricing model for both posts and requests (carpool cost-sharing approach)
  const calculateSuggestedPrice = (distanceInMiles: number, durationInMinutes: number) => {
    // Gas cost calculation
    const CURRENT_GAS_PRICE = 3.50; // $/gallon
    const MPG_ESTIMATE = 25; // Miles per gallon
    const totalGasCost = (distanceInMiles / MPG_ESTIMATE) * CURRENT_GAS_PRICE;

    // UNIFIED CARPOOL PRICING MODEL
    // This model is based on cost-sharing, not profit maximization
    // Fair for both drivers posting rides and passengers requesting them

    const BASE_FEE = 4.50; // Covers basic wear-and-tear per trip
    const DISTANCE_RATE = 0.55; // Per mile for maintenance, insurance, depreciation
    const TIME_RATE = 0.15; // Per minute for driver's time
    const DRIVER_INCENTIVE_BASE = 3.00; // Minimum driver incentive
    const DRIVER_INCENTIVE_RATE = 0.20; // Additional incentive per mile for longer trips

    // Calculate components
    const baseFee = BASE_FEE;
    const gasFee = totalGasCost;
    const distanceFee = distanceInMiles * DISTANCE_RATE;
    const timeFee = durationInMinutes * TIME_RATE;
    const driverIncentive = Math.max(DRIVER_INCENTIVE_BASE, distanceInMiles * DRIVER_INCENTIVE_RATE);

    // Total suggested price per seat
    const suggestedPrice = baseFee + gasFee + distanceFee + timeFee + driverIncentive;

    const priceBreakdown = {
      baseFee: Math.round((baseFee + driverIncentive) * 100) / 100,
      distanceFee: Math.round(distanceFee * 100) / 100,
      timeFee: Math.round(timeFee * 100) / 100,
      gasFee: Math.round(gasFee * 100) / 100,
      peakMultiplier: 1.0,
    };

    return {
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      priceBreakdown: priceBreakdown,
    };
  };

  // Calculate distance and suggested price when both locations are set
  const calculateDistance = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
    const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    
    if (!googleApiKey) {
      console.error('Google API key is missing for distance calculation');
      return;
    }

    setDistanceData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&units=imperial&mode=driving&key=${googleApiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const distanceValue = data.rows[0].elements[0].distance.value; 
        const durationValue = data.rows[0].elements[0].duration.value; 
        
        // Convert to miles and minutes
        const distanceInMiles = Math.round(distanceValue * 0.000621371 * 100) / 100;
        const durationInMinutes = Math.round(durationValue / 60);
        
        const pricing = calculateSuggestedPrice(distanceInMiles, durationInMinutes);
        
        setDistanceData({
          distanceInMiles,
          durationInMinutes,
          suggestedPrice: pricing.suggestedPrice,
          priceBreakdown: pricing.priceBreakdown,
          isLoading: false,
          error: null,
        });

        // Auto-fill price if it's currently empty
        if (!formData.price.trim()) {
          setFormData(prev => ({ ...prev, price: pricing.suggestedPrice.toString() }));
        }
      } else {
        throw new Error('Unable to calculate distance');
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      setDistanceData({
        distanceInMiles: 0,
        durationInMinutes: 0,
        suggestedPrice: 0,
        priceBreakdown: {
          baseFee: 0,
          distanceFee: 0,
          timeFee: 0,
          gasFee: 0,
          peakMultiplier: 1,
        },
        isLoading: false,
        error: 'Unable to calculate distance',
      });
    }
  };

  // Effect to calculate distance when both locations are set
  useEffect(() => {
    if (
      formData.originLat &&
      formData.originLng &&
      formData.destinationLat &&
      formData.destinationLng
    ) {
      calculateDistance(
        formData.originLat,
        formData.originLng,
        formData.destinationLat,
        formData.destinationLng
      );
    } else {
      // Reset distance data when locations are cleared
      setDistanceData({
        distanceInMiles: 0,
        durationInMinutes: 0,
        suggestedPrice: 0,
        priceBreakdown: {
          baseFee: 0,
          distanceFee: 0,
          timeFee: 0,
          gasFee: 0,
          peakMultiplier: 1,
        },
        isLoading: false,
        error: null,
      });
    }
  }, [formData.originLat, formData.originLng, formData.destinationLat, formData.destinationLng, formData.seatsTotal, formData.departureTime]);

  // Effect to sync selectedDate with formData.departureDate
  useEffect(() => {
    if (formData.departureDate) {
      const [year, month, day] = formData.departureDate.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      setSelectedDate(newDate);
    }
  }, [formData.departureDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
      // Use local date string to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setFormData(prev => ({ ...prev, departureDate: dateString }));
    }
  };

  const handleDateConfirm = () => {
    setShowDatePicker(false);
    // Ensure the date is set when user confirms using local date
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setFormData(prev => ({ ...prev, departureDate: dateString }));
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
    // Reset to previous date if user cancels
    if (formData.departureDate) {
      const [year, month, day] = formData.departureDate.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    } else {
      setSelectedDate(new Date());
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setSelectedTime(selectedTime);
      // Format time to HH:MM format
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setFormData(prev => ({ ...prev, departureTime: timeString }));
    }
  };

  const handleTimeConfirm = () => {
    setShowTimePicker(false);
    // Ensure the time is set when user confirms
    const hours = String(selectedTime.getHours()).padStart(2, '0');
    const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    setFormData(prev => ({ ...prev, departureTime: timeString }));
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
    // Reset to previous time if user cancels
    if (formData.departureTime) {
      const [hours, minutes] = formData.departureTime.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hours, minutes, 0, 0);
      setSelectedTime(newTime);
    } else {
      setSelectedTime(new Date());
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Tap to select date';
    
    // Parse as local date components to avoid UTC conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Create local date
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return 'Select time';
    const [hour, minute] = timeString.split(':');
    const hour12 = parseInt(hour) === 0 ? 12 : parseInt(hour) > 12 ? parseInt(hour) - 12 : parseInt(hour);
    const ampm = parseInt(hour) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minute} ${ampm}`;
  };


  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingTop: 20, 
            paddingBottom: 40,
            minHeight: Platform.OS === 'android' ? '120%' : undefined 
          }} 
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <TouchableWithoutFeedback onPress={() => {
            if (Platform.OS === 'android') {
              Keyboard.dismiss();
            }
          }}>
            <View className="w-full">
            <View className="mb-8">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="flex-row items-center mb-6"
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={isDark ? '#FFFFFF' : '#000000'} 
                />
                <Text className={`text-lg font-InterMedium ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Back
                </Text>
              </TouchableOpacity>
              <Text className={`text-3xl font-InterBold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {isEditMode 
                  ? 'Edit Ride Request' 
                  : requestType === 'request' 
                    ? 'Request a Ride' 
                    : 'Post a Ride'
                }
              </Text>
              <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} font-InterMedium`}>
                {isEditMode 
                  ? 'Update your ride request details'
                  : requestType === 'request' 
                    ? 'Find a ride that fits your schedule' 
                    : 'Share your journey with others'
                }
              </Text>
            </View>
            
            <View className="w-full">
              {/* Location Section */}
              <View className="mb-8">
                <Text className={`text-lg font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Where are you going?
                </Text>
                {/* From Location */}
                <View className="mb-4">
                  <Text className={`text-sm font-InterMedium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 ml-1`}>
                    From
                  </Text>
                  <View
                    className={`${isDark ? 'border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border flex-row items-center px-4 py-4`}
                    style={{
                      minHeight: 56,
                      zIndex: 1000,
                      overflow: 'visible',
                      backgroundColor: isDark ? '#161616' : undefined
                    }}
                  >
                    <Ionicons name="radio-button-on" size={18} color={isDark ? '#F97316' : '#EA580C'} style={{ marginRight: 12 }} />
                    <View className="flex-1" style={{ zIndex: 1000, overflow: 'visible' }}>
                      <GoogleTextInput
                        icon=""
                        initialLocation={formData.originLabel || undefined}
                        containerStyle=""
                        textInputBackgroundColor="transparent"
                        placeholder="Starting location"
                        disabled={isLoading}
                        handlePress={handleOriginSelect}
                      />
                    </View>
                  </View>
                </View>

                {/* To Location */}
                <View className="mb-6">
                  <Text className={`text-sm font-InterMedium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 ml-1`}>
                    To
                  </Text>
                  <View
                    className={`${isDark ? 'border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border flex-row items-center px-4 py-4`}
                    style={{
                      minHeight: 56,
                      zIndex: 999,
                      overflow: 'visible',
                      backgroundColor: isDark ? '#161616' : undefined
                    }}
                  >
                    <Ionicons name="location" size={18} color={isDark ? '#EF4444' : '#DC2626'} style={{ marginRight: 12 }} />
                    <View className="flex-1" style={{ zIndex: 999, overflow: 'visible' }}>
                      <GoogleTextInput
                        icon=""
                        initialLocation={formData.destinationLabel || undefined}
                        containerStyle=""
                        textInputBackgroundColor="transparent"
                        placeholder="Destination"
                        disabled={isLoading}
                        handlePress={handleDestinationSelect}
                      />
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Date & Time Section */}
              <View className="mb-8">
                <Text className={`text-lg font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                  When?
                </Text>
                
                {/* Date */}
                <View className="mb-4">
                  <Text className={`text-sm font-InterMedium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 ml-1`}>
                    Date *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    disabled={isLoading}
                    className={`${isDark ? 'border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border px-4 py-4 flex-row items-center justify-between`}
                    style={{
                      minHeight: 56,
                      backgroundColor: isDark ? '#161616' : undefined
                    }}
                    activeOpacity={0.7}
                  >
                    <Text 
                      className={`text-base ${
                        formData.departureDate 
                          ? (isDark ? 'text-white' : 'text-gray-900') 
                          : (isDark ? 'text-gray-500' : 'text-gray-500')
                      }`}
                      style={{ fontFamily: 'Inter-Medium' }}
                    >
                      {formatDateForDisplay(formData.departureDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </TouchableOpacity>
                </View>

                {/* Time */}
                <View>
                  <Text className={`text-sm font-InterMedium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 ml-1`}>
                    Time *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    disabled={isLoading}
                    className={`${isDark ? 'border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border px-4 py-4 flex-row items-center justify-between`}
                    style={{
                      minHeight: 56,
                      backgroundColor: isDark ? '#161616' : undefined
                    }}
                    activeOpacity={0.7}
                  >
                    <Text 
                      className={`text-base ${
                        formData.departureTime 
                          ? (isDark ? 'text-white' : 'text-gray-900') 
                          : (isDark ? 'text-gray-500' : 'text-gray-500')
                      }`}
                      style={{ fontFamily: 'Inter-Medium' }}
                    >
                      {formatTimeForDisplay(formData.departureTime)}
                    </Text>
                    <Ionicons name="time-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Trip Details Section */}
              <View className="mb-8">
                <Text className={`text-lg font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Trip details
                </Text>
                
                {/* Seats */}
                <View className="mb-4">
                  <Text className={`text-sm font-InterMedium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 ml-1`}>
                    {mode === 'request' ? 'Seats needed *' : 'Seats available *'}
                  </Text>
                  <TextInput
                    placeholder="How many seats?"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={mode === 'request' ? formData.seatsRequired : formData.seatsTotal}
                    onChangeText={(text) => updateFormField(mode === 'request' ? 'seatsRequired' : 'seatsTotal', text)}
                    className={`${isDark ? 'border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-xl border px-4 py-4 text-base`}
                    keyboardType="numeric"
                    style={{
                      fontFamily: 'Inter-Medium',
                      minHeight: 56,
                      backgroundColor: isDark ? '#161616' : undefined
                    }}
                  />
                </View>

                {/* Price */}
                <View>
                  <Text className={`text-sm font-InterMedium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 ml-1`}>
                    {mode === 'post' 
                      ? 'Carpool cost per seat *'
                      : 'Maximum price per seat *'
                    }
                  </Text>
                  <TextInput
                    placeholder={mode === 'request' ? "Price per seat in USD" : "Price in USD"}
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={formData.price}
                    onChangeText={(text) => updateFormField('price', text)}
                    className={`${isDark ? 'border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-xl border px-4 py-4 text-base`}
                    keyboardType="numeric"
                    style={{
                      fontFamily: 'Inter-Medium',
                      minHeight: 56,
                      backgroundColor: isDark ? '#161616' : undefined
                    }}
                  />
                  
                  
                  {/* Price Suggestions */}
                  {distanceData.isLoading && (
                    <View className="flex-row items-center mt-3 px-1">
                      <ActivityIndicator size="small" color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-2 font-InterMedium`}>
                        Calculating suggestion...
                      </Text>
                    </View>
                  )}
                  {!distanceData.isLoading && distanceData.suggestedPrice > 0 && (
                    <View className="mt-3 px-1">
                      {(() => {
                        const suggestedPricePerSeat = mode === 'request' && formData.seatsRequired 
                          ? (() => {
                              const seatsRequested = parseInt(formData.seatsRequired);
                              // For ride requests, apply custom group discount percentages
                              let discountPercentage = 0;
                              switch (seatsRequested) {
                                case 1:
                                  discountPercentage = 0; // No discount for solo riders
                                  break;
                                case 2:
                                  discountPercentage = 15; // 15% off for 2 riders
                                  break;
                                case 3:
                                  discountPercentage = 25; // 25% off for 3 riders
                                  break;
                                default: // 4+ riders
                                  discountPercentage = 40; // 40% off for 4+ riders
                                  break;
                              }
                              const discountedPrice = distanceData.suggestedPrice * (1 - discountPercentage / 100);
                              return Math.round(discountedPrice * 100) / 100;
                            })()
                          : Math.round(distanceData.suggestedPrice * 100) / 100;
                        
                        return (
                          <View
                            className={`${isDark ? 'border-gray-600/40' : 'bg-white border-orange-200'} rounded-2xl border-2 p-5 mt-1`}
                            style={{
                              shadowColor: isDark ? '#000' : '#F97316',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: isDark ? 0.3 : 0.12,
                              shadowRadius: 12,
                              elevation: 4,
                              backgroundColor: isDark ? '#161616' : undefined
                            }}
                          >
                            <View className="flex-row items-center justify-between mb-3">
                              <View className="flex-row items-center">
                                <View 
                                  className={`${isDark ? 'bg-orange-500/20' : 'bg-orange-50'} rounded-full p-2 mr-3`}
                                  style={{
                                    shadowColor: '#F97316',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 4,
                                    elevation: 2,
                                  }}
                                >
                                  <Ionicons 
                                    name="checkmark-circle" 
                                    size={16} 
                                    color={isDark ? '#FB923C' : '#EA580C'} 
                                  />
                                </View>
                                <Text className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'} font-InterSemiBold`}>
                                  Suggested Price{mode === 'request' ? ' per seat' : ''}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Text className={`text-xl ${isDark ? 'text-white' : 'text-orange-600'} font-InterBold`}>
                                  ${suggestedPricePerSeat.toFixed(2)}
                                </Text>
                              </View>
                            </View>
                            
                            {mode === 'request' && formData.seatsRequired && parseInt(formData.seatsRequired) > 1 && (
                              <View className={`${isDark ? 'bg-orange-500/10' : 'bg-orange-50'} rounded-lg p-2 mb-3`}>
                                <Text className={`text-xs ${isDark ? 'text-gray-200' : 'text-orange-700'} font-InterMedium text-center`}>
                                  Total for {formData.seatsRequired} seats: ${(suggestedPricePerSeat * parseInt(formData.seatsRequired)).toFixed(2)}
                                </Text>
                              </View>
                            )}
                            
                            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4 font-InterMedium text-center`}>
                              {distanceData.distanceInMiles} miles • {distanceData.durationInMinutes} min
                            </Text>
                            
                            {formData.price !== suggestedPricePerSeat.toString() && (
                              <TouchableOpacity
                                onPress={() => setFormData(prev => ({ ...prev, price: suggestedPricePerSeat.toString() }))}
                                className={`${isDark ? 'bg-orange-600' : 'bg-orange-500'} rounded-xl py-3 px-6`}
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
                                  <Text className="text-white font-InterBold text-center text-sm">
                                    Use Suggested Price{mode === 'request' ? ' per Seat' : ''}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })()}
                    </View>
                  )}
                  {distanceData.error && (
                    <Text className="text-sm text-red-500 mt-3 px-1 font-InterMedium">
                      {distanceData.error}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            
            {/* Fare Splitting Section - Only for ride posts with valid price */}
            {mode === 'post' && formData.price && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) > 0 && (
              <View className="px-6 mt-6">
                {(() => {
                  const basePrice = parseFloat(formData.price) || 0;
                  const seatsTotal = parseInt(formData.seatsTotal) || 1;
                  
                  // Show potential savings with 2 passengers if fare splitting is enabled
                  const previewPassengers = formData.fareSplittingEnabled && seatsTotal >= 2 ? 2 : 1;
                  const calculation = calculateFareSplit(basePrice, previewPassengers);
                  
                  return (
                    <FareSplitPricingDisplay
                      basePrice={basePrice}
                      currentPrice={calculation.discountedPrice}
                      discountPercentage={calculation.discountPercentage}
                      totalPassengers={previewPassengers}
                      maxPassengers={seatsTotal}
                      fareSplittingEnabled={formData.fareSplittingEnabled}
                      onToggleSplitting={() => 
                        setFormData(prev => ({ ...prev, fareSplittingEnabled: !prev.fareSplittingEnabled }))
                      }
                      isDriver={true}
                      showToggle={true}
                    />
                  );
                })()}
              </View>
            )}

            {/* Recurring Ride Options - Only for drivers posting new rides (not editing) */}
            {requestType === 'post' && !isEditMode && (
              <View className="px-6 mt-6">
                <RecurringRideOptions
                  settings={recurringSettings}
                  onSettingsChange={setRecurringSettings}
                  routeDescription={
                    formData.originLabel && formData.destinationLabel 
                      ? `${formData.originLabel.split(',')[0]} → ${formData.destinationLabel.split(',')[0]}`
                      : undefined
                  }
                />
              </View>
            )}
            
            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              className="rounded-full px-6 py-4 mt-8 flex flex-row justify-center items-center shadow-md"
              style={{
                backgroundColor: isDark ? '#3B82F6' : '#000000',
                opacity: isLoading ? 0.7 : 1,
                minHeight: 56,
                shadowColor: isDark ? '#000' : '#000',
                shadowOpacity: isDark ? 0.5 : 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 }
              }}
              activeOpacity={0.8}
            >
              {isLoading && (
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              )}
              <Text className="font-bold text-center" style={{ 
                color: '#FFFFFF',
                fontSize: 19,
                letterSpacing: 0.5
              }}>
                {isLoading 
                  ? (isEditMode ? 'Updating request...' : requestType === 'request' ? 'Creating request...' : 'Posting ride...') 
                  : (isEditMode ? 'Update request' : requestType === 'request' ? 'Post request' : 'Post ride')
                }
              </Text>
            </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Date Picker Modal */}
      {Platform.OS === 'ios' ? (
        <ReactNativeModal
          isVisible={showDatePicker}
          onBackdropPress={handleDateCancel}
          className="justify-center items-center m-0"
          backdropOpacity={0.6}
          animationIn="fadeInUp"
          animationOut="fadeOutDown"
          animationInTiming={400}
          animationOutTiming={300}
        >
          <View
            className={`${isDark ? '' : 'bg-white'} rounded-2xl overflow-hidden mx-6 w-full max-w-sm`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 15,
              elevation: 10,
              maxHeight: '80%',
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
            }}
          >
            <View
              className={`${isDark ? 'border-gray-700' : 'border-gray-100'} border-b px-6 py-4`}
              style={{ backgroundColor: isDark ? '#0D0D0D' : '#FFFFFF' }}
            >
              <View className="flex-row items-center justify-between">
                <TouchableOpacity onPress={handleDateCancel} className="py-1">
                  <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-base font-InterMedium`}>Cancel</Text>
                </TouchableOpacity>
                <Text className={`text-lg font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'}`}>Select Date</Text>
                <TouchableOpacity onPress={handleDateConfirm} className="py-1">
                  <Text style={{ color: isDark ? '#3B82F6' : '#F97316' }} className="text-base font-InterSemiBold">Done</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Picker Container */}
            <View
              className={`${isDark ? '' : ''} px-6 py-6`}
              style={{ backgroundColor: isDark ? '#161616' : '#F9FAFB' }}
            >
              <DateTimePicker
                value={selectedDate}
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
            value={selectedDate}
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
          onBackdropPress={handleTimeCancel}
          className="justify-center items-center m-0"
          backdropOpacity={0.6}
          animationIn="fadeInUp"
          animationOut="fadeOutDown"
          animationInTiming={400}
          animationOutTiming={300}
        >
          <View
            className={`${isDark ? '' : 'bg-white'} rounded-2xl overflow-hidden mx-6 w-full max-w-sm`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 15,
              elevation: 10,
              maxHeight: '80%',
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
            }}
          >
            <View
              className={`${isDark ? 'border-gray-700' : 'border-gray-100'} border-b px-6 py-4`}
              style={{ backgroundColor: isDark ? '#0D0D0D' : '#FFFFFF' }}
            >
              <View className="flex-row items-center justify-between">
                <TouchableOpacity onPress={handleTimeCancel} className="py-1">
                  <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-base font-InterMedium`}>Cancel</Text>
                </TouchableOpacity>
                <Text className={`text-lg font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'}`}>Select Time</Text>
                <TouchableOpacity onPress={handleTimeConfirm} className="py-1">
                  <Text style={{ color: isDark ? '#3B82F6' : '#F97316' }} className="text-base font-InterSemiBold">Done</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Picker Container */}
            <View
              className={`${isDark ? '' : ''} px-6 py-6`}
              style={{ backgroundColor: isDark ? '#161616' : '#F9FAFB' }}
            >
              <DateTimePicker
                value={selectedTime}
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
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )
      )}
    </SafeAreaView>
  );
}