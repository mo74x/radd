'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';
import { ShellLocation } from './types';

export interface LocationSwitcherProps {
  locations?: ShellLocation[];
  currentLocationId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

const LocationSwitcherInner: React.FC<LocationSwitcherProps> = ({
  locations: initialLocations = [],
  currentLocationId,
  onSelect,
  className,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [fetchedLocations, setFetchedLocations] = useState<ShellLocation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive locations: use prop if available, otherwise fetched
  const locations = initialLocations.length > 0 ? initialLocations : fetchedLocations;

  // Fetch locations only if not provided via props
  useEffect(() => {
    if (initialLocations.length > 0) return;

    let isMounted = true;
    fetch('/api/dashboard/locations')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.locations) {
          setFetchedLocations(
            data.locations.map((l: { id: string; display_name: string }) => ({
              id: l.id,
              name: l.display_name,
            }))
          );
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [initialLocations.length]);

  const activeId =
    currentLocationId || searchParams.get('locationId') || (locations[0]?.id ?? 'all');
  const activeLocation = locations.find((l) => l.id === activeId);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    if (onSelect) {
      onSelect(id);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'all') {
      params.delete('locationId');
    } else {
      params.set('locationId', id);
    }
    router.push(`?${params.toString()}`);
  };

  const displayName = activeLocation
    ? activeLocation.name
    : locations.length === 1
    ? locations[0].name
    : 'All Locations (جميع الفروع)';

  if (locations.length === 0) {
    return (
      <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted', className)}>
        <Icon icon={MapPin} size={15} className="text-primary" />
        <span>Cairo Branch</span>
      </div>
    );
  }

  if (locations.length === 1) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface text-text text-sm font-semibold select-none shadow-xs',
          className
        )}
      >
        <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-primary flex items-center justify-center shrink-0">
          <Icon icon={MapPin} size={14} />
        </div>
        <span className="truncate max-w-[160px] sm:max-w-[200px]">{locations[0].name}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block text-start', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'min-h-[44px] px-3.5 py-2 inline-flex items-center gap-2 rounded-xl text-sm font-semibold',
          'border border-border bg-surface text-text hover:bg-surface-raised transition-colors shadow-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-primary flex items-center justify-center shrink-0">
          <Icon icon={MapPin} size={14} />
        </div>
        <span className="truncate max-w-[140px] sm:max-w-[180px]">{displayName}</span>
        <Icon
          icon={ChevronDown}
          size={16}
          className={cn(
            'text-text-muted transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select location"
          className={cn(
            'absolute start-0 mt-1.5 w-64 rounded-2xl border border-border bg-surface p-1.5 shadow-xl z-50',
            'animate-in fade-in zoom-in-95 duration-100 space-y-1'
          )}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Branch Locations
          </div>

          <button
            type="button"
            role="option"
            aria-selected={activeId === 'all'}
            onClick={() => handleSelect('all')}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-start font-medium transition-colors',
              activeId === 'all'
                ? 'bg-teal-50 text-primary dark:bg-teal-900/40'
                : 'text-text hover:bg-surface-raised'
            )}
          >
            <span>All Locations (الكل)</span>
            {activeId === 'all' && <Icon icon={Check} size={16} className="text-primary" />}
          </button>

          {locations.map((loc) => {
            const isSelected = activeId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(loc.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-start font-medium transition-colors',
                  isSelected
                    ? 'bg-teal-50 text-primary dark:bg-teal-900/40'
                    : 'text-text hover:bg-surface-raised'
                )}
              >
                <span className="truncate">{loc.name}</span>
                {isSelected && <Icon icon={Check} size={16} className="text-primary" />}
              </button>
            );
          })}

          <div className="pt-1 mt-1 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard#locations');
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
            >
              <Icon icon={Plus} size={14} />
              <span>Add New Location</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const LocationSwitcher: React.FC<LocationSwitcherProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div className="min-h-[44px] px-3.5 py-2 inline-flex items-center gap-2 rounded-xl border border-border bg-surface text-xs text-text-muted">
          <Icon icon={MapPin} size={14} className="text-primary" />
          <span>Loading...</span>
        </div>
      }
    >
      <LocationSwitcherInner {...props} />
    </Suspense>
  );
};
