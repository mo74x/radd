 
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LocationRow } from '@/types/database';

interface LocationSelectorProps {
  locations: (LocationRow & { reviews_count?: number })[];
  defaultBrandSignature: string | null;
  totalReviewsCount: number;
}

export default function LocationSelector({
  locations,
  defaultBrandSignature,
  totalReviewsCount,
}: LocationSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLocationId = searchParams.get('locationId') || 'all';

  const [isEditing, setIsEditing] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationRow | null>(null);
  const [formPhone, setFormPhone] = useState('');
  const [formSignature, setFormSignature] = useState('');
  const [formPolling, setFormPolling] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeLoc = locations.find((l) => l.id === selectedLocationId);

  const handleSelectLocation = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'all') {
      params.delete('locationId');
    } else {
      params.set('locationId', id);
    }
    router.push(`?${params.toString()}`);
  };

  const handleOpenEdit = (loc: LocationRow) => {
    setEditingLocation(loc);
    setFormPhone(loc.contact_phone || '');
    setFormSignature(loc.signature_override || '');
    setFormPolling(loc.is_polling_enabled);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSaveOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/dashboard/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: editingLocation.id,
          contactPhone: formPhone || null,
          signatureOverride: formSignature || null,
          isPollingEnabled: formPolling,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update location overrides');
      }

      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Location Filter Pills / Dropdown */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            📍 Branch Filter:
          </span>

          <button
            type="button"
            onClick={() => handleSelectLocation('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedLocationId === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Branches ({totalReviewsCount})
          </button>

          {locations.map((loc) => {
            const isSelected = selectedLocationId === loc.id;
            const hasOverrides = Boolean(loc.contact_phone || loc.signature_override);

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectLocation(loc.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{loc.display_name}</span>
                {hasOverrides && (
                  <span
                    title="Per-location overrides active (Phone / Signature)"
                    className={isSelected ? 'text-emerald-200' : 'text-emerald-600'}
                  >
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeLoc && (
          <button
            type="button"
            onClick={() => handleOpenEdit(activeLoc)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ⚙️ Edit Branch Overrides
          </button>
        )}
      </div>

      {/* Selected Branch Overrides Card (When a specific location is active) */}
      {activeLoc && (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-4 text-xs text-gray-800 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">
                  {activeLoc.display_name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    activeLoc.is_polling_enabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeLoc.is_polling_enabled ? 'Sync Active' : 'Sync Paused'}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                <span>
                  📞 Phone Override:{' '}
                  <strong className="text-gray-900">
                    {activeLoc.contact_phone || 'Default (No override)'}
                  </strong>
                </span>
                <span>
                  ✍️ Signature Override:{' '}
                  <strong className="text-gray-900">
                    {activeLoc.signature_override ||
                      `Default (${defaultBrandSignature || 'Brand Voice'})`}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenEdit(activeLoc)}
              className="self-start rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-emerald-700 sm:self-center"
            >
              Configure Overrides
            </button>
          </div>
        </div>
      )}

      {/* Modal / Dialog for editing location overrides */}
      {isEditing && editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Edit Branch Overrides
                </h3>
                <p className="text-xs text-gray-500">
                  {editingLocation.display_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOverrides} className="mt-4 space-y-4">
              {saveError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Branch Phone Number Override
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+201001234567"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Used in complaint resolutions and safety checks for this branch. Leave blank to omit phone number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Branch Signature Override
                </label>
                <input
                  type="text"
                  value={formSignature}
                  onChange={(e) => setFormSignature(e.target.value)}
                  placeholder="فريق Roastery & Co. - فرع المعادي"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  The sign-off at the end of AI replies for this location (e.g. &ldquo;فريق Roastery & Co. - فرع المعادي&rdquo;). Falls back to brand signature if blank.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="loc-polling-toggle"
                  checked={formPolling}
                  onChange={(e) => setFormPolling(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="loc-polling-toggle"
                  className="text-xs font-medium text-gray-700 cursor-pointer"
                >
                  Enable automated review polling for this location
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Overrides'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
