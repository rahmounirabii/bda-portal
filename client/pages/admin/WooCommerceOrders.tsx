import { useState } from 'react';
import {
  ShoppingCart,
  RefreshCw,
  Ticket,
  CheckCircle,
  XCircle,
  User,
  Package,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/contexts/ConfirmDialogContext';
import {
  useWooCommerceOrders,
  useMarkOrderVouchersGenerated,
  type WooCommerceOrder,
} from '@/entities/woocommerce';
import {
  useAllCertificationProducts,
  useCreateVoucher,
  type CertificationProduct,
} from '@/entities/quiz';
import { cn } from '@/shared/utils/cn';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  'on-hold': 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  failed: 'Failed',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
};

export default function WooCommerceOrders() {
  const { toast } = useToast();
  const { confirm } = useConfirm();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('completed');
  const [productFilter, setProductFilter] = useState<number | undefined>(undefined);

  // Fetch data
  const { data: certProducts } = useAllCertificationProducts();
  const { data: orders, isLoading, refetch } = useWooCommerceOrders({
    status: statusFilter,
    product_id: productFilter,
  });

  // Mutations
  const createVoucherMutation = useCreateVoucher();
  const markOrderMutation = useMarkOrderVouchersGenerated();

  // Get certification product IDs for filtering
  const certProductIds = certProducts?.map((cp) => cp.woocommerce_product_id) || [];

  // Filter orders to only show those with certification products
  const certificationOrders = orders?.filter((order) =>
    order.items.some((item) => certProductIds.includes(item.product_id))
  );

  const handleGenerateVouchers = async (order: WooCommerceOrder) => {
    const confirmed = await confirm({
      title: 'Generate Vouchers',
      description: `Generate certification vouchers for order #${order.order_number}? This will create vouchers for the customer.`,
      confirmText: 'Generate',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      // Get certification products from this order
      const orderCertProducts = order.items
        .map((item) => {
          const certProduct = certProducts?.find(
            (cp) => cp.woocommerce_product_id === item.product_id
          );
          return certProduct ? { ...certProduct, quantity: item.quantity } : null;
        })
        .filter(Boolean) as (CertificationProduct & { quantity: number })[];

      if (orderCertProducts.length === 0) {
        toast({
          title: 'Error',
          description: 'No certification products found in this order',
          variant: 'destructive',
        });
        return;
      }

      // TODO: Get user_id from customer email
      // For now, we'll need to implement a user lookup endpoint
      // const userResponse = await fetch(`${API_URL}/users/by-email?email=${order.customer.email}`);
      // const userData = await userResponse.json();

      // Create vouchers for each certification product
      let totalVouchers = 0;
      for (const certProduct of orderCertProducts) {
        const vouchersToCreate = certProduct.vouchers_per_purchase * certProduct.quantity;

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + certProduct.voucher_validity_months);

        for (let i = 0; i < vouchersToCreate; i++) {
          // TODO: Replace with actual user_id lookup
          // For now, using a placeholder - this needs to be implemented
          await createVoucherMutation.mutateAsync({
            user_id: 'USER_ID_PLACEHOLDER', // TODO: Lookup from order.customer.email
            certification_type: certProduct.certification_type,
            quiz_id: certProduct.quiz_id || undefined,
            expires_at: expiresAt.toISOString(),
            woocommerce_order_id: order.id,
            certification_product_id: certProduct.id,
            admin_notes: `Auto-generated from WooCommerce order #${order.order_number}`,
          });

          totalVouchers++;
        }
      }

      // Mark order as vouchers generated
      await markOrderMutation.mutateAsync(order.id);

      toast({
        title: 'Success',
        description: `${totalVouchers} voucher(s) generated successfully for order #${order.order_number}`,
      });

      refetch();
    } catch (error: any) {
      console.error('Error generating vouchers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate vouchers',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" />
          WooCommerce Orders
        </h1>
        <p className="mt-2 opacity-90">
          View orders and generate certification vouchers for customers
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Ticket className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Automatic Voucher Generation</h3>
              <p className="text-sm text-blue-800">
                When you click "Generate Vouchers", the system will automatically create the correct
                number of vouchers based on the product configuration (vouchers per purchase,
                validity period, etc.)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Order Status */}
              <div>
                <Label>Order Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Product Filter */}
              <div>
                <Label>Certification Product</Label>
                <Select
                  value={productFilter?.toString() || 'all'}
                  onValueChange={(v) => setProductFilter(v === 'all' ? undefined : parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Certification Products</SelectItem>
                    {certProducts?.map((cp) => (
                      <SelectItem key={cp.id} value={cp.woocommerce_product_id.toString()}>
                        {cp.woocommerce_product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <Button onClick={() => refetch()} disabled={isLoading} variant="outline" className="w-full">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Orders
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : !certificationOrders || certificationOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No certification orders found</p>
            <p className="text-sm text-gray-500">
              Orders containing certification products will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {certificationOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-purple-100">
                        <ShoppingCart className="h-6 w-6 text-royal-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            Order #{order.order_number}
                          </h3>
                          <Badge className={ORDER_STATUS_COLORS[order.status]}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                          {order.vouchers_generated && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Vouchers Generated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>
                            <User className="h-3 w-3 inline mr-1" />
                            {order.customer.first_name} {order.customer.last_name}
                          </span>
                          <span>{order.customer.email}</span>
                          <span>{formatDate(order.date_created)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => {
                        const isCertProduct = certProductIds.includes(item.product_id);
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'p-3 rounded-lg',
                              isCertProduct ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-600" />
                                <span className="font-medium">{item.product_name}</span>
                                {isCertProduct && (
                                  <Badge variant="outline" className="text-xs">
                                    Certification Product
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                Qty: {item.quantity} × ${item.total}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        {order.currency} ${order.total}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {order.vouchers_generated ? (
                      <div className="text-center p-4">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-green-700 font-semibold">Vouchers Created</p>
                        {order.vouchers_generated_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(order.vouchers_generated_at)}
                          </p>
                        )}
                      </div>
                    ) : order.status === 'completed' ? (
                      <Button
                        onClick={() => handleGenerateVouchers(order)}
                        disabled={createVoucherMutation.isPending || markOrderMutation.isPending}
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Generate Vouchers
                      </Button>
                    ) : (
                      <div className="text-center p-4">
                        <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Order not completed</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

WooCommerceOrders.displayName = 'WooCommerceOrders';
