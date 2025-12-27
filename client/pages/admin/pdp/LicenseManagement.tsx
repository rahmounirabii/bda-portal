/**
 * PDP License Management Page
 * View and manage PDP partner license details, slots, and renewals
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import {
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Save,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function LicenseManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [maxPrograms, setMaxPrograms] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Fetch partner
  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: ['pdp-partner', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .eq('partner_type', 'pdp')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch license
  const { data: license, isLoading: loadingLicense } = useQuery({
    queryKey: ['pdp-license', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdp_licenses')
        .select('*')
        .eq('partner_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!id,
  });

  // Populate form fields when license data loads
  useEffect(() => {
    if (license) {
      setMaxPrograms(license.max_programs.toString());
      setExpiryDate(license.expiry_date);
    }
  }, [license]);

  // Update license mutation
  const updateLicenseMutation = useMutation({
    mutationFn: async ({ maxPrograms, expiryDate }: { maxPrograms?: number; expiryDate?: string }) => {
      if (!license) {
        throw new Error('No license to update');
      }

      const updateData: any = {};
      if (maxPrograms !== undefined) updateData.max_programs = maxPrograms;
      if (expiryDate) updateData.expiry_date = expiryDate;

      const { error } = await supabase
        .from('pdp_licenses')
        .update(updateData)
        .eq('id', license.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdp-license', id] });
      toast({
        title: 'License Updated',
        description: 'License information has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update license. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!license) return;

    // Only send changed values
    const updates: any = {};

    if (maxPrograms && parseInt(maxPrograms) !== license.max_programs) {
      updates.maxPrograms = parseInt(maxPrograms);
    }

    if (expiryDate && expiryDate !== license.expiry_date) {
      updates.expiryDate = expiryDate;
    }

    // Only update if something changed
    if (Object.keys(updates).length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes detected. Modify the fields to update.',
        variant: 'default',
      });
      return;
    }

    updateLicenseMutation.mutate(updates);
  };

  // Check if form has changes
  const hasChanges = license && (
    (maxPrograms && parseInt(maxPrograms) !== license.max_programs) ||
    (expiryDate && expiryDate !== license.expiry_date)
  );

  if (loadingPartner || loadingLicense) {
    return (
      <AdminPageLayout title="Loading..." backTo={`/admin/pdp/${id}`}>
        <Skeleton className="h-96 w-full" />
      </AdminPageLayout>
    );
  }

  if (!partner) {
    return (
      <AdminPageLayout title="Partner Not Found" backTo="/admin/pdp-management">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>PDP partner not found.</AlertDescription>
        </Alert>
      </AdminPageLayout>
    );
  }

  if (!license) {
    return (
      <AdminPageLayout
        title="License Management"
        subtitle={partner.company_name}
        backTo={`/admin/pdp/${id}`}
        
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No license found for this partner.</AlertDescription>
        </Alert>
      </AdminPageLayout>
    );
  }

  const programUsagePercent = (license.programs_used / license.max_programs) * 100;

  return (
    <AdminPageLayout
      title="License Management"
      subtitle={partner.company_name}
      backTo={`/admin/pdp/${id}`}
      
    >
      <div className="space-y-6">
        {/* Current License Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current License Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">License Number</Label>
                <p className="font-medium font-mono">{license.license_number}</p>
              </div>
              <div>
                <Label className="text-gray-500">Partner Code</Label>
                <p className="font-medium font-mono">{license.partner_code}</p>
              </div>
              <div>
                <Label className="text-gray-500">Status</Label>
                <Badge
                  className={
                    license.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : license.status === 'suspended'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }
                >
                  {license.status}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">Issue Date</Label>
                <p className="font-medium">{new Date(license.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">Expiry Date</Label>
                <p className="font-medium">{new Date(license.expiry_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Program Slots Usage */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <Label>Program Slots Usage</Label>
                <span className="text-sm text-gray-500">
                  {license.programs_used} / {license.max_programs} used
                </span>
              </div>
              <Progress value={programUsagePercent} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Update License Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Update License</CardTitle>
              <CardDescription>Modify license parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Current settings: <strong>{license.max_programs} programs</strong>, expires <strong>{new Date(license.expiry_date).toLocaleDateString()}</strong>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxPrograms">Maximum Programs *</Label>
                  <Input
                    id="maxPrograms"
                    type="number"
                    min={license.programs_used}
                    value={maxPrograms}
                    onChange={(e) => setMaxPrograms(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum allowed: {license.programs_used} (programs already used)
                  </p>
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be a future date
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/pdp/${id}`)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLicenseMutation.isPending || !hasChanges}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateLicenseMutation.isPending ? (
                'Updating...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {hasChanges ? 'Update License' : 'No Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  );
}
