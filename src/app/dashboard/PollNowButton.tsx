'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button, Icon, useToast, Tooltip } from '@/components/ui';

export default function PollNowButton({ isRevoked }: { isRevoked?: boolean }) {
  const [polling, setPolling] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handlePoll() {
    if (isRevoked || polling) return;
    setPolling(true);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'poll_now' }),
      });

      if (!res.ok) {
        throw new Error('Failed to sync reviews');
      }

      toast.success('Reviews synced successfully from Google Business Profile.');
      router.refresh();
    } catch {
      toast.error('Sync failed. Please check your Google connection and try again.');
    } finally {
      setPolling(false);
    }
  }

  if (isRevoked) {
    return (
      <Tooltip content="Google authorization is expired or revoked. Please reconnect.">
        <Button
          variant="outline"
          disabled
          startIcon={<Icon icon={AlertTriangle} size={16} className="text-warning" />}
          className="border-warning/40 text-warning"
        >
          Sync Paused (Revoked)
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="secondary"
      loading={polling}
      onClick={handlePoll}
      startIcon={!polling ? <Icon icon={RefreshCw} size={16} /> : undefined}
    >
      {polling ? 'Syncing Reviews...' : 'Sync Reviews Now'}
    </Button>
  );
}