'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PollNowButton() {
  const [polling, setPolling] = useState(false);
  const router = useRouter();

  async function handlePoll() {
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
      disabled={polling}
      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
    >
      {polling ? 'Syncing Google Reviews...' : '🔄 Sync Reviews Now'}
    </button>
  );
}