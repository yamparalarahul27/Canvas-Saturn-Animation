"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Offer = {
  id: string;
  name: string;
  phone: string;
  price: number;
  note: string;
  createdAt: string;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function AdminDashboard() {
  const key = useSearchParams().get("key") ?? "";
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/offers?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        setError(
          "Unauthorized. Open this page as /admin?key=YOUR_ADMIN_KEY (set the ADMIN_KEY env var on Vercel)."
        );
        setOffers(null);
        return;
      }
      const data = await res.json();
      setOffers(data.offers as Offer[]);
      setPersistent(Boolean(data.persistent));
    } catch {
      setError("Couldn't load offers — check your connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  const top = offers?.[0];

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <header className="sticky top-0 z-10 border-b border-black/5 bg-[#f5f5f7]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-sm font-semibold">
            Offers{offers ? ` (${offers.length})` : ""}
          </h1>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        {!persistent && offers && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ Storage not configured — offers are kept in temporary memory and
            will vanish on redeploy. Add Upstash Redis from the Vercel
            marketplace and set UPSTASH_REDIS_REST_URL +
            UPSTASH_REDIS_REST_TOKEN.
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {offers && offers.length === 0 && (
          <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-[#6e6e73] shadow-sm">
            No offers yet. Share the link around!
          </p>
        )}

        {offers?.map((o) => (
          <article key={o.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold tabular-nums">{inr(o.price)}</p>
                <p className="mt-0.5 text-sm text-[#6e6e73]">
                  {o.name || "(no name)"} · {o.phone}
                </p>
                {o.note && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    &ldquo;{o.note}&rdquo;
                  </p>
                )}
              </div>
              {o === top && offers.length > 1 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  ⭐ highest
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[#a1a1a6]">{timeAgo(o.createdAt)}</span>
              <div className="flex gap-2">
                <a
                  href={`tel:${o.phone}`}
                  className="rounded-full bg-[#1d1d1f] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Call
                </a>
                <a
                  href={`https://wa.me/${o.phone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  );
}
