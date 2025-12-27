/**
 * ECP Voucher Allocation Page
 * Review and approve voucher requests from ECP partners
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import {
  Building2,
  Ticket,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function VoucherAllocation() {
  const { id, requestId } = useParams<{ id: string; requestId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState('');
  const [certificationType, setCertificationType] = useState('CP');
  const [validUntil, setValidUntil] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  // Fetch partner
  const { data: partner, isLoading: loadingPartner } = useQuery({
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

  // Allocate vouchers mutation
  const allocateMutation = useMutation({
    mutationFn: async ({
      quantity,
      certType,
      validUntil,
      unitPrice
    }: {
      quantity: number;
      certType: string;
      validUntil: string;
      unitPrice?: number;
    }) => {
      const totalAmount = unitPrice ? quantity * unitPrice : null;

      // Create voucher allocation record
      const { error } = await supabase
        .from('ecp_voucher_allocations')
        .insert({
          partner_id: id,
          certification_type: certType,
          quantity: quantity,
          unit_price: unitPrice || null,
          total_amount: totalAmount,
          valid_until: validUntil,
          status: 'active',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecp-vouchers', id] });
      toast({
        title: 'Vouchers Allocated',
        description: `${quantity} ${certificationType} vouchers allocated successfully.`,
      });
      navigate(`/admin/ecp/${id}`);
    },
    onError: (error: any) => {
      console.error('Allocation error:', error);
      toast({
        title: 'Allocation Failed',
        description: error.message || 'Failed to allocate vouchers. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    const price = unitPrice ? parseFloat(unitPrice) : undefined;

    if (qty > 0 && validUntil) {
      allocateMutation.mutate({
        quantity: qty,
        certType: certificationType,
        validUntil,
        unitPrice: price
      });
    }
  };

  if (loadingPartner) {
    return (
      <AdminPageLayout title="Loading..." backTo="/admin/ecp-management">
        <Skeleton className="h-96 w-full" />
      </AdminPageLayout>
    );
  }

  if (!partner) {
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
      title="Allocate Vouchers"
      subtitle={partner.company_name}
      backTo={`/admin/ecp/${id}`}
    >
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Voucher Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <span className="font-medium">{partner.company_name}</span>
              </div>
              <p className="text-sm text-gray-600">{partner.contact_email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certType">Certification Type *</Label>
                <select
                  id="certType"
                  value={certificationType}
                  onChange={(e) => setCertificationType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                  required
                >
                  <option value="CP">Certified Professional (CP)</option>
                  <option value="SCP">Senior Certified Professional (SCP)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter number of vouchers"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unitPrice">Unit Price (Optional)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {quantity && parseInt(quantity) > 0 && validUntil && (
              <Alert>
                <Ticket className="h-4 w-4" />
                <AlertDescription>
                  You are about to allocate <strong>{quantity} {certificationType} vouchers</strong> to {partner.company_name}, valid until {new Date(validUntil).toLocaleDateString()}.
                  {unitPrice && ` Total cost: $${(parseInt(quantity) * parseFloat(unitPrice)).toFixed(2)}`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/ecp/${id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={allocateMutation.isPending || !quantity || parseInt(quantity) <= 0 || !validUntil}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {allocateMutation.isPending ? (
              'Allocating...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Allocate Vouchers
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
