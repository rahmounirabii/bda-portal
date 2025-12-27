# BDA Portal - Plan de Structure UX/UI

## 🎯 Architecture des Profils et Navigation

### 1. PROFIL INDIVIDUEL (Individual User)

#### 📱 Sidebar Menu
```typescript
const individualMenu = [
  { icon: "LayoutDashboard", label: "Dashboard", path: "/dashboard" },
  { icon: "BookOpen", label: "My Books", path: "/my-books" },
  { icon: "GraduationCap", label: "Exam Applications", path: "/exam-applications" },
  { icon: "ClipboardCheck", label: "Mock Exams", path: "/mock-exams" },
  { icon: "Award", label: "My Certifications", path: "/my-certifications" },
  { icon: "Star", label: "My Recognitions", path: "/my-recognitions" },
  { icon: "Clock", label: "PDCs", path: "/pdcs" },
  { icon: "Building2", label: "Authorized Providers", path: "/authorized-providers" },
  { icon: "FolderOpen", label: "Resources", path: "/resources" },
  { icon: "ShieldCheck", label: "Verify Certification", path: "/verify-certification" },
  { icon: "HelpCircle", label: "Help Center", path: "/help-center" },
  { icon: "ExternalLink", label: "Return to Website", path: "https://bda-global.org", external: true },
  { icon: "LogOut", label: "Sign Out", action: "logout" }
];
```

#### 📄 Pages à Créer
1. **Dashboard** - `/dashboard`
   - Metrics cards (certifications, PDCs, upcoming deadlines)
   - Recent activity feed
   - Quick actions buttons

2. **My Books** - `/my-books`
   - Grid view of purchased materials
   - Download buttons with expiry dates
   - Search/filter functionality

3. **Exam Applications** - `/exam-applications`
   - Available exams (CP™, SCP™)
   - Purchase voucher flow
   - Profile completion check

4. **Mock Exams** - `/mock-exams`
   - Language selection (EN/AR)
   - Practice exam interface
   - Results summary (non-recorded)

5. **My Certifications** - `/my-certifications`
   - Active certifications list
   - Expiry countdown
   - Certificate download
   - Curriculum access (if purchased)

6. **My Recognitions** - `/my-recognitions`
   - Badges gallery
   - Achievement timeline

7. **PDCs** - `/pdcs`
   - Progress bar (X/60 credits)
   - Add PDC form with Program ID
   - PDC history table
   - Upload evidence

8. **Authorized Providers** - `/authorized-providers`
   - Searchable directory
   - Filter by country/type
   - Provider cards with contact info

9. **Resources** - `/resources`
   - Categorized downloads
   - Language toggle
   - Search functionality

10. **Verify Certification** - `/verify-certification`
    - Search by ID or name
    - Results display card

11. **Help Center** - `/help-center`
    - FAQ accordion
    - Ticket submission form
    - Live chat widget

---

### 2. PROFIL ECP (Endorsed Certification Partner)

#### 📱 Sidebar Menu
```typescript
const ecpMenu = [
  { icon: "LayoutDashboard", label: "Dashboard", path: "/ecp/dashboard" },
  { icon: "Users", label: "Candidate Management", path: "/ecp/candidates" },
  { icon: "Ticket", label: "Exam Vouchers", path: "/ecp/vouchers" },
  { icon: "Calendar", label: "Training Deliveries", path: "/ecp/trainings" },
  { icon: "UserCheck", label: "Certified Trainers", path: "/ecp/trainers" },
  { icon: "BarChart3", label: "Performance Reports", path: "/ecp/reports" },
  { icon: "FileText", label: "License & Agreement", path: "/ecp/license" },
  { icon: "Palette", label: "Promotional Toolkit", path: "/ecp/toolkit" },
  { icon: "HelpCircle", label: "Help Center", path: "/ecp/help" },
  { icon: "LogOut", label: "Sign Out", action: "logout" }
];
```

#### 📄 Pages à Créer
1. **ECP Dashboard** - `/ecp/dashboard`
   - KPI widgets (candidates, trainings, success rate)
   - Alerts/reminders section
   - Recent activity log

2. **Candidate Management** - `/ecp/candidates`
   - Data table with filters
   - Add candidate modal
   - Import CSV button
   - Status workflow visualization

3. **Exam Vouchers** - `/ecp/vouchers`
   - Request new vouchers form
   - Voucher inventory table
   - Assignment interface

