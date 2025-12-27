/**
 * System Settings Admin Page
 *
 * Admin dashboard for managing system configuration
 * Requirements: Admin Panel - System Settings
 */

import { useState } from 'react';
import {
  Settings,
  Globe,
  Mail,
  Bell,
  Shield,
  Database,
  Clock,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  Server,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// ============================================================================
// Types
// ============================================================================

type TabType = 'general' | 'email' | 'notifications' | 'security' | 'maintenance';

interface SettingGroup {
  id: string;
  label: string;
  description: string;
  settings: Setting[];
}

interface Setting {
  id: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'email';
  value: any;
  options?: { value: string; label: string }[];
}

// ============================================================================
// Component
// ============================================================================

export default function SystemSettings() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // State
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Mock settings data (in production, these would come from a database/API)
  const [settings, setSettings] = useState({
    // General
    siteName: 'BDA Certification Portal',
    siteUrl: 'https://bda-global.org',
    supportEmail: 'support@bda-global.org',
    defaultLanguage: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',

    // Email
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
    fromEmail: 'noreply@bda-global.org',
    fromName: 'BDA Certification',
    emailFooter: 'Business Data Analytics Association',

    // Notifications
    sendBookingConfirmation: true,
    send48hReminder: true,
    send24hReminder: true,
    sendExamResults: true,
    sendCertificateReady: true,
    adminNotifyNewRegistration: true,
    adminNotifyFailedExam: false,

    // Security
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requireEmailVerification: true,
    enforceStrongPassword: true,
    enable2FA: false,

    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'The system is currently under maintenance. Please check back later.',
    debugMode: false,
    logLevel: 'error',
  });

  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Reset settings
  const handleReset = () => {
    // Reset to default values
    setHasChanges(false);
    setSaved(false);
  };

  // Render setting input based on type
  const renderSettingInput = (key: string, setting: { type: string; value: any; options?: any[] }) => {
    const value = (settings as any)[key];

    switch (setting.type) {
      case 'boolean':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleSettingChange(key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-royal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-royal-600"></div>
          </label>
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-500 focus:border-transparent"
          >
            {setting.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(key, parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 w-32 focus:ring-2 focus:ring-royal-500 focus:border-transparent"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            rows={3}
            className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-royal-500 focus:border-transparent"
          />
        );
      default:
        return (
          <input
            type={setting.type}
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 w-full max-w-md focus:ring-2 focus:ring-royal-500 focus:border-transparent"
          />
        );
    }
  };

  // Render General Tab
  const renderGeneral = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-royal-600" />
          {isRTL ? 'الإعدادات العامة' : 'General Settings'}
        </h3>
        <div className="space-y-6">
          {[
            { key: 'siteName', label: isRTL ? 'اسم الموقع' : 'Site Name', type: 'text' },
            { key: 'siteUrl', label: isRTL ? 'رابط الموقع' : 'Site URL', type: 'text' },
            { key: 'supportEmail', label: isRTL ? 'بريد الدعم' : 'Support Email', type: 'email' },
            { key: 'defaultLanguage', label: isRTL ? 'اللغة الافتراضية' : 'Default Language', type: 'select', options: [
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'Arabic' },
            ]},
            { key: 'timezone', label: isRTL ? 'المنطقة الزمنية' : 'Timezone', type: 'select', options: [
              { value: 'UTC', label: 'UTC' },
              { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
              { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
              { value: 'Europe/London', label: 'London (GMT)' },
              { value: 'America/New_York', label: 'New York (GMT-5)' },
            ]},
            { key: 'dateFormat', label: isRTL ? 'صيغة التاريخ' : 'Date Format', type: 'select', options: [
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            ]},
          ].map(setting => (
            <div key={setting.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <label className="w-48 text-sm font-medium text-gray-700">{setting.label}</label>
              {renderSettingInput(setting.key, setting as any)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Email Tab
  const renderEmail = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5 text-royal-600" />
          {isRTL ? 'إعدادات البريد الإلكتروني' : 'Email Settings'}
        </h3>
        <div className="space-y-6">
          {[
            { key: 'smtpHost', label: isRTL ? 'خادم SMTP' : 'SMTP Host', type: 'text' },
            { key: 'smtpPort', label: isRTL ? 'منفذ SMTP' : 'SMTP Port', type: 'number' },
            { key: 'smtpUser', label: isRTL ? 'مستخدم SMTP' : 'SMTP User', type: 'text' },
            { key: 'fromEmail', label: isRTL ? 'بريد المرسل' : 'From Email', type: 'email' },
            { key: 'fromName', label: isRTL ? 'اسم المرسل' : 'From Name', type: 'text' },
            { key: 'emailFooter', label: isRTL ? 'تذييل البريد' : 'Email Footer', type: 'text' },
          ].map(setting => (
            <div key={setting.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <label className="w-48 text-sm font-medium text-gray-700">{setting.label}</label>
              {renderSettingInput(setting.key, setting as any)}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">{isRTL ? 'ملاحظة' : 'Note'}</p>
              <p className="text-sm text-blue-700">
                {isRTL
                  ? 'يتم إدارة إعدادات SMTP عبر متغيرات البيئة لأسباب أمنية.'
                  : 'SMTP credentials are managed via environment variables for security.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Notifications Tab
  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-royal-600" />
          {isRTL ? 'إشعارات المستخدمين' : 'User Notifications'}
        </h3>
        <div className="space-y-4">
          {[
            { key: 'sendBookingConfirmation', label: isRTL ? 'تأكيد الحجز' : 'Booking Confirmation', desc: isRTL ? 'إرسال بريد عند حجز موعد الامتحان' : 'Send email when exam is booked' },
            { key: 'send48hReminder', label: isRTL ? 'تذكير 48 ساعة' : '48h Reminder', desc: isRTL ? 'إرسال تذكير قبل 48 ساعة' : 'Send reminder 48 hours before exam' },
            { key: 'send24hReminder', label: isRTL ? 'تذكير 24 ساعة' : '24h Reminder', desc: isRTL ? 'إرسال تذكير قبل 24 ساعة' : 'Send reminder 24 hours before exam' },
            { key: 'sendExamResults', label: isRTL ? 'نتائج الامتحان' : 'Exam Results', desc: isRTL ? 'إرسال النتائج عند الانتهاء' : 'Send results after completion' },
            { key: 'sendCertificateReady', label: isRTL ? 'الشهادة جاهزة' : 'Certificate Ready', desc: isRTL ? 'إشعار بتوفر الشهادة' : 'Notify when certificate is ready' },
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.desc}</p>
              </div>
              {renderSettingInput(setting.key, { type: 'boolean', value: (settings as any)[setting.key] })}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-royal-600" />
          {isRTL ? 'إشعارات المشرفين' : 'Admin Notifications'}
        </h3>
        <div className="space-y-4">
          {[
            { key: 'adminNotifyNewRegistration', label: isRTL ? 'تسجيل جديد' : 'New Registration', desc: isRTL ? 'إشعار عند تسجيل مستخدم جديد' : 'Notify when new user registers' },
            { key: 'adminNotifyFailedExam', label: isRTL ? 'امتحان راسب' : 'Failed Exam', desc: isRTL ? 'إشعار عند رسوب مستخدم' : 'Notify when user fails exam' },
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.desc}</p>
              </div>
              {renderSettingInput(setting.key, { type: 'boolean', value: (settings as any)[setting.key] })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Security Tab
  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-royal-600" />
          {isRTL ? 'إعدادات الأمان' : 'Security Settings'}
        </h3>
        <div className="space-y-6">
          {[
            { key: 'sessionTimeout', label: isRTL ? 'مهلة الجلسة (دقائق)' : 'Session Timeout (min)', type: 'number' },
            { key: 'maxLoginAttempts', label: isRTL ? 'الحد الأقصى لمحاولات تسجيل الدخول' : 'Max Login Attempts', type: 'number' },
            { key: 'lockoutDuration', label: isRTL ? 'مدة الحظر (دقائق)' : 'Lockout Duration (min)', type: 'number' },
          ].map(setting => (
            <div key={setting.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <label className="w-64 text-sm font-medium text-gray-700">{setting.label}</label>
              {renderSettingInput(setting.key, setting as any)}
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {[
            { key: 'requireEmailVerification', label: isRTL ? 'طلب التحقق من البريد الإلكتروني' : 'Require Email Verification', desc: isRTL ? 'يجب التحقق من البريد قبل تسجيل الدخول' : 'Users must verify email before logging in' },
            { key: 'enforceStrongPassword', label: isRTL ? 'فرض كلمة مرور قوية' : 'Enforce Strong Password', desc: isRTL ? 'طلب كلمات مرور معقدة' : 'Require complex passwords' },
            { key: 'enable2FA', label: isRTL ? 'تفعيل المصادقة الثنائية' : 'Enable 2FA', desc: isRTL ? 'السماح بالمصادقة الثنائية' : 'Allow two-factor authentication' },
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.desc}</p>
              </div>
              {renderSettingInput(setting.key, { type: 'boolean', value: (settings as any)[setting.key] })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Maintenance Tab
  const renderMaintenance = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Server className="w-5 h-5 text-royal-600" />
          {isRTL ? 'وضع الصيانة' : 'Maintenance Mode'}
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <p className="font-medium text-yellow-900">{isRTL ? 'تفعيل وضع الصيانة' : 'Enable Maintenance Mode'}</p>
              <p className="text-sm text-yellow-700">
                {isRTL
                  ? 'عند التفعيل، لن يتمكن المستخدمون من الوصول للموقع'
                  : 'When enabled, users will see a maintenance page'}
              </p>
            </div>
            {renderSettingInput('maintenanceMode', { type: 'boolean', value: settings.maintenanceMode })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isRTL ? 'رسالة الصيانة' : 'Maintenance Message'}
            </label>
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-royal-600" />
          {isRTL ? 'التصحيح والسجلات' : 'Debug & Logging'}
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-red-900">{isRTL ? 'وضع التصحيح' : 'Debug Mode'}</p>
              <p className="text-sm text-red-700">
                {isRTL
                  ? 'تحذير: يعرض معلومات حساسة. للتطوير فقط.'
                  : 'Warning: Exposes sensitive info. Development only.'}
              </p>
            </div>
            {renderSettingInput('debugMode', { type: 'boolean', value: settings.debugMode })}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <label className="w-48 text-sm font-medium text-gray-700">
              {isRTL ? 'مستوى السجلات' : 'Log Level'}
            </label>
            {renderSettingInput('logLevel', {
              type: 'select',
              value: settings.logLevel,
              options: [
                { value: 'error', label: 'Error' },
                { value: 'warn', label: 'Warning' },
                { value: 'info', label: 'Info' },
                { value: 'debug', label: 'Debug' },
              ],
            })}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 text-royal-600" />
          {isRTL ? 'معلومات النظام' : 'System Information'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isRTL ? 'الإصدار' : 'Version', value: '1.0.0' },
            { label: isRTL ? 'البيئة' : 'Environment', value: 'Production' },
            { label: isRTL ? 'قاعدة البيانات' : 'Database', value: 'Supabase' },
            { label: isRTL ? 'آخر تحديث' : 'Last Deploy', value: new Date().toLocaleDateString() },
          ].map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isRTL ? 'إعدادات النظام' : 'System Settings'}
          </h1>
          <p className="text-gray-600">
            {isRTL
              ? 'إدارة تكوين وإعدادات النظام'
              : 'Manage system configuration and settings'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              {isRTL ? 'تم الحفظ' : 'Saved'}
            </span>
          )}
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                {isRTL ? 'إعادة تعيين' : 'Reset'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 disabled:opacity-50"
              >
                {saving ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800">
            {isRTL
              ? 'لديك تغييرات غير محفوظة. لا تنسَ الحفظ قبل المغادرة.'
              : 'You have unsaved changes. Remember to save before leaving.'}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8 overflow-x-auto">
          {[
            { id: 'general', label: isRTL ? 'عام' : 'General', icon: Globe },
            { id: 'email', label: isRTL ? 'البريد' : 'Email', icon: Mail },
            { id: 'notifications', label: isRTL ? 'الإشعارات' : 'Notifications', icon: Bell },
            { id: 'security', label: isRTL ? 'الأمان' : 'Security', icon: Shield },
            { id: 'maintenance', label: isRTL ? 'الصيانة' : 'Maintenance', icon: Server },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-royal-600 text-royal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && renderGeneral()}
      {activeTab === 'email' && renderEmail()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'security' && renderSecurity()}
      {activeTab === 'maintenance' && renderMaintenance()}
    </div>
  );
}
