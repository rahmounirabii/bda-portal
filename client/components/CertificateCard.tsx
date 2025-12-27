/**
 * Certificate Card Component
 *
 * Displays a single certificate with actions
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Share2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { UserCertificate } from '@/entities/certificate';

// ============================================================================
// Types
// ============================================================================

export interface CertificateCardProps {
  certificate: UserCertificate;
  onDownload?: (certificate: UserCertificate) => void;
  onShare?: (certificate: UserCertificate) => void;
  onView?: (certificate: UserCertificate) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function CertificateCard({
  certificate,
  onDownload,
  onShare,
  onView,
}: CertificateCardProps) {
  const isActive = certificate.status === 'active';
  const isExpired = certificate.status === 'expired';
  const isRevoked = certificate.status === 'revoked';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = () => {
    if (isActive && !certificate.is_expiring_soon) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (certificate.is_expiring_soon) {
      return <Clock className="h-4 w-4" />;
    }
    return <AlertCircle className="h-4 w-4" />;
  };

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (isRevoked) return 'destructive';
    if (isExpired) return 'secondary';
    if (certificate.is_expiring_soon) return 'outline';
    return 'default';
  };

  const getStatusText = () => {
    if (isRevoked) return 'Revoked';
    if (isExpired) return 'Expired';
    if (certificate.is_expiring_soon) return 'Expiring Soon';
    return 'Active';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : isExpired
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {certificate.certification_type === 'CP'
                  ? 'Certified Professional'
                  : 'Senior Certified Professional'}
              </h3>
              <p className="text-sm text-gray-600 font-mono">{certificate.credential_id}</p>
            </div>
          </div>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Exam Details */}
        {certificate.exam_title && (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Exam</p>
            <p className="text-sm font-medium text-gray-900">{certificate.exam_title}</p>
            {certificate.exam_score && (
              <p className="text-sm text-green-600 font-semibold">Score: {certificate.exam_score}%</p>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Issued</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(certificate.issued_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Expires</p>
            <p
              className={`text-sm font-medium ${
                certificate.is_expiring_soon ? 'text-orange-600' : 'text-gray-900'
              }`}
            >
              {formatDate(certificate.expiry_date)}
            </p>
          </div>
        </div>

        {/* Expiring Soon Warning */}
        {certificate.is_expiring_soon && isActive && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Renewal Required:</strong> This certificate expires in less than 60 days.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button
              onClick={() => onView(certificate)}
              variant="default"
              className="flex-1"
              size="sm"
            >
              View Certificate
            </Button>
          )}

          {certificate.certificate_url && onDownload && (
            <Button
              onClick={() => onDownload(certificate)}
              variant="outline"
              size="sm"
              disabled={isRevoked}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          )}

          {onShare && isActive && (
            <Button onClick={() => onShare(certificate)} variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
