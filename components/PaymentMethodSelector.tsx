import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'cash',
    label: 'Cash',
    icon: 'dollar-sign',
  },
  {
    id: 'venmo',
    label: 'Venmo',
    icon: 'smartphone',
  },
  {
    id: 'zelle',
    label: 'Zelle',
    icon: 'zap',
  },
  {
    id: 'cashapp',
    label: 'Cash App',
    icon: 'credit-card',
  },
];

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const handleSelect = (method: PaymentMethod) => {
    onMethodChange(method);
    setModalVisible(false);
  };

  return (
    <>
      {/* Selector Button */}
      <TouchableOpacity
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
        className="flex-row items-center justify-between px-6 py-5 rounded-2xl"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <View className="flex-row items-center flex-1">
          {/* Icon */}
          <Feather
            name={selectedOption?.icon as any}
            size={24}
            color="#9e9e9e"
            style={{ marginRight: 14 }}
          />

          {/* Label */}
          <Text
            className="text-lg font-semibold"
            style={{ color: isDark ? '#FFFFFF' : '#111827' }}
          >
            {selectedOption?.label}
          </Text>
        </View>

        {/* Dropdown Arrow */}
        <Feather
          name="chevron-down"
          size={22}
          color={isDark ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>

      {/* Modal for selecting payment method */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <TouchableOpacity
            activeOpacity={1}
            className="rounded-t-3xl px-6 pt-5"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              paddingBottom: 44,
            }}
          >
            {/* Handle Bar */}
            <View
              className="w-14 h-1.5 rounded-full mx-auto mb-6"
              style={{ backgroundColor: isDark ? '#6B7280' : '#D1D5DB' }}
            />

            {/* Header */}
            <Text
              className="text-2xl font-bold text-center mb-8"
              style={{ color: isDark ? '#FFFFFF' : '#111827' }}
            >
              Payment Method
            </Text>

            {/* Payment Method Options */}
            <View style={{ gap: 14 }}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => handleSelect(method.id)}
                  activeOpacity={0.7}
                  className="flex-row items-center px-5 py-5 rounded-2xl"
                  style={{
                    backgroundColor:
                      selectedMethod === method.id
                        ? isDark
                          ? 'rgba(158, 158, 158, 0.15)'
                          : 'rgba(158, 158, 158, 0.08)'
                        : isDark
                        ? '#1F2937'
                        : '#F9FAFB',
                  }}
                >
                  {/* Icon */}
                  <Feather
                    name={method.icon as any}
                    size={26}
                    color={selectedMethod === method.id ? '#9e9e9e' : isDark ? '#9CA3AF' : '#6B7280'}
                    style={{ marginRight: 18 }}
                  />

                  {/* Text */}
                  <View className="flex-1">
                    <Text
                      className="text-lg font-semibold"
                      style={{
                        color:
                          selectedMethod === method.id
                            ? '#9e9e9e'
                            : isDark
                            ? '#FFFFFF'
                            : '#111827',
                      }}
                    >
                      {method.label}
                    </Text>
                  </View>

                  {/* Checkmark for selected */}
                  {selectedMethod === method.id && (
                    <Feather name="check-circle" size={26} color="#9e9e9e" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Info Text */}
            <View
              className="mt-7 p-4 rounded-xl flex-row items-start"
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
                You and the driver will coordinate payment details directly. The app does not process payments.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default PaymentMethodSelector;
