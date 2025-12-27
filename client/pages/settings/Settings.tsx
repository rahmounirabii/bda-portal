/**
 * Settings Page
 * Main settings page with tabs for Profile, Notifications, Appearance, and Support
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from './tabs/ProfileTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { SupportTab } from './tabs/SupportTab';
import { User, Bell, Palette, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'support';

export default function Settings() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const t = {
    en: {
      title: 'Settings',
      description: 'Manage your account preferences and settings',
      profile: 'Profile',
      notifications: 'Notifications',
      appearance: 'Appearance',
      support: 'Support',
    },
    ar: {
      title: 'الإعدادات',
      description: 'إدارة تفضيلات حسابك وإعداداته',
      profile: 'الملف الشخصي',
      notifications: 'الإشعارات',
      appearance: 'المظهر',
      support: 'الدعم',
    }
  };

  const texts = t[language];

  // Read tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'notifications', 'appearance', 'support'].includes(tabParam)) {
      setActiveTab(tabParam as SettingsTab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as SettingsTab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          {texts.title}
        </h1>
        <p className="mt-2 opacity-90">{texts.description}</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.profile}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 py-3">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.notifications}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 py-3">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.appearance}</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2 py-3">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.support}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <SupportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

Settings.displayName = 'Settings';
