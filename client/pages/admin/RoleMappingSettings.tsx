import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/contexts/ConfirmDialogContext';
import {
  RoleMappingService,
  type WordPressRoleMapping,
  type WordPressRoleInfo,
  type SupabaseRoleInfo
} from '@/services/role-mapping.service';
import { ArrowUpDown } from 'lucide-react';

// Simple WordPress role selector component
const WordPressRoleSelector = ({
  selectedRole,
  onRoleChange,
  availableRoles,
  allMappings,
  currentSupabaseRole,
  confirm
}: {
  selectedRole: string | null;
  onRoleChange: (role: string | null) => void;
  availableRoles: WordPressRoleInfo[];
  allMappings: Record<string, string | null>;
  currentSupabaseRole: string;
  confirm: (options: any) => Promise<boolean>;
}) => {
  // Get WordPress roles that are already mapped to other Supabase roles
  const getAlreadyMappedRoles = () => {
    const mapped: Record<string, string> = {};
    Object.entries(allMappings).forEach(([supabaseRole, wpRole]) => {
      if (supabaseRole !== currentSupabaseRole && wpRole) {
        mapped[wpRole] = supabaseRole;
      }
    });
    return mapped;
  };

  const alreadyMapped = getAlreadyMappedRoles();

  const handleRoleSelection = async (newRole: string) => {
    // Check if role is already mapped to another Supabase role
    if (alreadyMapped[newRole]) {
      const mappedTo = alreadyMapped[newRole];
      const supabaseRoleInfo = RoleMappingService.getSupabaseRoles().find(r => r.role === mappedTo);
      const wpRoleInfo = availableRoles.find(r => r.role === newRole);

      const confirmed = await confirm({
        title: 'Role Already Mapped',
        description: `"${wpRoleInfo?.display_name}" is currently mapped to "${supabaseRoleInfo?.display_name}".

Do you want to move it to the current role? This will remove it from the previous mapping.`,
        confirmText: 'Move Role',
        cancelText: 'Cancel',
        variant: 'warning'
      });

      if (!confirmed) return;
    }

    onRoleChange(newRole);
  };

  return (
    <Select
      value={selectedRole || ''}
      onValueChange={(value) => {
        if (value === 'none') {
          onRoleChange(null);
        } else {
          handleRoleSelection(value);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select WordPress role..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-gray-500">No mapping</span>
        </SelectItem>
        {availableRoles.map((role) => {
          const isMappedElsewhere = alreadyMapped[role.role];
          const mappedToRole = isMappedElsewhere ?
            RoleMappingService.getSupabaseRoles().find(r => r.role === alreadyMapped[role.role]) : null;

          return (
            <SelectItem
              key={role.role}
              value={role.role}
              className={isMappedElsewhere ? 'bg-orange-50' : ''}
            >
              <div className="flex flex-col">
                <div className="font-medium">{role.display_name}</div>
                {isMappedElsewhere && (
                  <div className="text-xs text-orange-600">
                    ⚠️ Currently mapped to {mappedToRole?.display_name}
                  </div>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default function RoleMappingSettings() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [roleMappings, setRoleMappings] = useState<Record<string, string | null>>({});

  const wpRoles = RoleMappingService.getWordPressRoles();
  const supabaseRoles = RoleMappingService.getSupabaseRoles();

  // Load mappings on component mount
  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const { data, error } = await RoleMappingService.getAllMappings();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load role mappings",
          variant: "destructive",
        });
        return;
      }

      // Convert array of mappings to 1-to-1 mapping
      const mappings: Record<string, string | null> = {};

      // Initialize all supabase roles with null
      supabaseRoles.forEach(role => {
        mappings[role.role] = null;
      });

      // Set mappings (only the first WordPress role per Supabase role)
      data?.forEach(mapping => {
        if (!mappings[mapping.supabase_role]) {
          mappings[mapping.supabase_role] = mapping.wordpress_role;
        }
      });

      setRoleMappings(mappings);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = async (supabaseRole: string, wpRole: string | null) => {
    try {
      // Get current mappings to identify conflicts
      const { data: existingMappings } = await RoleMappingService.getAllMappings();
      if (!existingMappings) return;

      // Delete existing mappings for this supabase role
      const currentMappings = existingMappings.filter(m => m.supabase_role === supabaseRole);
      await Promise.all(currentMappings.map(m => RoleMappingService.deleteMapping(m.id)));

      if (wpRole) {
        // Find and delete any existing mapping for this WordPress role
        const conflictingMappings = existingMappings.filter(m =>
          m.wordpress_role === wpRole && m.supabase_role !== supabaseRole
        );
        await Promise.all(conflictingMappings.map(m => RoleMappingService.deleteMapping(m.id)));

        // Create new mapping
        const wpRoleInfo = RoleMappingService.getWordPressRoles().find(r => r.role === wpRole);
        await RoleMappingService.upsertMapping({
          wordpress_role: wpRole,
          wordpress_role_display: wpRoleInfo?.display_name || wpRole,
          supabase_role: supabaseRole as SupabaseRoleInfo['role'],
          priority: 0
        });
      }

      // Update local state - reload all mappings to reflect changes
      await loadMappings();

      toast({
        title: "Success",
        description: "Role mapping updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update mapping",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Mapping</h1>
        <p className="text-gray-600 mt-2">
          Map WordPress roles to Supabase roles for seamless authentication
        </p>
      </div>

      {/* Simple Side-by-Side Role Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Role Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {supabaseRoles.map((supabaseRole) => (
              <div key={supabaseRole.role} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* Supabase Role - Left */}
                  <div className="space-y-2">
                    <div className="font-semibold text-lg">{supabaseRole.display_name}</div>
                    <div className="text-sm text-gray-600">{supabaseRole.description}</div>
                    <Badge variant="outline" className="w-fit">
                      {supabaseRole.role}
                    </Badge>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowUpDown className="w-6 h-6 text-gray-400 rotate-90 lg:rotate-0" />
                  </div>

                  {/* WordPress Role - Right */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Mapped WordPress Role</div>
                    <WordPressRoleSelector
                      selectedRole={roleMappings[supabaseRole.role] || null}
                      onRoleChange={(wpRole) => updateMapping(supabaseRole.role, wpRole)}
                      availableRoles={wpRoles}
                      allMappings={roleMappings}
                      currentSupabaseRole={supabaseRole.role}
                      confirm={confirm}
                    />
                    {roleMappings[supabaseRole.role] && (
                      <div className="text-xs text-gray-500">
                        Currently mapped to: {wpRoles.find(r => r.role === roleMappings[supabaseRole.role])?.display_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}