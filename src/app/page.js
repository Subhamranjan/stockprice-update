"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { getQuote } from "./actions";
import { getHistory } from "./actions";


const REFRESH_INTERVAL = 300000;

const MARKETS = {
    NSE: { suffix: ".NS", currency: "INR", symbol: "₹", label: "NSE", tz: "Asia/Kolkata", open: [9, 15], close: [15, 30] },
    BSE: { suffix: ".BO", currency: "INR", symbol: "₹", label: "BSE", tz: "Asia/Kolkata", open: [9, 15], close: [15, 30] },
    NASDAQ: { suffix: "", currency: "USD", symbol: "$", label: "NASDAQ", tz: "America/New_York", open: [9, 30], close: [16, 0] },
    NYSE: { suffix: "", currency: "USD", symbol: "$", label: "NYSE", tz: "America/New_York", open: [9, 30], close: [16, 0] },
    TSE: { suffix: ".T", currency: "JPY", symbol: "¥", label: "Tokyo", tz: "Asia/Tokyo", open: [9, 0], close: [15, 0] },
    LSE: { suffix: ".L", currency: "GBP", symbol: "£", label: "LSE", tz: "Europe/London", open: [8, 0], close: [16, 30] },
    HKEX: { suffix: ".HK", currency: "HKD", symbol: "HK$", label: "HKEX", tz: "Asia/Hong_Kong", open: [9, 30], close: [16, 0] },
    SSE: { suffix: ".SS", currency: "CNY", symbol: "¥", label: "Shanghai", tz: "Asia/Shanghai", open: [9, 30], close: [15, 0] },
    SGX: { suffix: ".SI", currency: "SGD", symbol: "S$", label: "SGX", tz: "Asia/Singapore", open: [9, 0], close: [17, 0] },
    ASX: { suffix: ".AX", currency: "AUD", symbol: "A$", label: "ASX", tz: "Australia/Sydney", open: [10, 0], close: [16, 0] },
    KRX: { suffix: ".KS", currency: "KRW", symbol: "₩", label: "KRX", tz: "Asia/Seoul", open: [9, 0], close: [15, 30] },
    TWSE: { suffix: ".TW", currency: "TWD", symbol: "NT$", label: "TWSE", tz: "Asia/Taipei", open: [9, 0], close: [13, 30] },
    JSE: { suffix: ".JO", currency: "ZAR", symbol: "R", label: "JSE", tz: "Africa/Johannesburg", open: [9, 0], close: [17, 0] },
    TADAWUL: { suffix: ".SR", currency: "SAR", symbol: "﷼", label: "Tadawul", tz: "Asia/Riyadh", open: [10, 0], close: [15, 0] },
    B3: { suffix: ".SA", currency: "BRL", symbol: "R$", label: "B3", tz: "America/Sao_Paulo", open: [10, 0], close: [18, 0] },
    TSX: { suffix: ".TO", currency: "CAD", symbol: "C$", label: "TSX", tz: "America/Toronto", open: [9, 30], close: [16, 0] },
    COMMODITY: { suffix: "", currency: "USD", symbol: "$", label: "Commodity", tz: "America/New_York", open: [18, 0], close: [17, 0] },
    INDEX: { suffix: "", currency: "", symbol: "", label: "Index", tz: "Asia/Kolkata", open: [9, 0], close: [16, 0] },
};

const COMMODITY_PRESETS = [
    { label: "Gold", value: "GC=F" },
    { label: "Silver", value: "SI=F" },
    { label: "Crude Oil", value: "CL=F" },
    { label: "Brent Crude", value: "BZ=F" },
    { label: "Natural Gas", value: "NG=F" },
    { label: "Copper", value: "HG=F" },
    { label: "Platinum", value: "PL=F" },
    { label: "Corn", value: "ZC=F" },
    { label: "Wheat", value: "ZW=F" },
    { label: "Soybean", value: "ZS=F" },
    { label: "Cotton", value: "CT=F" },
    { label: "Coffee", value: "KC=F" },
];

const INDEX_PRESETS = [
    { label: "Nifty 50", value: "^NSEI", market: "INDEX" },
    { label: "Sensex", value: "^BSESN", market: "INDEX" },
    { label: "Nifty Bank", value: "^NSEBANK", market: "INDEX" },
    { label: "Nifty IT", value: "^CNXIT", market: "INDEX" },
    { label: "Nifty Midcap 50", value: "^NSEMDCP50", market: "INDEX" },
    { label: "Nifty Next 50", value: "^NSMIDCP", market: "INDEX" },
    { label: "Nifty Auto", value: "^CNXAUTO", market: "INDEX" },
    { label: "Nifty Pharma", value: "^CNXPHARMA", market: "INDEX" },
    { label: "Nifty FMCG", value: "^CNXFMCG", market: "INDEX" },
    { label: "Nifty Metal", value: "^CNXMETAL", market: "INDEX" },
    { label: "Nifty Energy", value: "^CNXENERGY", market: "INDEX" },
    { label: "Nifty Realty", value: "^CNXREALTY", market: "INDEX" },
    { label: "Nifty Infra", value: "^CNXINFRA", market: "INDEX" },
    { label: "Nifty PSU Bank", value: "^CNXPSUBANK", market: "INDEX" },
    { label: "India VIX", value: "^INDIAVIX", market: "INDEX" },
    { label: "S&P 500", value: "^GSPC", market: "INDEX" },
    { label: "Nasdaq 100", value: "^NDX", market: "INDEX" },
    { label: "Dow Jones", value: "^DJI", market: "INDEX" },
    { label: "Russell 2000", value: "^RUT", market: "INDEX" },
    { label: "S&P 400 Mid", value: "^MID", market: "INDEX" },
    { label: "NYSE Composite", value: "^NYA", market: "INDEX" },
    { label: "VIX", value: "^VIX", market: "INDEX" },
    { label: "FTSE 100", value: "^FTSE", market: "INDEX" },
    { label: "DAX", value: "^GDAXI", market: "INDEX" },
    { label: "CAC 40", value: "^FCHI", market: "INDEX" },
    { label: "Euro Stoxx 50", value: "^STOXX50E", market: "INDEX" },
    { label: "IBEX 35", value: "^IBEX", market: "INDEX" },
    { label: "AEX (Amsterdam)", value: "^AEX", market: "INDEX" },
    { label: "SMI (Swiss)", value: "^SSMI", market: "INDEX" },
    { label: "OMX (Stockholm)", value: "^OMX", market: "INDEX" },
    { label: "ATX (Austria)", value: "^ATX", market: "INDEX" },
    { label: "BEL 20", value: "^BFX", market: "INDEX" },
    { label: "FTSE MIB Italy", value: "FTSEMIB.MI", market: "INDEX" },
    { label: "Nikkei 225", value: "^N225", market: "INDEX" },
    { label: "Topix", value: "^TOPX", market: "INDEX" },
    { label: "Hang Seng", value: "^HSI", market: "INDEX" },
    { label: "Shanghai", value: "000001.SS", market: "INDEX" },
    { label: "Shenzhen", value: "399001.SZ", market: "INDEX" },
    { label: "CSI 300", value: "000300.SS", market: "INDEX" },
    { label: "Kospi", value: "^KS11", market: "INDEX" },
    { label: "Kosdaq", value: "^KQ11", market: "INDEX" },
    { label: "Taiwan TWSE", value: "^TWII", market: "INDEX" },
    { label: "ASX 200", value: "^AXJO", market: "INDEX" },
    { label: "Straits Times", value: "^STI", market: "INDEX" },
    { label: "Jakarta (IDX)", value: "^JKSE", market: "INDEX" },
    { label: "SET (Thailand)", value: "^SET.BK", market: "INDEX" },
    { label: "KLCI (Malaysia)", value: "^KLSE", market: "INDEX" },
    { label: "PSEi (Philippines)", value: "PSEi.PS", market: "INDEX" },
    { label: "Tadawul (Saudi)", value: "^TASI.SR", market: "INDEX" },
    { label: "DFM (Dubai)", value: "^DFMGI", market: "INDEX" },
    { label: "ADX (Abu Dhabi)", value: "^FTFADGI", market: "INDEX" },
    { label: "EGX 30 (Egypt)", value: "^CASE30", market: "INDEX" },
    { label: "JSE (S.Africa)", value: "^J203.JO", market: "INDEX" },
    { label: "NSE 20 (Kenya)", value: "^NSE20", market: "INDEX" },
    { label: "TSX (Canada)", value: "^GSPTSE", market: "INDEX" },
    { label: "Bovespa (Brazil)", value: "^BVSP", market: "INDEX" },
    { label: "IPC (Mexico)", value: "^MXX", market: "INDEX" },
    { label: "Merval (Argentina)", value: "^MERV", market: "INDEX" },
    { label: "IPSA (Chile)", value: "^IPSA", market: "INDEX" },
];

