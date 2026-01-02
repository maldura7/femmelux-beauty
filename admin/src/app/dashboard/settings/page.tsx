'use client';

import { useState } from 'react';
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  TruckIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const settingSections: SettingSection[] = [
  {
    id: 'store',
    title: 'Store Settings',
    description: 'Configure your store name, logo, and basic information',
    icon: <BuildingStorefrontIcon className="h-6 w-6" />,
  },
  {
    id: 'payment',
    title: 'Payment Settings',
    description: 'Manage payment methods and currency settings',
    icon: <CurrencyDollarIcon className="h-6 w-6" />,
  },
  {
    id: 'shipping',
    title: 'Shipping Settings',
    description: 'Configure shipping zones, rates, and delivery options',
    icon: <TruckIcon className="h-6 w-6" />,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage email and push notification preferences',
    icon: <BellIcon className="h-6 w-6" />,
  },
  {
    id: 'email',
    title: 'Email Templates',
    description: 'Customize order confirmation and notification emails',
    icon: <EnvelopeIcon className="h-6 w-6" />,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Password, two-factor authentication, and session settings',
    icon: <ShieldCheckIcon className="h-6 w-6" />,
  },
  {
    id: 'localization',
    title: 'Localization',
    description: 'Language, timezone, and regional settings',
    icon: <GlobeAltIcon className="h-6 w-6" />,
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('store');
  const [isSaving, setIsSaving] = useState(false);

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'FemmeLux Beauty',
    storeEmail: 'contact@femmelux.com',
    storePhone: '+1 (555) 123-4567',
    storeAddress: '123 Beauty Street, New York, NY 10001',
    currency: 'USD',
    timezone: 'America/New_York',
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    lowStockAlerts: true,
    customerSignups: false,
    marketingEmails: true,
    weeklyReports: true,
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStoreSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
        <input
          type="text"
          value={storeSettings.storeName}
          onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
        <input
          type="email"
          value={storeSettings.storeEmail}
          onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={storeSettings.storePhone}
          onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
        <textarea
          value={storeSettings.storeAddress}
          onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={storeSettings.currency}
            onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="AED">AED - UAE Dirham</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={storeSettings.timezone}
            onChange={(e) => setStoreSettings({ ...storeSettings, timezone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Asia/Dubai">Dubai (GST)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {[
        { key: 'orderNotifications', label: 'New Order Notifications', description: 'Get notified when a new order is placed' },
        { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Receive alerts when products are running low' },
        { key: 'customerSignups', label: 'Customer Signups', description: 'Get notified when new customers register' },
        { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive marketing tips and product updates' },
        { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly performance summary reports' },
      ].map((setting) => (
        <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-700">{setting.label}</p>
            <p className="text-sm text-gray-500">{setting.description}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  [setting.key]: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Payment gateway configuration is managed through the backend environment variables.
          Contact your administrator to update payment settings.
        </p>
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Accepted Payment Methods</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['Credit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery'].map((method) => (
            <div key={method} className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-700">{method}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Minimum Order Amount</h3>
        <p className="text-sm text-gray-500 mb-2">
          Minimum order amounts are configured per brand. Go to Brands management to update.
        </p>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
        <ShieldCheckIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-800">Your account is secure</p>
          <p className="text-sm text-green-700">
            All security features are properly configured.
          </p>
        </div>
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Password</h3>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Change Password
        </button>
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Two-Factor Authentication</h3>
        <p className="text-sm text-gray-500 mb-2">
          Add an extra layer of security to your account.
        </p>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Enable 2FA
        </button>
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Active Sessions</h3>
        <p className="text-sm text-gray-500 mb-2">
          You are currently logged in from 1 device.
        </p>
        <button className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
          Sign Out All Other Sessions
        </button>
      </div>
    </div>
  );

  const renderPlaceholder = (title: string) => (
    <div className="text-center py-12">
      <Cog6ToothIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500">This section is coming soon.</p>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'store':
        return renderStoreSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'payment':
        return renderPaymentSettings();
      case 'security':
        return renderSecuritySettings();
      case 'shipping':
        return renderPlaceholder('Shipping Settings');
      case 'email':
        return renderPlaceholder('Email Templates');
      case 'localization':
        return renderPlaceholder('Localization');
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center gap-2">
          <Cog6ToothIcon className="h-7 w-7 text-primary-600" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your store configuration and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {settingSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <span className={activeSection === section.id ? 'text-primary-600' : 'text-gray-400'}>
                  {section.icon}
                </span>
                <span className="font-medium">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-secondary-800">
                {settingSections.find((s) => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-gray-500">
                {settingSections.find((s) => s.id === activeSection)?.description}
              </p>
            </div>

            {renderSectionContent()}

            {/* Save Button */}
            {['store', 'notifications'].includes(activeSection) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
