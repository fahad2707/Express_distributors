'use client';

import { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import adminApi from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface StoreSettings {
  business_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  default_tax_rate: number;
  receipt_header?: string;
  receipt_footer?: string;
  currency: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await adminApi.get('/store-settings');
      setSettings(res.data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await adminApi.put('/store-settings', {
        business_name: settings.business_name,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        zip: settings.zip,
        phone: settings.phone,
        email: settings.email,
        tax_id: settings.tax_id,
        default_tax_rate: settings.default_tax_rate,
        receipt_header: settings.receipt_header,
        receipt_footer: settings.receipt_footer,
        currency: settings.currency,
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-10 h-10 text-gray-700" />
        <h1 className="text-4xl font-bold text-gray-900">Store Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 max-w-2xl space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Business information</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input
            type="text"
            value={settings.business_name || ''}
            onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={settings.address || ''}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={settings.city || ''}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={settings.state || ''}
              onChange={(e) => setSettings({ ...settings, state: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
            <input
              type="text"
              value={settings.zip || ''}
              onChange={(e) => setSettings({ ...settings, zip: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={settings.phone || ''}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={settings.email || ''}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / EIN</label>
          <input
            type="text"
            value={settings.tax_id || ''}
            onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-4">Tax & currency</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default tax rate (%)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={settings.default_tax_rate ?? 0}
            onChange={(e) => setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <input
            type="text"
            value={settings.currency || 'USD'}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-4">Receipt</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt header (optional)</label>
          <textarea
            value={settings.receipt_header || ''}
            onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt footer (optional)</label>
          <textarea
            value={settings.receipt_footer || ''}
            onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