const INDEX_GROUPS = [
    {
        label: "India",
        values: ["^NSEI", "^BSESN", "^NSEBANK", "^CNXIT", "^NSEMDCP50",
            "^NSMIDCP", "^CNXAUTO", "^CNXPHARMA", "^CNXFMCG",
            "^CNXMETAL", "^CNXENERGY", "^CNXREALTY", "^CNXINFRA",
            "^CNXPSUBANK", "^INDIAVIX"],
    },
    {
        label: "USA",
        values: ["^GSPC", "^NDX", "^DJI", "^RUT", "^MID", "^NYA", "^VIX"],
    },
    {
        label: "Europe",
        values: ["^FTSE", "^GDAXI", "^FCHI", "^STOXX50E", "^IBEX",
            "^AEX", "^SSMI", "^OMX", "^ATX", "^BFX", "FTSEMIB.MI"],
    },
    {
        label: "Asia",
        values: ["^N225", "^TOPX", "^HSI", "000001.SS", "399001.SZ",
            "000300.SS", "^KS11", "^KQ11", "^TWII", "^AXJO",
            "^STI", "^JKSE", "^SET.BK", "^KLSE", "PSEi.PS"],
    },
    {
        label: "Middle East & Africa",
        values: ["^TASI.SR", "^DFMGI", "^FTFADGI", "^CASE30", "^J203.JO", "^NSE20"],
    },
    {
        label: "Americas",
        values: ["^GSPTSE", "^BVSP", "^MXX", "^MERV", "^IPSA"],
    },
];

const REFERENCE_CLOCKS = [
    { label: "NSE", tz: "Asia/Kolkata", open: [9, 15], close: [15, 30], alwaysOpen: false },
    { label: "BSE", tz: "Asia/Kolkata", open: [9, 15], close: [15, 30], alwaysOpen: false },
    { label: "NASDAQ", tz: "America/New_York", open: [9, 30], close: [16, 0], alwaysOpen: false },
    { label: "NYSE", tz: "America/New_York", open: [9, 30], close: [16, 0], alwaysOpen: false },
    { label: "Tokyo", tz: "Asia/Tokyo", open: [9, 0], close: [15, 0], alwaysOpen: false },
    { label: "London", tz: "Europe/London", open: [8, 0], close: [16, 30], alwaysOpen: false },
    { label: "SGX", tz: "Asia/Singapore", open: [9, 0], close: [17, 0], alwaysOpen: false },
    { label: "ASX", tz: "Australia/Sydney", open: [10, 0], close: [16, 0], alwaysOpen: false },
    { label: "KRX", tz: "Asia/Seoul", open: [9, 0], close: [15, 30], alwaysOpen: false },
    { label: "JSE", tz: "Africa/Johannesburg", open: [9, 0], close: [17, 0], alwaysOpen: false },
    { label: "Tadawul", tz: "Asia/Riyadh", open: [10, 0], close: [15, 0], alwaysOpen: false },
    { label: "B3", tz: "America/Sao_Paulo", open: [10, 0], close: [18, 0], alwaysOpen: false },
    { label: "TSX", tz: "America/Toronto", open: [9, 30], close: [16, 0], alwaysOpen: false },
    { label: "FX", tz: "Asia/Kolkata", open: [0, 0], close: [23, 59], alwaysOpen: true },
    { label: "Commodities", tz: "America/New_York", open: [18, 0], close: [17, 0], alwaysOpen: true },
];



const NIFTY_COMPARE_GROUPS = {
    Sectoral: [
        { label: "Nifty Auto", ticker: "^CNXAUTO" },
        { label: "Nifty Bank", ticker: "^NSEBANK" },
        { label: "Nifty IT", ticker: "^CNXIT" },
        { label: "Nifty Pharma", ticker: "^CNXPHARMA" },
        { label: "Nifty FMCG", ticker: "^CNXFMCG" },
        { label: "Nifty Metal", ticker: "^CNXMETAL" },
        { label: "Nifty Energy", ticker: "^CNXENERGY" },
        { label: "Nifty Realty", ticker: "^CNXREALTY" },
        { label: "Nifty Infra", ticker: "^CNXINFRA" },
        { label: "Nifty PSU Bank", ticker: "^CNXPSUBANK" },
        { label: "Nifty Media", ticker: "^CNXMEDIA" },
        { label: "Nifty Finance", ticker: "^CNXFINANCE" },
    ],
    Thematic: [
        { label: "Nifty MNC", ticker: "^CNXMNC" },
        { label: "Nifty PSE", ticker: "^CNXPSE" },
        { label: "Nifty CPSE", ticker: "^CNXCPSE" },
        { label: "Nifty Services", ticker: "^CNXSERVICE" },
        { label: "Nifty Consumption", ticker: "^CNXCONSUMPTION" },
        { label: "Nifty Mfg", ticker: "^CNXMFG" },
    ],
    "Broad Market": [
        { label: "Sensex", ticker: "^BSESN" },
        { label: "Nifty 100", ticker: "^CNX100" },
        { label: "Nifty 500", ticker: "^CNX500" },
        { label: "Nifty Midcap 50", ticker: "^NSEMDCP50" },
        { label: "Nifty Next 50", ticker: "^NSMIDCP" },
        { label: "Nifty Smallcap", ticker: "^CNXSC" },
        { label: "India VIX", ticker: "^INDIAVIX" },
    ],
};

const RANGES = [
    { label: "1M", value: "1mo", interval: "1d" },
    { label: "3M", value: "3mo", interval: "1d" },
    { label: "6M", value: "6mo", interval: "1d" },
    { label: "1Y", value: "1y", interval: "1d" },
    { label: "2Y", value: "2y", interval: "1wk" },
    { label: "5Y", value: "5y", interval: "1wk" },
];


const OPTION_SYMBOLS = [
    "NIFTY", "BANKNIFTY", "FINNIFTY",
    "MIDCPNIFTY", "SENSEX", "BANKEX",
];


// Normalize series to % change from first value
function normalize(data) {
    if (!data || data.length === 0) return [];
    const base = data[0].value;
    if (!base) return [];
    return data.map(d => ({
        date: d.date,
        value: parseFloat((((d.value - base) / base) * 100).toFixed(2)),
    }));
}

const LINE_COLORS = [
    "#2563eb", "#dc2626", "#16a34a", "#d97706",
    "#7c3aed", "#db2777", "#0891b2", "#65a30d",
    "#ea580c", "#6366f1", "#14b8a6", "#f43f5e",
];

// ── Market hours ─────────────────────────────────────────────────────────────

function getLocalTime(tz) {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: tz }));
}

function isMarketOpenForClock(clock) {
    if (clock.alwaysOpen) return true;
    const local = getLocalTime(clock.tz);
    const day = local.getDay();
    if (day === 0 || day === 6) return false;
    const total = local.getHours() * 60 + local.getMinutes();
    const openMin = clock.open[0] * 60 + clock.open[1];
    const closeMin = clock.close[0] * 60 + clock.close[1];
    return total >= openMin && total < closeMin;
}