4. **Training Deliveries** - `/ecp/trainings`
   - Calendar view
   - Add training form
   - Upload photos/feedback

5. **Certified Trainers** - `/ecp/trainers`
   - Trainers list
   - Assignment to programs
   - Performance metrics

6. **Performance Reports** - `/ecp/reports`
   - Filter panel
   - Charts and graphs
   - Export buttons

7. **License & Agreement** - `/ecp/license`
   - PDF viewer
   - Renewal timeline
   - Contact for updates

8. **Promotional Toolkit** - `/ecp/toolkit`
   - Logo downloads
   - Template gallery
   - Brand guidelines

---

### 3. PROFIL PDP (Professional Development Partner)

#### 📱 Sidebar Menu
```typescript
const pdpMenu = [
  { icon: "LayoutDashboard", label: "Dashboard", path: "/pdp/dashboard" },
  { icon: "BookOpen", label: "My Accredited Programs", path: "/pdp/programs" },
  { icon: "PlusCircle", label: "Submit New Program", path: "/pdp/submit-program" },
  { icon: "Edit", label: "Edit Partner Profile", path: "/pdp/profile" },
  { icon: "FileText", label: "Accreditation Guidelines", path: "/pdp/guidelines" },
  { icon: "Upload", label: "Annual Report", path: "/pdp/annual-report" },
  { icon: "MessageCircle", label: "Support Center", path: "/pdp/support" },
  { icon: "LogOut", label: "Sign Out", action: "logout" }
];
```

#### 📄 Pages à Créer
1. **PDP Dashboard** - `/pdp/dashboard`
   - Program metrics cards
   - Compliance status widget
   - Notifications panel

2. **My Accredited Programs** - `/pdp/programs`
   - Programs table with status badges
   - Program ID display
   - Edit/view actions

3. **Submit New Program** - `/pdp/submit-program`
   - Multi-step form
   - BoCK™ competencies checklist
   - File upload area
   - Auto-generated ID confirmation

4. **Edit Partner Profile** - `/pdp/profile`
   - Organization details form
   - Contact information
   - Logo upload

5. **Accreditation Guidelines** - `/pdp/guidelines`
   - Document library
   - Policy viewer
   - Download templates

6. **Annual Report** - `/pdp/annual-report`
   - Upload interface
   - Previous reports archive
   - Submission status

7. **Support Center** - `/pdp/support`
   - Ticket system
   - FAQ section
   - Direct messaging

---

### 4. PROFIL ADMIN (BDA Administrator)

#### 📱 Sidebar Menu
```typescript
const adminMenu = [
  { icon: "LayoutDashboard", label: "Admin Dashboard", path: "/admin/dashboard" },
  { icon: "Users", label: "User Management", path: "/admin/users" },
  { icon: "Building2", label: "Partner Management", path: "/admin/partners" },
  { icon: "GraduationCap", label: "Exam Management", path: "/admin/exams" },
  { icon: "CheckSquare", label: "PDC Validation", path: "/admin/pdcs" },
  { icon: "UserCheck", label: "Trainer Management", path: "/admin/trainers" },
  { icon: "FolderOpen", label: "Content & Resources", path: "/admin/content" },
  { icon: "DollarSign", label: "Finance & Transactions", path: "/admin/finance" },
  { icon: "BarChart3", label: "Reports & Analytics", path: "/admin/reports" },
  { icon: "Mail", label: "Communications", path: "/admin/communications" },
  { icon: "Settings", label: "System Settings", path: "/admin/settings" },
  { icon: "Shield", label: "Security & Logs", path: "/admin/security" },
  { icon: "LogOut", label: "Sign Out", action: "logout" }
];
```

#### 📄 Pages à Créer
1. **Admin Dashboard** - `/admin/dashboard`
   - Real-time metrics grid
   - System health indicators
   - Pending actions queue

2. **User Management** - `/admin/users`
   - Advanced data table
   - Bulk actions toolbar
   - User details drawer
   - Role assignment modal

3. **Partner Management** - `/admin/partners`
   - Partner applications queue
   - Active partners grid
   - License management interface

4. **Exam Management** - `/admin/exams`
   - Voucher tracking
   - Score upload interface
   - Certificate generation queue

