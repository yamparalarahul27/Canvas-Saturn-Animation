"use client";

import { useEffect, useRef, useState } from "react";

const PHOTOS = [
  { src: "/macbook/1.svg", alt: "MacBook Pro 14-inch, front view" },
  { src: "/macbook/2.svg", alt: "Keyboard and trackpad" },
  { src: "/macbook/3.svg", alt: "Closed lid, silver aluminium" },
  { src: "/macbook/4.svg", alt: "Side profile" },
  { src: "/macbook/5.svg", alt: "Ports: MagSafe 3, Thunderbolt 4, headphone jack" },
];

const SPECS: [string, string][] = [
  ["Chip", "Apple M1 Pro"],
  ["Display", '14.2" Liquid Retina XDR, 120Hz'],
  ["Storage", "256 GB SSD"],
  ["Memory", "16 GB unified"],
  ["Colour", "Silver"],
  ["Ports", "MagSafe 3 · 3× Thunderbolt 4 · HDMI · SDXC · 3.5mm"],
  ["Condition", "Well cared for, single owner"],
];

const MIN_ACCEPTED = 50_000;
const ASKING_NUDGE = 70_000;

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function SalesPage() {
  const [active, setActive] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const [formVisible, setFormVisible] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const price = parseInt(priceStr.replace(/[^\d]/g, ""), 10) || 0;
  const tooLow = price > 0 && price < MIN_ACCEPTED;
  const lowball = price >= MIN_ACCEPTED && price < ASKING_NUDGE;

  // Track which photo is in view (mobile swipe)
  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollToPhoto = (i: number) => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Hide the sticky CTA once the form is on screen
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (tooLow) {
      setError("Dude, go away, that low is no cap 🫨");
      return;
    }
    if (lowball && note.trim() === "") {
      setError("Come on dude, make it above 70k — or at least tell me why this low.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, price, note, website: hpRef.current?.value ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong, try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f5f5f7]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold tracking-tight">
            MacBook Pro 14&Prime; · M1 Pro
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            For sale
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-28 md:grid md:grid-cols-2 md:gap-10 md:pb-16">
        {/* Gallery */}
        <section className="pt-4">
          <div
            ref={galleryRef}
            onScroll={onGalleryScroll}
            className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {PHOTOS.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.src}
                src={p.src}
                alt={p.alt}
                className="aspect-[4/3] w-full flex-shrink-0 snap-center rounded-2xl object-cover"
                draggable={false}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {PHOTOS.map((p, i) => (
              <button
                key={p.src}
                aria-label={`Photo ${i + 1}`}
                onClick={() => scrollToPhoto(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-6 bg-[#1d1d1f]" : "w-1.5 bg-black/20"
                }`}
              />
            ))}
          </div>
          <div className="mt-3 hidden gap-2 md:flex">
            {PHOTOS.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.src}
                src={p.src}
                alt=""
                onClick={() => scrollToPhoto(i)}
                className={`aspect-[4/3] w-16 cursor-pointer rounded-lg object-cover ring-2 transition ${
                  i === active ? "ring-[#1d1d1f]" : "ring-transparent opacity-70 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Details + form */}
        <section>
          <div className="pt-6">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              MacBook Pro 14&Prime; (2021)
            </h1>
            <p className="mt-1 text-[#6e6e73]">M1 Pro · 256 GB · Silver</p>
            <p className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-sm shadow-sm">
              Asking around <strong>{inr(ASKING_NUDGE)}</strong> — make your best offer
            </p>
          </div>

          <dl className="mt-6 divide-y divide-black/5 rounded-2xl bg-white px-4 shadow-sm">
            {SPECS.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-[#6e6e73]">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-[#6e6e73]">
            Owner&apos;s note: used gently for work, always in a sleeve, battery in
            great shape. Selling because I&apos;m upgrading. Charger and box included.
          </p>

          {/* Offer form */}
          <div ref={formRef} id="offer" className="mt-8 scroll-mt-20">
            <h2 className="text-lg font-semibold">Make an offer</h2>
            {done ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-5 text-emerald-800 shadow-sm">
                <p className="font-semibold">Offer received ✓</p>
                <p className="mt-1 text-sm">
                  Thanks{name ? `, ${name}` : ""}! I&apos;ll call you back on your
                  number if it works out.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-black/30"
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  inputMode="tel"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-black/30"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6e6e73]">
                    ₹
                  </span>
                  <input
                    type="text"
                    required
                    value={priceStr}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, "");
                      setPriceStr(digits ? parseInt(digits, 10).toLocaleString("en-IN") : "");
                    }}
                    placeholder="Your offer"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-black/10 bg-white py-3 pl-9 pr-4 text-base shadow-sm outline-none focus:border-black/30"
                  />
                </div>

                {tooLow && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    Dude, go away, that low is no cap 🫨
                  </p>
                )}
                {lowball && (
                  <div className="space-y-2 rounded-xl bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">
                      Come on dude, make it above 70k 😤
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Fine… but tell me why this low?"
                      rows={2}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                )}
                {error && !tooLow && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}

                {/* Honeypot — hidden from humans */}
                <input
                  ref={hpRef}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <button
                  type="submit"
                  disabled={submitting || tooLow}
                  className="w-full rounded-xl bg-[#1d1d1f] py-3.5 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-40"
                >
                  {submitting ? "Sending…" : "Submit offer"}
                </button>
                <p className="text-center text-xs text-[#a1a1a6]">
                  Your number is only used to call you back about this MacBook.
                </p>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Sticky mobile CTA */}
      {!formVisible && !done && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/90 p-3 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-1">
            <span className="text-sm font-medium">Interested?</span>
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Make an offer ↓
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
