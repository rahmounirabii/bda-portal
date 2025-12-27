/**
 * PDP License Request Review Page
 * Review and approve/reject PDP license requests (renewal, slot increase, etc.)
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function RequestReview() {
  const { id, requestId } = useParams<{ id: string; requestId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [adminNotes, setAdminNotes] = useState('');

  // Fetch request
  const { data: request, isLoading, error } = useQuery({
    queryKey: ['pdp-license-request', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdp_license_requests')
        .select('*, pdp_licenses(*), partners(*)')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ notes }: { notes: string }) => {
      const { error } = await supabase
        .from('pdp_license_requests')
        .update({
          status: 'approved',
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // If it's a slot increase request, update the license
      if (request?.request_type === 'slot_increase' && request?.requested_slots) {
        const { error: licenseError } = await supabase
          .from('pdp_licenses')
          .update({
            max_programs: request.requested_slots,
          })
          .eq('id', request.license_id);

        if (licenseError) throw licenseError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdp-license-request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['pdp-license', id] });
      toast({
        title: 'Request Approved',
        description: 'The license request has been approved successfully.',
      });
      navigate(`/admin/pdp/${id}`);
    },
    onError: (error) => {
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ notes }: { notes: string }) => {
      const { error } = await supabase
        .from('pdp_license_requests')
        .update({
          status: 'rejected',
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdp-license-request', requestId] });
      toast({
        title: 'Request Rejected',
        description: 'The license request has been rejected.',
        variant: 'destructive',
      });
      navigate(`/admin/pdp/${id}`);
    },
    onError: (error) => {
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading || loadingPartner) {
    return (
      <AdminPageLayout title="Loading..." backTo={`/admin/pdp/${id}`}>
        <Skeleton className="h-96 w-full" />
      </AdminPageLayout>
    );
  }

  if (error || !request) {
    return (
      <AdminPageLayout title="Request Not Found" backTo={`/admin/pdp/${id}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>License request not found.</AlertDescription>
        </Alert>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Review License Request"
      subtitle={request.partners?.company_name || 'PDP Partner'}
      backTo={`/admin/pdp/${id}`}
      
    >
      <div className="space-y-6">
        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Request Type</Label>
                <Badge className="bg-blue-100 text-blue-700">
                  {request.request_type.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">Status</Label>
                <Badge
                  className={
                    request.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }
                >
                  {request.status}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">Submitted</Label>
                <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
              </div>
              {request.request_type === 'slot_increase' && (
                <>
                  <div>
                    <Label className="text-gray-500">Current Slots</Label>
                    <p className="font-medium">{request.current_slots}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Requested Slots</Label>
                    <p className="font-medium">{request.requested_slots}</p>
                  </div>
                </>
              )}
            </div>

            {request.justification && (
              <div className="mt-4">
                <Label className="text-gray-500">Justification</Label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{request.justification}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Form */}
        {request.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => rejectMutation.mutate({ notes: adminNotes })}
                  disabled={rejectMutation.isPending}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Request
                </Button>
                <Button
                  type="button"
                  onClick={() => approveMutation.mutate({ notes: adminNotes })}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Review (if already reviewed) */}
        {request.status !== 'pending' && request.admin_notes && (
          <Card>
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 whitespace-pre-wrap">{request.admin_notes}</p>
              {request.reviewed_at && (
                <p className="text-sm text-gray-500 mt-2">
                  Reviewed on {new Date(request.reviewed_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageLayout>
  );
}
