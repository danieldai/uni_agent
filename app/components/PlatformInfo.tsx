'use client';

import { useState, useEffect } from 'react';
import { getPlatform, getDeviceInfo, isNativePlatform } from '@/lib/platform';
import { 
  getAvailableCapabilities, 
  getPlatformCapabilities,
  isCameraAvailable,
  isGeolocationAvailable,
  CapabilityInfo 
} from '@/lib/capabilities';

export function PlatformInfo() {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [capabilities, setCapabilities] = useState<CapabilityInfo[]>([]);
  const [platformCapabilities, setPlatformCapabilities] = useState(getPlatformCapabilities());
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [geolocationAvailable, setGeolocationAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Load capabilities asynchronously
    const loadCapabilities = async () => {
      const caps = await getAvailableCapabilities();
      setCapabilities(caps);
      
      // Check specific capabilities
      const camera = await isCameraAvailable();
      const geolocation = isGeolocationAvailable();
      
      setCameraAvailable(camera);
      setGeolocationAvailable(geolocation);
    };

    loadCapabilities();
  }, []);

  const getCapabilityIcon = (capability: string): string => {
    const icons: Record<string, string> = {
      camera: '📷',
      geolocation: '📍',
      filesystem: '📁',
      notifications: '🔔',
      haptics: '📳',
      statusbar: '📊',
      splashscreen: '🖼️',
      keyboard: '⌨️',
      app: '📱',
      browser: '🌐',
      clipboard: '📋',
      device: '📱',
      network: '🌐',
      share: '📤',
      storage: '💾',
    };
    return icons[capability] || '❓';
  };

  const getStatusColor = (supported: boolean, hardwareAvailable?: boolean): string => {
    if (supported && hardwareAvailable !== false) {
      return 'text-green-600 dark:text-green-400';
    } else if (supported && hardwareAvailable === false) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusText = (capability: CapabilityInfo): string => {
    if (capability.supported && capability.hardwareAvailable !== false) {
      return '✅ Available';
    } else if (capability.supported && capability.hardwareAvailable === false) {
      return '⚠️ Plugin available, no hardware';
    } else {
      return '❌ Not available';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Platform & Capabilities Info
      </h2>

      {/* Platform Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Platform Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Platform</div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
              {deviceInfo.platform.toUpperCase()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Native</div>
            <div className={`text-lg font-semibold ${deviceInfo.isNative ? 'text-green-600' : 'text-gray-600'}`}>
              {deviceInfo.isNative ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Web</div>
            <div className={`text-lg font-semibold ${deviceInfo.isWeb ? 'text-blue-600' : 'text-gray-600'}`}>
              {deviceInfo.isWeb ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Mobile</div>
            <div className={`text-lg font-semibold ${deviceInfo.isIOS || deviceInfo.isAndroid ? 'text-purple-600' : 'text-gray-600'}`}>
              {deviceInfo.isIOS || deviceInfo.isAndroid ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Capability Checks */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Key Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📷</span>
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">Camera</div>
                <div className={`text-sm ${cameraAvailable === null ? 'text-gray-500' : getStatusColor(cameraAvailable || false)}`}>
                  {cameraAvailable === null ? 'Checking...' : cameraAvailable ? '✅ Available' : '❌ Not available'}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📍</span>
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">Geolocation</div>
                <div className={`text-sm ${geolocationAvailable === null ? 'text-gray-500' : getStatusColor(geolocationAvailable || false)}`}>
                  {geolocationAvailable === null ? 'Checking...' : geolocationAvailable ? '✅ Available' : '❌ Not available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Capabilities */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          All Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {capabilities.map((capability) => (
            <div key={capability.name} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getCapabilityIcon(capability.name)}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white capitalize">
                    {capability.name}
                  </div>
                  <div className={`text-xs ${getStatusColor(capability.supported, capability.hardwareAvailable)}`}>
                    {getStatusText(capability)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Platform Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Recommended ({platformCapabilities.recommended.length})
            </h4>
            <div className="space-y-1">
              {platformCapabilities.recommended.map((cap) => (
                <div key={cap} className="text-sm text-green-700 dark:text-green-300 flex items-center space-x-1">
                  <span>{getCapabilityIcon(cap)}</span>
                  <span className="capitalize">{cap}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Available ({platformCapabilities.available.length})
            </h4>
            <div className="space-y-1">
              {platformCapabilities.available.map((cap) => (
                <div key={cap} className="text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-1">
                  <span>{getCapabilityIcon(cap)}</span>
                  <span className="capitalize">{cap}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Not Available ({platformCapabilities.notAvailable.length})
            </h4>
            <div className="space-y-1">
              {platformCapabilities.notAvailable.map((cap) => (
                <div key={cap} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                  <span>{getCapabilityIcon(cap)}</span>
                  <span className="capitalize">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
