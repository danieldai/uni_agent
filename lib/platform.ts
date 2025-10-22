/**
 * Platform Detection Utilities
 * 
 * Provides functions to detect the current platform (web, iOS, Android)
 * and get device information using Capacitor APIs.
 */

import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android';

export interface DeviceInfo {
  platform: Platform;
  isNative: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

/**
 * Get the current platform
 * @returns 'web', 'ios', or 'android'
 */
export function getPlatform(): Platform {
  if (typeof window === 'undefined') {
    // Server-side rendering - default to web
    return 'web';
  }
  
  return Capacitor.getPlatform() as Platform;
}

/**
 * Check if running on a native platform (iOS or Android)
 * @returns true if running natively, false if on web
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on web browser
 * @returns true if running on web
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
}

/**
 * Check if running on iOS
 * @returns true if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Check if running on Android
 * @returns true if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Get comprehensive device information
 * @returns DeviceInfo object with platform details
 */
export function getDeviceInfo(): DeviceInfo {
  const platform = getPlatform();
  
  return {
    platform,
    isNative: isNativePlatform(),
    isWeb: platform === 'web',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  };
}

/**
 * Get platform-specific configuration
 * @param config Configuration object with platform-specific values
 * @returns The appropriate configuration for the current platform
 */
export function getPlatformConfig<T>(config: {
  web?: T;
  ios?: T;
  android?: T;
  default?: T;
}): T | undefined {
  const platform = getPlatform();
  
  return config[platform] ?? config.default;
}

/**
 * Check if a feature should be available based on platform
 * @param feature Feature name to check
 * @returns true if feature should be available on current platform
 */
export function isFeatureSupported(feature: string): boolean {
  const platform = getPlatform();
  
  // Define platform-specific feature support
  const featureSupport: Record<string, Platform[]> = {
    'camera': ['web', 'ios', 'android'],
    'geolocation': ['web', 'ios', 'android'],
    'filesystem': ['ios', 'android'],
    'notifications': ['web', 'ios', 'android'],
    'haptics': ['ios', 'android'],
    'statusbar': ['ios', 'android'],
    'splashscreen': ['ios', 'android'],
    'keyboard': ['ios', 'android'],
    'app': ['ios', 'android'],
    'browser': ['web'],
    'clipboard': ['web', 'ios', 'android'],
    'device': ['ios', 'android'],
    'network': ['web', 'ios', 'android'],
    'share': ['web', 'ios', 'android'],
    'storage': ['web', 'ios', 'android'],
  };
  
  const supportedPlatforms = featureSupport[feature.toLowerCase()];
  return supportedPlatforms ? supportedPlatforms.includes(platform) : false;
}