5. **PDC Validation** - `/admin/pdcs`
   - Submission review queue
   - Validation tools
   - Audit trail viewer

6. **Trainer Management** - `/admin/trainers`
   - Application review
   - Performance dashboard
   - Badge generation

7. **Content & Resources** - `/admin/content`
   - File manager interface
   - Curriculum builder
   - Language management

8. **Finance & Transactions** - `/admin/finance`
   - Transaction log
   - Invoice management
   - Reconciliation tools

9. **Reports & Analytics** - `/admin/reports`
   - Custom report builder
   - Export center
   - Scheduled reports

10. **Communications** - `/admin/communications`
    - Announcement composer
    - Email templates
    - Notification manager

11. **System Settings** - `/admin/settings`
    - Configuration panels
    - Integration settings
    - Role permissions matrix

12. **Security & Logs** - `/admin/security`
    - Activity logs viewer
    - Security alerts
    - Access control lists

---

## 🎨 Design System Components Nécessaires

### Base Components
```typescript
// Core UI Components needed
- Button (primary, secondary, danger, ghost)
- Input (text, email, password, number)
- Select (single, multi)
- Checkbox / Radio
- DatePicker / DateRangePicker
- FileUpload (single, multiple)
- DataTable (sorting, filtering, pagination)
- Card / Panel
- Modal / Dialog
- Drawer (side panel)
- Tabs
- Accordion
- Badge / Tag
- Progress (bar, circle)
- Alert / Toast
- Breadcrumb
- Avatar
- Tooltip
- Loading states
```

### Composite Components
```typescript
// Business-specific components
- MetricCard (icon, label, value, trend)
- StatusBadge (active, expired, pending)
- CertificationCard (type, expiry, actions)
- ProgramCard (title, hours, competencies)
- UserCard (avatar, name, role, status)
- VoucherCard (code, validity, assigned)
- SearchFilter (multi-criteria)
- LanguageToggle (EN/AR with RTL)
- ProfileCompletion (progress indicator)
- PDCTracker (circular progress)
```

---

## 🔐 Route Protection Strategy

```typescript
// Route configuration with role-based access
const routeConfig = {
  public: ['/login', '/register', '/forgot-password'],
  individual: ['/dashboard', '/my-*', '/pdcs', ...],
  ecp: ['/ecp/*'],
  pdp: ['/pdp/*'],
  admin: ['/admin/*'],
  shared: ['/help-center', '/verify-certification']
};

// Middleware for route protection
const RouteGuard = ({ allowedRoles, children }) => {
  // Check user role and redirect if unauthorized
};
```

---

## 📱 Responsive Breakpoints

```scss
// Tailwind breakpoints to use
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large screens
```

---

## 🌐 Internationalization Strategy

```typescript
// Language file structure
/locales
  /en
    - common.json
    - dashboard.json
    - certifications.json
  /ar
    - common.json
    - dashboard.json
    - certifications.json

// RTL support for Arabic
const useRTL = () => {
  const { language } = useLanguage();
  return language === 'ar';
};
```

---

## 📊 Data Flow Architecture

```typescript
// State management structure
- AuthContext (user, roles, permissions)
- LanguageContext (locale, RTL)
- DashboardContext (metrics, notifications)
- CertificationContext (exams, vouchers, certificates)
- PDCContext (credits, programs)

// API structure
/api
  /auth (login, logout, refresh)
  /users (CRUD operations)
  /certifications (exams, results)
  /pdcs (submit, validate)
  /partners (ecp, pdp management)
  /admin (all admin operations)
```

---

## ✅ Implementation Priority

### Phase 1 - Core Foundation
1. Auth system with role detection
2. Layout with dynamic sidebar
3. Dashboard pages (all profiles)
4. Language toggle with RTL

### Phase 2 - Individual Features
1. Certification workflow
2. PDC management
3. Mock exams
4. Resources

### Phase 3 - Partner Features
1. ECP portal complete
2. PDP portal complete
3. Integration points

### Phase 4 - Admin Features
1. User management
2. Partner management
3. Reports and analytics
4. System settings

---

## 🚀 Next Steps

1. **Validate this structure** with stakeholders
2. **Setup routing** with role-based protection
3. **Create shared layout** components
4. **Implement static pages** with placeholder content
5. **Add navigation** and sidebar switching
6. **Apply design system** consistently
7. **Test responsive behavior**
8. **Prepare for API integration**