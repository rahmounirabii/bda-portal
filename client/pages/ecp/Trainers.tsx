/**
 * ECP Trainers Management
 * Manage certified trainers for the ECP partner
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/dropdown-menu';
import {
  UserCheck,
  Search,
  PlusCircle,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Award,
  ExternalLink,
  Eye,
} from 'lucide-react';
import {
  useTrainers,
  useUpdateTrainer,
  useDeleteTrainer,
} from '@/entities/ecp';
import type { Trainer, TrainerFilters, TrainerStatus, CertificationType } from '@/entities/ecp';
import { useCommonConfirms } from '@/hooks/use-confirm';
import { useLanguage } from '@/contexts/LanguageContext';

// ============================================================================
// Translations
// ============================================================================

const translations = {
  en: {
    // Header
    title: 'Certified Trainers',
    subtitle: 'Manage your accredited trainers who deliver certification programs',
    addTrainer: 'Add Trainer',
    // Stats
    totalTrainers: 'Total Trainers',
    active: 'Active',
    pendingApproval: 'Pending Approval',
    scpCertified: 'SCP Certified',
    // Status labels
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusSuspended: 'Suspended',
    statusInactive: 'Inactive',
    // Filters
    searchPlaceholder: 'Search trainers...',
    allStatus: 'All Status',
    allCertifications: 'All Certifications',
    cpCertified: 'CP Certified',
    scpCertifiedFilter: 'SCP Certified',
    // Table
    allTrainers: 'All Trainers',
    viewAndManage: 'View and manage your certified trainers',
    trainer: 'Trainer',
    contact: 'Contact',
    certifications: 'Certifications',
    certificationExpiry: 'Certification Expiry',
    status: 'Status',
    actions: 'Actions',
    none: 'None',
    inactive: 'Inactive',
    // Actions
    viewDetails: 'View Details',
    edit: 'Edit',
    sendEmail: 'Send Email',
    linkedin: 'LinkedIn',
    activate: 'Activate',
    deactivate: 'Deactivate',
    remove: 'Remove',
    // Confirm dialogs
    activateTrainerTitle: 'Activate Trainer',
    deactivateTrainerTitle: 'Deactivate Trainer',
    activateConfirmDesc: (name: string) => `Are you sure you want to activate ${name}?`,
    deactivateConfirmDesc: (name: string) => `Are you sure you want to deactivate ${name}?`,
    activateBtn: 'Activate',
    deactivateBtn: 'Deactivate',
    cancelBtn: 'Cancel',
    // Empty state
    noTrainersFound: 'No trainers found',
    addFirstTrainer: 'Add your first trainer',
  },
  ar: {
    // Header
    title: 'المدربون المعتمدون',
    subtitle: 'إدارة المدربين المعتمدين الذين يقدمون برامج الشهادات',
    addTrainer: 'إضافة مدرب',
    // Stats
    totalTrainers: 'إجمالي المدربين',
    active: 'نشط',
    pendingApproval: 'بانتظار الموافقة',
    scpCertified: 'حاصل على SCP',
    // Status labels
    statusPending: 'قيد الانتظار',
    statusApproved: 'معتمد',
    statusSuspended: 'موقوف',
    statusInactive: 'غير نشط',
    // Filters
    searchPlaceholder: 'البحث في المدربين...',
    allStatus: 'جميع الحالات',
    allCertifications: 'جميع الشهادات',
    cpCertified: 'حاصل على CP',
    scpCertifiedFilter: 'حاصل على SCP',
    // Table
    allTrainers: 'جميع المدربين',
    viewAndManage: 'عرض وإدارة المدربين المعتمدين',
    trainer: 'المدرب',
    contact: 'التواصل',
    certifications: 'الشهادات',
    certificationExpiry: 'انتهاء الشهادة',
    status: 'الحالة',
    actions: 'الإجراءات',
    none: 'لا يوجد',
    inactive: 'غير نشط',
    // Actions
    viewDetails: 'عرض التفاصيل',
    edit: 'تعديل',
    sendEmail: 'إرسال بريد',
    linkedin: 'لينكد إن',
    activate: 'تفعيل',
    deactivate: 'إلغاء التفعيل',
    remove: 'إزالة',
    // Confirm dialogs
    activateTrainerTitle: 'تفعيل المدرب',
    deactivateTrainerTitle: 'إلغاء تفعيل المدرب',
    activateConfirmDesc: (name: string) => `هل أنت متأكد من تفعيل ${name}؟`,
    deactivateConfirmDesc: (name: string) => `هل أنت متأكد من إلغاء تفعيل ${name}؟`,
    activateBtn: 'تفعيل',
    deactivateBtn: 'إلغاء التفعيل',
    cancelBtn: 'إلغاء',
    // Empty state
    noTrainersFound: 'لم يتم العثور على مدربين',
    addFirstTrainer: 'أضف أول مدرب',
  },
};

const STATUS_COLORS: Record<TrainerStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-700',
};

export default function ECPTrainers() {
  const navigate = useNavigate();
  const { confirmDelete, confirm } = useCommonConfirms();
  const { language } = useLanguage();
  const texts = translations[language];

  // Status labels map
  const statusLabels: Record<TrainerStatus, string> = {
    pending: texts.statusPending,
    approved: texts.statusApproved,
    suspended: texts.statusSuspended,
    inactive: texts.statusInactive,
  };

  // Filters
  const [filters, setFilters] = useState<TrainerFilters>({});
  const [search, setSearch] = useState('');

  // Queries
  const { data: trainers, isLoading } = useTrainers({ ...filters, search });

  // Mutations
  const updateMutation = useUpdateTrainer();
  const deleteMutation = useDeleteTrainer();

  const handleDelete = async (trainer: Trainer) => {
    const confirmed = await confirmDelete(`${trainer.first_name} ${trainer.last_name}`);
    if (!confirmed) return;
    await deleteMutation.mutateAsync(trainer.id);
  };

  const handleToggleActive = async (trainer: Trainer) => {
    const isDeactivating = trainer.is_active;
    const trainerName = `${trainer.first_name} ${trainer.last_name}`;
    const confirmed = await confirm({
      title: isDeactivating ? texts.deactivateTrainerTitle : texts.activateTrainerTitle,
      description: isDeactivating ? texts.deactivateConfirmDesc(trainerName) : texts.activateConfirmDesc(trainerName),
      confirmText: isDeactivating ? texts.deactivateBtn : texts.activateBtn,
      cancelText: texts.cancelBtn,
      variant: isDeactivating ? 'destructive' : 'default',
    });

    if (!confirmed) return;

    await updateMutation.mutateAsync({
      id: trainer.id,
      dto: { is_active: !trainer.is_active },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${language === 'ar' ? 'from-navy-800 via-royal-600 to-sky-500' : 'from-sky-500 via-royal-600 to-navy-800'} rounded-lg p-6 text-white`}>
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className={language === 'ar' ? 'text-right' : ''}>
            <h1 className={`text-3xl font-bold flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <UserCheck className="h-8 w-8" />
              {texts.title}
            </h1>
            <p className="mt-2 opacity-90">
              {texts.subtitle}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/ecp/trainers/new')}
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <PlusCircle className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {texts.addTrainer}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{trainers?.length || 0}</div>
            <div className="text-sm text-gray-500">{texts.totalTrainers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {trainers?.filter((t) => t.status === 'approved' && t.is_active).length || 0}
            </div>
            <div className="text-sm text-gray-500">{texts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {trainers?.filter((t) => t.status === 'pending').length || 0}
            </div>
            <div className="text-sm text-gray-500">{texts.pendingApproval}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {trainers?.filter((t) => t.certifications?.includes('SCP')).length || 0}
            </div>
            <div className="text-sm text-gray-500">{texts.scpCertified}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex flex-col md:flex-row gap-4 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
                <Input
                  placeholder={texts.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={language === 'ar' ? 'pr-10' : 'pl-10'}
                />
              </div>
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  status: value === 'all' ? undefined : (value as TrainerStatus),
                })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={texts.allStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{texts.allStatus}</SelectItem>
                <SelectItem value="approved">{texts.statusApproved}</SelectItem>
                <SelectItem value="pending">{texts.statusPending}</SelectItem>
                <SelectItem value="suspended">{texts.statusSuspended}</SelectItem>
                <SelectItem value="inactive">{texts.statusInactive}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.certification || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  certification: value === 'all' ? undefined : (value as CertificationType),
                })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={texts.allCertifications} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{texts.allCertifications}</SelectItem>
                <SelectItem value="CP">{texts.cpCertified}</SelectItem>
                <SelectItem value="SCP">{texts.scpCertifiedFilter}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trainers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.allTrainers}</CardTitle>
          <CardDescription>{texts.viewAndManage}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{texts.trainer}</TableHead>
                <TableHead>{texts.contact}</TableHead>
                <TableHead>{texts.certifications}</TableHead>
                <TableHead>{texts.certificationExpiry}</TableHead>
                <TableHead>{texts.status}</TableHead>
                <TableHead>{texts.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers && trainers.length > 0 ? (
                trainers.map((trainer) => (
                  <TableRow key={trainer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {trainer.first_name[0]}
                            {trainer.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {trainer.first_name} {trainer.last_name}
                          </div>
                          {trainer.trainer_code && (
                            <div className="text-xs text-gray-500 font-mono">
                              {trainer.trainer_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{trainer.email}</div>
                      {trainer.phone && (
                        <div className="text-xs text-gray-500">{trainer.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`flex gap-1 ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                        {trainer.certifications?.map((cert) => (
                          <Badge
                            key={cert}
                            variant="outline"
                            className={
                              cert === 'CP'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-purple-50 text-purple-700'
                            }
                          >
                            {cert}
                          </Badge>
                        ))}
                        {(!trainer.certifications || trainer.certifications.length === 0) && (
                          <span className="text-gray-400">{texts.none}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {trainer.trainer_certification_expiry ? (
                        <div
                          className={
                            new Date(trainer.trainer_certification_expiry) < new Date()
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }
                        >
                          {new Date(trainer.trainer_certification_expiry).toLocaleDateString(
                            language === 'ar' ? 'ar-EG' : 'en-US'
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`flex flex-col gap-1 ${language === 'ar' ? 'items-end' : ''}`}>
                        <Badge className={STATUS_COLORS[trainer.status]}>{statusLabels[trainer.status]}</Badge>
                        {!trainer.is_active && trainer.status === 'approved' && (
                          <Badge variant="outline" className="text-xs">
                            {texts.inactive}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                          <DropdownMenuItem onClick={() => navigate(`/ecp/trainers/${trainer.id}`)} className={language === 'ar' ? 'flex-row-reverse' : ''}>
                            <Eye className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                            {texts.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/ecp/trainers/${trainer.id}/edit`)} className={language === 'ar' ? 'flex-row-reverse' : ''}>
                            <Edit className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                            {texts.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`mailto:${trainer.email}`)}
                            className={language === 'ar' ? 'flex-row-reverse' : ''}
                          >
                            <Mail className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                            {texts.sendEmail}
                          </DropdownMenuItem>
                          {trainer.linkedin_url && (
                            <DropdownMenuItem
                              onClick={() => window.open(trainer.linkedin_url, '_blank')}
                              className={language === 'ar' ? 'flex-row-reverse' : ''}
                            >
                              <ExternalLink className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                              {texts.linkedin}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleActive(trainer)} className={language === 'ar' ? 'flex-row-reverse' : ''}>
                            {trainer.is_active ? texts.deactivate : texts.activate}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={`text-red-600 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                            onClick={() => handleDelete(trainer)}
                          >
                            <Trash2 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                            {texts.remove}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{texts.noTrainersFound}</p>
                    <Button variant="link" size="sm" onClick={() => navigate('/ecp/trainers/new')}>
                      {texts.addFirstTrainer}
                    </Button>
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
