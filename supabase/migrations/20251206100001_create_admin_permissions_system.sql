-- Migration: Create Admin Permissions System
-- Date: 2024-12-06
-- Description: Implements US1-US3 from Admin Panel spec
--   US1: Create Admin Users (Super Admin only)
--   US2: Assign Admin Roles & Permissions (8 default roles with permissions matrix)
--   US3: Manage Admin Accounts (deactivate/reactivate, reset passwords, audit logs)

-- ============================================
-- ENUM: Admin Role Types
-- ============================================

-- Create enum for admin-specific role types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role_type') THEN
        CREATE TYPE admin_role_type AS ENUM (
            'super_admin',           -- Full system access
            'certification_manager', -- Manages certifications, exams
            'partner_manager',       -- Manages ECP/PDP partners
            'pdc_manager',           -- Manages PDC submissions
            'content_manager',       -- Manages curriculum, questions, flashcards
            'finance_admin',         -- Manages vouchers, finances
            'support_admin',         -- Manages support tickets
            'read_only_reviewer'     -- Read-only access for audits
        );
    END IF;
END$$;

-- ============================================
-- TABLE: Admin Roles (Extended role definitions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_type admin_role_type NOT NULL UNIQUE,

    -- Display info
    display_name TEXT NOT NULL,
    display_name_ar TEXT,
    description TEXT,
    description_ar TEXT,

    -- Role hierarchy (higher = more permissions)
    hierarchy_level INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: Admin Permissions (Granular permissions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    permission_key TEXT NOT NULL UNIQUE,

    -- Display info
    display_name TEXT NOT NULL,
    display_name_ar TEXT,
    description TEXT,
    description_ar TEXT,

    -- Grouping for UI
    module TEXT NOT NULL, -- 'users', 'certifications', 'partners', etc.

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: Role-Permission Mapping
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_type admin_role_type NOT NULL,
    permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,

    -- Whether this permission can be edited for this role
    is_customizable BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_role_permission UNIQUE (role_type, permission_id)
);

-- ============================================
-- TABLE: Admin Users (Extended user info for admins)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    admin_role_type admin_role_type NOT NULL DEFAULT 'read_only_reviewer',

    -- Admin-specific info
    department TEXT,
    employee_id TEXT,

    -- Custom permission overrides (additions/removals from role defaults)
    custom_permissions_added TEXT[] DEFAULT '{}',
    custom_permissions_removed TEXT[] DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by UUID REFERENCES public.users(id),
    deactivation_reason TEXT,

    -- Password management
    password_reset_required BOOLEAN DEFAULT false,
    last_password_change TIMESTAMP WITH TIME ZONE,

    -- Login tracking
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip TEXT,

    -- Metadata
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: Admin Activity Logs (Audit trail for US3)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

    -- Action details
    action_type TEXT NOT NULL, -- 'role_change', 'permission_change', 'account_create', 'account_deactivate', 'password_reset', etc.
    action_target_type TEXT, -- 'user', 'admin', 'certification', etc.
    action_target_id UUID,

    -- Change details
    old_value JSONB,
    new_value JSONB,

    -- Context
    ip_address TEXT,
    user_agent TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_roles_type ON public.admin_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_key ON public.admin_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_module ON public.admin_permissions(module);

CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role ON public.admin_role_permissions(role_type);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_perm ON public.admin_role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_admin_users_user ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(admin_role_type);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_type ON public.admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON public.admin_activity_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin roles - readable by all admins
CREATE POLICY "Admins can view admin roles" ON public.admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Only super_admin can modify admin roles
CREATE POLICY "Super admin can manage admin roles" ON public.admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
        )
    );

-- Admin permissions - readable by all admins
CREATE POLICY "Admins can view permissions" ON public.admin_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Only super_admin can modify permissions
CREATE POLICY "Super admin can manage permissions" ON public.admin_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
        )
    );

-- Role-permission mapping - readable by all admins
CREATE POLICY "Admins can view role permissions" ON public.admin_role_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Only super_admin can modify role permissions
CREATE POLICY "Super admin can manage role permissions" ON public.admin_role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
        )
    );

-- Admin users - readable by all admins
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Only super_admin can modify admin users
CREATE POLICY "Super admin can manage admin users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
        )
    );

-- Activity logs - readable by super admin only
CREATE POLICY "Super admin can view activity logs" ON public.admin_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
        )
    );

