/**
 * Tech Check Widget Component
 *
 * System compatibility check before exam launch
 * Requirements: task.md Step 6.1 - Tech Compatibility Check
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Monitor,
  Wifi,
  Camera,
  Mic,
  Globe,
  Download,
  Upload,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface TechCheckResult {
  check: string;
  status: 'pass' | 'fail' | 'warning' | 'checking';
  message: string;
  details?: string;
}

export interface TechCheckProps {
  onComplete?: (results: TechCheckResult[], allPassed: boolean) => void;
  autoStart?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function TechCheckWidget({ onComplete, autoStart = false }: TechCheckProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TechCheckResult[]>([]);
  const [currentCheck, setCurrentCheck] = useState<string>('');

  useEffect(() => {
    if (autoStart) {
      runAllChecks();
    }
  }, [autoStart]);

  // ========================================================================
  // Check Functions
  // ========================================================================

  const checkBrowser = async (): Promise<TechCheckResult> => {
    setCurrentCheck('Checking browser compatibility...');
    await delay(500);

    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

    const supported = isChrome || isFirefox || isEdge;

    return {
      check: 'Browser',
      status: supported ? 'pass' : isSafari ? 'warning' : 'fail',
      message: supported
        ? `${getBrowserName()} - Compatible`
        : isSafari
        ? 'Safari - Limited support'
        : 'Unsupported browser',
      details: supported
        ? 'Your browser is fully supported'
        : 'Please use Chrome, Firefox, or Edge for best experience',
    };
  };

  const checkScreenResolution = async (): Promise<TechCheckResult> => {
    setCurrentCheck('Checking screen resolution...');
    await delay(300);

    const width = window.screen.width;
    const height = window.screen.height;
    const minWidth = 1024;
    const minHeight = 768;

    const meetsRequirements = width >= minWidth && height >= minHeight;

    return {
      check: 'Screen Resolution',
      status: meetsRequirements ? 'pass' : 'warning',
      message: `${width}x${height}`,
      details: meetsRequirements
        ? 'Resolution is adequate'
        : `Minimum recommended: ${minWidth}x${minHeight}`,
    };
  };

  const checkInternetSpeed = async (): Promise<TechCheckResult> => {
    setCurrentCheck('Testing internet connection...');

    try {
      const startTime = performance.now();
      const response = await fetch('https://www.google.com/images/phd/px.gif?' + Date.now(), {
        mode: 'no-cors',
        cache: 'no-cache',
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Estimate speed (very rough)
      const status = duration < 1000 ? 'pass' : duration < 3000 ? 'warning' : 'fail';
      const speedLabel =
        duration < 1000 ? 'Excellent' : duration < 3000 ? 'Good' : 'Slow';

      return {
        check: 'Internet Speed',
        status,
        message: `${speedLabel} (${Math.round(duration)}ms)`,
        details:
          status === 'pass'
            ? 'Connection speed is good'
            : 'Slow connection may affect exam experience',
      };
    } catch (error) {
      return {
        check: 'Internet Speed',
        status: 'fail',
        message: 'Connection test failed',
        details: 'Please check your internet connection',
      };
    }
  };

  const checkWebcam = async (): Promise<TechCheckResult> => {
    setCurrentCheck('Checking webcam access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Get video capabilities
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      return {
        check: 'Webcam',
        status: 'pass',
        message: `Available (${settings.width}x${settings.height})`,
        details: 'Webcam is working correctly',
      };
    } catch (error: any) {
      const denied = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';

      return {
        check: 'Webcam',
        status: 'warning', // Changed from 'fail' to 'warning'
        message: denied ? 'Not enabled' : 'Not available',
        details: 'Webcam is optional - you can upload a photo instead for identity verification',
      };
    }
  };

  const checkMicrophone = async (): Promise<TechCheckResult> => {
    setCurrentCheck('Checking microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      return {
        check: 'Microphone',
        status: 'pass',
        message: 'Available',
        details: 'Microphone is working correctly',
      };
    } catch (error: any) {
      const denied = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';

      return {
        check: 'Microphone',
        status: 'warning',
        message: denied ? 'Permission denied' : 'Not available',
        details: denied
          ? 'Microphone access is recommended but not required'
          : 'Microphone not detected',
      };
    }
  };

  const checkPopupBlocker = async (): Promise<TechCheckResult> => {
    setCurrentCheck('Checking popup blocker...');
    await delay(300);

    try {
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (popup) {
        popup.close();
        return {
          check: 'Popup Blocker',
          status: 'pass',
          message: 'Popups allowed',
          details: 'Popup windows are not blocked',
        };
      } else {
        return {
          check: 'Popup Blocker',
          status: 'warning',
          message: 'Popups may be blocked',
          details: 'Please disable popup blocker for this site',
        };
      }
    } catch (error) {
      return {
        check: 'Popup Blocker',
        status: 'warning',
        message: 'Cannot test popups',
        details: 'Ensure popups are allowed if exam opens in new window',
      };
    }
  };

  const checkCookies = async (): Promise<TechCheckResult> => {
    setCurrentCheck('Checking cookies and storage...');
    await delay(300);

    const cookiesEnabled = navigator.cookieEnabled;

    // Test localStorage
    let localStorageWorks = false;
    try {
      localStorage.setItem('test', 'test');
      localStorageWorks = localStorage.getItem('test') === 'test';
      localStorage.removeItem('test');
    } catch (e) {
      localStorageWorks = false;
    }

    const status = cookiesEnabled && localStorageWorks ? 'pass' : 'fail';

    return {
      check: 'Cookies & Storage',
      status,
      message: status === 'pass' ? 'Enabled' : 'Disabled',
      details:
        status === 'pass'
          ? 'Cookies and local storage are enabled'
          : 'Please enable cookies and local storage',
    };
  };

  // ========================================================================
  // Run All Checks
  // ========================================================================

  const runAllChecks = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const checks = [
      checkBrowser,
      checkScreenResolution,
      checkInternetSpeed,
      checkCookies,
      checkPopupBlocker,
      checkWebcam,
      checkMicrophone,
    ];

    const totalChecks = checks.length;
    const newResults: TechCheckResult[] = [];

    for (let i = 0; i < checks.length; i++) {
      const result = await checks[i]();
      newResults.push(result);
      setResults([...newResults]);
      setProgress(((i + 1) / totalChecks) * 100);
    }

    setCurrentCheck('');
    setIsRunning(false);

    // Check if all critical tests passed
    const criticalChecks = ['Browser', 'Webcam', 'Cookies & Storage'];
    const allCriticalPassed = newResults
      .filter(r => criticalChecks.includes(r.check))
      .every(r => r.status === 'pass');

    if (onComplete) {
      onComplete(newResults, allCriticalPassed);
    }
  };

  // ========================================================================
  // Helper Functions
  // ========================================================================

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (/Edg/.test(ua)) return 'Edge';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua)) return 'Safari';
    return 'Unknown';
  };

  const getStatusIcon = (status: TechCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getCheckIcon = (checkName: string) => {
    switch (checkName) {
      case 'Browser':
        return <Globe className="h-4 w-4" />;
      case 'Screen Resolution':
        return <Monitor className="h-4 w-4" />;
      case 'Internet Speed':
        return <Wifi className="h-4 w-4" />;
      case 'Webcam':
        return <Camera className="h-4 w-4" />;
      case 'Microphone':
        return <Mic className="h-4 w-4" />;
      case 'Popup Blocker':
        return <Monitor className="h-4 w-4" />;
      case 'Cookies & Storage':
        return <Download className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const criticalFailed = results.some(
    r => ['Browser', 'Webcam', 'Cookies & Storage'].includes(r.check) && r.status === 'fail'
  );

  const allChecksComplete = results.length === 7 && !isRunning;

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Compatibility Check</CardTitle>
        <CardDescription>
          Verify your system meets the requirements for taking the exam
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{currentCheck}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  result.status === 'pass'
                    ? 'bg-green-50 border-green-200'
                    : result.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getStatusIcon(result.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getCheckIcon(result.check)}
                    <span className="font-medium text-sm">{result.check}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-600 mt-1">{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Alert */}
        {allChecksComplete && (
          <Alert variant={criticalFailed ? 'destructive' : 'default'}>
            {criticalFailed ? (
              <>
                <XCircle className="h-4 w-4" />
                <AlertTitle>System Check Failed</AlertTitle>
                <AlertDescription>
                  Critical requirements are not met. Please resolve the issues above before
                  continuing.
                </AlertDescription>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>System Check Passed</AlertTitle>
                <AlertDescription>
                  Your system meets the requirements to take the exam.
                  {results.some(r => r.status === 'warning') &&
                    ' Some warnings were detected but you can proceed.'}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Action Button */}
        {!isRunning && results.length === 0 && (
          <Button onClick={runAllChecks} className="w-full" size="lg">
            Run System Check
          </Button>
        )}

        {allChecksComplete && (
          <Button
            onClick={runAllChecks}
            variant="outline"
            className="w-full"
          >
            Run Check Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
