/**
 * Create PDP Guideline Page
 * Upload and create new guideline documents for PDP partners
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { Plus, Upload } from 'lucide-react';
import {
  useCreatePDPGuideline,
  useUploadGuidelineFile,
} from '@/entities/pdp/pdp.hooks';
import type { GuidelineCategory } from '@/entities/pdp/pdp.types';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_OPTIONS: { value: GuidelineCategory; label: string }[] = [
  { value: 'policy', label: 'Policy' },
  { value: 'template', label: 'Template' },
  { value: 'guide', label: 'Guide' },
  { value: 'logo', label: 'Logo Usage' },
  { value: 'format', label: 'Format Spec' },
];

export default function GuidelineCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreatePDPGuideline();
  const uploadMutation = useUploadGuidelineFile();

  const [form, setForm] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    category: 'guide' as GuidelineCategory,
    file_url: '',
    version: '1.0',
    is_required: false,
    sort_order: 0,
    file: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.file) {
      toast({
        title: 'Missing Fields',
        description: 'Title and file are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload file first
      const uploadResult = await uploadMutation.mutateAsync({
        file: form.file,
        category: form.category,
      });

      if (!uploadResult.data) {
        throw new Error('File upload failed');
      }

      // Create guideline record
      await createMutation.mutateAsync({
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        category: form.category,
        file_url: uploadResult.data.url,
        file_name: uploadResult.data.fileName,
        file_type: form.file.type,
        file_size: uploadResult.data.fileSize,
        version: form.version,
        is_required: form.is_required,
        sort_order: form.sort_order,
      });

      toast({
        title: 'Guideline Created',
        description: 'Guideline has been created successfully.',
      });

      navigate('/admin/pdp-guidelines');
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create guideline.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminPageLayout
      title="Add New Guideline"
      subtitle="Upload a new guideline document for PDP partners"
      backTo="/admin/pdp-guidelines"
      
    >
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Guideline Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Titles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title (English) *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Document title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="title_ar">Title (Arabic)</Label>
                <Input
                  id="title_ar"
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  placeholder="عنوان المستند"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="description_ar">Description (Arabic)</Label>
                <Textarea
                  id="description_ar"
                  value={form.description_ar}
                  onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                  placeholder="وصف موجز"
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Category, Version, Sort Order */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value as GuidelineCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="1.0"
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Required toggle */}
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is_required"
                checked={form.is_required}
                onCheckedChange={(checked) => setForm({ ...form, is_required: checked })}
              />
              <Label htmlFor="is_required">Required document (partners must read)</Label>
            </div>

            {/* File upload */}
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label htmlFor="file">Upload File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.zip,.png,.jpg,.svg"
                  required
                />
                {form.file && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {form.file.name} ({(form.file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Manual URL (alternative to upload) */}
              <div>
                <Label htmlFor="file_url">Or Enter File URL</Label>
                <Input
                  id="file_url"
                  type="url"
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  placeholder="https://..."
                  disabled={!!form.file}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use this if file is already hosted externally
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/pdp-guidelines')}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || uploadMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {createMutation.isPending || uploadMutation.isPending ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Guideline
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