-- Admins can insert their own activity
CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- SEED DATA: Admin Roles
-- ============================================

INSERT INTO public.admin_roles (role_type, display_name, display_name_ar, description, description_ar, hierarchy_level)
VALUES
    ('super_admin', 'Super Administrator', 'المسؤول الأعلى',
     'Full system access with all permissions. Can create and manage other admins.',
     'وصول كامل للنظام مع جميع الصلاحيات. يمكنه إنشاء وإدارة المسؤولين الآخرين.', 100),

    ('certification_manager', 'Certification Manager', 'مدير الشهادات',
     'Manages certifications, exam results, and certificate issuance.',
     'يدير الشهادات ونتائج الامتحانات وإصدار الشهادات.', 70),

    ('partner_manager', 'Partner Manager', 'مدير الشركاء',
     'Manages ECP and PDP partner relationships, applications, and licensing.',
     'يدير علاقات شركاء ECP و PDP والطلبات والتراخيص.', 70),

    ('pdc_manager', 'PDC Manager', 'مدير PDC',
     'Reviews and validates PDC submissions from certified professionals.',
     'يراجع ويصادق على طلبات PDC من المحترفين المعتمدين.', 60),

    ('content_manager', 'Content Manager', 'مدير المحتوى',
     'Manages curriculum, question banks, flashcards, and learning materials.',
     'يدير المناهج وبنوك الأسئلة والبطاقات التعليمية ومواد التعلم.', 60),

    ('finance_admin', 'Finance Administrator', 'مسؤول المالية',
     'Manages vouchers, payments, and financial reports.',
     'يدير القسائم والمدفوعات والتقارير المالية.', 50),

    ('support_admin', 'Support Administrator', 'مسؤول الدعم',
     'Handles support tickets and user inquiries.',
     'يتعامل مع تذاكر الدعم واستفسارات المستخدمين.', 40),

    ('read_only_reviewer', 'Read-only Reviewer', 'مراجع للقراءة فقط',
     'Can view all data but cannot make changes. Used for auditing.',
     'يمكنه عرض جميع البيانات ولكن لا يمكنه إجراء تغييرات. يستخدم للتدقيق.', 10)
ON CONFLICT (role_type) DO NOTHING;

-- ============================================
-- SEED DATA: Admin Permissions
-- ============================================

