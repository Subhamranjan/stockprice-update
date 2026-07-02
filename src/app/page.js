"use client";

import { useState, useEffect, useRef } from "react";
import { getQuote } from "./actions";

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
    // India
    { label: "Nifty 50", value: "^NSEI", market: "INDEX" },
    { label: "Sensex", value: "^BSESN", market: "INDEX" },
    { label: "Nifty Bank", value: "^NSEBANK", market: "INDEX" },
    { label: "Nifty IT", value: "^CNXIT", market: "INDEX" },
    { label: "Nifty Midcap", value: "^NSEMDCP50", market: "INDEX" },
    // USA
    { label: "S&P 500", value: "^GSPC", market: "INDEX" },
    { label: "Nasdaq 100", value: "^NDX", market: "INDEX" },
    { label: "Dow Jones", value: "^DJI", market: "INDEX" },
    { label: "Russell 2000", value: "^RUT", market: "INDEX" },
    { label: "VIX", value: "^VIX", market: "INDEX" },
    // Europe
    { label: "FTSE 100", value: "^FTSE", market: "INDEX" },
    { label: "DAX", value: "^GDAXI", market: "INDEX" },
    { label: "CAC 40", value: "^FCHI", market: "INDEX" },
    { label: "Euro Stoxx 50", value: "^STOXX50E", market: "INDEX" },
    // Asia
    { label: "Nikkei 225", value: "^N225", market: "INDEX" },
    { label: "Hang Seng", value: "^HSI", market: "INDEX" },
    { label: "Shanghai", value: "000001.SS", market: "INDEX" },
    { label: "Kospi", value: "^KS11", market: "INDEX" },
    { label: "ASX 200", value: "^AXJO", market: "INDEX" },
];

const REFERENCE_CLOCKS = [
    { label: "NSE", tz: "Asia/Kolkata", open: [9, 30], close: [15, 0], alwaysOpen: false },
    { label: "NASDAQ", tz: "America/New_York", open: [9, 30], close: [16, 0], alwaysOpen: false },
    { label: "Tokyo", tz: "Asia/Tokyo", open: [9, 0], close: [15, 0], alwaysOpen: false },
    { label: "London", tz: "Europe/London", open: [8, 0], close: [16, 30], alwaysOpen: false },
    { label: "FX", tz: "Asia/Kolkata", open: [0, 0], close: [23, 59], alwaysOpen: true },
    { label: "Commodities", tz: "America/New_York", open: [18, 0], close: [17, 0], alwaysOpen: true },
];

// ── Market hours ────────

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

