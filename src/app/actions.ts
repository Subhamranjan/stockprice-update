"use server";

export async function getQuote(ticker: string): Promise<{
    price: number | null;
    change?: number;
    changePercent?: number;
    volume?: number | null;
    prevVolume?: number | null;
    low52Week?: number;
    high52Week?: number;
    currency?: string;
    error?: boolean;
}> {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com",
        "Origin": "https://finance.yahoo.com",
    };

    const urls = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, { headers, cache: "no-store" });
            if (!res.ok) continue;

            const data = await res.json();
            const result = data?.chart?.result?.[0];
            if (!result) continue;

            const meta = result.meta;
            const quotes = result.indicators?.quote?.[0];
            const volumes: (number | null)[] = quotes?.volume ?? [];
            const validVols = volumes.filter((v): v is number => v != null);
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
        } catch (err: any) {
            console.error(`getQuote error (${url}):`, err.message);
            continue;
        }
    }

    return { price: null, error: true };
}

export async function getHistory(
    ticker: string,
    range: string = "1y",
    interval: string = "1d"
): Promise<{ date: string; value: number }[]> {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com",
        "Origin": "https://finance.yahoo.com",
    };

    const urls = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`,
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, { headers, cache: "no-store" });
            if (!res.ok) continue;
            const data = await res.json();
            const result = data?.chart?.result?.[0];
            if (!result) continue;

            const timestamps: number[] = result.timestamp ?? [];
            const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

            return timestamps
                .map((ts, i) => ({
                    date: new Date(ts * 1000).toISOString().split("T")[0],
                    value: closes[i] ?? null,
                }))
                .filter(d => d.value !== null) as { date: string; value: number }[];
        } catch (err: any) {
            console.error(`getHistory error (${url}):`, err.message);
            continue;
        }
    }
    return [];
}


