/**
 * Device Validation System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Device fingerprinting and validation for enhanced security
 * Detects suspicious logins from new devices
 */

export interface DeviceInfo {
  id: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  firstSeen: string;
  lastSeen: string;
  isTrusted: boolean;
}

/**
 * Generate a device fingerprint from browser characteristics
 */
export function generateDeviceFingerprint(): string {
  try {
    const components: string[] = [];

    // User agent
    components.push(navigator.userAgent);

    // Platform
    components.push(navigator.platform);

    // Language
    components.push(navigator.language);

    // Screen resolution
    components.push(`${screen.width}x${screen.height}`);

    // Color depth
    components.push(screen.colorDepth.toString());

    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency) {
      components.push(navigator.hardwareConcurrency.toString());
    }

    // Device memory (if available)
    if ((navigator as any).deviceMemory) {
      components.push((navigator as any).deviceMemory.toString());
    }

    // Touch support
    components.push(('ontouchstart' in window).toString());

    // Create hash from components
    const hash = components.join('|');
    
    // Simple hash function
    let hashValue = 0;
    for (let i = 0; i < hash.length; i++) {
      const char = hash.charCodeAt(i);
      hashValue = ((hashValue << 5) - hashValue) + char;
      hashValue = hashValue & hashValue; // Convert to 32bit integer
    }

    return Math.abs(hashValue).toString(36) + Date.now().toString(36);
  } catch (error) {
    // Fallback to simple timestamp-based ID
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Get current device information
 */
export function getCurrentDeviceInfo(): Omit<DeviceInfo, 'id' | 'firstSeen' | 'lastSeen' | 'isTrusted'> {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Store device information in localStorage
 */
export function storeDeviceInfo(deviceId: string, isTrusted: boolean = false): void {
  try {
    const deviceInfo: DeviceInfo = {
      id: deviceId,
      ...getCurrentDeviceInfo(),
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isTrusted,
    };

    const devices = getStoredDevices();
    const existingIndex = devices.findIndex(d => d.id === deviceId);

    if (existingIndex >= 0) {
      // Update existing device
      devices[existingIndex] = {
        ...devices[existingIndex],
        lastSeen: new Date().toISOString(),
        isTrusted: devices[existingIndex].isTrusted || isTrusted,
      };
    } else {
      // Add new device
      devices.push(deviceInfo);
    }

    localStorage.setItem('auth_devices', JSON.stringify(devices));
  } catch (error) {
    console.error('Error storing device info:', error);
  }
}

/**
 * Get all stored devices
 */
export function getStoredDevices(): DeviceInfo[] {
  try {
    const stored = localStorage.getItem('auth_devices');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting stored devices:', error);
    return [];
  }
}

/**
 * Check if current device is trusted
 */
export function isDeviceTrusted(deviceId: string): boolean {
  const devices = getStoredDevices();
  const device = devices.find(d => d.id === deviceId);
  return device?.isTrusted || false;
}

/**
 * Check if device is new (not seen before)
 */
export function isNewDevice(deviceId: string): boolean {
  const devices = getStoredDevices();
  return !devices.some(d => d.id === deviceId);
}

/**
 * Trust a device
 */
export function trustDevice(deviceId: string): void {
  try {
    const devices = getStoredDevices();
    const deviceIndex = devices.findIndex(d => d.id === deviceId);

    if (deviceIndex >= 0) {
      devices[deviceIndex].isTrusted = true;
      localStorage.setItem('auth_devices', JSON.stringify(devices));
    }
  } catch (error) {
    console.error('Error trusting device:', error);
  }
}

/**
 * Remove a device (for security)
 */
export function removeDevice(deviceId: string): void {
  try {
    const devices = getStoredDevices();
    const filtered = devices.filter(d => d.id !== deviceId);
    localStorage.setItem('auth_devices', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing device:', error);
  }
}

/**
 * Get device information for display
 */
export function getDeviceDisplayInfo(device: DeviceInfo): string {
  const platform = device.platform || 'Unknown';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(device.userAgent);
  const deviceType = isMobile ? 'Móvil' : 'Escritorio';
  
  return `${deviceType} - ${platform}`;
}

/**
 * Compare two device information objects
 */
export function isSimilarDevice(device1: Partial<DeviceInfo>, device2: Partial<DeviceInfo>): boolean {
  if (!device1 || !device2) return false;

  const checks = [
    device1.platform === device2.platform,
    device1.language === device2.language,
    device1.screenResolution === device2.screenResolution,
    device1.timezone === device2.timezone,
  ];

  // Consider similar if at least 3 of 4 characteristics match
  return checks.filter(Boolean).length >= 3;
}

/**
 * Clean up old devices (older than 90 days)
 */
export function cleanupOldDevices(): void {
  try {
    const devices = getStoredDevices();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const filtered = devices.filter(d => {
      const lastSeen = new Date(d.lastSeen);
      return lastSeen > ninetyDaysAgo || d.isTrusted;
    });

    localStorage.setItem('auth_devices', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error cleaning up old devices:', error);
  }
}

/**
 * Initialize device validation on app load
 */
export function initializeDeviceValidation(): string {
  const deviceId = generateDeviceFingerprint();
  const isNew = isNewDevice(deviceId);
  
  if (isNew) {
    storeDeviceInfo(deviceId, false);
  } else {
    // Update last seen
    storeDeviceInfo(deviceId, isDeviceTrusted(deviceId));
  }

  // Cleanup old devices occasionally
  if (Math.random() < 0.1) { // 10% chance on load
    cleanupOldDevices();
  }

  return deviceId;
}