INSERT INTO public.admin_permissions (permission_key, display_name, display_name_ar, description, module)
VALUES
    -- Users Module
    ('users.view', 'View Users', 'عرض المستخدمين', 'View all registered users', 'users'),
    ('users.edit', 'Edit Users', 'تعديل المستخدمين', 'Edit user profiles and details', 'users'),
    ('users.create', 'Create Users', 'إنشاء مستخدمين', 'Create new user accounts', 'users'),
    ('users.deactivate', 'Deactivate Users', 'إلغاء تنشيط المستخدمين', 'Deactivate user accounts', 'users'),
    ('users.bulk_upload', 'Bulk Upload Users', 'رفع مستخدمين بالجملة', 'Upload users via Excel', 'users'),

    -- Admin Module
    ('admins.view', 'View Admins', 'عرض المسؤولين', 'View all admin accounts', 'admins'),
    ('admins.create', 'Create Admins', 'إنشاء مسؤولين', 'Create new admin accounts', 'admins'),
    ('admins.edit', 'Edit Admins', 'تعديل المسؤولين', 'Edit admin roles and permissions', 'admins'),
    ('admins.deactivate', 'Deactivate Admins', 'إلغاء تنشيط المسؤولين', 'Deactivate admin accounts', 'admins'),
    ('admins.reset_password', 'Reset Admin Passwords', 'إعادة تعيين كلمات مرور المسؤولين', 'Reset admin passwords', 'admins'),

    -- Certifications Module
    ('certifications.view', 'View Certifications', 'عرض الشهادات', 'View all certifications', 'certifications'),
    ('certifications.issue', 'Issue Certifications', 'إصدار الشهادات', 'Issue new certifications', 'certifications'),
    ('certifications.revoke', 'Revoke Certifications', 'إلغاء الشهادات', 'Revoke certifications', 'certifications'),
    ('certifications.extend', 'Extend Certifications', 'تمديد الشهادات', 'Extend certification validity', 'certifications'),
    ('certifications.reassign', 'Reassign Certifications', 'إعادة تعيين الشهادات', 'Transfer certifications between users', 'certifications'),

    -- Exams Module
    ('exams.view', 'View Exams', 'عرض الامتحانات', 'View exam attempts and results', 'exams'),
    ('exams.manage', 'Manage Exams', 'إدارة الامتحانات', 'Configure and manage official exams', 'exams'),
    ('exams.grade', 'Grade Exams', 'تصحيح الامتحانات', 'Grade and approve exam results', 'exams'),
    ('exams.reopen', 'Reopen Exam Attempts', 'إعادة فتح محاولات الامتحان', 'Allow candidates to retake exams', 'exams'),

    -- Mock Exams Module
    ('mocks.view', 'View Mock Exams', 'عرض الامتحانات التجريبية', 'View mock exam data', 'mocks'),
    ('mocks.manage', 'Manage Mock Exams', 'إدارة الامتحانات التجريبية', 'Create and edit mock exams', 'mocks'),

    -- Partners Module (ECP)
    ('ecp.view', 'View ECP Partners', 'عرض شركاء ECP', 'View ECP partner data', 'partners'),
    ('ecp.manage', 'Manage ECP Partners', 'إدارة شركاء ECP', 'Create and edit ECP partners', 'partners'),
    ('ecp.approve', 'Approve ECP Applications', 'الموافقة على طلبات ECP', 'Approve or reject ECP applications', 'partners'),

    -- Partners Module (PDP)
    ('pdp.view', 'View PDP Partners', 'عرض شركاء PDP', 'View PDP partner data', 'partners'),
    ('pdp.manage', 'Manage PDP Partners', 'إدارة شركاء PDP', 'Create and edit PDP partners', 'partners'),
    ('pdp.programs', 'Manage PDP Programs', 'إدارة برامج PDP', 'Approve and manage PDP programs', 'partners'),

    -- Vouchers Module
    ('vouchers.view', 'View Vouchers', 'عرض القسائم', 'View all vouchers', 'vouchers'),
    ('vouchers.generate', 'Generate Vouchers', 'إنشاء قسائم', 'Generate new vouchers', 'vouchers'),
    ('vouchers.assign', 'Assign Vouchers', 'تعيين القسائم', 'Assign vouchers to users or batches', 'vouchers'),

    -- PDC Module
    ('pdcs.view', 'View PDCs', 'عرض PDCs', 'View PDC submissions', 'pdcs'),
    ('pdcs.approve', 'Approve PDCs', 'الموافقة على PDCs', 'Approve or reject PDC submissions', 'pdcs'),
    ('pdcs.edit', 'Edit PDCs', 'تعديل PDCs', 'Edit PDC totals and details', 'pdcs'),

    -- Learning System Module
    ('curriculum.view', 'View Curriculum', 'عرض المناهج', 'View curriculum content', 'learning'),
    ('curriculum.manage', 'Manage Curriculum', 'إدارة المناهج', 'Create and edit curriculum modules and lessons', 'learning'),
    ('questions.view', 'View Question Bank', 'عرض بنك الأسئلة', 'View question bank', 'learning'),
    ('questions.manage', 'Manage Question Bank', 'إدارة بنك الأسئلة', 'Add and edit questions', 'learning'),
    ('flashcards.view', 'View Flashcards', 'عرض البطاقات التعليمية', 'View flashcard sets', 'learning'),
    ('flashcards.manage', 'Manage Flashcards', 'إدارة البطاقات التعليمية', 'Create and edit flashcards', 'learning'),

    -- Memberships Module
    ('memberships.view', 'View Memberships', 'عرض العضويات', 'View all memberships', 'memberships'),
    ('memberships.manage', 'Manage Memberships', 'إدارة العضويات', 'Activate, extend, and deactivate memberships', 'memberships'),

    -- Support Module
    ('support.view', 'View Support Tickets', 'عرض تذاكر الدعم', 'View support tickets', 'support'),
    ('support.respond', 'Respond to Tickets', 'الرد على التذاكر', 'Reply to support tickets', 'support'),
    ('support.manage', 'Manage Tickets', 'إدارة التذاكر', 'Assign and close tickets', 'support'),

    -- Content Module
    ('content.view', 'View Resources', 'عرض الموارد', 'View content resources', 'content'),
    ('content.manage', 'Manage Resources', 'إدارة الموارد', 'Upload and manage resources', 'content'),

    -- Reports Module
    ('reports.view', 'View Reports', 'عرض التقارير', 'Access analytics and reports', 'reports'),
    ('reports.export', 'Export Reports', 'تصدير التقارير', 'Export data and reports', 'reports'),

    -- Settings Module
    ('settings.view', 'View Settings', 'عرض الإعدادات', 'View system settings', 'settings'),
    ('settings.manage', 'Manage Settings', 'إدارة الإعدادات', 'Configure system settings', 'settings'),

    -- Audit Module
    ('audit.view', 'View Audit Logs', 'عرض سجلات التدقيق', 'View activity and audit logs', 'audit')
