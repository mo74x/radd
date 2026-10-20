'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PollNowButton({ isRevoked }: { isRevoked?: boolean }) {
  const [polling, setPolling] = useState(false);
  const router = useRouter();

  async function handlePoll() {
    if (isRevoked) return;
    setPolling(true);
    try {
      await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'poll_now' }),
      });
      router.refresh();
    } finally {
      setPolling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePoll}
      disabled={polling || isRevoked}
      title={isRevoked ? 'Google connection is revoked. Reconnect to sync reviews.' : undefined}
      className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${
        isRevoked ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
      }`}
    >
      {polling ? 'Syncing Google Reviews...' : isRevoked ? '⚠️ Sync Paused (Revoked)' : '🔄 Sync Reviews Now'}
    </button>
  );
}