/**
 * Admin Partner Management
 *
 * Enhanced management for ECP and PDP partners with type-specific features
 * Partner details and editing now use dedicated pages instead of modals
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  GraduationCap,
  Edit,
  Search,
  UserCheck,
  UserX,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import {
  usePartners,
  usePartnerStats,
  useTogglePartnerStatus,
} from '@/entities/partners';
import type {
  Partner,
  PartnerFilters,
  PartnerType,
} from '@/entities/partners';
import { useLanguage } from '@/contexts/LanguageContext';

const PARTNER_TYPE_COLORS: Record<PartnerType, string> = {
  ecp: 'purple',
  pdp: 'green',
};

const PARTNER_TYPE_ICONS: Record<PartnerType, any> = {
  ecp: Building2,
  pdp: GraduationCap,
};

export default function PartnerManagement() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [filters, setFilters] = useState<PartnerFilters>({});
  const [search, setSearch] = useState('');

  const { data: partners, isLoading } = usePartners({ ...filters, search });
  const { data: stats } = usePartnerStats();

  const toggleStatusMutation = useTogglePartnerStatus();

  const handleToggleStatus = async (partnerId: string, currentStatus: boolean) => {
    await toggleStatusMutation.mutateAsync({ id: partnerId, is_active: !currentStatus });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">{t('partners.title')}</h1>
            <p className="mt-2 opacity-90">
              {t('partners.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('partners.ecpPartners')}</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.ecp_partners || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('partners.pdpPartners')}</p>
                <p className="text-3xl font-bold text-green-600">{stats?.pdp_partners || 0}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('partners.activePartners')}</p>
                <p className="text-3xl font-bold text-green-600">{stats?.active_partners || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('partners.inactivePartners')}</p>
                <p className="text-3xl font-bold text-gray-600">{(stats?.total_partners || 0) - (stats?.active_partners || 0)}</p>
              </div>
              <UserX className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('partners.allPartners')}</CardTitle>
              <CardDescription>{t('partners.manageDescription')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('partners.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.partnerType || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, partnerType: value === 'all' ? undefined : (value as PartnerType) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('membership.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('membership.allTypes')}</SelectItem>
                <SelectItem value="ecp">{t('partners.ecpPartners')}</SelectItem>
                <SelectItem value="pdp">{t('partners.pdpPartners')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  isActive: value === 'all' ? undefined : value === 'active',
                })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filters.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('common.active')}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('partners.partner')}</TableHead>
                  <TableHead>{t('membership.type')}</TableHead>
                  <TableHead>{t('partners.contactPerson')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.country')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.joined')}</TableHead>
                  <TableHead>{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners && partners.length > 0 ? (
                  partners.map((partner) => {
                    const Icon = PARTNER_TYPE_ICONS[partner.partner_type];
                    return (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 text-${PARTNER_TYPE_COLORS[partner.partner_type]}-600`} />
                            <span className="font-medium">{partner.company_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              partner.partner_type === 'ecp'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-green-100 text-green-700'
                            }
                          >
                            {partner.partner_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{partner.contact_person || '—'}</TableCell>
                        <TableCell>{partner.contact_email}</TableCell>
                        <TableCell>{partner.country || '—'}</TableCell>
                        <TableCell>
                          <Badge className={partner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {partner.is_active ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(partner.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/partners/${partner.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('partners.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/partners/${partner.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('partners.editPartner')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(partner.id, partner.is_active)}
                                disabled={toggleStatusMutation.isPending}
                              >
                                {partner.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    {t('userMgmt.deactivate')}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    {t('partners.activate')}
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {t('partners.noPartners')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

PartnerManagement.displayName = 'PartnerManagement';
