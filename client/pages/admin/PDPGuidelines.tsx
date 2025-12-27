/**
 * Admin PDP Guidelines Management
 *
 * Manage downloadable guideline documents for PDP partners:
 * - Policy documents
 * - Templates
 * - Guides
 * - Logo usage guidelines
 * - Format specifications
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit,
  Trash2,
  Download,
  FileText,
  Search,
  Plus,
  BookOpen,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import {
  useAllPDPGuidelines,
  useUpdatePDPGuideline,
  useDeletePDPGuideline,
} from '@/entities/pdp/pdp.hooks';
import type {
  PDPGuideline,
  GuidelineCategory,
} from '@/entities/pdp/pdp.types';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORY_OPTIONS: { value: GuidelineCategory; label: string }[] = [
  { value: 'policy', label: 'Policy' },
  { value: 'template', label: 'Template' },
  { value: 'guide', label: 'Guide' },
  { value: 'logo', label: 'Logo Usage' },
  { value: 'format', label: 'Format Spec' },
];

const CATEGORY_COLORS: Record<GuidelineCategory, string> = {
  policy: 'bg-red-100 text-red-700',
  template: 'bg-blue-100 text-blue-700',
  guide: 'bg-green-100 text-green-700',
  logo: 'bg-purple-100 text-purple-700',
  format: 'bg-amber-100 text-amber-700',
};

const getFileIcon = (fileType?: string) => {
  if (!fileType) return File;
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return FileText;
  if (type.includes('doc')) return FileText;
  if (type.includes('xls') || type.includes('xlsx')) return FileSpreadsheet;
  if (type.includes('png') || type.includes('jpg') || type.includes('svg')) return FileImage;
  if (type.includes('zip') || type.includes('rar')) return FileArchive;
  return File;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function PDPGuidelines() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Queries & Mutations
  const { data: guidelines, isLoading } = useAllPDPGuidelines();
  const updateMutation = useUpdatePDPGuideline();
  const deleteMutation = useDeletePDPGuideline();

  // Translated category options
  const getCategoryLabel = (category: GuidelineCategory): string => {
    switch (category) {
      case 'policy': return t('pdpGuidelines.policy');
      case 'template': return t('pdpGuidelines.template');
      case 'guide': return t('pdpGuidelines.guide');
      case 'logo': return t('pdpGuidelines.logoUsage');
      case 'format': return t('pdpGuidelines.formatSpec');
    }
  };

  // Filter guidelines
  const filteredGuidelines = guidelines?.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase()) ||
      g.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || g.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  // Stats
  const totalGuidelines = guidelines?.length || 0;
  const activeGuidelines = guidelines?.filter((g) => g.is_active).length || 0;
  const requiredGuidelines = guidelines?.filter((g) => g.is_required).length || 0;
  const totalDownloads = guidelines?.reduce((sum, g) => sum + (g.download_count || 0), 0) || 0;

  const handleToggleActive = async (guideline: PDPGuideline) => {
    await updateMutation.mutateAsync({
      id: guideline.id,
      dto: { is_active: !guideline.is_active },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('pdpGuidelines.deleteConfirm'))) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">{t('pdpGuidelines.title')}</h1>
              <p className="mt-2 opacity-90">
                {t('pdpGuidelines.subtitle')}
              </p>
            </div>
          </div>
          <Button size="lg" variant="secondary" onClick={() => navigate('/admin/pdp-guidelines/create')}>
            <Plus className="h-5 w-5 mr-2" />
            {t('pdpGuidelines.addGuideline')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pdpGuidelines.totalGuidelines')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalGuidelines}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('common.active')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeGuidelines}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pdpGuidelines.required')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{requiredGuidelines}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pdpGuidelines.totalDownloads')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalDownloads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Guidelines Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('pdpGuidelines.allGuidelines')}</CardTitle>
              <CardDescription>{t('pdpGuidelines.manageDescription')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('pdpGuidelines.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('pdpGuidelines.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('pdpGuidelines.allCategories')}</SelectItem>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {getCategoryLabel(cat.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('pdpGuidelines.document')}</TableHead>
                <TableHead>{t('pdpGuidelines.category')}</TableHead>
                <TableHead>{t('pdpGuidelines.version')}</TableHead>
                <TableHead>{t('pdpGuidelines.size')}</TableHead>
                <TableHead>{t('pdpGuidelines.downloads')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuidelines.length > 0 ? (
                filteredGuidelines.map((guideline) => {
                  const FileIcon = getFileIcon(guideline.file_type);
                  return (
                    <TableRow key={guideline.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded">
                            <FileIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {guideline.title}
                              {guideline.is_required && (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            {guideline.title_ar && (
                              <div className="text-sm text-muted-foreground" dir="rtl">
                                {guideline.title_ar}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {guideline.file_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={CATEGORY_COLORS[guideline.category]}>
                          {getCategoryLabel(guideline.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">v{guideline.version}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(guideline.file_size)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span>{guideline.download_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {guideline.is_active ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('common.active')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            {t('common.inactive')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDownload(guideline.file_url)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {t('pdpGuidelines.download')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/pdp-guidelines/${guideline.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(guideline)}>
                              {guideline.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  {t('pdpGuidelines.deactivate')}
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('pdpGuidelines.activate')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(guideline.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('pdpGuidelines.noGuidelines')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

