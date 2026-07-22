const BASE_URL = "https://api.rentcast.io/v1";

export function isValuationConfigured(): boolean {
  return Boolean(process.env.RENTCAST_API_KEY);
}

export interface ValueEstimate {
  price: number | null;
  rangeLow: number | null;
  rangeHigh: number | null;
}

export async function fetchHomeValue(address: string): Promise<ValueEstimate> {
  if (!process.env.RENTCAST_API_KEY) {
    throw new Error(
      "Home value lookups aren't set up yet. Add RENTCAST_API_KEY to server/.env, then restart the server."
    );
  }

  const url = `${BASE_URL}/avm/value?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": process.env.RENTCAST_API_KEY },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RentCast lookup failed (${res.status}): ${body || res.statusText}`);
  }

  const data = await res.json();
  return {
    price: typeof data.price === "number" ? data.price : null,
    rangeLow: typeof data.priceRangeLow === "number" ? data.priceRangeLow : null,
    rangeHigh: typeof data.priceRangeHigh === "number" ? data.priceRangeHigh : null,
  };
}
