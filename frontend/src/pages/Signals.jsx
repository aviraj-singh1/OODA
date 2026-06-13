/**
 * Signals — Full signal list page.
 */

import { useEffect, useState } from 'react';
import SignalFeed from '../components/SignalFeed';
import { getSignals } from '../services/api';

export default function Signals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSignals();
        setSignals(res.data);
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          📡 <span>Signal Intelligence</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          All detected competitor signals — newest first
        </p>
      </div>

      <div className="animate-fade-in animate-delay-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="loading-spinner" />
          </div>
        ) : (
          <SignalFeed signals={signals} />
        )}
      </div>
    </div>
  );
}
