/**
 * ECP Partner Details Page
 * Comprehensive view of ECP partner information, stats, and activity
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import {
  Building2,
  Edit,
  Ticket,
  Users,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ECPDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch ECP partner data
  const { data: partner, isLoading, error } = useQuery({
    queryKey: ['ecp-partner', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .eq('partner_type', 'ecp')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['ecp-stats', id],
    queryFn: async () => {
      const [allocations, trainers, batches, trainees] = await Promise.all([
        supabase.from('ecp_voucher_allocations').select('quantity, vouchers_used').eq('partner_id', id),
        supabase.from('ecp_trainers').select('status').eq('partner_id', id),
        supabase.from('ecp_training_batches').select('id').eq('partner_id', id),
        supabase.from('ecp_trainees').select('id').eq('partner_id', id),
      ]);

      // Calculate total vouchers from allocations
      const totalVouchers = allocations.data?.reduce((sum, a) => sum + (a.quantity || 0), 0) || 0;
      const vouchersUsedCount = allocations.data?.reduce((sum, a) => sum + (a.vouchers_used || 0), 0) || 0;

      return {
        vouchers_total: totalVouchers,
        vouchers_used: vouchersUsedCount,
        trainers_total: trainers.data?.length || 0,
        trainers_approved: trainers.data?.filter((t) => t.status === 'approved').length || 0,
        batches_total: batches.data?.length || 0,
        trainees_total: trainees.data?.length || 0,
      };
    },
    enabled: !!id,
  });

  // Fetch trainers
  const { data: trainers } = useQuery({
    queryKey: ['ecp-trainers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecp_trainers')
        .select('*')
        .eq('partner_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch batches
  const { data: batches } = useQuery({
    queryKey: ['ecp-batches', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecp_training_batches')
        .select('*')
        .eq('partner_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch voucher allocations
  const { data: voucherAllocations } = useQuery({
    queryKey: ['ecp-voucher-allocations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecp_voucher_allocations')
        .select('*')
        .eq('partner_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminPageLayout title="Loading..." backTo="/admin/ecp-management">
        <Skeleton className="h-96 w-full" />
      </AdminPageLayout>
    );
  }

  if (error || !partner) {
    return (
      <AdminPageLayout title="Partner Not Found" backTo="/admin/ecp-management">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ECP partner not found.</AlertDescription>
        </Alert>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={partner.company_name}
      subtitle="ECP - Examination & Certification Partner"
      backTo="/admin/ecp-management"
      actions={
        <>
          <Button
            onClick={() => navigate(`/admin/ecp/${id}/vouchers`)}
            variant="outline"
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            <Ticket className="h-4 w-4 mr-2" />
            Allocate Vouchers
          </Button>
          <Button
            onClick={() => navigate(`/admin/partners/${id}/edit`)}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Partner
          </Button>
        </>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trainers">Trainers</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Contact Person</Label>
                  <p className="font-medium">{partner.contact_person || '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{partner.contact_email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="font-medium">{partner.contact_phone || '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Country</Label>
                  <p className="font-medium">{partner.country || '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <Badge className={partner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {partner.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Vouchers</p>
                    <p className="text-2xl font-bold">{stats?.vouchers_total || 0}</p>
                  </div>
                  <Ticket className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Approved Trainers</p>
                    <p className="text-2xl font-bold">{stats?.trainers_approved || 0}</p>
                  </div>
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Trainees</p>
                    <p className="text-2xl font-bold">{stats?.trainees_total || 0}</p>
                  </div>
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trainers Tab */}
        <TabsContent value="trainers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Trainers</CardTitle>
              <CardDescription>All trainers approved for this ECP partner</CardDescription>
            </CardHeader>
            <CardContent>
              {trainers && trainers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Certifications</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainers.map((trainer: any) => (
                      <TableRow key={trainer.id}>
                        <TableCell className="font-medium">
                          {trainer.first_name} {trainer.last_name}
                        </TableCell>
                        <TableCell>{trainer.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              trainer.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : trainer.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {trainer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trainer.certifications?.join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(trainer.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No trainers found for this partner.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Batches</CardTitle>
              <CardDescription>All training batches for this ECP partner</CardDescription>
            </CardHeader>
            <CardContent>
              {batches && batches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Certification</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Trainees</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch: any) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium font-mono">
                          {batch.batch_code || batch.id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{batch.certification_type || 'CP'}</Badge>
                        </TableCell>
                        <TableCell>
                          {batch.training_start_date ? new Date(batch.training_start_date).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          {batch.training_end_date ? new Date(batch.training_end_date).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>{batch.max_capacity || 0}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              batch.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : batch.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }
                          >
                            {batch.status || 'scheduled'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No training batches found for this partner.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Voucher Allocations</CardTitle>
                  <CardDescription>All voucher allocations for this ECP partner</CardDescription>
                </div>
                <Button
                  onClick={() => navigate(`/admin/ecp/${id}/vouchers`)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Allocate More
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {voucherAllocations && voucherAllocations.length > 0 ? (
                <div className="space-y-4">
                  {voucherAllocations.map((allocation: any) => (
                    <Card key={allocation.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <Label className="text-gray-500">Certification Type</Label>
                              <Badge className="mt-1">{allocation.certification_type}</Badge>
                            </div>
                            <div>
                              <Label className="text-gray-500">Total Vouchers</Label>
                              <p className="text-lg font-bold mt-1">{allocation.quantity}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Used</Label>
                              <p className="text-lg font-bold mt-1">{allocation.vouchers_used}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Remaining</Label>
                              <p className="text-lg font-bold mt-1 text-green-600">
                                {allocation.vouchers_remaining || (allocation.quantity - allocation.vouchers_used)}
                              </p>
                            </div>
                          </div>

                          {/* Usage Progress */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium">Voucher Usage</span>
                              <span className="text-sm text-gray-500">
                                {Math.round((allocation.vouchers_used / allocation.quantity) * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={(allocation.vouchers_used / allocation.quantity) * 100}
                              className="h-2"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                            <div>
                              <Label className="text-gray-500">Valid From</Label>
                              <p className="text-sm mt-1">
                                {new Date(allocation.valid_from).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Valid Until</Label>
                              <p className="text-sm mt-1">
                                {new Date(allocation.valid_until).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Status</Label>
                              <Badge
                                className={
                                  allocation.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : allocation.status === 'depleted'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-red-100 text-red-700'
                                }
                              >
                                {allocation.status}
                              </Badge>
                            </div>
                          </div>

                          {allocation.unit_price && (
                            <div className="pt-4 border-t">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-gray-500">Unit Price</Label>
                                  <p className="font-medium">${allocation.unit_price}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-500">Total Amount</Label>
                                  <p className="font-medium">${allocation.total_amount?.toFixed(2)}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-500">Payment Status</Label>
                                  <Badge variant="outline">{allocation.payment_status || 'pending'}</Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No voucher allocations found. Click "Allocate More" to create the first allocation.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
