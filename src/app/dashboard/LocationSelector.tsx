'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Settings2 } from 'lucide-react';
import { LocationRow } from '@/types/database';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Input,
  Switch,
  useToast,
} from '@/components/ui';

interface LocationSelectorProps {
  locations: (LocationRow & { reviews_count?: number })[];
  defaultBrandSignature: string | null;
  totalReviewsCount: number;
}

function LocationSelectorInner({
  locations,
  defaultBrandSignature,
  totalReviewsCount,
}: LocationSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLocationId = searchParams.get('locationId') || 'all';
  const toast = useToast();

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
          contactPhone: formPhone,
          signatureOverride: formSignature,
          isPollingEnabled: formPolling,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update location overrides');
      }

      toast.success('Branch overrides saved successfully.');
      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating location';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (locations.length === 0) return null;

  return (
    <div className="space-y-3 text-start">
      {/* Branch Pills Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-border-muted dark:bg-surface-raised border border-border select-none">
          <button
            type="button"
            onClick={() => handleSelectLocation('all')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
              selectedLocationId === 'all'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span>All Branches (الكل)</span>
            <span className="opacity-70 font-mono">({totalReviewsCount})</span>
          </button>

          {locations.map((loc) => {
            const isSelected = selectedLocationId === loc.id;
            const hasOverrides = Boolean(loc.contact_phone || loc.signature_override);

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectLocation(loc.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <span>{loc.display_name}</span>
                {hasOverrides && (
                  <span
                    title="Overrides active"
                    className={isSelected ? 'text-accent' : 'text-primary'}
                  >
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeLoc && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(activeLoc)}
            startIcon={<Icon icon={Settings2} size={15} />}
          >
            Edit Branch Overrides
          </Button>
        )}
      </div>

      {/* Selected Branch Overrides Card */}
      {activeLoc && (
        <Card className="p-4 bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text text-sm">
                  {activeLoc.display_name}
                </span>
                <Badge
                  variant={activeLoc.is_polling_enabled ? 'success' : 'warning'}
                  size="sm"
                  dot
                >
                  {activeLoc.is_polling_enabled ? 'Sync Active' : 'Sync Paused'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                <span>
                  📞 Phone Override:{' '}
                  <bdi dir="ltr" className="text-text font-mono font-bold">
                    {activeLoc.contact_phone || 'Default (None)'}
                  </bdi>
                </span>
                <span>
                  ✍️ Signature Override:{' '}
                  <strong className="text-text">
                    {activeLoc.signature_override ||
                      `Default (${defaultBrandSignature || 'Brand Voice'})`}
                  </strong>
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenEdit(activeLoc)}
            >
              Configure Overrides
            </Button>
          </div>
        </Card>
      )}

      {/* Dialog for editing location overrides */}
      {editingLocation && (
        <Dialog open={isEditing} onClose={() => setIsEditing(false)} size="md">
          <DialogHeader onClose={() => setIsEditing(false)}>
            <div className="flex items-center gap-2">
              <Icon icon={MapPin} size={18} className="text-primary" />
              <DialogTitle>Edit Branch Overrides</DialogTitle>
            </div>
            <DialogDescription>
              Custom contact phone and signature for {editingLocation.display_name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOverrides}>
            <DialogBody className="space-y-4">
              {saveError && (
                <div className="p-3 rounded-xl bg-danger-surface text-danger text-xs font-semibold">
                  {saveError}
                </div>
              )}

              <Input
                label="Branch Phone Number"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+20 10 1234 5678"
                helperText="Included in AI replies when customers need phone assistance."
              />

              <Input
                label="Custom Sign-Off Signature"
                value={formSignature}
                onChange={(e) => setFormSignature(e.target.value)}
                placeholder="e.g. — إدارة فرع المعادي"
                helperText="Appended to the bottom of published review responses."
              />

              <div className="pt-2">
                <Switch
                  label="Google Review Polling"
                  description="Automatically pull new reviews from this specific branch"
                  checked={formPolling}
                  onChange={setFormPolling}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSaving}>
                Save Branch Overrides
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export default function LocationSelector(props: LocationSelectorProps) {
  return (
    <Suspense fallback={<div className="h-10 w-full rounded-2xl bg-border-muted animate-pulse" />}>
      <LocationSelectorInner {...props} />
    </Suspense>
  );
}
