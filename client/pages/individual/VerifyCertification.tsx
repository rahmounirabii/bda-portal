import { useState } from 'react';
import { Search, ShieldCheck, CheckCircle, XCircle, AlertCircle, Award, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CertificationsService } from '@/entities/certifications';
import type { UserCertification, CertificationStatus } from '@/entities/certifications';

/**
 * Verify Certification Page
 * Public tool for verifying certification credentials by ID or holder name
 * Restricted to authenticated users only
 */

interface CertificationWithUser extends UserCertification {
  user_name: string;
  user_email: string;
  exam_score?: number;
}

type SearchType = 'credential_id' | 'holder_name';

export default function VerifyCertification() {
  // Search state
  const [searchType, setSearchType] = useState<SearchType>('credential_id');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Results
  const [results, setResults] = useState<CertificationWithUser[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearching(true);
    setSearched(true);
    setResults([]);

    try {
      let certifications: CertificationWithUser[] = [];

      if (searchType === 'credential_id') {
        // Search by credential ID (exact match)
        const result = await CertificationsService.verifyCertificationByCredentialId(
          searchQuery.trim()
        );

        if (result.error) {
          throw result.error;
        }

        if (result.data) {
          // Get exam score
          const scoreResult = await CertificationsService.getCertificationExamScore(
            result.data.id
          );

          certifications = [{
            ...result.data,
            exam_score: scoreResult.data || undefined,
          }];
        }
      } else {
        // Search by holder name (partial match)
        const result = await CertificationsService.searchCertificationsByName(
          searchQuery.trim()
        );

        if (result.error) {
          throw result.error;
        }

        if (result.data) {
          // Get exam scores for all results
          const withScores = await Promise.all(
            result.data.map(async (cert) => {
              const scoreResult = await CertificationsService.getCertificationExamScore(
                cert.id
              );
              return {
                ...cert,
                exam_score: scoreResult.data || undefined,
              };
            })
          );
          certifications = withScores;
        }
      }

      setResults(certifications);

      if (certifications.length === 0) {
        toast.info('No certifications found matching your search');
      } else {
        toast.success(`Found ${certifications.length} certification${certifications.length > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search certifications');
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status: CertificationStatus) => {
    const config = {
      active: {
        icon: CheckCircle,
        label: 'Active',
        className: 'border-green-300 text-green-700 bg-green-50',
      },
      expired: {
        icon: AlertCircle,
        label: 'Expired',
        className: 'border-orange-300 text-orange-700 bg-orange-50',
      },
      revoked: {
        icon: XCircle,
        label: 'Revoked',
        className: 'border-red-300 text-red-700 bg-red-50',
      },
      suspended: {
        icon: AlertCircle,
        label: 'Suspended',
        className: 'border-gray-300 text-gray-700 bg-gray-50',
      },
    };

    const { icon: Icon, label, className } = config[status];

    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          Verify Certification
        </h1>
        <p className="mt-2 opacity-90">
          Verify the authenticity and status of BDA certifications
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Verification Information</h3>
              <p className="text-sm text-blue-800 mb-2">
                This tool allows you to verify the authenticity of BDA certifications. You can search by:
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li><strong>Credential ID</strong>: The unique identifier (e.g., CP-2024-0001)</li>
                <li><strong>Holder Name</strong>: The name of the certified professional</li>
              </ul>
              <p className="text-sm text-blue-800 mt-2">
                All search results are real-time and reflect the current status in the BDA database.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search for Certification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Type */}
            <div>
              <Label htmlFor="search_type">Search By</Label>
              <Select
                value={searchType}
                onValueChange={(value) => setSearchType(value as SearchType)}
              >
                <SelectTrigger id="search_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credential_id">Credential ID</SelectItem>
                  <SelectItem value="holder_name">Holder Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div>
              <Label htmlFor="search_query">
                {searchType === 'credential_id' ? 'Credential ID' : 'Holder Name'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="search_query"
                  placeholder={
                    searchType === 'credential_id'
                      ? 'e.g., CP-2024-0001'
                      : 'e.g., John Doe'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={searching}>
                  {searching ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searched && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShieldCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No Results Found</p>
                <p className="text-sm text-gray-500">
                  No certifications match your search criteria. Please check your input and try again.
                </p>
              </CardContent>
            </Card>
          ) : (
            results.map((cert) => {
              const daysUntilExpiry = getDaysUntilExpiry(cert.expiry_date);
              const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry < 90;

              return (
                <Card key={cert.id} className="border-2 border-green-200">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Certification Verified
                          </h3>
                          <p className="text-sm text-gray-600">
                            This is a valid BDA certification
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(cert.status)}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1">
                            Credential ID
                          </div>
                          <div className="font-mono font-semibold text-gray-900">
                            {cert.credential_id}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Holder Name
                          </div>
                          <div className="font-semibold text-gray-900">
                            {cert.user_name}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Certification Type
                          </div>
                          <Badge variant="outline" className="font-semibold">
                            {cert.certification_type}™
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Issued Date
                          </div>
                          <div className="text-gray-900">{formatDate(cert.issued_date)}</div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expiry Date
                          </div>
                          <div className="text-gray-900">{formatDate(cert.expiry_date)}</div>
                          {cert.status === 'active' && (
                            <div className="text-xs text-gray-600 mt-1">
                              {daysUntilExpiry > 0
                                ? `Expires in ${daysUntilExpiry} days`
                                : 'Expired'}
                            </div>
                          )}
                        </div>

                        {cert.exam_score !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500 uppercase mb-1">
                              Exam Score
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {cert.exam_score}%
                            </div>
                          </div>
                        )}

                        {cert.renewal_count > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 uppercase mb-1">
                              Renewals
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {cert.renewal_count} time{cert.renewal_count > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warnings */}
                    {isExpiringSoon && cert.status === 'active' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          <strong>Renewal Required Soon:</strong> This certification will expire in{' '}
                          {daysUntilExpiry} days. The holder should complete renewal requirements.
                        </p>
                      </div>
                    )}

                    {cert.status === 'revoked' && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">
                          <strong>Revoked:</strong> This certification has been revoked and is no
                          longer valid.
                          {cert.revocation_reason && ` Reason: ${cert.revocation_reason}`}
                        </p>
                      </div>
                    )}

                    {cert.status === 'expired' && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-orange-800">
                          <strong>Expired:</strong> This certification has expired. The holder must
                          complete renewal requirements to reactivate it.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Footer Info */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Important Notes:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>This verification tool shows real-time data from the BDA certification database</li>
              <li>All certifications are valid for 3 years from the issue date</li>
              <li>Revoked certifications are no longer valid regardless of expiry date</li>
              <li>For questions about verification results, please contact BDA support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

VerifyCertification.displayName = 'VerifyCertification';