function daysSince(dateStr) {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
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
    // INDEX has no fixed symbol — just show the number
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

function ClockSelector({ visible, onToggle }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
            >
                Clocks
                <span className="text-[10px] text-gray-400">({visible.length}/{REFERENCE_CLOCKS.length})</span>
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white shadow-lg py-1">
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

function StockCard({ symbol, market, target, stopLoss, entryDate, notes, qty, buyPrice, side, mode, onRemove, onUpdate }) {
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
        <div className="h-full flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                        title={isTrading ? "Switch to watch-only" : "Switch to trading mode"}
                    >
                        {isTrading ? "Trading" : "Watch"}
                    </button>
                    {isTrading && (
                        <button onClick={() => setShowNotes(v => !v)} className="text-xs text-gray-400 hover:text-blue-500 transition-colors" title="Trade notes">📝</button>
                    )}
                    <button
                        onClick={onRemove}
                        className="w-6 h-6 rounded-md border border-gray-300 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center text-base leading-none"
                        title="Remove this card"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Qty row */}
            {isTrading && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Qty</span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onUpdate("qty", Math.max(1, (qty || 1) - 1))}
                            className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium flex items-center justify-center"
                        >−</button>
                        <input
                            type="number"
                            value={qty || 1}
                            min={1}
                            onChange={(e) => onUpdate("qty", Math.max(1, Number(e.target.value)))}
                            className="w-16 text-center text-sm font-semibold text-gray-800 border border-gray-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => onUpdate("qty", (qty || 1) + 1)}
                            className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium flex items-center justify-center"
                        >+</button>
                    </div>
                    <span className="text-xs text-gray-400">
                        {price !== null && qty ? fmtMoney(price * qty, market) : ""}
                    </span>
                </div>
            )}

            {/* Buy / Sell toggle */}
            {isTrading && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Direction</span>
                    <div className="flex rounded-md overflow-hidden border border-gray-300 text-xs font-medium">
                        <button
                            onClick={() => onUpdate("side", "buy")}
                            className={`px-3 py-1 transition-colors ${side === "buy"
                                ? "bg-green-500 text-white"
                                : "bg-white text-gray-500 hover:bg-gray-50"}`}
                        >Buy</button>
                        <button
                            onClick={() => onUpdate("side", "sell")}
                            className={`px-3 py-1 transition-colors ${side === "sell"
                                ? "bg-red-500 text-white"
                                : "bg-white text-gray-500 hover:bg-gray-50"}`}
                        >Sell</button>
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

            {/* 52W range — shown in both modes */}
            {quote?.low52Week && quote?.high52Week && (
                <RangeBar price={price} low52={quote.low52Week} high52={quote.high52Week} market={market} />
            )}

            {/* Stats grid — trading mode only */}
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
                        <p className="text-xs font-semibold text-gray-700">{daysHeld ?? "-"}</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 px-2 py-1.5">
                        <p className="text-[10px] text-gray-400">R : R</p>
                        <p className={`text-xs font-semibold ${rrColor}`}>{rr ? `1 : ${rr}` : "-"}</p>
                    </div>
                </div>
            )}

            {/* Inputs — trading mode only */}
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

            {/* P&L — trading mode only */}
            {isTrading && buyPrice > 0 && price !== null && qty > 0 && (() => {
                const pnl = side === "buy"
                    ? (price - buyPrice) * qty
                    : (buyPrice - price) * qty;
                const pnlPct = side === "buy"
                    ? ((price - buyPrice) / buyPrice) * 100
                    : ((buyPrice - price) / buyPrice) * 100;
                const isProfit = pnl >= 0;
                return (
                    <div className={`rounded-lg px-3 py-2 ${isProfit ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">P&L ({daysHeld ?? 0}d)</span>
                            <span className={`text-[10px] font-medium ${isProfit ? "text-green-600" : "text-red-500"}`}>
                                {pnlPct.toFixed(2)}%
                            </span>
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

            {/* Notes — trading mode only */}
            {isTrading && showNotes && (
                <textarea value={notes || ""} onChange={(e) => onUpdate("notes", e.target.value)}
                    placeholder="Trade thesis, setup, key levels..." rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
        </div>
    );
}

// ── Responsive column count ─────────────────────────────────────────────────

function useResponsiveColumns(desktopColumns = 4) {
    const [columns, setColumns] = useState(desktopColumns);

    useEffect(() => {
        const compute = () => {
            const w = window.innerWidth;
            if (w < 640) return 1;       // phone
            if (w < 1024) return 2;      // tablet
            return desktopColumns;       // desktop
        };
        const onResize = () => setColumns(compute());
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [desktopColumns]);

    return columns;
}

export default function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedMarket, setSelectedMarket] = useState("NSE");
    const [loaded, setLoaded] = useState(false);
    const [showCommodities, setShowCommodities] = useState(false);
    const [visibleClocks, setVisibleClocks] = useState(REFERENCE_CLOCKS.map(c => c.label));
    const [layout, setLayout] = useState("masonry");
    const columns = useResponsiveColumns(4);
    const [showIndices, setShowIndices] = useState(false);

    // ── Load watchlist from DB on mount ──────────────────────────────────────
    useEffect(() => {
        fetch("/api/watchlist")
            .then(r => r.json())
            .then(data => {
                setStocks(Array.isArray(data) ? data : []);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    // Load visible clocks from DB on mount
    useEffect(() => {
        fetch("/api/clocks")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const visible = data.filter(c => c.visible).map(c => c.label);
                    setVisibleClocks(visible);
                }
            })
            .catch(() => { });
    }, []);

    // Toggle clock visibility — update DB
    const toggleClock = async (label) => {
        const isVisible = visibleClocks.includes(label);
        // Optimistic update
        setVisibleClocks(prev =>
            isVisible ? prev.filter(l => l !== label) : [...prev, label]
        );
        // Persist to DB
        await fetch("/api/clocks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label, visible: !isVisible }),
        });
    };

    // ── Add stock → POST to DB ───────────────────────────────────────────────
    const addStock = async (overrideSymbol, overrideMarket) => {
        const sym = typeof overrideSymbol === "string" ? overrideSymbol : search;
        const mkt = overrideMarket ?? selectedMarket;
        if (!sym) return;

        const newStock = {
            symbol: overrideSymbol ? sym : sym.toUpperCase(),
            market: mkt,
            target: 0,
            stopLoss: 0,
            entryDate: "",
            notes: "",
            qty: 1,
            buyPrice: 0,
            side: "buy",
            mode: (mkt === "COMMODITY" || mkt === "INDEX") ? "watch" : "trade",
        };

        const res = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newStock),
        });
        const saved = await res.json();
        setStocks(prev => [...prev, saved]);
        setSearch("");
        setShowCommodities(false);
    };

    // ── Update field → PUT to DB (debounced 600ms) ───────────────────────────
    const updateTimers = useRef({});

    const update = (idx, field, value) => {
        // Optimistic update in UI immediately
        setStocks(prev => {
            const copy = [...prev];
            copy[idx] = {
                ...copy[idx],
                [field]: ["target", "stopLoss", "qty", "buyPrice"].includes(field) ? Number(value) : value,
            };
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

    // ── Remove stock → DELETE from DB ────────────────────────────────────────
    const removeStock = async (idx) => {
        const stock = stocks[idx];
        setStocks(prev => prev.filter((_, i) => i !== idx)); // optimistic
        if (stock?.id) {
            await fetch(`/api/watchlist/${stock.id}`, { method: "DELETE" });
        }
    };

    if (!loaded) return (
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            Loading watchlist...
        </div>
    );

    return (
        <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">

            {/* Search + market selector */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {Object.entries(MARKETS)
                        .filter(([k]) => k !== "COMMODITY" && k !== "INDEX")
                        .map(([key, m]) => (
                            <option key={key} value={key}>{m.label}</option>
                        ))
                    }
                </select>

                <MarketBadge clock={clockForMarket(selectedMarket)} />
                <ClockSelector visible={visibleClocks} onToggle={toggleClock} />

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${MARKETS[selectedMarket].label} symbol e.g. ${selectedMarket === "NSE" ? "TCS" : selectedMarket === "TSE" ? "7203" : "AAPL"}`}
                    onKeyDown={(e) => e.key === "Enter" && addStock()}
                    className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => addStock()}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Add
                </button>

                <button
                    onClick={() => setShowCommodities(v => !v)}
                    className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                    Commodities
                </button>

                <button
                    onClick={() => setShowIndices(v => !v)}
                    className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                    Indices
                </button>
            </div>

            {/* Commodity quick-add panel */}
            {showCommodities && (
                <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {COMMODITY_PRESETS.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => addStock(c.value, "COMMODITY")}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-amber-50 hover:border-amber-300"
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Indices quick-add panel */}
            {showIndices && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {/* India */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">India</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {INDEX_PRESETS.filter(i => ["^NSEI", "^BSESN", "^NSEBANK", "^CNXIT", "^NSEMDCP50"].includes(i.value)).map((idx) => (
                            <button key={idx.value} onClick={() => addStock(idx.value, idx.market)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300">
                                {idx.label}
                            </button>
                        ))}
                    </div>
                    {/* USA */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">USA</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {INDEX_PRESETS.filter(i => ["^GSPC", "^NDX", "^DJI", "^RUT", "^VIX"].includes(i.value)).map((idx) => (
                            <button key={idx.value} onClick={() => addStock(idx.value, idx.market)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300">
                                {idx.label}
                            </button>
                        ))}
                    </div>
                    {/* Europe */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Europe</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {INDEX_PRESETS.filter(i => ["^FTSE", "^GDAXI", "^FCHI", "^STOXX50E"].includes(i.value)).map((idx) => (
                            <button key={idx.value} onClick={() => addStock(idx.value, idx.market)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300">
                                {idx.label}
                            </button>
                        ))}
                    </div>
                    {/* Asia */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Asia</p>
                    <div className="flex flex-wrap gap-2">
                        {INDEX_PRESETS.filter(i => ["^N225", "^HSI", "000001.SS", "^KS11", "^AXJO"].includes(i.value)).map((idx) => (
                            <button key={idx.value} onClick={() => addStock(idx.value, idx.market)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300">
                                {idx.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Reference clocks */}
            {visibleClocks.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {REFERENCE_CLOCKS.filter(clock => visibleClocks.includes(clock.label)).map((clock) => (
                        <MarketBadge key={clock.label} clock={clock} />
                    ))}
                </div>
            )}

            {layout === "wide" ? (
                <div className="flex flex-wrap gap-4">
                    {stocks.map((s, idx) => (
                        <div key={s.id ?? idx} className="w-80">
                            <StockCard {...s} onRemove={() => removeStock(idx)} onUpdate={(field, val) => update(idx, field, val)} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="gap-4" style={{ columnCount: columns, columnGap: "1rem" }}>
                    {stocks.map((s, idx) => (
                        <div key={s.id ?? idx} className="mb-4 break-inside-avoid">
                            <StockCard {...s} onRemove={() => removeStock(idx)} onUpdate={(field, val) => update(idx, field, val)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
