/**
 * System Check Utility
 *
 * Performs compatibility checks for exam taking
 * Requirements: task.md Step 6.1 - Tech Compatibility Check
 */

// ============================================================================
// Types
// ============================================================================

export interface SystemCheckResult {
  passed: boolean;
  message: string;
  details?: string;
}

export interface SystemCheckResults {
  browser: SystemCheckResult;
  screenResolution: SystemCheckResult;
  popupBlocker: SystemCheckResult;
  cookies: SystemCheckResult;
  localStorage: SystemCheckResult;
  javascript: SystemCheckResult;
  networkSpeed: SystemCheckResult;
  camera: SystemCheckResult;
  microphone: SystemCheckResult;
  overallPassed: boolean;
  timestamp: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
}

// ============================================================================
// Browser Detection
// ============================================================================

export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let isSupported = false;

  // Chrome
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 90;
  }
  // Firefox
  else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 90;
  }
  // Safari
  else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 14;
  }
  // Edge
  else if (ua.includes('Edg')) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 90;
  }
  // Opera
  else if (ua.includes('OPR')) {
    browserName = 'Opera';
    const match = ua.match(/OPR\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 76;
  }

  return { name: browserName, version: browserVersion, isSupported };
}

// ============================================================================
// Individual Checks
// ============================================================================

export function checkBrowser(): SystemCheckResult {
  const browser = detectBrowser();

  if (browser.isSupported) {
    return {
      passed: true,
      message: `${browser.name} ${browser.version} is supported`,
      details: `Browser: ${browser.name} v${browser.version}`,
    };
  }

  return {
    passed: false,
    message: `${browser.name} ${browser.version} may not be fully supported`,
    details: `Please use Chrome 90+, Firefox 90+, Safari 14+, or Edge 90+`,
  };
}

export function checkScreenResolution(): SystemCheckResult {
  const width = window.screen.width;
  const height = window.screen.height;
  const minWidth = 1024;
  const minHeight = 768;

  if (width >= minWidth && height >= minHeight) {
    return {
      passed: true,
      message: `Screen resolution ${width}x${height} meets requirements`,
      details: `Minimum required: ${minWidth}x${minHeight}`,
    };
  }

  return {
    passed: false,
    message: `Screen resolution ${width}x${height} is below recommended`,
    details: `Minimum required: ${minWidth}x${minHeight}`,
  };
}

export function checkPopupBlocker(): SystemCheckResult {
  // Try to detect popup blocker by attempting to open a small window
  // This is not 100% reliable but gives a reasonable indication
  try {
    const popup = window.open('', '_blank', 'width=1,height=1');
    if (popup) {
      popup.close();
      return {
        passed: true,
        message: 'Popups are allowed',
        details: 'Exam can open required windows',
      };
    }
  } catch {
    // Popup blocked
  }

  return {
    passed: false,
    message: 'Popup blocker may be enabled',
    details: 'Please allow popups for this site',
  };
}

export function checkCookies(): SystemCheckResult {
  try {
    document.cookie = 'testcookie=1';
    const hasCookies = document.cookie.includes('testcookie');
    document.cookie = 'testcookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    if (hasCookies) {
      return {
        passed: true,
        message: 'Cookies are enabled',
        details: 'Session data can be stored',
      };
    }
  } catch {
    // Cookies blocked
  }

  return {
    passed: false,
    message: 'Cookies are disabled',
    details: 'Please enable cookies for this site',
  };
}

export function checkLocalStorage(): SystemCheckResult {
  try {
    const testKey = '__tech_check_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);

    return {
      passed: true,
      message: 'Local storage is available',
      details: 'Progress can be saved locally',
    };
  } catch {
    return {
      passed: false,
      message: 'Local storage is disabled',
      details: 'Please enable local storage for this site',
    };
  }
}

export function checkJavaScript(): SystemCheckResult {
  // If this code runs, JavaScript is enabled
  return {
    passed: true,
    message: 'JavaScript is enabled',
    details: 'Interactive features will work correctly',
  };
}

