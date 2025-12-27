/**
 * Admin Identity Verifications Page
 *
 * Admin interface to review and approve/reject identity verifications
 * Requirements: task.md Step 1 - Identity Verification (Admin Review)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  FileText,
  Camera,
  IdCard,
  User,
  Calendar,
  Mail,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  IdentityVerificationService,
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  type IdentityVerification,
} from '@/entities/identity-verification';

export default function IdentityVerifications() {
  const { toast } = useToast();

  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<IdentityVerification | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [documentUrls, setDocumentUrls] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});

  // Load pending verifications
  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    setIsLoading(true);
    try {
      const result = await IdentityVerificationService.getPendingVerifications();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setVerifications(result.data || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewClick = async (verification: IdentityVerification) => {
    setSelectedVerification(verification);
    setReviewAction(null);
    setAdminNotes('');
    setRejectionReason('');
    setDocumentUrls({});

    // Load document URLs
    try {
      const urls: any = {};

      if (verification.document_front_url) {
        const frontResult = await IdentityVerificationService.getDocumentUrl(
          verification.document_front_url
        );
        if (frontResult.data) {
          urls.front = frontResult.data;
        }
      }

      if (verification.document_back_url) {
        const backResult = await IdentityVerificationService.getDocumentUrl(
          verification.document_back_url
        );
        if (backResult.data) {
          urls.back = backResult.data;
        }
      }

      if (verification.selfie_url) {
        const selfieResult = await IdentityVerificationService.getDocumentUrl(
          verification.selfie_url
        );
        if (selfieResult.data) {
          urls.selfie = selfieResult.data;
        }
      }

      setDocumentUrls(urls);
    } catch (error) {
      console.error('Error loading documents:', error);
    }

    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedVerification || !reviewAction) return;

    // Validation
    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      let result;

      if (reviewAction === 'approve') {
        result = await IdentityVerificationService.approveVerification(
          selectedVerification.id,
          adminNotes || undefined
        );
      } else {
        result = await IdentityVerificationService.rejectVerification(
          selectedVerification.id,
          rejectionReason,
          adminNotes || undefined
        );
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: reviewAction === 'approve' ? 'Verification Approved' : 'Verification Rejected',
        description: `Identity verification has been ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      // Reload list
      await loadPendingVerifications();

      // Close dialog
      setIsReviewDialogOpen(false);
      setSelectedVerification(null);

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Review Failed',
        description: error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Identity Verifications
          </h1>
          <p className="text-gray-600 mt-1">
            Review and approve identity verification submissions
          </p>
        </div>
        <Button onClick={loadPendingVerifications} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{verifications.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>
            Click on a verification to review documents and approve/reject
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                No pending verifications. All submissions have been reviewed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((verification: any) => (
                    <TableRow key={verification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {verification.user?.first_name} {verification.user?.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {verification.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {DOCUMENT_TYPE_LABELS[verification.document_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(verification.submitted_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[verification.status]}>
                          {STATUS_LABELS[verification.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleReviewClick(verification)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Identity Verification</DialogTitle>
            <DialogDescription>
              Review the submitted documents and approve or reject the verification
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">
                        {(selectedVerification as any).user?.first_name} {(selectedVerification as any).user?.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">
                        {(selectedVerification as any).user?.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Document Type:</span>
                      <span className="ml-2 font-medium">
                        {DOCUMENT_TYPE_LABELS[selectedVerification.document_type]}
                      </span>
                    </div>
                    {selectedVerification.document_number && (
                      <div>
                        <span className="text-gray-600">Document Number:</span>
                        <span className="ml-2 font-medium">
                          {selectedVerification.document_number}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedVerification.submitted_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submitted Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Document Front */}
                  {documentUrls.front && (
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <IdCard className="h-4 w-4" />
                        Front of Document
                      </Label>
                      <img
                        src={documentUrls.front}
                        alt="Document front"
                        className="w-full max-w-md border rounded-lg"
                      />
                    </div>
                  )}

                  {/* Document Back */}
                  {documentUrls.back && (
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <IdCard className="h-4 w-4" />
                        Back of Document
                      </Label>
                      <img
                        src={documentUrls.back}
                        alt="Document back"
                        className="w-full max-w-md border rounded-lg"
                      />
                    </div>
                  )}

                  {/* Selfie */}
                  {documentUrls.selfie && (
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Camera className="h-4 w-4" />
                        Selfie (Liveness Check)
                      </Label>
                      <img
                        src={documentUrls.selfie}
                        alt="Selfie"
                        className="w-full max-w-md border rounded-lg"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Review Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Action Selection */}
                  <div className="flex gap-4">
                    <Button
                      variant={reviewAction === 'approve' ? 'default' : 'outline'}
                      onClick={() => setReviewAction('approve')}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                      onClick={() => setReviewAction('reject')}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>

                  {/* Rejection Reason (if reject) */}
                  {reviewAction === 'reject' && (
                    <div className="space-y-2">
                      <Label htmlFor="rejection_reason">
                        Rejection Reason * (will be shown to user)
                      </Label>
                      <Textarea
                        id="rejection_reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a clear reason for rejection (e.g., 'Document is blurry and unreadable', 'Selfie does not match ID photo')"
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  {/* Admin Notes (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="admin_notes">
                      Admin Notes (optional, internal only)
                    </Label>
                    <Textarea
                      id="admin_notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes for admin reference"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={!reviewAction || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
