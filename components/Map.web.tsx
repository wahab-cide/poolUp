import { MapProps } from "@/types/type";
import React from "react";

/**
 * Web-specific Map component
 *
 * react-native-maps is not compatible with web, so this is a stub component
 * that returns null. The Map component is hidden on web builds.
 *
 * For web builds, Metro bundler automatically uses this file instead of Map.tsx
 */
const Map = (_props: MapProps = {}) => {
  // Return null - map is not shown on web
  return null;
};

export default Map;
