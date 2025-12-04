import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";

import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";
import { fetchAPI } from "@/lib/fetch";
import { getUserInitials } from "@/lib/utils";
import DirectRideRequestModal from "@/components/DirectRideRequestModal";

type DriverProfile = {
  id: string;
  clerkId: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  bio: string | null;
  memberSince: string;
  college: {
    name: string | null;
    verified: boolean;
  };
  stats: {
    totalRides: number;
    completionRate: number;
    totalReviews: number;
    averageRating: number;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateLast3: string | null;
    seats: number;
  } | null;
  commonRoutes: {
    origin: string;
    destination: string;
    tripCount: number;
  }[];
  recentReviews: {
    id: string;
    rating: number;
    review: string;
    createdAt: string;
    reviewer: {
      name: string;
      avatarUrl: string | null;
    };
  }[];
  socialProof: {
    mutualFriends: {
      id: string;
      name: string;
      avatarUrl: string | null;
    }[];
    commonRoutes: {
      origin: string;
      destination: string;
    }[];
  };
};

const DriverProfile = () => {
  const params = useLocalSearchParams();
  const { driverId } = params;
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Build driver object from URL params (no API fetch)
  const driver: DriverProfile = {
    id: driverId as string,
    clerkId: driverId as string,
    name: (params.driverName as string) || "Driver",
    avatarUrl: (params.driverAvatar as string) || null,
    rating: parseFloat(params.driverRating as string) || 5.0,
    bio: (params.driverBio as string) || null,
    memberSince: (params.memberSince as string) || new Date().toISOString(),
    college: {
      name: (params.collegeName as string) || null,
      verified: params.collegeVerified === 'true',
    },
    stats: {
      totalRides: parseInt(params.totalRides as string) || 0,
      completionRate: parseInt(params.completionRate as string) || 100,
      totalReviews: 0,
      averageRating: parseFloat(params.driverRating as string) || 5.0,
    },
    vehicle: params.vehicleMake ? {
      make: params.vehicleMake as string,
      model: params.vehicleModel as string,
      year: parseInt(params.vehicleYear as string) || new Date().getFullYear(),
      color: params.vehicleColor as string,
      plateLast3: params.vehiclePlate as string || null,
      seats: 4,
    } : null,
    commonRoutes: [],
    recentReviews: [],
    socialProof: {
      mutualFriends: [],
      commonRoutes: [],
    },
  };

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      {/* Header with back button */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather
            name="arrow-left"
            size={24}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <Text
          className="text-xl font-semibold"
          style={{ color: isDark ? "#FFFFFF" : "#111827" }}
        >
          Driver Profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Profile Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="rounded-2xl p-6" style={{
            backgroundColor: isDark ? '#161616' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 6
          }}>
            {/* Avatar and Basic Info - Horizontal Layout */}
            <View className="flex-row items-start mb-5">
              <View className="w-24 h-24 rounded-full overflow-hidden mr-4"
                style={{ backgroundColor: isDark ? "#333" : "#3B82F6" }}>
                {driver.avatarUrl ? (
                  <Image
                    source={{ uri: driver.avatarUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Text
                      className="text-3xl font-bold"
                      style={{ color: "#FFFFFF" }}
                    >
                      {getUserInitials(driver.name, "", "")}
                    </Text>
                  </View>
                )}
              </View>

              {/* Info Column */}
              <View className="flex-1">
                <Text
                  className="text-2xl font-bold mb-1"
                  style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                >
                  {driver.name}
                </Text>

                {/* College - No Background */}
                {driver.college?.name && (
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons
                      name={driver.college.verified ? "verified" : "school"}
                      size={14}
                      color={driver.college.verified ? "#f44336" : (isDark ? "#909090" : "#6B7280")}
                    />
                    <Text
                      className="ml-1 text-sm"
                      style={{ color: isDark ? "#909090" : "#6B7280" }}
                    >
                      {driver.college.name}
                    </Text>
                  </View>
                )}

                {/* Rating & Member Since Row */}
                <View className="flex-row items-center flex-wrap">
                  <View className="flex-row items-center mr-4">
                    <Feather name="star" size={16} color={isDark ? "#909090" : "#6B7280"} />
                    <Text
                      className="ml-1 text-base font-semibold"
                      style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                    >
                      {driver.stats.averageRating.toFixed(1)}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Feather name="calendar" size={12} color={isDark ? "#909090" : "#6B7280"} />
                    <Text className="ml-1 text-xs" style={{ color: isDark ? "#909090" : "#6B7280" }}>
                      {formatMemberSince(driver.memberSince)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bio */}
            {driver.bio && (
              <View className="pt-4">
                <Text
                  className="font-semibold mb-2"
                  style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                >
                  Bio
                </Text>
                <Text style={{ color: isDark ? "#909090" : "#4B5563", lineHeight: 20 }}>
                  {driver.bio}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-5 mb-6">
          <Text
            className="text-lg font-bold mb-3 px-1"
            style={{ color: isDark ? "#FFFFFF" : "#111827" }}
          >
            Statistics
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View
              className="w-[48%] rounded-xl p-4 mb-3"
              style={{
                backgroundColor: isDark ? "#161616" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#E5E7EB",
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <Text
                className="text-2xl font-bold mb-1"
                style={{ color: isDark ? "#FFFFFF" : "#111827" }}
              >
                {driver.stats.totalRides}
              </Text>
              <Text style={{ color: isDark ? "#909090" : "#6B7280", fontSize: 12 }}>
                Total Rides
              </Text>
            </View>

            <View
              className="w-[48%] rounded-xl p-4 mb-3"
              style={{
                backgroundColor: isDark ? "#161616" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#E5E7EB",
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <Text
                className="text-2xl font-bold mb-1"
                style={{ color: isDark ? "#FFFFFF" : "#111827" }}
              >
                {driver.stats.completionRate}%
              </Text>
              <Text style={{ color: isDark ? "#909090" : "#6B7280", fontSize: 12 }}>
                Completion Rate
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        {driver.vehicle && (
          <View className="px-5 mb-6">
            <Text
              className="text-lg font-bold mb-3 px-1"
              style={{ color: isDark ? "#FFFFFF" : "#111827" }}
            >
              Vehicle
            </Text>
            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: isDark ? "#161616" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#E5E7EB",
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <Text
                className="text-lg font-semibold mb-3"
                style={{ color: isDark ? "#FFFFFF" : "#111827" }}
              >
                {driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}
              </Text>

              <Text style={{ color: isDark ? "#909090" : "#6B7280", fontSize: 14, marginBottom: 8 }}>
                {driver.vehicle.color}
              </Text>

              {driver.vehicle.plateLast3 && (
                <Text style={{ color: isDark ? "#909090" : "#6B7280", fontSize: 14, marginBottom: 8 }}>
                  Plate: {driver.vehicle.plateLast3}
                </Text>
              )}

              <Text style={{ color: isDark ? "#909090" : "#6B7280", fontSize: 14 }}>
                {driver.vehicle.seats} seats
              </Text>
            </View>
          </View>
        )}

        {/* Social Proof - Mutual Friends */}
        {driver.socialProof?.mutualFriends && driver.socialProof.mutualFriends.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: isDark ? "#FFFFFF" : "#111827" }}
            >
              Mutual Connections
            </Text>
            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: isDark
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(59, 130, 246, 0.05)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.1)",
              }}
            >
              <View className="flex-row items-center">
                <Feather
                  name="users"
                  size={18}
                  color={isDark ? "#60A5FA" : "#3B82F6"}
                />
                <Text
                  className="ml-2"
                  style={{ color: isDark ? "#60A5FA" : "#3B82F6" }}
                >
                  {driver.socialProof.mutualFriends.length} mutual{" "}
                  {driver.socialProof.mutualFriends.length === 1
                    ? "friend"
                    : "friends"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Social Proof - Common Routes */}
        {driver.socialProof?.commonRoutes && driver.socialProof.commonRoutes.length > 0 && (
          <View className="px-6 mb-6">
            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: isDark
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(16, 185, 129, 0.05)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(16, 185, 129, 0.1)",
              }}
            >
              <View className="flex-row items-center mb-2">
                <Feather
                  name="map-pin"
                  size={18}
                  color={isDark ? "#34D399" : "#10B981"}
                />
                <Text
                  className="ml-2 font-semibold"
                  style={{ color: isDark ? "#34D399" : "#10B981" }}
                >
                  You&apos;ve both traveled:
                </Text>
              </View>
              {driver.socialProof.commonRoutes.map((route, index) => (
                <Text
                  key={index}
                  className="ml-6"
                  style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}
                >
                  {route.origin} → {route.destination}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Common Routes */}
        {driver.commonRoutes && driver.commonRoutes.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: isDark ? "#FFFFFF" : "#111827" }}
            >
              Common Routes
            </Text>
            {driver.commonRoutes.map((route, index) => (
              <View
                key={index}
                className="rounded-xl p-3 mb-2 flex-row items-center justify-between"
                style={{
                  backgroundColor: isDark ? "#161616" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#E5E7EB",
                }}
              >
                <View className="flex-1">
                  <Text
                    className="font-semibold"
                    style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                  >
                    {route.origin}
                  </Text>
                  <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
                    → {route.destination}
                  </Text>
                </View>
                <Text
                  className="text-sm"
                  style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                >
                  {route.tripCount} trips
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Reviews */}
        {driver.recentReviews && driver.recentReviews.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: isDark ? "#FFFFFF" : "#111827" }}
            >
              Recent Reviews
            </Text>
            {driver.recentReviews.map((review) => (
              <View
                key={review.id}
                className="rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: isDark ? "#161616" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#E5E7EB",
                }}
              >
                <View className="flex-row items-center mb-2">
                  <View className="w-10 h-10 rounded-full overflow-hidden mr-3"
                    style={{ backgroundColor: isDark ? "#374151" : "#F3F4F6" }}>
                    {review.reviewer.avatarUrl ? (
                      <Image
                        source={{ uri: review.reviewer.avatarUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
                          {getUserInitials(review.reviewer.name, "", "")}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-semibold"
                      style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                    >
                      {review.reviewer.name}
                    </Text>
                    <View className="flex-row items-center">
                      {[...Array(5)].map((_, i) => (
                        <Feather
                          key={i}
                          name="star"
                          size={12}
                          color={
                            i < review.rating
                              ? isDark
                                ? "#FCD34D"
                                : "#F59E0B"
                              : isDark
                              ? "#4B5563"
                              : "#D1D5DB"
                          }
                          style={{ marginRight: 2, fill: i < review.rating ? (isDark ? "#FCD34D" : "#F59E0B") : "transparent" }}
                        />
                      ))}
                      <Text
                        className="ml-2 text-xs"
                        style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                      >
                        {formatReviewDate(review.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
                {review.review && (
                  <Text style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}>
                    {review.review}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-6 mt-4">
          <TouchableOpacity
            className="rounded-full py-4"
            style={{ backgroundColor: isDark ? "#3B82F6" : "#000000" }}
            onPress={() => setShowRequestModal(true)}
          >
            <Text className="text-white text-center font-bold text-lg">
              Request Ride
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Direct Ride Request Modal */}
      <DirectRideRequestModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        driverClerkId={driver.clerkId}
        driverName={driver.name}
      />
    </SafeAreaView>
  );
};

export default DriverProfile;
