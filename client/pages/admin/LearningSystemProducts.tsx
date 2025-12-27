import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/config/supabase.config';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/contexts/ConfirmDialogContext';
import { cn } from '@/shared/utils/cn';

/**
 * Learning System Products Page (Admin)
 * Manage WooCommerce product links to Learning System access (EN/AR)
 */

type Language = 'EN' | 'AR';

type FormMode = 'create' | 'edit' | null;

interface LearningSystemProduct {
  id: string;
  woocommerce_product_id: number;
  woocommerce_product_name: string;
  woocommerce_product_sku: string | null;
  language: Language;
  includes_question_bank: boolean;
  includes_flashcards: boolean;
  validity_months: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  id?: string;
  woocommerce_product_id: string;
  woocommerce_product_name: string;
  woocommerce_product_sku: string;
  language: Language;
  includes_question_bank: boolean;
  includes_flashcards: boolean;
  validity_months: string;
}

const emptyFormData: ProductFormData = {
  woocommerce_product_id: '',
  woocommerce_product_name: '',
  woocommerce_product_sku: '',
  language: 'EN',
  includes_question_bank: true,
  includes_flashcards: true,
  validity_months: '12',
};

export default function LearningSystemProducts() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // Filters
  const [languageFilter, setLanguageFilter] = useState<Language | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-learning-system-products', languageFilter, activeFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('learning_system_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (languageFilter !== 'all') {
        query = query.eq('language', languageFilter);
      }

      if (activeFilter !== 'all') {
        query = query.eq('is_active', activeFilter === 'active');
      }

      if (searchQuery) {
        query = query.or(
          `woocommerce_product_name.ilike.%${searchQuery}%,woocommerce_product_sku.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LearningSystemProduct[];
    },
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase.from('learning_system_products').insert({
        woocommerce_product_id: parseInt(data.woocommerce_product_id),
        woocommerce_product_name: data.woocommerce_product_name,
        woocommerce_product_sku: data.woocommerce_product_sku || null,
        language: data.language,
        includes_question_bank: data.includes_question_bank,
        includes_flashcards: data.includes_flashcards,
        validity_months: parseInt(data.validity_months),
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learning-system-products'] });
      toast({
        title: 'Product Created',
        description: 'Learning System product mapping created successfully.',
      });
      setFormMode(null);
      setFormData(emptyFormData);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product mapping',
        variant: 'destructive',
      });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase
        .from('learning_system_products')
        .update({
          woocommerce_product_id: parseInt(data.woocommerce_product_id),
          woocommerce_product_name: data.woocommerce_product_name,
          woocommerce_product_sku: data.woocommerce_product_sku || null,
          language: data.language,
          includes_question_bank: data.includes_question_bank,
          includes_flashcards: data.includes_flashcards,
          validity_months: parseInt(data.validity_months),
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learning-system-products'] });
      toast({
        title: 'Product Updated',
        description: 'Learning System product mapping updated successfully.',
      });
      setFormMode(null);
      setFormData(emptyFormData);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product mapping',
        variant: 'destructive',
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('learning_system_products')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learning-system-products'] });
      toast({
        title: 'Status Updated',
        description: 'Product status updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product status',
        variant: 'destructive',
      });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('learning_system_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learning-system-products'] });
      toast({
        title: 'Product Deleted',
        description: 'Learning System product mapping deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product mapping',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleCreate = () => {
    setFormMode('create');
    setFormData(emptyFormData);
  };

  const handleEdit = (product: LearningSystemProduct) => {
    setFormMode('edit');
    setFormData({
      id: product.id,
      woocommerce_product_id: product.woocommerce_product_id.toString(),
      woocommerce_product_name: product.woocommerce_product_name,
      woocommerce_product_sku: product.woocommerce_product_sku || '',
      language: product.language,
      includes_question_bank: product.includes_question_bank,
      includes_flashcards: product.includes_flashcards,
      validity_months: product.validity_months.toString(),
    });
  };

  const handleDelete = async (product: LearningSystemProduct) => {
    const confirmed = await confirm({
      title: 'Delete Product Mapping?',
      message: `Are you sure you want to delete the mapping for "${product.woocommerce_product_name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleToggleActive = (product: LearningSystemProduct) => {
    toggleActiveMutation.mutate({
      id: product.id,
      isActive: product.is_active,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync(formData);
      } else if (formMode === 'edit') {
        await updateMutation.mutateAsync(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            Learning System Products
          </h1>
          <p className="text-gray-600 mt-1">
            Manage WooCommerce product mappings for Learning System access (EN/AR)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="language-filter">Language</Label>
              <Select
                value={languageFilter}
                onValueChange={(value) => setLanguageFilter(value as Language | 'all')}
              >
                <SelectTrigger id="language-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="EN">English (EN)</SelectItem>
                  <SelectItem value="AR">Arabic (AR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={activeFilter}
                onValueChange={(value) => setActiveFilter(value as 'all' | 'active' | 'inactive')}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Product Mappings ({products?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading products...</p>
            </div>
          ) : products && products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {product.woocommerce_product_name}
                      </h3>
                      <Badge variant={product.language === 'EN' ? 'default' : 'secondary'}>
                        <Globe className="w-3 h-3 mr-1" />
                        {product.language}
                      </Badge>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">WooCommerce ID</p>
                        <p className="font-medium">{product.woocommerce_product_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">SKU</p>
                        <p className="font-medium">{product.woocommerce_product_sku || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Validity</p>
                        <p className="font-medium">{product.validity_months} months</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Includes</p>
                        <div className="flex gap-2 mt-1">
                          {product.includes_question_bank && (
                            <Badge variant="outline" className="text-xs">QB</Badge>
                          )}
                          {product.includes_flashcards && (
                            <Badge variant="outline" className="text-xs">FC</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {product.is_active ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Create your first product mapping to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formMode !== null} onOpenChange={() => setFormMode(null)}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {formMode === 'create' ? 'Create Product Mapping' : 'Edit Product Mapping'}
              </DialogTitle>
              <DialogDescription>
                Map a WooCommerce product to Learning System access (EN or AR)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-id">WooCommerce Product ID *</Label>
                  <Input
                    id="product-id"
                    type="number"
                    value={formData.woocommerce_product_id}
                    onChange={(e) =>
                      setFormData({ ...formData, woocommerce_product_id: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-sku">Product SKU</Label>
                  <Input
                    id="product-sku"
                    value={formData.woocommerce_product_sku}
                    onChange={(e) =>
                      setFormData({ ...formData, woocommerce_product_sku: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  value={formData.woocommerce_product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, woocommerce_product_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language *</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value as Language })
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">English (EN)</SelectItem>
                      <SelectItem value="AR">Arabic (AR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validity">Validity (months) *</Label>
                  <Input
                    id="validity"
                    type="number"
                    min="1"
                    value={formData.validity_months}
                    onChange={(e) =>
                      setFormData({ ...formData, validity_months: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Access Includes</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Question Bank</p>
                    <p className="text-sm text-gray-500">
                      Allow access to practice questions
                    </p>
                  </div>
                  <Switch
                    checked={formData.includes_question_bank}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_question_bank: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Flashcards</p>
                    <p className="text-sm text-gray-500">
                      Allow access to spaced repetition flashcards
                    </p>
                  </div>
                  <Switch
                    checked={formData.includes_flashcards}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_flashcards: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormMode(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : formMode === 'create'
                  ? 'Create'
                  : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
