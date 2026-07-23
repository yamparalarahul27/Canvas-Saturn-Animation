import { NextRequest, NextResponse } from "next/server";
import { saveOffer, listOffers, isPersistent } from "@/lib/offers";

export const dynamic = "force-dynamic";

const MIN_ACCEPTED = 50_000; // below this the offer is refused outright
const ASKING_NUDGE = 70_000; // below this a "why so low" note is required

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real users never see this field. Pretend success for bots.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const price = typeof body.price === "number" ? Math.round(body.price) : NaN;

  const phoneDigits = phoneRaw.replace(/[^\d]/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return NextResponse.json(
      { error: "That phone number doesn't look right — how would I call you back?" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) {
    return NextResponse.json({ error: "Enter a real price in ₹." }, { status: 400 });
  }

  if (price < MIN_ACCEPTED) {
    return NextResponse.json(
      { error: "Dude, go away, that low is no cap 🫨" },
      { status: 422 }
    );
  }

  if (price < ASKING_NUDGE && note === "") {
    return NextResponse.json(
      {
        error: "Come on dude, make it above 70k",
        needsNote: true,
      },
      { status: 422 }
    );
  }

  const phone = phoneRaw.startsWith("+") ? `+${phoneDigits}` : phoneDigits;
  const offer = await saveOffer({ name, phone, price, note });
  return NextResponse.json({ ok: true, id: offer.id });
}

export async function GET(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  const key = req.nextUrl.searchParams.get("key");
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const offers = await listOffers();
  return NextResponse.json({ offers, persistent: isPersistent() });
}
