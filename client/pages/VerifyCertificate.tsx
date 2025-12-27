/**
 * Certificate Verification Page
 *
 * Public page for verifying certificates by credential ID
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  Award,
  Calendar,
  User,
  AlertCircle,
  Shield,
  ExternalLink,
} from 'lucide-react';
import {
  verifyCertificate,
  type CertificateVerification,
} from '@/entities/certificate';

// ============================================================================
// Component
// ============================================================================

export default function VerifyCertificate() {
  const { credentialId: urlCredentialId } = useParams<{ credentialId?: string }>();
  const navigate = useNavigate();

  const [credentialId, setCredentialId] = useState(urlCredentialId || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ========================================================================
  // Auto-verify if credential ID in URL
  // ========================================================================

  useEffect(() => {
    if (urlCredentialId && !hasSearched) {
      handleVerify();
    }
  }, [urlCredentialId]);

  // ========================================================================
  // Verification Handler
  // ========================================================================

  const handleVerify = async () => {
    if (!credentialId.trim()) {
      return;
    }

    setIsVerifying(true);
    setHasSearched(true);

    try {
      const result = await verifyCertificate(credentialId.trim());

      if (result.error) {
        throw new Error(result.error.message);
      }

      setVerification(result.data);

      // Update URL with credential ID if not already there
      if (!urlCredentialId) {
        navigate(`/verify/${credentialId.trim()}`, { replace: true });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerification({
        is_valid: false,
        status: 'error',
        holder_name: null,
        certification_type: null,
        issued_date: null,
        expiry_date: null,
        message: error instanceof Error ? error.message : 'Verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleReset = () => {
    setCredentialId('');
    setVerification(null);
    setHasSearched(false);
    navigate('/verify', { replace: true });
  };

  // ========================================================================
  // Format Date
  // ========================================================================

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Verify Certificate</h1>
          </div>
          <p className="text-lg text-gray-600">
            Verify the authenticity of BDA Association certifications
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Credential ID</CardTitle>
            <CardDescription>
              Enter the credential ID (e.g., CP-2025-0001 or SCP-2025-0001) to verify a
              certification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="CP-2025-0001"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isVerifying}
                  className="text-lg font-mono"
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={!credentialId.trim() || isVerifying}
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification Results */}
        {verification && hasSearched && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              {/* Valid Certificate */}
              {verification.is_valid ? (
                <div className="space-y-6">
                  {/* Success Banner */}
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-900 text-lg">
                      Certificate Verified
                    </AlertTitle>
                    <AlertDescription className="text-green-800">
                      This is a valid and active certification issued by BDA Association.
                    </AlertDescription>
                  </Alert>

                  {/* Certificate Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <h3 className="text-2xl font-bold text-gray-900">Certificate Details</h3>
                      <Badge variant="default" className="text-base px-4 py-2">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Active
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Holder Name */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium uppercase tracking-wide">
                            Certificate Holder
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {verification.holder_name}
                        </p>
                      </div>

                      {/* Certification Type */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium uppercase tracking-wide">
                            Certification Type
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {verification.certification_type === 'CP'
                            ? 'Certified Professional (CP™)'
                            : 'Senior Certified Professional (SCP™)'}
                        </p>
                      </div>

                      {/* Issue Date */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium uppercase tracking-wide">
                            Issued Date
                          </span>
                        </div>
                        <p className="text-lg text-gray-900">
                          {formatDate(verification.issued_date)}
                        </p>
                      </div>

                      {/* Expiry Date */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium uppercase tracking-wide">
                            Valid Until
                          </span>
                        </div>
                        <p className="text-lg text-gray-900">
                          {formatDate(verification.expiry_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Authenticity Statement */}
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Authenticity Confirmed</AlertTitle>
                    <AlertDescription>
                      This certification has been verified against BDA Association's official
                      records. The credential holder has successfully completed all certification
                      requirements and maintains active standing.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                /* Invalid/Expired/Revoked Certificate */
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg">
                      {verification.status === 'not_found'
                        ? 'Certificate Not Found'
                        : verification.status === 'expired'
                        ? 'Certificate Expired'
                        : verification.status === 'revoked'
                        ? 'Certificate Revoked'
                        : 'Verification Failed'}
                    </AlertTitle>
                    <AlertDescription className="text-base">
                      {verification.message}
                    </AlertDescription>
                  </Alert>

                  {/* Show limited details for expired/revoked */}
                  {verification.holder_name && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Holder Name</p>
                          <p className="text-base font-medium text-gray-900">
                            {verification.holder_name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Certification Type</p>
                          <p className="text-base font-medium text-gray-900">
                            {verification.certification_type}
                          </p>
                        </div>
                        {verification.issued_date && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">Issued</p>
                            <p className="text-base text-gray-900">
                              {formatDate(verification.issued_date)}
                            </p>
                          </div>
                        )}
                        {verification.expiry_date && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">Expiry Date</p>
                            <p className="text-base text-gray-900">
                              {formatDate(verification.expiry_date)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t mt-6">
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  Verify Another Certificate
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  disabled={!verification.is_valid}
                >
                  Print Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Certificate Verification</CardTitle>
            <CardDescription>How to verify BDA Association certifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What is a Credential ID?</h4>
              <p className="text-sm text-gray-600">
                Every BDA Association certification is issued with a unique Credential ID (e.g.,
                CP-2025-0001). This ID can be found on the certificate and is used for
                verification.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-Time Verification</h4>
              <p className="text-sm text-gray-600">
                Our verification system checks certificates in real-time against our official
                database. You'll immediately see if a certificate is valid, expired, or revoked.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">For Employers</h4>
              <p className="text-sm text-gray-600">
                Use this tool to verify candidate certifications during the hiring process. All
                verifications are logged for security purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
