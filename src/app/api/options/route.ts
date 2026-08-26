import { NextRequest } from "next/server";

const YAHOO_SYMBOL_MAP: Record<string, string> = {
    NIFTY: "%5ENSEI",
    BANKNIFTY: "%5ENSEBANK",
    FINNIFTY: "%5ECNXFIN",
    MIDCPNIFTY: "%5ENIFMDCP50",
    SENSEX: "%5EBSESN",
    BANKEX: "%5EBANKEX",
};

const BASE_HEADERS: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com",
};

function formatExpiry(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
    });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get("symbol") ?? "NIFTY").toUpperCase();
    const dateParam = searchParams.get("date"); // optional expiry timestamp

    const yahooSym = YAHOO_SYMBOL_MAP[symbol] ?? `%5E${symbol}`;
    const dateQuery = dateParam ? `&date=${dateParam}` : "";

    const urls = [
        `https://query1.finance.yahoo.com/v7/finance/options/${yahooSym}${dateQuery}`,
        `https://query2.finance.yahoo.com/v7/finance/options/${yahooSym}${dateQuery}`,
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, { headers: BASE_HEADERS, cache: "no-store" });
            console.log(`[options] Yahoo ${url.split("?")[0]} → ${res.status}`);

            if (!res.ok) continue;

            const json = await res.json();
            const result = json?.optionChain?.result?.[0];
            if (!result) continue;

            const spot = result.quote?.regularMarketPrice ?? null;
            const expirationDates: number[] = result.expirationDates ?? [];
            const expiryDates = expirationDates.map(formatExpiry);
            const rawOptions = result.options?.[0];
            const calls = rawOptions?.calls ?? [];
            const puts = rawOptions?.puts ?? [];

            // Merge calls + puts into NSE-like data structure
            const strikeMap: Record<number, any> = {};

            calls.forEach((c: any) => {
                strikeMap[c.strike] = {
                    strikePrice: c.strike,
                    expiryDate: expiryDates[0] ?? "",
                    CE: {
                        strikePrice: c.strike,
                        lastPrice: c.lastPrice ?? 0,
                        change: c.change ?? 0,
                        pChange: c.percentChange ?? 0,
                        openInterest: c.openInterest ?? 0,
                        changeinOpenInterest: 0,
                        totalTradedVolume: c.volume ?? 0,
                        impliedVolatility: c.impliedVolatility ? parseFloat((c.impliedVolatility * 100).toFixed(2)) : 0,
                        bidprice: c.bid ?? 0,
                        askPrice: c.ask ?? 0,
                    },
                };
            });

            puts.forEach((p: any) => {
                if (!strikeMap[p.strike]) {
                    strikeMap[p.strike] = { strikePrice: p.strike, expiryDate: expiryDates[0] ?? "" };
                }
                strikeMap[p.strike].PE = {
                    strikePrice: p.strike,
                    lastPrice: p.lastPrice ?? 0,
                    change: p.change ?? 0,
                    pChange: p.percentChange ?? 0,
                    openInterest: p.openInterest ?? 0,
                    changeinOpenInterest: 0,
                    totalTradedVolume: p.volume ?? 0,
                    impliedVolatility: p.impliedVolatility ? parseFloat((p.impliedVolatility * 100).toFixed(2)) : 0,
                    bidprice: p.bid ?? 0,
                    askPrice: p.ask ?? 0,
                };
            });

            const data = Object.values(strikeMap).sort((a: any, b: any) => a.strikePrice - b.strikePrice);

            return Response.json({
                records: {
                    underlyingValue: spot,
                    expiryDates,
                    expirationTimestamps: expirationDates, // raw timestamps for switching expiry
                    data,
                },
                source: "yahoo",
            });

        } catch (err: any) {
            console.error(`[options] error for ${url}:`, err.message);
            continue;
        }
    }

    return Response.json({
        error: true,
        message: "Could not fetch option chain. Check symbol or try again.",
    }, { status: 503 });
}
