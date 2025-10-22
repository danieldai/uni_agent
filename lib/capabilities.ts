/**
 * Capability Checking Utilities
 * 
 * Provides functions to check if specific Capacitor plugins and capabilities
 * are available on the current platform.
 */

import { Capacitor } from '@capacitor/core';
import { getPlatform, isNativePlatform } from './platform';

export type Capability = 
  | 'camera'
  | 'geolocation'
  | 'filesystem'
  | 'notifications'
  | 'haptics'
  | 'statusbar'
  | 'splashscreen'
  | 'keyboard'
  | 'app'
  | 'browser'
  | 'clipboard'
  | 'device'
  | 'network'
  | 'share'
  | 'storage';

export interface CapabilityInfo {
  name: Capability;
  pluginAvailable: boolean;
  hardwareAvailable?: boolean;
  supported: boolean;
}

/**
 * Check if a specific Capacitor plugin is available
 * @param pluginName Name of the Capacitor plugin
 * @returns true if plugin is available
 */
export function isPluginAvailable(pluginName: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return Capacitor.isPluginAvailable(pluginName);
}

/**
 * Check if a specific capability is available
 * @param capability The capability to check
 * @returns true if capability is available
 */
export function isCapabilityAvailable(capability: Capability): boolean {
  const pluginMap: Record<Capability, string> = {
    camera: 'Camera',
    geolocation: 'Geolocation',
    filesystem: 'Filesystem',
    notifications: 'LocalNotifications',
    haptics: 'Haptics',
    statusbar: 'StatusBar',
    splashscreen: 'SplashScreen',
    keyboard: 'Keyboard',
    app: 'App',
    browser: 'Browser',
    clipboard: 'Clipboard',
    device: 'Device',
    network: 'Network',
    share: 'Share',
    storage: 'Storage',
  };
  
  const pluginName = pluginMap[capability];
  return pluginName ? isPluginAvailable(pluginName) : false;
}

/**
 * Check if camera is available (both plugin and hardware)
 * @returns Promise<boolean> true if camera is available
 */
export async function isCameraAvailable(): Promise<boolean> {
  // Check if Camera plugin is available
  if (!isCapabilityAvailable('camera')) {
    return false;
  }
  
  // For web, check if physical camera exists
  if (getPlatform() === 'web') {
    return await checkPhysicalCamera();
  }
  
  // For native platforms, assume camera is available if plugin is present
  return true;
}

/**
 * Check if geolocation is available
 * @returns true if geolocation is available
 */
export function isGeolocationAvailable(): boolean {
  return isCapabilityAvailable('geolocation');
}

/**
 * Check if filesystem access is available
 * @returns true if filesystem is available
 */
export function isFilesystemAvailable(): boolean {
  return isCapabilityAvailable('filesystem');
}

/**
 * Check if notifications are available
 * @returns true if notifications are available
 */
export function isNotificationsAvailable(): boolean {
  return isCapabilityAvailable('notifications');
}

/**
 * Check if haptics are available
 * @returns true if haptics are available
 */
export function isHapticsAvailable(): boolean {
  return isCapabilityAvailable('haptics');
}

/**
 * Check if device info is available
 * @returns true if device info is available
 */
export function isDeviceInfoAvailable(): boolean {
  return isCapabilityAvailable('device');
}

/**
 * Check if network status is available
 * @returns true if network status is available
 */
export function isNetworkStatusAvailable(): boolean {
  return isCapabilityAvailable('network');
}

/**
 * Check if sharing is available
 * @returns true if sharing is available
 */
export function isShareAvailable(): boolean {
  return isCapabilityAvailable('share');
}

/**
 * Check if storage is available
 * @returns true if storage is available
 */
export function isStorageAvailable(): boolean {
  return isCapabilityAvailable('storage');
}

/**
 * Check if physical camera hardware exists (web only)
 * @returns Promise<boolean> true if camera hardware is detected
 */
export async function checkPhysicalCamera(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.mediaDevices) {
    return false;
  }
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.warn('Error checking for camera:', error);
    return false;
  }
}

/**
 * Get detailed information about a specific capability
 * @param capability The capability to check
 * @returns Promise<CapabilityInfo> Detailed capability information
 */
export async function getCapabilityInfo(capability: Capability): Promise<CapabilityInfo> {
  const pluginAvailable = isCapabilityAvailable(capability);
  let hardwareAvailable: boolean | undefined;
  
  // Check hardware availability for specific capabilities
  if (capability === 'camera') {
    hardwareAvailable = await checkPhysicalCamera();
  }
  
  return {
    name: capability,
    pluginAvailable,
    hardwareAvailable,
    supported: pluginAvailable && (hardwareAvailable !== false),
  };
}

/**
 * Get all available capabilities
 * @returns Promise<CapabilityInfo[]> List of all capabilities with their status
 */
export async function getAvailableCapabilities(): Promise<CapabilityInfo[]> {
  const capabilities: Capability[] = [
    'camera',
    'geolocation',
    'filesystem',
    'notifications',
    'haptics',
    'statusbar',
    'splashscreen',
    'keyboard',
    'app',
    'browser',
    'clipboard',
    'device',
    'network',
    'share',
    'storage',
  ];
  
  const capabilityInfos = await Promise.all(
    capabilities.map(capability => getCapabilityInfo(capability))
  );
  
  return capabilityInfos;
}

/**
 * Get only the capabilities that are available
 * @returns Promise<Capability[]> List of available capabilities
 */
export async function getAvailableCapabilityNames(): Promise<Capability[]> {
  const capabilities = await getAvailableCapabilities();
  return capabilities
    .filter(cap => cap.supported)
    .map(cap => cap.name);
}

/**
 * Check if running in a native app container
 * @returns true if running in native app (iOS/Android)
 */
export function isNativeApp(): boolean {
  return isNativePlatform();
}

/**
 * Get platform-specific capability recommendations
 * @returns Object with recommended capabilities for current platform
 */
export function getPlatformCapabilities(): {
  recommended: Capability[];
  available: Capability[];
  notAvailable: Capability[];
} {
  const platform = getPlatform();
  
  const allCapabilities: Capability[] = [
    'camera', 'geolocation', 'filesystem', 'notifications',
    'haptics', 'statusbar', 'splashscreen', 'keyboard',
    'app', 'browser', 'clipboard', 'device', 'network',
    'share', 'storage'
  ];
  
  const recommended: Capability[] = [];
  const available: Capability[] = [];
  const notAvailable: Capability[] = [];
  
  allCapabilities.forEach(capability => {
    const isAvailable = isCapabilityAvailable(capability);
    
    if (isAvailable) {
      available.push(capability);
      
      // Mark as recommended based on platform
      if (platform === 'web') {
        if (['camera', 'geolocation', 'notifications', 'clipboard', 'share'].includes(capability)) {
          recommended.push(capability);
        }
      } else {
        if (['camera', 'geolocation', 'filesystem', 'notifications', 'haptics'].includes(capability)) {
          recommended.push(capability);
        }
      }
    } else {
      notAvailable.push(capability);
    }
  });
  
  return { recommended, available, notAvailable };
}