ON CONFLICT (permission_key) DO NOTHING;

-- ============================================
-- SEED DATA: Default Role-Permission Mappings
-- ============================================

-- Super Admin gets all permissions
INSERT INTO public.admin_role_permissions (role_type, permission_id, is_customizable)
SELECT 'super_admin', id, false
FROM public.admin_permissions
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- Certification Manager
INSERT INTO public.admin_role_permissions (role_type, permission_id)
SELECT 'certification_manager', id
FROM public.admin_permissions
WHERE permission_key IN (
    'users.view', 'users.edit',
    'certifications.view', 'certifications.issue', 'certifications.revoke', 'certifications.extend', 'certifications.reassign',
    'exams.view', 'exams.manage', 'exams.grade', 'exams.reopen',
    'mocks.view', 'mocks.manage',
    'vouchers.view', 'vouchers.generate', 'vouchers.assign',
    'reports.view', 'reports.export'
)
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- Partner Manager
INSERT INTO public.admin_role_permissions (role_type, permission_id)
SELECT 'partner_manager', id
FROM public.admin_permissions
WHERE permission_key IN (
    'users.view', 'users.edit', 'users.create',
    'ecp.view', 'ecp.manage', 'ecp.approve',
    'pdp.view', 'pdp.manage', 'pdp.programs',
    'vouchers.view', 'vouchers.generate', 'vouchers.assign',
    'reports.view', 'reports.export'
)
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- PDC Manager
INSERT INTO public.admin_role_permissions (role_type, permission_id)
SELECT 'pdc_manager', id
FROM public.admin_permissions
WHERE permission_key IN (
    'users.view',
    'pdcs.view', 'pdcs.approve', 'pdcs.edit',
    'pdp.view',
    'certifications.view',
    'reports.view'
)
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- Content Manager
INSERT INTO public.admin_role_permissions (role_type, permission_id)
SELECT 'content_manager', id
FROM public.admin_permissions
WHERE permission_key IN (
    'curriculum.view', 'curriculum.manage',
    'questions.view', 'questions.manage',
    'flashcards.view', 'flashcards.manage',
    'mocks.view', 'mocks.manage',
    'content.view', 'content.manage'
)
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- Finance Admin
INSERT INTO public.admin_role_permissions (role_type, permission_id)
SELECT 'finance_admin', id
FROM public.admin_permissions
WHERE permission_key IN (
    'users.view',
    'vouchers.view', 'vouchers.generate', 'vouchers.assign',
    'memberships.view', 'memberships.manage',
    'reports.view', 'reports.export'
)
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- Support Admin
INSERT INTO public.admin_role_permissions (role_type, permission_id)
SELECT 'support_admin', id
FROM public.admin_permissions
WHERE permission_key IN (
    'users.view', 'users.edit',
    'support.view', 'support.respond', 'support.manage',
    'certifications.view',
    'memberships.view'
)
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- Read-only Reviewer
INSERT INTO public.admin_role_permissions (role_type, permission_id)
SELECT 'read_only_reviewer', id
FROM public.admin_permissions
WHERE permission_key LIKE '%.view' OR permission_key = 'audit.view'
ON CONFLICT (role_type, permission_id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if admin has a specific permission
CREATE OR REPLACE FUNCTION public.admin_has_permission(
    p_user_id UUID,
    p_permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_role admin_role_type;
    v_custom_added TEXT[];
    v_custom_removed TEXT[];
    v_has_permission BOOLEAN;
BEGIN
    -- Get admin info
    SELECT admin_role_type, custom_permissions_added, custom_permissions_removed
    INTO v_admin_role, v_custom_added, v_custom_removed
    FROM public.admin_users
    WHERE user_id = p_user_id AND is_active = true;

    IF v_admin_role IS NULL THEN
        RETURN false;
    END IF;

    -- Super admin has all permissions
    IF v_admin_role = 'super_admin' THEN
        RETURN true;
    END IF;

    -- Check if permission is in custom_removed
    IF p_permission_key = ANY(v_custom_removed) THEN
        RETURN false;
    END IF;

    -- Check if permission is in custom_added
    IF p_permission_key = ANY(v_custom_added) THEN
        RETURN true;
    END IF;

    -- Check role default permissions
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_role_permissions arp
        JOIN public.admin_permissions ap ON ap.id = arp.permission_id
        WHERE arp.role_type = v_admin_role
        AND ap.permission_key = p_permission_key
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for an admin user
CREATE OR REPLACE FUNCTION public.get_admin_permissions(p_user_id UUID)
RETURNS TABLE (permission_key TEXT) AS $$
DECLARE
    v_admin_role admin_role_type;
    v_custom_added TEXT[];
    v_custom_removed TEXT[];
BEGIN
    -- Get admin info
    SELECT au.admin_role_type, au.custom_permissions_added, au.custom_permissions_removed
    INTO v_admin_role, v_custom_added, v_custom_removed
    FROM public.admin_users au
    WHERE au.user_id = p_user_id AND au.is_active = true;

    IF v_admin_role IS NULL THEN
        RETURN;
    END IF;

    -- Super admin gets all permissions
    IF v_admin_role = 'super_admin' THEN
        RETURN QUERY SELECT ap.permission_key FROM public.admin_permissions ap WHERE ap.is_active = true;
        RETURN;
    END IF;

    -- Return role default permissions + custom added - custom removed
    RETURN QUERY
    SELECT DISTINCT perm_key
    FROM (
        -- Role default permissions
        SELECT ap.permission_key as perm_key
        FROM public.admin_role_permissions arp
        JOIN public.admin_permissions ap ON ap.id = arp.permission_id
        WHERE arp.role_type = v_admin_role AND ap.is_active = true

        UNION

        -- Custom added permissions
        SELECT unnest(v_custom_added) as perm_key
    ) all_perms
    WHERE perm_key NOT IN (SELECT unnest(v_custom_removed));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin user (US1)
CREATE OR REPLACE FUNCTION public.create_admin_user(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_admin_role_type admin_role_type,
    p_department TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_auth_user_id UUID;
    v_admin_id UUID;
BEGIN
    -- Verify caller is super_admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Only super admin can create admin users';
    END IF;

    -- Check if admin cannot create roles higher than their own
    -- (For now, only super_admin can create admins, so this is simplified)

    -- Get or create user in public.users
    SELECT id INTO v_auth_user_id
    FROM public.users
    WHERE email = p_email;

    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % does not exist. Create user first.', p_email;
    END IF;

    -- Update user role to admin
    UPDATE public.users
    SET role = 'admin', updated_at = NOW()
    WHERE id = v_auth_user_id;

    -- Create admin_users entry
    INSERT INTO public.admin_users (
        user_id, admin_role_type, department, created_by
    ) VALUES (
        v_auth_user_id, p_admin_role_type, p_department, COALESCE(p_created_by, auth.uid())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET admin_role_type = p_admin_role_type,
        department = p_department,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_admin_id;

    -- Log activity
    INSERT INTO public.admin_activity_logs (
        admin_user_id, action_type, action_target_type, action_target_id,
        new_value
    ) VALUES (
        (SELECT id FROM public.admin_users WHERE user_id = auth.uid()),
        'account_create',
        'admin',
        v_admin_id,
        jsonb_build_object('email', p_email, 'role', p_admin_role_type)
    );

    RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate admin user (US3)
CREATE OR REPLACE FUNCTION public.deactivate_admin_user(
    p_admin_user_id UUID,
    p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_target_role admin_role_type;
    v_target_user_id UUID;
BEGIN
    -- Verify caller is super_admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Only super admin can deactivate admin users';
    END IF;

    -- Get target admin info
    SELECT admin_role_type, user_id INTO v_target_role, v_target_user_id
    FROM public.admin_users
    WHERE id = p_admin_user_id;

    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'Admin user not found';
    END IF;

    -- Prevent deactivating self
    IF v_target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot deactivate your own account';
    END IF;

    -- Deactivate
    UPDATE public.admin_users
    SET is_active = false,
        deactivated_at = NOW(),
        deactivated_by = auth.uid(),
        deactivation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_admin_user_id;

    -- Optionally downgrade user role to individual
    UPDATE public.users
    SET role = 'individual', updated_at = NOW()
    WHERE id = v_target_user_id;

    -- Log activity
    INSERT INTO public.admin_activity_logs (
        admin_user_id, action_type, action_target_type, action_target_id,
        new_value
    ) VALUES (
        (SELECT id FROM public.admin_users WHERE user_id = auth.uid()),
        'account_deactivate',
        'admin',
        p_admin_user_id,
        jsonb_build_object('reason', p_reason)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate admin user (US3)
CREATE OR REPLACE FUNCTION public.reactivate_admin_user(
    p_admin_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_target_user_id UUID;
BEGIN
    -- Verify caller is super_admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Only super admin can reactivate admin users';
    END IF;

    -- Get target admin
    SELECT user_id INTO v_target_user_id
    FROM public.admin_users
    WHERE id = p_admin_user_id;

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found';
    END IF;

    -- Reactivate
    UPDATE public.admin_users
    SET is_active = true,
        deactivated_at = NULL,
        deactivated_by = NULL,
        deactivation_reason = NULL,
        updated_at = NOW()
    WHERE id = p_admin_user_id;

    -- Restore admin role
    UPDATE public.users
    SET role = 'admin', updated_at = NOW()
    WHERE id = v_target_user_id;

    -- Log activity
    INSERT INTO public.admin_activity_logs (
        admin_user_id, action_type, action_target_type, action_target_id
    ) VALUES (
        (SELECT id FROM public.admin_users WHERE user_id = auth.uid()),
        'account_reactivate',
        'admin',
        p_admin_user_id
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change admin role (US2, US3)
CREATE OR REPLACE FUNCTION public.change_admin_role(
    p_admin_user_id UUID,
    p_new_role admin_role_type
) RETURNS BOOLEAN AS $$
DECLARE
    v_old_role admin_role_type;
    v_caller_hierarchy INTEGER;
    v_target_hierarchy INTEGER;
    v_new_hierarchy INTEGER;
BEGIN
    -- Verify caller is super_admin or has higher hierarchy
    SELECT ar.hierarchy_level INTO v_caller_hierarchy
    FROM public.admin_users au
    JOIN public.admin_roles ar ON ar.role_type = au.admin_role_type
    WHERE au.user_id = auth.uid() AND au.is_active = true;

    IF v_caller_hierarchy IS NULL THEN
        RAISE EXCEPTION 'Caller is not an active admin';
    END IF;

    -- Get target current role hierarchy
    SELECT au.admin_role_type, ar.hierarchy_level
    INTO v_old_role, v_target_hierarchy
    FROM public.admin_users au
    JOIN public.admin_roles ar ON ar.role_type = au.admin_role_type
    WHERE au.id = p_admin_user_id;

    IF v_old_role IS NULL THEN
        RAISE EXCEPTION 'Target admin user not found';
    END IF;

    -- Get new role hierarchy
    SELECT hierarchy_level INTO v_new_hierarchy
    FROM public.admin_roles
    WHERE role_type = p_new_role;

    -- Check that caller cannot assign roles higher than their own
    IF v_new_hierarchy >= v_caller_hierarchy AND v_caller_hierarchy < 100 THEN
        RAISE EXCEPTION 'Cannot assign a role equal to or higher than your own';
    END IF;

    -- Check that caller cannot modify admins at or above their level
    IF v_target_hierarchy >= v_caller_hierarchy AND v_caller_hierarchy < 100 THEN
        RAISE EXCEPTION 'Cannot modify an admin at or above your level';
    END IF;

    -- Update role
    UPDATE public.admin_users
    SET admin_role_type = p_new_role,
        updated_at = NOW()
    WHERE id = p_admin_user_id;

    -- Log activity
    INSERT INTO public.admin_activity_logs (
        admin_user_id, action_type, action_target_type, action_target_id,
        old_value, new_value
    ) VALUES (
        (SELECT id FROM public.admin_users WHERE user_id = auth.uid()),
        'role_change',
        'admin',
        p_admin_user_id,
        jsonb_build_object('role', v_old_role),
        jsonb_build_object('role', p_new_role)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON public.admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
