import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ReactNativeModal } from 'react-native-modal';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import GoogleTextInput from '@/components/GoogleTextInput';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { fetchAPI } from '@/lib/fetch';

const CreateEventScreen = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { user } = useUser();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [creating, setCreating] = useState(false);

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  // Location states
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);

  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setLocationAddress(location.address);
    setLocationLat(location.latitude);
    setLocationLng(location.longitude);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setEventDate(dateString);
    }
  };

  const handleDateConfirm = () => {
    setShowDatePicker(false);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setEventDate(dateString);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
    if (eventDate) {
      const [year, month, day] = eventDate.split('-').map(Number);
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
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setEventTime(timeString);
    }
  };

  const handleTimeConfirm = () => {
    setShowTimePicker(false);
    const hours = String(selectedTime.getHours()).padStart(2, '0');
    const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    setEventTime(timeString);
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
    if (eventTime) {
      const [hours, minutes] = eventTime.split(':').map(Number);
      const time = new Date();
      time.setHours(hours, minutes);
      setSelectedTime(time);
    } else {
      setSelectedTime(new Date());
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      showErrorToast('Please enter an event name', 'Validation Error');
      return;
    }

    if (!eventDate) {
      showErrorToast('Please select an event date', 'Validation Error');
      return;
    }

    if (!locationAddress || !locationLat || !locationLng) {
      showErrorToast('Please select an event location', 'Validation Error');
      return;
    }

    if (!user?.id) {
      showErrorToast('User not authenticated', 'Error');
      return;
    }

    setCreating(true);

    try {
      const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;

      const response = await fetchAPI('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          event_date: eventDate.trim(),
          event_time: eventTime.trim() || undefined,
          location_address: locationAddress,
          location_lat: locationLat,
          location_lng: locationLng,
          college_id: collegeId as string,
          user_id: user.id
        })
      });

      if (response.success) {
        showSuccessToast('Event created successfully!', 'Success');
        router.back();
      } else {
        showErrorToast(response.error || 'Failed to create event', 'Error');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showErrorToast('Failed to create event', 'Error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="close"
            size={28}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000'
        }}>
          Create Event
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {/* Event Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                Event Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Concert at TD Garden"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                style={{
                  backgroundColor: isDark ? '#161616' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: isDark ? '#FFFFFF' : '#000000'
                }}
                maxLength={200}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell people about this event..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: isDark ? '#161616' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: isDark ? '#FFFFFF' : '#000000',
                  minHeight: 100
                }}
                maxLength={1000}
              />
            </View>

            {/* Date & Time Section */}
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#000000',
              marginBottom: 16,
              marginTop: 8
            }}>
              Date & Time *
            </Text>

            {/* Event Date */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: isDark ? '#161616' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: eventDate ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#6B7280' : '#9CA3AF')
                }}>
                  {eventDate || 'Select date'}
                </Text>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>

            {/* Event Time */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                Time (Optional)
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={{
                  backgroundColor: isDark ? '#161616' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: eventTime ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#6B7280' : '#9CA3AF')
                }}>
                  {eventTime || 'Select time'}
                </Text>
                <Ionicons
                  name="time"
                  size={20}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#000000',
              marginBottom: 16
            }}>
              Location *
            </Text>

            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                Event Venue
              </Text>
              <View style={{
                backgroundColor: isDark ? '#161616' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                borderRadius: 12,
                padding: 12
              }}>
                <GoogleTextInput
                  icon=""
                  initialLocation={locationAddress}
                  containerStyle=""
                  textInputBackgroundColor="transparent"
                  placeholder="Search for venue"
                  handlePress={handleLocationSelect}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 32
        }}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating}
            style={{
              backgroundColor: isDark ? '#909090' : '#000000',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              opacity: creating ? 0.6 : 1
            }}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Create Event
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
        >
          <View
            className={`${isDark ? '' : 'bg-white'} rounded-2xl overflow-hidden mx-6 w-full max-w-sm`}
            style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF' }}
          >
            <View className="px-6 pt-6 pb-4">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={handleDateCancel}>
                  <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} className="text-base font-semibold">Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }} className="text-lg font-bold">Select Date</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Text style={{ color: isDark ? '#3B82F6' : '#F97316' }} className="text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="px-6 py-6" style={{ backgroundColor: isDark ? '#161616' : '#F9FAFB' }}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={{ backgroundColor: 'transparent', height: 180, width: '100%' }}
                textColor={isDark ? '#FFFFFF' : '#1F2937'}
                themeVariant={isDark ? 'dark' : 'light'}
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
        >
          <View
            className={`${isDark ? '' : 'bg-white'} rounded-2xl overflow-hidden mx-6 w-full max-w-sm`}
            style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF' }}
          >
            <View className="px-6 pt-6 pb-4">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={handleTimeCancel}>
                  <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} className="text-base font-semibold">Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }} className="text-lg font-bold">Select Time</Text>
                <TouchableOpacity onPress={handleTimeConfirm}>
                  <Text style={{ color: isDark ? '#3B82F6' : '#F97316' }} className="text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="px-6 py-6" style={{ backgroundColor: isDark ? '#161616' : '#F9FAFB' }}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={{ backgroundColor: 'transparent', height: 180, width: '100%' }}
                textColor={isDark ? '#FFFFFF' : '#1F2937'}
                themeVariant={isDark ? 'dark' : 'light'}
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
};

export default CreateEventScreen;