function secondsUntilOpenForClock(clock) {
    const local = getLocalTime(clock.tz);
    const day = local.getDay();
    const open = new Date(local);
    open.setHours(clock.open[0], clock.open[1], 0, 0);
    if (day === 0) open.setDate(open.getDate() + 1);
    else if (day === 6) open.setDate(open.getDate() + 2);
    else if (local >= open) open.setDate(open.getDate() + (day === 5 ? 3 : 1));
    return Math.max(0, Math.floor((open - local) / 1000));
}

function secondsUntilCloseForClock(clock) {
    const local = getLocalTime(clock.tz);
    const close = new Date(local);
    close.setHours(clock.close[0], clock.close[1], 0, 0);
    return Math.max(0, Math.floor((close - local) / 1000));
}

function formatSeconds(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function clockForMarket(marketKey) {
    const found = REFERENCE_CLOCKS.find(c => c.label === MARKETS[marketKey]?.label);
    if (found) return found;
    const m = MARKETS[marketKey] || MARKETS.NSE;
    return { label: m.label, tz: m.tz, open: m.open, close: m.close, alwaysOpen: false };
}

// ── Days held — counts ALL calendar days including weekends ──────────────────
function daysSince(dateStr) {
    if (!dateStr) return null;
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = today - start;
    if (diff < 0) return null;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calcRR(buyPrice, target, stopLoss, side = "buy") {
    if (!buyPrice || !target || !stopLoss) return null;
    const reward = side === "buy" ? target - buyPrice : buyPrice - target;
    const risk = side === "buy" ? buyPrice - stopLoss : stopLoss - buyPrice;
    if (reward <= 0 || risk <= 0) return null;
    return (reward / risk).toFixed(2);
}

function fmtMoney(value, market) {
    const m = MARKETS[market] || MARKETS.NSE;
    if (value === null || value === undefined || isNaN(value)) return "-";
    const decimals = market === "FX" ? 4 : 2;
    const num = value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (market === "INDEX") return num;
    return m.symbol ? `${m.symbol}${num}` : num;
}

// ── RangeBar ──────────────────────────────────────────────────────────────────

function RangeBar({ price, low52, high52, market }) {
    if (!price || !low52 || !high52 || high52 === low52) return null;
    const pct = Math.max(0, Math.min(100, ((price - low52) / (high52 - low52)) * 100));
    return (
        <div className="mt-1">
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>52W L {fmtMoney(low52, market)}</span>
                <span>{fmtMoney(high52, market)} 52W H</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-gray-100">
                <div className="absolute h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400" style={{ width: "100%" }} />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 shadow" style={{ left: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct.toFixed(1)}% of range</p>
        </div>
    );
}

// ── MarketBadge ───────────────────────────────────────────────────────────────

function MarketBadge({ clock }) {
    const [open, setOpen] = useState(isMarketOpenForClock(clock));
    const [countdown, setCountdown] = useState("");

    useEffect(() => {
        const tick = () => {
            const o = isMarketOpenForClock(clock);
            setOpen(o);
            setCountdown(o
                ? formatSeconds(secondsUntilCloseForClock(clock))
                : formatSeconds(secondsUntilOpenForClock(clock))
            );
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [clock]);

    return (
        <div className="flex flex-col items-center min-w-[110px] rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-center">
            <span className={`text-[10px] font-medium ${open ? "text-green-500" : "text-red-400"}`}>
                {open ? `● ${clock.label} open` : `● ${clock.label} closed`}
            </span>
            <span className="text-sm font-mono font-semibold text-blue-600">{countdown}</span>
            <span className="text-[10px] text-gray-400">{open ? "closes in" : "opens in"}</span>
        </div>
    );
}

// ── ClockSelector ─────────────────────────────────────────────────────────────

function ClockSelector({ visible, onToggle, total }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
            >
                Clocks
                <span className="text-[10px] text-gray-400">
                    ({visible.length}/{total ?? REFERENCE_CLOCKS.length})
                </span>
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute top-full z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white shadow-lg py-1 max-h-72 overflow-y-auto">
                        {REFERENCE_CLOCKS.map((clock) => (
                            <label
                                key={clock.label}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={visible.includes(clock.label)}
                                    onChange={() => onToggle(clock.label)}
                                    className="accent-blue-500"
                                />
                                {clock.label}
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── StockCard ─────────────────────────────────────────────────────────────────

function StockCard({ symbol, market, target, stopLoss, entryDate, notes, qty, buyPrice, side, mode, onRemove, onUpdate, isDragging }) {
    const [quote, setQuote] = useState(null);
    const [showNotes, setShowNotes] = useState(false);
    const m = MARKETS[market] || MARKETS.NSE;
    const isTrading = mode !== "watch";

    useEffect(() => {
        let active = true;
        const fetchPrice = async () => {
            const ticker = (market === "COMMODITY" || market === "INDEX")
                ? symbol
                : `${symbol}${m.suffix}`;
            const data = await getQuote(ticker);
            if (active) setQuote(data);
        };
        fetchPrice();
        const interval = setInterval(fetchPrice, REFRESH_INTERVAL);
        return () => { active = false; clearInterval(interval); };
    }, [symbol, market]);

    const price = quote?.price ?? null;
    const daysHeld = daysSince(entryDate);
    const rr = calcRR(buyPrice, target, stopLoss, side);

    const status =
        price === null ? "Loading"
            : !isTrading ? "Watching"
                : side === "buy"
                    ? price >= target ? "Target hit"
                        : price <= stopLoss ? "Stoploss hit"
                            : "Holding"
                    : price <= target ? "Target hit"
                        : price >= stopLoss ? "Stoploss hit"
                            : "Holding";

    const badgeClasses =
        status === "Target hit" ? "bg-green-100 text-green-700"
            : status === "Stoploss hit" ? "bg-red-100 text-red-700"
                : status === "Holding" ? "bg-amber-100 text-amber-700"
                    : status === "Watching" ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600";

    const changeColor =
        quote?.change > 0 ? "text-green-600"
            : quote?.change < 0 ? "text-red-600"
                : "text-gray-500";

    const rrColor =
        !rr ? "text-gray-400"
            : rr >= 2 ? "text-green-600"
                : rr >= 1 ? "text-amber-600"
                    : "text-red-500";

    const volChgPct = quote?.volume && quote?.prevVolume
        ? ((quote.volume - quote.prevVolume) / quote.prevVolume * 100).toFixed(1)
        : null;

    return (
        <div className={`h-full flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm transition-all duration-150 ${isDragging ? "border-blue-400 shadow-lg opacity-50 scale-95" : "border-gray-200"}`}>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Drag handle */}
                    <span className="text-gray-300 cursor-grab active:cursor-grabbing select-none text-base leading-none" title="Drag to reorder">⠿</span>
                    <h3 className="text-base font-semibold text-gray-900">
                        {market === "COMMODITY"
                            ? (COMMODITY_PRESETS.find(c => c.value === symbol)?.label ?? symbol)
                            : market === "INDEX"
                                ? (INDEX_PRESETS.find(i => i.value === symbol)?.label ?? symbol)
                                : symbol}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium">{m.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onUpdate("mode", isTrading ? "watch" : "trade")}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors ${isTrading
                            ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                    >
                        {isTrading ? "Trading" : "Watch"}
                    </button>
                    {isTrading && (
                        <button onClick={() => setShowNotes(v => !v)} className="text-xs text-gray-400 hover:text-blue-500 transition-colors">📝</button>
                    )}
                    <button
                        onClick={onRemove}
                        className="w-6 h-6 rounded-md border border-gray-300 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center text-base leading-none"
                    >×</button>
                </div>
            </div>

            {/* Qty */}
            {isTrading && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Qty</span>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => onUpdate("qty", Math.max(1, (qty || 1) - 1))}
                            className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium flex items-center justify-center">−</button>
                        <input type="number" value={qty || 1} min={1}
                            onChange={(e) => onUpdate("qty", Math.max(1, Number(e.target.value)))}
                            className="w-16 text-center text-sm font-semibold text-gray-800 border border-gray-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onClick={() => onUpdate("qty", (qty || 1) + 1)}
                            className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium flex items-center justify-center">+</button>
                    </div>
                    <span className="text-xs text-gray-400">
                        {price !== null && qty ? fmtMoney(price * qty, market) : ""}
                    </span>
                </div>
            )}

            {/* Buy / Sell */}
            {isTrading && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Direction</span>
                    <div className="flex rounded-md overflow-hidden border border-gray-300 text-xs font-medium">
                        <button onClick={() => onUpdate("side", "buy")}
                            className={`px-3 py-1 transition-colors ${side === "buy" ? "bg-green-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>Buy</button>
                        <button onClick={() => onUpdate("side", "sell")}
                            className={`px-3 py-1 transition-colors ${side === "sell" ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>Sell</button>
                    </div>
                </div>
            )}

            {/* Price */}
            <p className="text-2xl font-semibold text-gray-900">
                {price !== null ? fmtMoney(price, market) : "..."}
            </p>

            {/* Change */}
            {quote?.change !== undefined && quote?.change !== null && (
                <p className={`text-sm font-medium ${changeColor}`}>
                    {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
                </p>
            )}

            {/* Status badge */}
            <span className={`self-start rounded-md px-2.5 py-1 text-xs font-medium ${badgeClasses}`}>{status}</span>

            {/* 52W range */}
            {quote?.low52Week && quote?.high52Week && (
                <RangeBar price={price} low52={quote.low52Week} high52={quote.high52Week} market={market} />
            )}

            {/* Stats grid */}
            {isTrading && (
                <div className="grid grid-cols-3 gap-1 mt-1 text-center">
                    <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p className="text-[10px] text-gray-400">Volume</p>
                        <p className="text-xs font-semibold text-gray-700">
                            {quote?.volume ? (quote.volume / 1_00_000).toFixed(1) + "L" : "-"}
                        </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p className="text-[10px] text-gray-400">Prev Vol</p>
                        <p className="text-xs font-semibold text-gray-700">
                            {quote?.prevVolume ? (quote.prevVolume / 1_00_000).toFixed(1) + "L" : "-"}
                        </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p className="text-[10px] text-gray-400">Vol chg</p>
                        <p className={`text-xs font-semibold ${volChgPct === null ? "text-gray-400" : Number(volChgPct) > 0 ? "text-blue-600" : "text-red-500"}`}>
                            {volChgPct !== null ? `${volChgPct}%` : "-"}
                        </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p className="text-[10px] text-gray-400">Days held</p>
                        <p className="text-xs font-semibold text-gray-700">
                            {daysHeld !== null ? `${daysHeld}d` : "-"}
                        </p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 px-2 py-1.5">
                        <p className="text-[10px] text-gray-400">R : R</p>
                        <p className={`text-xs font-semibold ${rrColor}`}>{rr ? `1 : ${rr}` : "-"}</p>
                    </div>
                </div>
            )}

            {/* Inputs */}
            {isTrading && (
                <div className="mt-1 flex flex-col gap-1.5">
                    <label className="flex items-center justify-between text-sm text-gray-600">
                        <span>Target ({price !== null ? (target - price).toFixed(2) : "-"})</span>
                        <input type="number" value={target} onChange={(e) => onUpdate("target", e.target.value)}
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                    <label className="flex items-center justify-between text-sm text-gray-600">
                        <span>Stop Loss ({price !== null ? (price - stopLoss).toFixed(2) : "-"})</span>
                        <input type="number" value={stopLoss} onChange={(e) => onUpdate("stopLoss", e.target.value)}
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                    <label className="flex items-center justify-between text-sm text-gray-600">
                        <span>Entry date</span>
                        <input type="date" value={entryDate || ""} onChange={(e) => onUpdate("entryDate", e.target.value)}
                            className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                    <label className="flex items-center justify-between text-sm text-gray-600">
                        <span>Buy Price</span>
                        <input type="number" value={buyPrice || ""} onChange={(e) => onUpdate("buyPrice", e.target.value)}
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0" />
                    </label>
                </div>
            )}

            {/* P&L */}
            {isTrading && buyPrice > 0 && price !== null && qty > 0 && (() => {
                const pnl = side === "buy" ? (price - buyPrice) * qty : (buyPrice - price) * qty;
                const pnlPct = side === "buy" ? ((price - buyPrice) / buyPrice) * 100 : ((buyPrice - price) / buyPrice) * 100;
                const isProfit = pnl >= 0;
                return (
                    <div className={`rounded-lg px-3 py-2 ${isProfit ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">P&L ({daysHeld !== null ? `${daysHeld}d` : "0d"})</span>
                            <span className={`text-[10px] font-medium ${isProfit ? "text-green-600" : "text-red-500"}`}>{pnlPct.toFixed(2)}%</span>
                        </div>
                        <p className={`text-base font-semibold ${isProfit ? "text-green-600" : "text-red-500"}`}>
                            {isProfit ? "+" : ""}{fmtMoney(pnl, market)}
                        </p>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                            <span>Buy {fmtMoney(buyPrice, market)}</span>
                            <span>Now {fmtMoney(price, market)}</span>
                        </div>
                    </div>
                );
            })()}

            {/* Notes */}
            {isTrading && showNotes && (
                <textarea value={notes || ""} onChange={(e) => onUpdate("notes", e.target.value)}
                    placeholder="Trade thesis, setup, key levels..." rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
        </div>
    );
}

// ── Responsive columns ────────────────────────────────────────────────────────

function useResponsiveColumns(desktopColumns = 4) {
    const [columns, setColumns] = useState(desktopColumns);
    useEffect(() => {
        const compute = () => {
            const w = window.innerWidth;
            if (w < 640) return 1;
            if (w < 1024) return 2;
            return desktopColumns;
        };
        const onResize = () => setColumns(compute());
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [desktopColumns]);
    return columns;
}

// -- Compare Chart --------------------------------------------------------

function CompareChart({ onClose }) {
    const [activeGroup, setActiveGroup] = useState("Sectoral");
    const [selected, setSelected] = useState([]);       // array of ticker strings
    const [range, setRange] = useState(RANGES[3]);      // default 1Y
    const [seriesData, setSeriesData] = useState({});   // { ticker: [{date,value}] }
    const [loading, setLoading] = useState({});         // { ticker: bool }
    const [baseData, setBaseData] = useState([]);       // Nifty 50 data
    const [baseLoading, setBaseLoading] = useState(true);
    const [tooltip, setTooltip] = useState(null);

    const BASE_TICKER = "^NSEI";
    const BASE_LABEL = "Nifty 50";

    // Load base (Nifty 50) on mount or range change
    useEffect(() => {
        setBaseLoading(true);
        getHistory(BASE_TICKER, range.value, range.interval).then(data => {
            setBaseData(normalize(data));
            setBaseLoading(false);
        });
        // Reload all selected on range change
        selected.forEach(ticker => loadSeries(ticker));
    }, [range]);

    const loadSeries = async (ticker) => {
        setLoading(prev => ({ ...prev, [ticker]: true }));
        const data = await getHistory(ticker, range.value, range.interval);
        setSeriesData(prev => ({ ...prev, [ticker]: normalize(data) }));
        setLoading(prev => ({ ...prev, [ticker]: false }));
    };

    const toggleSeries = (ticker) => {
        if (selected.includes(ticker)) {
            setSelected(prev => prev.filter(t => t !== ticker));
        } else {
            setSelected(prev => [...prev, ticker]);
            if (!seriesData[ticker]) loadSeries(ticker);
        }
    };

    // Merge all series into one array keyed by date
    const mergedData = useMemo(() => {
        const dateMap = {};
        // Add base
        baseData.forEach(d => {
            dateMap[d.date] = { date: d.date, [BASE_TICKER]: d.value };
        });
        // Add selected
        selected.forEach(ticker => {
            (seriesData[ticker] ?? []).forEach(d => {
                if (!dateMap[d.date]) dateMap[d.date] = { date: d.date };
                dateMap[d.date][ticker] = d.value;
            });
        });
        return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    }, [baseData, seriesData, selected]);

    // Get label for ticker
    const getLabel = (ticker) => {
        if (ticker === BASE_TICKER) return BASE_LABEL;
        for (const group of Object.values(NIFTY_COMPARE_GROUPS)) {
            const found = group.find(i => i.ticker === ticker);
            if (found) return found.label;
        }
        return ticker;
    };

    // All lines to draw
    const allLines = [BASE_TICKER, ...selected];

    // Last values for legend
    const lastRow = mergedData[mergedData.length - 1] ?? {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="rounded-2xl shadow-2xl flex flex-col bg-white border border-gray-200 w-[96vw] h-[92vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">📊 Nifty 50 — Compare Chart</span>
                        {selected.length > 0 && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                +{selected.length} indices
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Range selector */}
                        <div className="flex rounded-md overflow-hidden border border-gray-300 text-xs font-medium">
                            {RANGES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setRange(r)}
                                    className={`px-2.5 py-1.5 transition-colors ${range.value === r.value
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        {selected.length > 0 && (
                            <button
                                onClick={() => setSelected([])}
                                className="text-xs px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                            >
                                Clear all
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-md border border-gray-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-lg"
                        >×</button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar */}
                    <div className="w-52 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">

                        {/* Base badge */}
                        <div className="px-3 py-2 border-b border-gray-200">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Base Index</p>
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 border border-blue-200">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: LINE_COLORS[0] }} />
                                <span className="text-xs font-semibold text-blue-700">Nifty 50</span>
                                {lastRow[BASE_TICKER] !== undefined && (
                                    <span className={`ml-auto text-[11px] font-bold ${lastRow[BASE_TICKER] >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {lastRow[BASE_TICKER] >= 0 ? "+" : ""}{lastRow[BASE_TICKER]}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Group tabs */}
                        <div className="flex border-b border-gray-200">
                            {Object.keys(NIFTY_COMPARE_GROUPS).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setActiveGroup(g)}
                                    className={`flex-1 py-1.5 text-[9px] font-semibold transition-colors ${activeGroup === g
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    {g === "Broad Market" ? "Broad" : g}
                                </button>
                            ))}
                        </div>

                        {/* Index list */}
                        <div className="flex-1 overflow-y-auto py-1">
                            {NIFTY_COMPARE_GROUPS[activeGroup].map((item, i) => {
                                const isSelected = selected.includes(item.ticker);
                                const colorIdx = selected.indexOf(item.ticker) + 1;
                                const color = isSelected ? LINE_COLORS[colorIdx % LINE_COLORS.length] : undefined;
                                const pct = isSelected && lastRow[item.ticker] !== undefined
                                    ? lastRow[item.ticker]
                                    : null;

                                return (
                                    <button
                                        key={item.ticker}
                                        onClick={() => toggleSeries(item.ticker)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${isSelected
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        <span className="w-3 h-3 rounded flex-shrink-0 border flex items-center justify-center text-[9px]"
                                            style={isSelected ? { background: color, borderColor: color, color: "#fff" } : { borderColor: "#d1d5db" }}>
                                            {isSelected ? "✓" : ""}
                                        </span>
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {loading[item.ticker] && (
                                            <span className="text-[9px] text-gray-400">...</span>
                                        )}
                                        {pct !== null && !loading[item.ticker] && (
                                            <span className={`text-[10px] font-bold ${pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                {pct >= 0 ? "+" : ""}{pct}%
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected summary */}
                        {selected.length > 0 && (
                            <div className="border-t border-gray-200 px-3 py-2">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Selected ({selected.length})</p>
                                {selected.map((ticker, i) => (
                                    <div key={ticker} className="flex items-center gap-1.5 py-0.5">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ background: LINE_COLORS[(i + 1) % LINE_COLORS.length] }} />
                                        <span className="text-[11px] text-gray-600 truncate flex-1">{getLabel(ticker)}</span>
                                        <button onClick={() => toggleSeries(ticker)}
                                            className="text-gray-300 hover:text-red-500 text-sm">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 flex flex-col overflow-hidden p-3">

                        {baseLoading ? (
                            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                                Loading Nifty 50 data...
                            </div>
                        ) : (
                            <>
                                {/* Legend */}
                                <div className="flex flex-wrap gap-3 mb-2 px-1">
                                    {allLines.map((ticker, i) => {
                                        const pct = lastRow[ticker];
                                        return (
                                            <div key={ticker} className="flex items-center gap-1.5">
                                                <span className="w-5 h-0.5 rounded-full inline-block" style={{ background: LINE_COLORS[i % LINE_COLORS.length] }} />
                                                <span className="text-xs text-gray-600">{getLabel(ticker)}</span>
                                                {pct !== undefined && (
                                                    <span className={`text-xs font-bold ${pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                        ({pct >= 0 ? "+" : ""}{pct}%)
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <span className="text-[10px] text-gray-400 ml-auto self-center">% change from start — all indices normalized</span>
                                </div>

                                {/* Custom SVG chart */}
                                <CustomLineChart
                                    data={mergedData}
                                    lines={allLines}
                                    colors={LINE_COLORS}
                                    getLabel={getLabel}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Custom SVG Line Chart ─────────────────────────────────────────────────────

function CustomLineChart({ data, lines, colors, getLabel }) {
    const svgRef = useRef(null);
    const [hoveredX, setHoveredX] = useState(null);
    const [tooltipData, setTooltipData] = useState(null);

    const W = 900, H = 400;
    const PAD = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const allValues = data.flatMap(d => lines.map(l => d[l]).filter(v => v !== undefined && v !== null));
    const minV = Math.min(...allValues, 0);
    const maxV = Math.max(...allValues, 0);
    const rangeV = maxV - minV || 1;

    const xScale = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const yScale = (v) => PAD.top + chartH - ((v - minV) / rangeV) * chartH;

    // Y axis ticks
    const yTicks = [];
    const tickCount = 6;
    for (let i = 0; i <= tickCount; i++) {
        const v = minV + (rangeV / tickCount) * i;
        yTicks.push(parseFloat(v.toFixed(1)));
    }

    // X axis ticks — show ~6 dates
    const xTickIdxs = [];
    const step = Math.floor(data.length / 5);
    for (let i = 0; i < data.length; i += step) xTickIdxs.push(i);
    if (xTickIdxs[xTickIdxs.length - 1] !== data.length - 1) xTickIdxs.push(data.length - 1);

    // Build SVG path for each line
    const buildPath = (ticker) => {
        let d = "";
        data.forEach((row, i) => {
            const v = row[ticker];
            if (v === undefined || v === null) return;
            const x = xScale(i);
            const y = yScale(v);
            d += d === "" ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });
        return d;
    };

    // Mouse move handler
    const handleMouseMove = (e) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const relX = mx - PAD.left;
        const idx = Math.round((relX / chartW) * (data.length - 1));
        const clamped = Math.max(0, Math.min(data.length - 1, idx));
        setHoveredX(clamped);
        setTooltipData(data[clamped]);
    };

    const hx = hoveredX !== null ? xScale(hoveredX) : null;

    return (
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { setHoveredX(null); setTooltipData(null); }}
            >
                {/* Grid lines */}
                {yTicks.map(v => (
                    <line key={v}
                        x1={PAD.left} y1={yScale(v)}
                        x2={W - PAD.right} y2={yScale(v)}
                        stroke="#e5e7eb" strokeWidth="0.5" />
                ))}

                {/* Zero line */}
                {minV < 0 && maxV > 0 && (
                    <line
                        x1={PAD.left} y1={yScale(0)}
                        x2={W - PAD.right} y2={yScale(0)}
                        stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 3" />
                )}

                {/* Y axis labels */}
                {yTicks.map(v => (
                    <text key={v}
                        x={PAD.left - 6} y={yScale(v) + 4}
                        textAnchor="end" fontSize="10" fill="#9ca3af">
                        {v >= 0 ? "+" : ""}{v}%
                    </text>
                ))}

                {/* X axis labels */}
                {xTickIdxs.map(i => (
                    <text key={i}
                        x={xScale(i)} y={H - 6}
                        textAnchor="middle" fontSize="10" fill="#9ca3af">
                        {data[i]?.date?.slice(5)}
                    </text>
                ))}

                {/* Lines */}
                {lines.map((ticker, i) => (
                    <path key={ticker}
                        d={buildPath(ticker)}
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth={ticker === "^NSEI" ? 2.5 : 1.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity={hoveredX !== null ? (tooltipData?.[ticker] !== undefined ? 1 : 0.3) : 1}
                    />
                ))}

                {/* Hover crosshair */}
                {hx !== null && (
                    <>
                        <line x1={hx} y1={PAD.top} x2={hx} y2={H - PAD.bottom}
                            stroke="#6b7280" strokeWidth="1" strokeDasharray="3 3" />
                        {lines.map((ticker, i) => {
                            const v = tooltipData?.[ticker];
                            if (v === undefined || v === null) return null;
                            return (
                                <circle key={ticker}
                                    cx={hx} cy={yScale(v)} r="4"
                                    fill={colors[i % colors.length]}
                                    stroke="#fff" strokeWidth="1.5" />
                            );
                        })}
                    </>
                )}
            </svg>

            {/* Tooltip */}
            {tooltipData && hoveredX !== null && (
                <div className="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs min-w-[160px]">
                    <p className="font-semibold text-gray-700 mb-1.5 border-b border-gray-100 pb-1">
                        {tooltipData.date}
                    </p>
                    {lines.map((ticker, i) => {
                        const v = tooltipData[ticker];
                        if (v === undefined || v === null) return null;
                        return (
                            <div key={ticker} className="flex items-center justify-between gap-3 py-0.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ background: colors[i % colors.length] }} />
                                    <span className="text-gray-600 truncate max-w-[90px]">{getLabel(ticker)}</span>
                                </div>
                                <span className={`font-bold ${v >= 0 ? "text-green-600" : "text-red-500"}`}>
                                    {v >= 0 ? "+" : ""}{v}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


// ---- Option Chain ------------------------------------------------------------

function OptionChain({ onClose }) {
    const [symbol, setSymbol] = useState("NIFTY");
    const [expiry, setExpiry] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [spotPrice, setSpotPrice] = useState(null);
    const [filter, setFilter] = useState(10); // show ±10 strikes from ATM
    const [expiryTimestamps, setExpiryTimestamps] = useState([]);

    const fetchData = async (sym, selectedExpiry = "") => {
        setLoading(true);
        setError(null);
        try {
            // Find timestamp for selected expiry
            const ts = expiryTimestamps.find((t) => {
                const label = new Date(t * 1000).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric"
                });
                return label === selectedExpiry;
            });

            const url = `/api/options?symbol=${sym}${ts ? `&date=${ts}` : ""}`;
            const res = await fetch(url);
            const json = await res.json();

            if (json.error) {
                setError(json.message ?? "Failed to fetch option chain.");
                setLoading(false);
                return;
            }

            const records = json?.records;
            setSpotPrice(records?.underlyingValue ?? null);
            setExpiryTimestamps(records?.expirationTimestamps ?? []);

            const expiries = records?.expiryDates ?? [];
            const activeExp = selectedExpiry || expiries[0] || "";
            setExpiry(activeExp);
            setData(json);
        } catch (e) {
            setError("Network error: " + e.message);
        }
        setLoading(false);
    };

    // Initial load
    useEffect(() => { fetchData(symbol); }, [symbol]);

    // Filter data for selected expiry
    const rows = useMemo(() => {
        if (!data || !expiry) return [];
        const records = data?.records?.data ?? [];
        return records.filter(r => r.expiryDate === expiry);
    }, [data, expiry]);

    // Find ATM strike
    const atm = useMemo(() => {
        if (!spotPrice || !rows.length) return null;
        return rows.reduce((prev, curr) =>
            Math.abs(curr.strikePrice - spotPrice) < Math.abs(prev.strikePrice - spotPrice) ? curr : prev
        ).strikePrice;
    }, [rows, spotPrice]);

    // Filter rows around ATM
    const filteredRows = useMemo(() => {
        if (!atm) return rows;
        const strikes = [...new Set(rows.map(r => r.strikePrice))].sort((a, b) => a - b);
        const atmIdx = strikes.indexOf(atm);
        const visible = strikes.slice(Math.max(0, atmIdx - filter), atmIdx + filter + 1);
        return rows.filter(r => visible.includes(r.strikePrice));
    }, [rows, atm, filter]);

    const expiries = data?.records?.expiryDates ?? [];

    // Max OI for bar scaling
    const maxCEOI = Math.max(...filteredRows.map(r => r.CE?.openInterest ?? 0), 1);
    const maxPEOI = Math.max(...filteredRows.map(r => r.PE?.openInterest ?? 0), 1);

    const fmt = (n) => n == null ? "-" : n >= 1e7 ? (n / 1e7).toFixed(2) + "Cr" : n >= 1e5 ? (n / 1e5).toFixed(1) + "L" : n.toLocaleString("en-IN");
    const fmtChg = (n) => n == null ? "-" : (n >= 0 ? "+" : "") + n.toFixed(2);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="rounded-2xl shadow-2xl flex flex-col bg-white border border-gray-200 w-[98vw] h-[94vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-900">📋 Option Chain</span>

                        {/* Symbol selector */}
                        <div className="flex rounded-md overflow-hidden border border-gray-300 text-xs font-medium">
                            {OPTION_SYMBOLS.map(s => (
                                <button key={s} onClick={() => setSymbol(s)}
                                    className={`px-2.5 py-1.5 transition-colors ${symbol === s ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Expiry selector */}
                        {expiries.length > 0 && (
                            <select
                                value={expiry}
                                onChange={e => fetchData(symbol, e.target.value)}
                                className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {expiries.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        )}

                        {/* Strike filter */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>±</span>
                            <select value={filter} onChange={e => setFilter(Number(e.target.value))}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none">
                                {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} strikes</option>)}
                            </select>
                        </div>

                        {/* Spot price */}
                        {spotPrice && (
                            <span className="text-sm font-bold text-gray-700">
                                Spot: <span className="text-blue-600">₹{spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </span>
                        )}

                        <button
                            onClick={() => fetchData(symbol, expiry)}
                            className="px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    <button onClick={onClose}
                        className="w-7 h-7 rounded-md border border-gray-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-lg flex-shrink-0">
                        ×
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading && (
                        <div className="flex items-center justify-center h-full text-sm text-gray-400">
                            Loading option chain...
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center justify-center h-full text-sm text-red-500">
                            {error}
                        </div>
                    )}
                    {!loading && !error && filteredRows.length > 0 && (
                        <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    {/* CE headers */}
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">OI</th>
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">Chg OI</th>
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">Volume</th>
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">IV</th>
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">LTP</th>
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">Chg</th>
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">Bid</th>
                                    <th className="bg-green-50 text-green-700 px-2 py-2 text-center font-bold border-b border-green-100 text-green-800">CALLS</th>
                                    {/* Strike */}
                                    <th className="bg-gray-800 text-white px-3 py-2 text-center font-bold border-b border-gray-700 min-w-[80px]">STRIKE</th>
                                    {/* PE headers */}
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-center font-bold border-b border-red-100 text-red-800">PUTS</th>
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">Ask</th>
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">Chg</th>
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">LTP</th>
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">IV</th>
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">Volume</th>
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">Chg OI</th>
                                    <th className="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">OI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row) => {
                                    const ce = row.CE;
                                    const pe = row.PE;
                                    const strike = row.strikePrice;
                                    const isATM = strike === atm;
                                    const isITM_CE = spotPrice && strike < spotPrice;
                                    const isITM_PE = spotPrice && strike > spotPrice;

                                    const ceOIPct = ce ? (ce.openInterest / maxCEOI) * 100 : 0;
                                    const peOIPct = pe ? (pe.openInterest / maxPEOI) * 100 : 0;

                                    return (
                                        <tr key={strike}
                                            className={`border-b transition-colors ${isATM
                                                ? "bg-yellow-50 border-yellow-200"
                                                : "border-gray-100 hover:bg-gray-50"
                                                }`}>
                                            {/* CE side */}
                                            <td className={`px-2 py-1.5 text-right relative ${isITM_CE ? "bg-green-50" : ""}`}>
                                                <div className="absolute inset-y-0 right-0 bg-green-200 opacity-30 rounded-l"
                                                    style={{ width: `${ceOIPct}%` }} />
                                                <span className="relative font-medium text-gray-700">{fmt(ce?.openInterest)}</span>
                                            </td>
                                            <td className={`px-2 py-1.5 text-right ${isITM_CE ? "bg-green-50" : ""}`}>
                                                <span className={ce?.changeinOpenInterest > 0 ? "text-green-600" : ce?.changeinOpenInterest < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmt(ce?.changeinOpenInterest)}
                                                </span>
                                            </td>
                                            <td className={`px-2 py-1.5 text-right text-gray-600 ${isITM_CE ? "bg-green-50" : ""}`}>{fmt(ce?.totalTradedVolume)}</td>
                                            <td className={`px-2 py-1.5 text-right text-gray-600 ${isITM_CE ? "bg-green-50" : ""}`}>{ce?.impliedVolatility?.toFixed(1) ?? "-"}</td>
                                            <td className={`px-2 py-1.5 text-right font-semibold ${isITM_CE ? "bg-green-50" : ""}`}>
                                                {ce?.lastPrice?.toFixed(2) ?? "-"}
                                            </td>
                                            <td className={`px-2 py-1.5 text-right ${isITM_CE ? "bg-green-50" : ""}`}>
                                                <span className={ce?.change > 0 ? "text-green-600" : ce?.change < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmtChg(ce?.change)}
                                                </span>
                                            </td>
                                            <td className={`px-2 py-1.5 text-right text-gray-500 ${isITM_CE ? "bg-green-50" : ""}`}>{ce?.bidprice?.toFixed(2) ?? "-"}</td>
                                            <td className={`px-2 py-1.5 ${isITM_CE ? "bg-green-50" : ""}`} /> {/* spacer */}

                                            {/* Strike */}
                                            <td className={`px-3 py-1.5 text-center font-bold text-sm ${isATM
                                                ? "bg-yellow-400 text-yellow-900"
                                                : "bg-gray-800 text-white"
                                                }`}>
                                                {strike.toLocaleString("en-IN")}
                                            </td>

                                            {/* PE side */}
                                            <td className={`px-2 py-1.5 ${isITM_PE ? "bg-red-50" : ""}`} /> {/* spacer */}
                                            <td className={`px-2 py-1.5 text-left text-gray-500 ${isITM_PE ? "bg-red-50" : ""}`}>{pe?.askPrice?.toFixed(2) ?? "-"}</td>
                                            <td className={`px-2 py-1.5 text-left ${isITM_PE ? "bg-red-50" : ""}`}>
                                                <span className={pe?.change > 0 ? "text-green-600" : pe?.change < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmtChg(pe?.change)}
                                                </span>
                                            </td>
                                            <td className={`px-2 py-1.5 text-left font-semibold ${isITM_PE ? "bg-red-50" : ""}`}>
                                                {pe?.lastPrice?.toFixed(2) ?? "-"}
                                            </td>
                                            <td className={`px-2 py-1.5 text-left text-gray-600 ${isITM_PE ? "bg-red-50" : ""}`}>{pe?.impliedVolatility?.toFixed(1) ?? "-"}</td>
                                            <td className={`px-2 py-1.5 text-left text-gray-600 ${isITM_PE ? "bg-red-50" : ""}`}>{fmt(pe?.totalTradedVolume)}</td>
                                            <td className={`px-2 py-1.5 text-left ${isITM_PE ? "bg-red-50" : ""}`}>
                                                <span className={pe?.changeinOpenInterest > 0 ? "text-green-600" : pe?.changeinOpenInterest < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmt(pe?.changeinOpenInterest)}
                                                </span>
                                            </td>
                                            <td className={`px-2 py-1.5 text-left relative ${isITM_PE ? "bg-red-50" : ""}`}>
                                                <div className="absolute inset-y-0 left-0 bg-red-200 opacity-30 rounded-r"
                                                    style={{ width: `${peOIPct}%` }} />
                                                <span className="relative font-medium text-gray-700">{fmt(pe?.openInterest)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {error && (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <p className="text-sm text-red-500">{error}</p>
                                    <p className="text-xs text-gray-400 max-w-md text-center">
                                        NSE blocks automated requests. This works best during market hours (9:15 AM – 3:30 PM IST, Mon–Fri).
                                        Try refreshing or wait a few seconds.
                                    </p>
                                    <button onClick={() => fetchData(symbol, expiry)}
                                        className="px-4 py-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600">
                                        🔄 Try Again
                                    </button>
                                </div>
                            )}

                            {/* Footer — PCR and total OI */}
                            {(() => {
                                const totalCEOI = filteredRows.reduce((s, r) => s + (r.CE?.openInterest ?? 0), 0);
                                const totalPEOI = filteredRows.reduce((s, r) => s + (r.PE?.openInterest ?? 0), 0);
                                const pcr = totalCEOI > 0 ? (totalPEOI / totalCEOI).toFixed(2) : "-";
                                return (
                                    <tfoot>
                                        <tr className="bg-gray-100 font-semibold text-xs border-t border-gray-300">
                                            <td colSpan={2} className="px-3 py-2 text-right text-green-700">
                                                Total CE OI: {fmt(totalCEOI)}
                                            </td>
                                            <td colSpan={5} />
                                            <td className="px-3 py-2 text-center text-gray-700">
                                                PCR: <span className={Number(pcr) >= 1 ? "text-green-600" : "text-red-500"}>{pcr}</span>
                                            </td>
                                            <td className="px-3 py-2 text-center bg-gray-800 text-white text-xs">
                                                PCR {pcr}
                                            </td>
                                            <td />
                                            <td colSpan={5} />
                                            <td colSpan={2} className="px-3 py-2 text-left text-red-700">
                                                Total PE OI: {fmt(totalPEOI)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                );
                            })()}
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedMarket, setSelectedMarket] = useState("NSE");
    const [loaded, setLoaded] = useState(false);
    const [commodityOpen, setCommodityOpen] = useState(false);
    const [indicesOpen, setIndicesOpen] = useState(false);
    const [visibleClocks, setVisibleClocks] = useState([]);
    const [allClocks, setAllClocks] = useState(REFERENCE_CLOCKS); // tracks full list from DB
    const [layout, setLayout] = useState("masonry");
    const columns = useResponsiveColumns(4);
    const updateTimers = useRef({});
    const [showCompare, setShowCompare] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    // ── Drag state ────────────────────────────────────────────────────────────
    const dragIdx = useRef(null);       // index being dragged
    const dragOverIdx = useRef(null);   // index being hovered over
    const [draggingIdx, setDraggingIdx] = useState(null);
    const [dropTargetIdx, setDropTargetIdx] = useState(null);

    // ── Load watchlist ────────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/watchlist")
            .then(r => r.json())
            .then(data => { setStocks(Array.isArray(data) ? data : []); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, []);

    // ── Load clocks ───────────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/clocks")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // visible clocks = only those with visible: true
                    setVisibleClocks(data.filter(c => c.visible).map(c => c.label));
                    // allClocks = full list for the selector total count
                    setAllClocks(data.map(c => ({
                        ...REFERENCE_CLOCKS.find(r => r.label === c.label),
                        label: c.label,
                        visible: c.visible,
                    })).filter(Boolean));
                }
            })
            .catch(() => { });
    }, []);

    const toggleClock = async (label) => {
        const isVisible = visibleClocks.includes(label);
        setVisibleClocks(prev => isVisible ? prev.filter(l => l !== label) : [...prev, label]);
        await fetch("/api/clocks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label, visible: !isVisible }),
        });
    };

    // ── Add stock ─────────────────────────────────────────────────────────────
    const addStock = async (overrideSymbol, overrideMarket) => {
        const sym = typeof overrideSymbol === "string" ? overrideSymbol : search;
        const mkt = overrideMarket ?? selectedMarket;
        if (!sym) return;
        const newStock = {
            symbol: overrideSymbol ? sym : sym.toUpperCase(),
            market: mkt, target: 0, stopLoss: 0,
            entryDate: "", notes: "", qty: 1, buyPrice: 0,
            side: "buy", mode: (mkt === "COMMODITY" || mkt === "INDEX") ? "watch" : "trade",
        };
        const res = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newStock),
        });
        const saved = await res.json();
        setStocks(prev => [...prev, saved]);
        setSearch("");
        setCommodityOpen(false);
        setIndicesOpen(false);
    };

    // ── Update field ──────────────────────────────────────────────────────────
    const update = (idx, field, value) => {
        setStocks(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: ["target", "stopLoss", "qty", "buyPrice"].includes(field) ? Number(value) : value };
            return copy;
        });
        clearTimeout(updateTimers.current[idx]);
        updateTimers.current[idx] = setTimeout(() => {
            setStocks(prev => {
                const stock = prev[idx];
                if (!stock?.id) return prev;
                fetch(`/api/watchlist/${stock.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(stock),
                }).catch(console.error);
                return prev;
            });
        }, 600);
    };

    // ── Remove stock ──────────────────────────────────────────────────────────
    const removeStock = async (idx) => {
        const stock = stocks[idx];
        setStocks(prev => prev.filter((_, i) => i !== idx));
        if (stock?.id) await fetch(`/api/watchlist/${stock.id}`, { method: "DELETE" });
    };

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const handleDragStart = (e, idx) => {
        dragIdx.current = idx;
        setDraggingIdx(idx);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverIdx.current !== idx) {
            dragOverIdx.current = idx;
            setDropTargetIdx(idx);
        }
    };

    const handleDrop = (e, idx) => {
        e.preventDefault();
        const from = dragIdx.current;
        if (from === null || from === idx) return;
        setStocks(prev => {
            const copy = [...prev];
            const [moved] = copy.splice(from, 1);
            copy.splice(idx, 0, moved);
            return copy;
        });
        dragIdx.current = null;
        dragOverIdx.current = null;
        setDraggingIdx(null);
        setDropTargetIdx(null);
    };

    const handleDragEnd = () => {
        dragIdx.current = null;
        dragOverIdx.current = null;
        setDraggingIdx(null);
        setDropTargetIdx(null);
    };

    if (!loaded) return (
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            Loading watchlist...
        </div>
    );

    return (
        <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">

            {/* Search + market selector — single row, search shrinks dynamically */}
            <div className="mb-4 flex items-center gap-2 flex-nowrap overflow-x-auto pb-1">

                <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="flex-shrink-0 rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {Object.entries(MARKETS)
                        .filter(([k]) => k !== "COMMODITY" && k !== "INDEX")
                        .map(([key, m]) => (
                            <option key={key} value={key}>{m.label}</option>
                        ))}
                </select>

                <div className="flex-shrink-0">
                    <MarketBadge clock={clockForMarket(selectedMarket)} />
                </div>

                <div className="flex-shrink-0">
                    <ClockSelector visible={visibleClocks} onToggle={toggleClock} total={allClocks.length} />
                </div>

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${MARKETS[selectedMarket].label} e.g. ${selectedMarket === "NSE" ? "TCS" : selectedMarket === "TSE" ? "7203" : "AAPL"}`}
                    onKeyDown={(e) => e.key === "Enter" && addStock()}
                    className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    onClick={() => addStock()}
                    className="flex-shrink-0 whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Add
                </button>

                {/* Commodities dropdown */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => { setCommodityOpen(v => !v); setIndicesOpen(false); setShowCompare(false); }}
                        className="whitespace-nowrap rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 flex items-center gap-1"
                    >
                        Commodities <span className="text-[10px]">{commodityOpen ? "▲" : "▼"}</span>
                    </button>
                    {commodityOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setCommodityOpen(false)} />
                            <div className="absolute top-full left-0 z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg py-1">
                                {COMMODITY_PRESETS.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => { addStock(c.value, "COMMODITY"); setCommodityOpen(false); }}
                                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Indices dropdown */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => { setIndicesOpen(v => !v); setCommodityOpen(false); setShowCompare(false); }}
                        className="whitespace-nowrap rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                    >
                        Indices <span className="text-[10px]">{indicesOpen ? "▲" : "▼"}</span>
                    </button>
                    {indicesOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIndicesOpen(false)} />
                            <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-md border border-gray-200 bg-white shadow-lg py-1 max-h-80 overflow-y-auto">
                                {INDEX_GROUPS.map((group) => (
                                    <div key={group.label}>
                                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                            {group.label}
                                        </p>
                                        {INDEX_PRESETS
                                            .filter(i => group.values.includes(i.value))
                                            .map((idx) => (
                                                <button
                                                    key={idx.value}
                                                    onClick={() => { addStock(idx.value, idx.market); setIndicesOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    {idx.label}
                                                </button>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Compare button */}
                <button
                    onClick={() => setShowCompare(true)}
                    className="flex-shrink-0 whitespace-nowrap rounded-md border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 flex items-center gap-1"
                >
                    📊 Compare
                </button>

                {/* Option Chain button */}
                <button
                    onClick={() => setShowOptions(true)}
                    className="flex-shrink-0 whitespace-nowrap rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 flex items-center gap-1"
                >
                    📋 Options
                </button>

            </div>

            {/* Compare chart modal */}
            {showCompare && (
                <CompareChart
                    onClose={() => setShowCompare(false)}
                    dark={false}
                />
            )}

            {/* Option Chain modal */}
            {showOptions && (
                <OptionChain onClose={() => setShowOptions(false)} />
            )}

            {/* Reference clocks */}
            {visibleClocks.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {REFERENCE_CLOCKS.filter(clock => visibleClocks.includes(clock.label)).map((clock) => (
                        <MarketBadge key={clock.label} clock={clock} />
                    ))}
                </div>
            )}

            {/* Cards with drag and drop */}
            {layout === "wide" ? (
                <div className="flex flex-wrap gap-4">
                    {stocks.map((s, idx) => (
                        <div
                            key={s.id ?? idx}
                            className={`w-80 transition-all duration-150 ${dropTargetIdx === idx && draggingIdx !== idx ? "ring-2 ring-blue-400 rounded-xl" : ""}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                        >
                            <StockCard
                                {...s}
                                isDragging={draggingIdx === idx}
                                onRemove={() => removeStock(idx)}
                                onUpdate={(field, val) => update(idx, field, val)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ columnCount: columns, columnGap: "1rem" }}>
                    {stocks.map((s, idx) => (
                        <div
                            key={s.id ?? idx}
                            className={`mb-4 break-inside-avoid transition-all duration-150 ${dropTargetIdx === idx && draggingIdx !== idx ? "ring-2 ring-blue-400 rounded-xl" : ""}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                        >
                            <StockCard
                                {...s}
                                isDragging={draggingIdx === idx}
                                onRemove={() => removeStock(idx)}
                                onUpdate={(field, val) => update(idx, field, val)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
