/**
 * Rivals — Competitor intelligence page.
 */

import { useEffect, useState } from 'react';
import { getCompetitors } from '../services/api';

export default function Rivals() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCompetitors();
        setCompetitors(res.data);
      } catch (err) {
        console.error('Failed to fetch competitors:', err);
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
          👁️ <span>Rivals</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          Tracked competitors and their intelligence profiles
        </p>
      </div>

      <div className="animate-fade-in animate-delay-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="loading-spinner" />
          </div>
        ) : competitors.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-[var(--color-ooda-text-dim)] text-sm">
              No competitors tracked yet. Seed demo data first.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {competitors.map((comp) => (
              <div key={comp.id} className="card">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-threat)] to-[var(--color-warning)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {comp.name?.charAt(0) || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{comp.name}</h3>
                    <p className="text-xs text-[var(--color-ooda-text-dim)]">
                      {comp.category || 'Uncategorized'}
                    </p>
                  </div>

                  {/* Link */}
                  {comp.website_url && (
                    <a
                      href={comp.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-ooda-accent)] hover:underline"
                    >
                      Visit →
                    </a>
                  )}
                </div>

                {/* Pricing URL */}
                {comp.pricing_url && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-ooda-border)]">
                    <span className="text-xs text-[var(--color-ooda-text-dim)]">
                      Pricing tracked: {' '}
                      <span className="text-[var(--color-ooda-accent)] font-mono">
                        {comp.pricing_url}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
