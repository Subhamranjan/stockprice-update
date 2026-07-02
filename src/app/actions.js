"use server";

export async function getQuote(ticker) {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com",
        "Origin": "https://finance.yahoo.com",
    };

    // Try query1 first, fall back to query2 if blocked
    const urls = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, { headers, cache: "no-store" });

            if (!res.ok) continue; // try next URL

            const data = await res.json();
            const result = data?.chart?.result?.[0];

            if (!result) continue;

            const meta = result.meta;
            const quotes = result.indicators?.quote?.[0];
            const volumes = quotes?.volume ?? [];
            const validVols = volumes.filter((v) => v != null);
            const todayVol = validVols[validVols.length - 1] ?? null;
            const prevVol = validVols[validVols.length - 2] ?? null;
            const change = meta.regularMarketPrice - meta.chartPreviousClose;
            const changePercent = (change / meta.chartPreviousClose) * 100;

            return {
                price: meta.regularMarketPrice,
                change,
                changePercent,
                volume: todayVol,
                prevVolume: prevVol,
                low52Week: meta.fiftyTwoWeekLow,
                high52Week: meta.fiftyTwoWeekHigh,
                currency: meta.currency,
            };
        } catch (err) {
            console.error(`getQuote error (${url}):`, err.message);
            continue;
        }
    }

    return { price: null, error: true };
}
