'use client';

import { useState } from 'react';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import { FREE_DEMO_PLAN, getFreeDemoUpgradeMessage } from '@/lib/plans/free-demo-plan';

interface UpgradePromptProps {
  resource?: string;
  onClose: () => void;
  onActivate: (key: string) => Promise<{ ok: boolean; message?: string }>;
}

const FEATURE_ROWS = [
  { label: 'Customers', free: String(FREE_DEMO_PLAN.limits.customers), full: 'Unlimited' },
  { label: 'Products', free: String(FREE_DEMO_PLAN.limits.products), full: 'Unlimited' },
  { label: 'Orders', free: String(FREE_DEMO_PLAN.limits.orders), full: 'Unlimited' },
  { label: 'Market Schedules', free: String(FREE_DEMO_PLAN.limits.marketSchedules), full: 'Unlimited' },
  { label: 'Featured Products', free: String(FREE_DEMO_PLAN.limits.featuredProducts), full: 'Unlimited' },
  { label: 'POS Checkout', free: 'Demo', full: 'Live' },
  { label: 'QR Flyer', free: 'Demo', full: 'Live' },
  { label: 'Branding', free: 'Demo', full: 'Custom' },
  { label: 'Export', free: 'Locked', full: 'Included' },
];

export default function UpgradePrompt({ resource, onClose, onActivate }: UpgradePromptProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState('');
  const [activateSuccess, setActivateSuccess] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setActivating(true);
    setActivateError('');
    try {
      const result = await onActivate(licenseKey.trim());
      if (result.ok) {
        setActivateSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else {
        setActivateError(result.message || 'Activation failed');
      }
    } catch {
      setActivateError('Network error — try again');
    } finally {
      setActivating(false);
    }
  };

  const resourceLabel = resource
    ? resource.charAt(0).toUpperCase() + resource.slice(1)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #7f1d1d 100%)' }} className="rounded-t-2xl p-6 text-white text-center">
          <div className="text-4xl mb-2">👑</div>
          <h2 className="text-xl font-bold">{FREE_DEMO_PLAN.upgradeLabel}</h2>
          <p className="text-sm mt-1 opacity-90">Fresh Market Vendor - Full Vendor Plan</p>
        </div>

        {/* Limit Warning */}
        {resourceLabel && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
            {getFreeDemoUpgradeMessage(resource)} Limit: {PLAN_LIMITS.free[resource as keyof typeof PLAN_LIMITS.free]} {resourceLabel.toLowerCase()}.
          </div>
        )}

        {/* Feature Comparison */}
        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-3 text-center">Compare Plans</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="grid grid-cols-3 text-xs font-semibold bg-gray-50">
              <div className="p-2 text-left">Feature</div>
              <div className="p-2 text-center text-gray-500">Free Demo</div>
              <div className="p-2 text-center" style={{ color: '#b91c1c' }}>Full</div>
            </div>
            {FEATURE_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-3 text-xs border-t border-gray-100">
                <div className="p-2 text-left font-medium">{row.label}</div>
                <div className="p-2 text-center text-gray-500">{row.free}</div>
                <div className="p-2 text-center font-semibold" style={{ color: row.full === '✅' ? '#16a34a' : '#b91c1c' }}>{row.full}</div>
              </div>
            ))}
          </div>
        </div>

        {/* License Key Activation */}
        <div className="px-4 pb-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">Activate License Key</h3>
          {activateSuccess ? (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-center text-sm">
              ✅ Activated! Welcome to the full version.
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="JRT-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => { setLicenseKey(e.target.value.toUpperCase()); setActivateError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleActivate}
                  disabled={activating || !licenseKey.trim()}
                >
                  {activating ? '...' : 'Activate'}
                </button>
              </div>
              {activateError && (
                <p className="text-red-500 text-xs mt-2">{activateError}</p>
              )}
            </>
          )}
        </div>

        {/* Purchase Link */}
        <div className="px-4 pb-6 text-center">
          <p className="text-xs text-gray-500 mb-3">Don&apos;t have a license key?</p>
          <a
            href="https://www.jaderosetech.com/store/fresh-market-vendor-custom"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full block"
            style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #7f1d1d 100%)' }}
          >
            🛒 Purchase Custom Build — Starting at $79
          </a>
        </div>

        {/* Close */}
        <button
          className="absolute top-4 right-4 text-white/70 hover:text-white text-lg"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