export async function checkNetworkSpeed(): Promise<SystemCheckResult> {
  try {
    const startTime = performance.now();

    // Fetch a small resource to measure latency
    const response = await fetch('/favicon.ico', {
      cache: 'no-store',
      method: 'HEAD',
    });

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (latency < 500) {
      return {
        passed: true,
        message: `Network latency: ${latency}ms (Good)`,
        details: 'Network connection is stable',
      };
    } else if (latency < 1500) {
      return {
        passed: true,
        message: `Network latency: ${latency}ms (Acceptable)`,
        details: 'Network may be slightly slow',
      };
    } else {
      return {
        passed: false,
        message: `Network latency: ${latency}ms (Slow)`,
        details: 'Network connection may cause issues during exam',
      };
    }
  } catch {
    return {
      passed: false,
      message: 'Unable to check network speed',
      details: 'Please ensure you have a stable internet connection',
    };
  }
}

export async function checkCamera(): Promise<SystemCheckResult> {
  try {
    // Check if camera permissions are available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        passed: false,
        message: 'Camera API not available',
        details: 'Your browser may not support camera access',
      };
    }

    // Try to access the camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    // Stop the stream immediately
    stream.getTracks().forEach(track => track.stop());

    return {
      passed: true,
      message: 'Camera is available and accessible',
      details: 'Camera can be used for identity verification',
    };
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return {
        passed: false,
        message: 'Camera permission denied',
        details: 'Please allow camera access when prompted',
      };
    }
    if (error.name === 'NotFoundError') {
      return {
        passed: false,
        message: 'No camera found',
        details: 'Please connect a camera to your device',
      };
    }

    return {
      passed: false,
      message: 'Camera check failed',
      details: error.message || 'Unable to access camera',
    };
  }
}

export async function checkMicrophone(): Promise<SystemCheckResult> {
  try {
    // Check if microphone permissions are available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        passed: false,
        message: 'Microphone API not available',
        details: 'Your browser may not support microphone access',
      };
    }

    // Try to access the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop the stream immediately
    stream.getTracks().forEach(track => track.stop());

    return {
      passed: true,
      message: 'Microphone is available and accessible',
      details: 'Audio can be used if needed',
    };
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return {
        passed: false,
        message: 'Microphone permission denied',
        details: 'Please allow microphone access when prompted',
      };
    }
    if (error.name === 'NotFoundError') {
      return {
        passed: false,
        message: 'No microphone found',
        details: 'Please connect a microphone to your device',
      };
    }

    return {
      passed: false,
      message: 'Microphone check failed',
      details: error.message || 'Unable to access microphone',
    };
  }
}

// ============================================================================
// Full System Check
// ============================================================================

export async function runFullSystemCheck(): Promise<SystemCheckResults> {
  const browser = checkBrowser();
  const screenResolution = checkScreenResolution();
  const popupBlocker = checkPopupBlocker();
  const cookies = checkCookies();
  const localStorageResult = checkLocalStorage();
  const javascript = checkJavaScript();
  const networkSpeed = await checkNetworkSpeed();
  const camera = await checkCamera();
  const microphone = await checkMicrophone();

  // Essential checks that must pass
  const essentialPassed =
    browser.passed &&
    cookies.passed &&
    localStorageResult.passed &&
    javascript.passed &&
    networkSpeed.passed;

  // Overall passed if essential checks pass
  // Camera/microphone are recommended but not strictly required
  const overallPassed = essentialPassed;

  return {
    browser,
    screenResolution,
    popupBlocker,
    cookies,
    localStorage: localStorageResult,
    javascript,
    networkSpeed,
    camera,
    microphone,
    overallPassed,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Quick Check (for pre-exam validation)
// ============================================================================

export async function runQuickCheck(): Promise<{
  passed: boolean;
  issues: string[];
}> {
  const results = await runFullSystemCheck();
  const issues: string[] = [];

  if (!results.browser.passed) issues.push(results.browser.message);
  if (!results.cookies.passed) issues.push(results.cookies.message);
  if (!results.localStorage.passed) issues.push(results.localStorage.message);
  if (!results.networkSpeed.passed) issues.push(results.networkSpeed.message);
  if (!results.camera.passed) issues.push(results.camera.message);

  return {
    passed: issues.length === 0,
    issues,
  };
}
