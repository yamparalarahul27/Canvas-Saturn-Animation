import { promises as fs } from "fs";
import path from "path";

export type Offer = {
  id: string;
  name: string;
  phone: string;
  price: number;
  note: string;
  createdAt: string; // ISO
};

const REDIS_KEY = "macbook:offers";

function upstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url: url.replace(/\/$/, ""), token };
  return null;
}

/** True when offers survive restarts (Upstash configured). */
export function isPersistent(): boolean {
  return upstashConfig() !== null;
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const cfg = upstashConfig();
  if (!cfg) throw new Error("Upstash not configured");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

// Local fallback for development: a JSON file in the project root
// (gitignored). On Vercel this lands in /tmp and does NOT persist —
// isPersistent() lets the admin UI warn about that.
const localFile =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "offers.json")
    : path.join(process.cwd(), ".offers.json");

async function readLocal(): Promise<Offer[]> {
  try {
    return JSON.parse(await fs.readFile(localFile, "utf8")) as Offer[];
  } catch {
    return [];
  }
}

export async function saveOffer(
  offer: Omit<Offer, "id" | "createdAt">
): Promise<Offer> {
  const full: Offer = {
    ...offer,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
  };
  if (isPersistent()) {
    await redis(["LPUSH", REDIS_KEY, JSON.stringify(full)]);
  } else {
    const all = await readLocal();
    all.unshift(full);
    await fs.writeFile(localFile, JSON.stringify(all, null, 2));
  }
  return full;
}

export async function listOffers(): Promise<Offer[]> {
  let offers: Offer[];
  if (isPersistent()) {
    const raw = (await redis(["LRANGE", REDIS_KEY, 0, -1])) as string[];
    offers = raw.map((s) => JSON.parse(s) as Offer);
  } else {
    offers = await readLocal();
  }
  // Highest offer first; ties broken by most recent.
  return offers.sort(
    (a, b) => b.price - a.price || b.createdAt.localeCompare(a.createdAt)
  );
}
