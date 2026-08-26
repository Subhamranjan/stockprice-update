"use client";

import { usestate, useeffect, useref, usememo } from "react";
import { getquote } from "./actions";
import { gethistory } from "./actions";


const refresh_interval = 300000;

const markets = {
    nse: { suffix: ".ns", currency: "inr", symbol: "₹", label: "nse", tz: "asia/kolkata", open: [9, 15], close: [15, 30] },
    bse: { suffix: ".bo", currency: "inr", symbol: "₹", label: "bse", tz: "asia/kolkata", open: [9, 15], close: [15, 30] },
    nasdaq: { suffix: "", currency: "usd", symbol: "$", label: "nasdaq", tz: "america/new_york", open: [9, 30], close: [16, 0] },
    nyse: { suffix: "", currency: "usd", symbol: "$", label: "nyse", tz: "america/new_york", open: [9, 30], close: [16, 0] },
    tse: { suffix: ".t", currency: "jpy", symbol: "¥", label: "tokyo", tz: "asia/tokyo", open: [9, 0], close: [15, 0] },
    lse: { suffix: ".l", currency: "gbp", symbol: "£", label: "lse", tz: "europe/london", open: [8, 0], close: [16, 30] },
    hkex: { suffix: ".hk", currency: "hkd", symbol: "hk$", label: "hkex", tz: "asia/hong_kong", open: [9, 30], close: [16, 0] },
    sse: { suffix: ".ss", currency: "cny", symbol: "¥", label: "shanghai", tz: "asia/shanghai", open: [9, 30], close: [15, 0] },
    sgx: { suffix: ".si", currency: "sgd", symbol: "s$", label: "sgx", tz: "asia/singapore", open: [9, 0], close: [17, 0] },
    asx: { suffix: ".ax", currency: "aud", symbol: "a$", label: "asx", tz: "australia/sydney", open: [10, 0], close: [16, 0] },
    krx: { suffix: ".ks", currency: "krw", symbol: "₩", label: "krx", tz: "asia/seoul", open: [9, 0], close: [15, 30] },
    twse: { suffix: ".tw", currency: "twd", symbol: "nt$", label: "twse", tz: "asia/taipei", open: [9, 0], close: [13, 30] },
    jse: { suffix: ".jo", currency: "zar", symbol: "r", label: "jse", tz: "africa/johannesburg", open: [9, 0], close: [17, 0] },
    tadawul: { suffix: ".sr", currency: "sar", symbol: "﷼", label: "tadawul", tz: "asia/riyadh", open: [10, 0], close: [15, 0] },
    b3: { suffix: ".sa", currency: "brl", symbol: "r$", label: "b3", tz: "america/sao_paulo", open: [10, 0], close: [18, 0] },
    tsx: { suffix: ".to", currency: "cad", symbol: "c$", label: "tsx", tz: "america/toronto", open: [9, 30], close: [16, 0] },
    commodity: { suffix: "", currency: "usd", symbol: "$", label: "commodity", tz: "america/new_york", open: [18, 0], close: [17, 0] },
    index: { suffix: "", currency: "", symbol: "", label: "index", tz: "asia/kolkata", open: [9, 0], close: [16, 0] },
};

const commodity_presets = [
    { label: "gold", value: "gc=f" },
    { label: "silver", value: "si=f" },
    { label: "crude oil", value: "cl=f" },
    { label: "brent crude", value: "bz=f" },
    { label: "natural gas", value: "ng=f" },
    { label: "copper", value: "hg=f" },
    { label: "platinum", value: "pl=f" },
    { label: "corn", value: "zc=f" },
    { label: "wheat", value: "zw=f" },
    { label: "soybean", value: "zs=f" },
    { label: "cotton", value: "ct=f" },
    { label: "coffee", value: "kc=f" },
];

const index_presets = [
    { label: "nifty 50", value: "^nsei", market: "index" },
    { label: "sensex", value: "^bsesn", market: "index" },
    { label: "nifty bank", value: "^nsebank", market: "index" },
    { label: "nifty it", value: "^cnxit", market: "index" },
    { label: "nifty midcap 50", value: "^nsemdcp50", market: "index" },
    { label: "nifty next 50", value: "^nsmidcp", market: "index" },
    { label: "nifty auto", value: "^cnxauto", market: "index" },
    { label: "nifty pharma", value: "^cnxpharma", market: "index" },
    { label: "nifty fmcg", value: "^cnxfmcg", market: "index" },
    { label: "nifty metal", value: "^cnxmetal", market: "index" },
    { label: "nifty energy", value: "^cnxenergy", market: "index" },
    { label: "nifty realty", value: "^cnxrealty", market: "index" },
    { label: "nifty infra", value: "^cnxinfra", market: "index" },
    { label: "nifty psu bank", value: "^cnxpsubank", market: "index" },
    { label: "india vix", value: "^indiavix", market: "index" },
    { label: "s&p 500", value: "^gspc", market: "index" },
    { label: "nasdaq 100", value: "^ndx", market: "index" },
    { label: "dow jones", value: "^dji", market: "index" },
    { label: "russell 2000", value: "^rut", market: "index" },
    { label: "s&p 400 mid", value: "^mid", market: "index" },
    { label: "nyse composite", value: "^nya", market: "index" },
    { label: "vix", value: "^vix", market: "index" },
    { label: "ftse 100", value: "^ftse", market: "index" },
    { label: "dax", value: "^gdaxi", market: "index" },
    { label: "cac 40", value: "^fchi", market: "index" },
    { label: "euro stoxx 50", value: "^stoxx50e", market: "index" },
    { label: "ibex 35", value: "^ibex", market: "index" },
    { label: "aex (amsterdam)", value: "^aex", market: "index" },
    { label: "smi (swiss)", value: "^ssmi", market: "index" },
    { label: "omx (stockholm)", value: "^omx", market: "index" },
    { label: "atx (austria)", value: "^atx", market: "index" },
    { label: "bel 20", value: "^bfx", market: "index" },
    { label: "ftse mib italy", value: "ftsemib.mi", market: "index" },
    { label: "nikkei 225", value: "^n225", market: "index" },
    { label: "topix", value: "^topx", market: "index" },
    { label: "hang seng", value: "^hsi", market: "index" },
    { label: "shanghai", value: "000001.ss", market: "index" },
    { label: "shenzhen", value: "399001.sz", market: "index" },
    { label: "csi 300", value: "000300.ss", market: "index" },
    { label: "kospi", value: "^ks11", market: "index" },
    { label: "kosdaq", value: "^kq11", market: "index" },
    { label: "taiwan twse", value: "^twii", market: "index" },
    { label: "asx 200", value: "^axjo", market: "index" },
    { label: "straits times", value: "^sti", market: "index" },
    { label: "jakarta (idx)", value: "^jkse", market: "index" },
    { label: "set (thailand)", value: "^set.bk", market: "index" },
    { label: "klci (malaysia)", value: "^klse", market: "index" },
    { label: "psei (philippines)", value: "psei.ps", market: "index" },
    { label: "tadawul (saudi)", value: "^tasi.sr", market: "index" },
    { label: "dfm (dubai)", value: "^dfmgi", market: "index" },
    { label: "adx (abu dhabi)", value: "^ftfadgi", market: "index" },
    { label: "egx 30 (egypt)", value: "^case30", market: "index" },
    { label: "jse (s.africa)", value: "^j203.jo", market: "index" },
    { label: "nse 20 (kenya)", value: "^nse20", market: "index" },
    { label: "tsx (canada)", value: "^gsptse", market: "index" },
    { label: "bovespa (brazil)", value: "^bvsp", market: "index" },
    { label: "ipc (mexico)", value: "^mxx", market: "index" },
    { label: "merval (argentina)", value: "^merv", market: "index" },
    { label: "ipsa (chile)", value: "^ipsa", market: "index" },
];

const index_groups = [
    {
        label: "india",
        values: ["^nsei", "^bsesn", "^nsebank", "^cnxit", "^nsemdcp50",
            "^nsmidcp", "^cnxauto", "^cnxpharma", "^cnxfmcg",
            "^cnxmetal", "^cnxenergy", "^cnxrealty", "^cnxinfra",
            "^cnxpsubank", "^indiavix"],
    },
    {
        label: "usa",
        values: ["^gspc", "^ndx", "^dji", "^rut", "^mid", "^nya", "^vix"],
    },
    {
        label: "europe",
        values: ["^ftse", "^gdaxi", "^fchi", "^stoxx50e", "^ibex",
            "^aex", "^ssmi", "^omx", "^atx", "^bfx", "ftsemib.mi"],
    },
    {
        label: "asia",
        values: ["^n225", "^topx", "^hsi", "000001.ss", "399001.sz",
            "000300.ss", "^ks11", "^kq11", "^twii", "^axjo",
            "^sti", "^jkse", "^set.bk", "^klse", "psei.ps"],
    },
    {
        label: "middle east & africa",
        values: ["^tasi.sr", "^dfmgi", "^ftfadgi", "^case30", "^j203.jo", "^nse20"],
    },
    {
        label: "americas",
        values: ["^gsptse", "^bvsp", "^mxx", "^merv", "^ipsa"],
    },
];

const reference_clocks = [
    { label: "nse", tz: "asia/kolkata", open: [9, 15], close: [15, 30], alwaysopen: false },
    { label: "bse", tz: "asia/kolkata", open: [9, 15], close: [15, 30], alwaysopen: false },
    { label: "nasdaq", tz: "america/new_york", open: [9, 30], close: [16, 0], alwaysopen: false },
    { label: "nyse", tz: "america/new_york", open: [9, 30], close: [16, 0], alwaysopen: false },
    { label: "tokyo", tz: "asia/tokyo", open: [9, 0], close: [15, 0], alwaysopen: false },
    { label: "london", tz: "europe/london", open: [8, 0], close: [16, 30], alwaysopen: false },
    { label: "sgx", tz: "asia/singapore", open: [9, 0], close: [17, 0], alwaysopen: false },
    { label: "asx", tz: "australia/sydney", open: [10, 0], close: [16, 0], alwaysopen: false },
    { label: "krx", tz: "asia/seoul", open: [9, 0], close: [15, 30], alwaysopen: false },
    { label: "jse", tz: "africa/johannesburg", open: [9, 0], close: [17, 0], alwaysopen: false },
    { label: "tadawul", tz: "asia/riyadh", open: [10, 0], close: [15, 0], alwaysopen: false },
    { label: "b3", tz: "america/sao_paulo", open: [10, 0], close: [18, 0], alwaysopen: false },
    { label: "tsx", tz: "america/toronto", open: [9, 30], close: [16, 0], alwaysopen: false },
    { label: "fx", tz: "asia/kolkata", open: [0, 0], close: [23, 59], alwaysopen: true },
    { label: "commodities", tz: "america/new_york", open: [18, 0], close: [17, 0], alwaysopen: true },
];



const nifty_compare_groups = {
    sectoral: [
        { label: "nifty auto", ticker: "^cnxauto" },
        { label: "nifty bank", ticker: "^nsebank" },
        { label: "nifty it", ticker: "^cnxit" },
        { label: "nifty pharma", ticker: "^cnxpharma" },
        { label: "nifty fmcg", ticker: "^cnxfmcg" },
        { label: "nifty metal", ticker: "^cnxmetal" },
        { label: "nifty energy", ticker: "^cnxenergy" },
        { label: "nifty realty", ticker: "^cnxrealty" },
        { label: "nifty infra", ticker: "^cnxinfra" },
        { label: "nifty psu bank", ticker: "^cnxpsubank" },
        { label: "nifty media", ticker: "^cnxmedia" },
        { label: "nifty finance", ticker: "^cnxfinance" },
    ],
    thematic: [
        { label: "nifty mnc", ticker: "^cnxmnc" },
        { label: "nifty pse", ticker: "^cnxpse" },
        { label: "nifty cpse", ticker: "^cnxcpse" },
        { label: "nifty services", ticker: "^cnxservice" },
        { label: "nifty consumption", ticker: "^cnxconsumption" },
        { label: "nifty mfg", ticker: "^cnxmfg" },
    ],
    "broad market": [
        { label: "sensex", ticker: "^bsesn" },
        { label: "nifty 100", ticker: "^cnx100" },
        { label: "nifty 500", ticker: "^cnx500" },
        { label: "nifty midcap 50", ticker: "^nsemdcp50" },
        { label: "nifty next 50", ticker: "^nsmidcp" },
        { label: "nifty smallcap", ticker: "^cnxsc" },
        { label: "india vix", ticker: "^indiavix" },
    ],
};

const ranges = [
    { label: "1m", value: "1mo", interval: "1d" },
    { label: "3m", value: "3mo", interval: "1d" },
    { label: "6m", value: "6mo", interval: "1d" },
    { label: "1y", value: "1y", interval: "1d" },
    { label: "2y", value: "2y", interval: "1wk" },
    { label: "5y", value: "5y", interval: "1wk" },
];


const option_symbols = [
    "nifty", "banknifty", "finnifty",
    "midcpnifty", "sensex", "bankex",
];


// normalize series to % change from first value
function normalize(data) {
    if (!data || data.length === 0) return [];
    const base = data[0].value;
    if (!base) return [];
    return data.map(d => ({
        date: d.date,
        value: parsefloat((((d.value - base) / base) * 100).tofixed(2)),
    }));
}

const line_colors = [
    "#2563eb", "#dc2626", "#16a34a", "#d97706",
    "#7c3aed", "#db2777", "#0891b2", "#65a30d",
    "#ea580c", "#6366f1", "#14b8a6", "#f43f5e",
];

// ── market hours ─────────────────────────────────────────────────────────────

function getlocaltime(tz) {
    const now = new date();
    return new date(now.tolocalestring("en-us", { timezone: tz }));
}

function ismarketopenforclock(clock) {
    if (clock.alwaysopen) return true;
    const local = getlocaltime(clock.tz);
    const day = local.getday();
    if (day === 0 || day === 6) return false;
    const total = local.gethours() * 60 + local.getminutes();
    const openmin = clock.open[0] * 60 + clock.open[1];
    const closemin = clock.close[0] * 60 + clock.close[1];
    return total >= openmin && total < closemin;
}

function secondsuntilopenforclock(clock) {
    const local = getlocaltime(clock.tz);
    const day = local.getday();
    const open = new date(local);
    open.sethours(clock.open[0], clock.open[1], 0, 0);
    if (day === 0) open.setdate(open.getdate() + 1);
    else if (day === 6) open.setdate(open.getdate() + 2);
    else if (local >= open) open.setdate(open.getdate() + (day === 5 ? 3 : 1));
    return math.max(0, math.floor((open - local) / 1000));
}

function secondsuntilcloseforclock(clock) {
    const local = getlocaltime(clock.tz);
    const close = new date(local);
    close.sethours(clock.close[0], clock.close[1], 0, 0);
    return math.max(0, math.floor((close - local) / 1000));
}

function formatseconds(secs) {
    const h = math.floor(secs / 3600);
    const m = math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function clockformarket(marketkey) {
    const found = reference_clocks.find(c => c.label === markets[marketkey]?.label);
    if (found) return found;
    const m = markets[marketkey] || markets.nse;
    return { label: m.label, tz: m.tz, open: m.open, close: m.close, alwaysopen: false };
}

// ── days held — counts all calendar days including weekends ──────────────────
function dayssince(datestr) {
    if (!datestr) return null;
    const start = new date(datestr);
    start.sethours(0, 0, 0, 0);
    const today = new date();
    today.sethours(0, 0, 0, 0);
    const diff = today - start;
    if (diff < 0) return null;
    return math.floor(diff / (1000 * 60 * 60 * 24));
}

function calcrr(buyprice, target, stoploss, side = "buy") {
    if (!buyprice || !target || !stoploss) return null;
    const reward = side === "buy" ? target - buyprice : buyprice - target;
    const risk = side === "buy" ? buyprice - stoploss : stoploss - buyprice;
    if (reward <= 0 || risk <= 0) return null;
    return (reward / risk).tofixed(2);
}

function fmtmoney(value, market) {
    const m = markets[market] || markets.nse;
    if (value === null || value === undefined || isnan(value)) return "-";
    const decimals = market === "fx" ? 4 : 2;
    const num = value.tolocalestring("en-in", { minimumfractiondigits: decimals, maximumfractiondigits: decimals });
    if (market === "index") return num;
    return m.symbol ? `${m.symbol}${num}` : num;
}

// ── rangebar ──────────────────────────────────────────────────────────────────

function rangebar({ price, low52, high52, market }) {
    if (!price || !low52 || !high52 || high52 === low52) return null;
    const pct = math.max(0, math.min(100, ((price - low52) / (high52 - low52)) * 100));
    return (
        <div classname="mt-1">
            <div classname="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>52w l {fmtmoney(low52, market)}</span>
                <span>{fmtmoney(high52, market)} 52w h</span>
            </div>
            <div classname="relative h-1.5 rounded-full bg-gray-100">
                <div classname="absolute h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400" style={{ width: "100%" }} />
                <div classname="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 shadow" style={{ left: `${pct}%` }} />
            </div>
            <p classname="text-[10px] text-gray-400 mt-0.5 text-right">{pct.tofixed(1)}% of range</p>
        </div>
    );
}

// ── marketbadge ───────────────────────────────────────────────────────────────

function marketbadge({ clock }) {
    const [open, setopen] = usestate(ismarketopenforclock(clock));
    const [countdown, setcountdown] = usestate("");

    useeffect(() => {
        const tick = () => {
            const o = ismarketopenforclock(clock);
            setopen(o);
            setcountdown(o
                ? formatseconds(secondsuntilcloseforclock(clock))
                : formatseconds(secondsuntilopenforclock(clock))
            );
        };
        tick();
        const interval = setinterval(tick, 1000);
        return () => clearinterval(interval);
    }, [clock]);

    return (
        <div classname="flex flex-col items-center min-w-[110px] rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-center">
            <span classname={`text-[10px] font-medium ${open ? "text-green-500" : "text-red-400"}`}>
                {open ? `● ${clock.label} open` : `● ${clock.label} closed`}
            </span>
            <span classname="text-sm font-mono font-semibold text-blue-600">{countdown}</span>
            <span classname="text-[10px] text-gray-400">{open ? "closes in" : "opens in"}</span>
        </div>
    );
}

// ── clockselector ─────────────────────────────────────────────────────────────

function clockselector({ visible, ontoggle, total }) {
    const [open, setopen] = usestate(false);

    return (
        <div classname="relative">
            <button
                onclick={() => setopen(v => !v)}
                classname="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
            >
                clocks
                <span classname="text-[10px] text-gray-400">
                    ({visible.length}/{total ?? reference_clocks.length})
                </span>
            </button>
            {open && (
                <>
                    <div classname="fixed inset-0 z-10" onclick={() => setopen(false)} />
                    <div classname="absolute top-full z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white shadow-lg py-1 max-h-72 overflow-y-auto">
                        {reference_clocks.map((clock) => (
                            <label
                                key={clock.label}
                                classname="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={visible.includes(clock.label)}
                                    onchange={() => ontoggle(clock.label)}
                                    classname="accent-blue-500"
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

// ── stockcard ─────────────────────────────────────────────────────────────────

function stockcard({ symbol, market, target, stoploss, entrydate, notes, qty, buyprice, side, mode, onremove, onupdate, isdragging }) {
    const [quote, setquote] = usestate(null);
    const [shownotes, setshownotes] = usestate(false);
    const m = markets[market] || markets.nse;
    const istrading = mode !== "watch";

    useeffect(() => {
        let active = true;
        const fetchprice = async () => {
            const ticker = (market === "commodity" || market === "index")
                ? symbol
                : `${symbol}${m.suffix}`;
            const data = await getquote(ticker);
            if (active) setquote(data);
        };
        fetchprice();
        const interval = setinterval(fetchprice, refresh_interval);
        return () => { active = false; clearinterval(interval); };
    }, [symbol, market]);

    const price = quote?.price ?? null;
    const daysheld = dayssince(entrydate);
    const rr = calcrr(buyprice, target, stoploss, side);

    const status =
        price === null ? "loading"
            : !istrading ? "watching"
                : side === "buy"
                    ? price >= target ? "target hit"
                        : price <= stoploss ? "stoploss hit"
                            : "holding"
                    : price <= target ? "target hit"
                        : price >= stoploss ? "stoploss hit"
                            : "holding";

    const badgeclasses =
        status === "target hit" ? "bg-green-100 text-green-700"
            : status === "stoploss hit" ? "bg-red-100 text-red-700"
                : status === "holding" ? "bg-amber-100 text-amber-700"
                    : status === "watching" ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600";

    const changecolor =
        quote?.change > 0 ? "text-green-600"
            : quote?.change < 0 ? "text-red-600"
                : "text-gray-500";

    const rrcolor =
        !rr ? "text-gray-400"
            : rr >= 2 ? "text-green-600"
                : rr >= 1 ? "text-amber-600"
                    : "text-red-500";

    const volchgpct = quote?.volume && quote?.prevvolume
        ? ((quote.volume - quote.prevvolume) / quote.prevvolume * 100).tofixed(1)
        : null;

    return (
        <div classname={`h-full flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm transition-all duration-150 ${isdragging ? "border-blue-400 shadow-lg opacity-50 scale-95" : "border-gray-200"}`}>

            {/* header */}
            <div classname="flex items-center justify-between">
                <div classname="flex items-center gap-2">
                    {/* drag handle */}
                    <span classname="text-gray-300 cursor-grab active:cursor-grabbing select-none text-base leading-none" title="drag to reorder">⠿</span>
                    <h3 classname="text-base font-semibold text-gray-900">
                        {market === "commodity"
                            ? (commodity_presets.find(c => c.value === symbol)?.label ?? symbol)
                            : market === "index"
                                ? (index_presets.find(i => i.value === symbol)?.label ?? symbol)
                                : symbol}
                    </h3>
                    <span classname="text-[10px] text-gray-400 font-medium">{m.label}</span>
                </div>
                <div classname="flex items-center gap-2">
                    <button
                        onclick={() => onupdate("mode", istrading ? "watch" : "trade")}
                        classname={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors ${istrading
                            ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                    >
                        {istrading ? "trading" : "watch"}
                    </button>
                    {istrading && (
                        <button onclick={() => setshownotes(v => !v)} classname="text-xs text-gray-400 hover:text-blue-500 transition-colors">📝</button>
                    )}
                    <button
                        onclick={onremove}
                        classname="w-6 h-6 rounded-md border border-gray-300 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center text-base leading-none"
                    >×</button>
                </div>
            </div>

            {/* qty */}
            {istrading && (
                <div classname="flex items-center justify-between">
                    <span classname="text-xs text-gray-400">qty</span>
                    <div classname="flex items-center gap-1.5">
                        <button onclick={() => onupdate("qty", math.max(1, (qty || 1) - 1))}
                            classname="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium flex items-center justify-center">−</button>
                        <input type="number" value={qty || 1} min={1}
                            onchange={(e) => onupdate("qty", math.max(1, number(e.target.value)))}
                            classname="w-16 text-center text-sm font-semibold text-gray-800 border border-gray-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onclick={() => onupdate("qty", (qty || 1) + 1)}
                            classname="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium flex items-center justify-center">+</button>
                    </div>
                    <span classname="text-xs text-gray-400">
                        {price !== null && qty ? fmtmoney(price * qty, market) : ""}
                    </span>
                </div>
            )}

            {/* buy / sell */}
            {istrading && (
                <div classname="flex items-center justify-between">
                    <span classname="text-xs text-gray-400">direction</span>
                    <div classname="flex rounded-md overflow-hidden border border-gray-300 text-xs font-medium">
                        <button onclick={() => onupdate("side", "buy")}
                            classname={`px-3 py-1 transition-colors ${side === "buy" ? "bg-green-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>buy</button>
                        <button onclick={() => onupdate("side", "sell")}
                            classname={`px-3 py-1 transition-colors ${side === "sell" ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>sell</button>
                    </div>
                </div>
            )}

            {/* price */}
            <p classname="text-2xl font-semibold text-gray-900">
                {price !== null ? fmtmoney(price, market) : "..."}
            </p>

            {/* change */}
            {quote?.change !== undefined && quote?.change !== null && (
                <p classname={`text-sm font-medium ${changecolor}`}>
                    {quote.change >= 0 ? "+" : ""}{quote.change.tofixed(2)} ({quote.changepercent?.tofixed(2)}%)
                </p>
            )}

            {/* status badge */}
            <span classname={`self-start rounded-md px-2.5 py-1 text-xs font-medium ${badgeclasses}`}>{status}</span>

            {/* 52w range */}
            {quote?.low52week && quote?.high52week && (
                <rangebar price={price} low52={quote.low52week} high52={quote.high52week} market={market} />
            )}

            {/* stats grid */}
            {istrading && (
                <div classname="grid grid-cols-3 gap-1 mt-1 text-center">
                    <div classname="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p classname="text-[10px] text-gray-400">volume</p>
                        <p classname="text-xs font-semibold text-gray-700">
                            {quote?.volume ? (quote.volume / 1_00_000).tofixed(1) + "l" : "-"}
                        </p>
                    </div>
                    <div classname="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p classname="text-[10px] text-gray-400">prev vol</p>
                        <p classname="text-xs font-semibold text-gray-700">
                            {quote?.prevvolume ? (quote.prevvolume / 1_00_000).tofixed(1) + "l" : "-"}
                        </p>
                    </div>
                    <div classname="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p classname="text-[10px] text-gray-400">vol chg</p>
                        <p classname={`text-xs font-semibold ${volchgpct === null ? "text-gray-400" : number(volchgpct) > 0 ? "text-blue-600" : "text-red-500"}`}>
                            {volchgpct !== null ? `${volchgpct}%` : "-"}
                        </p>
                    </div>
                    <div classname="rounded-lg bg-gray-50 px-2 py-1.5">
                        <p classname="text-[10px] text-gray-400">days held</p>
                        <p classname="text-xs font-semibold text-gray-700">
                            {daysheld !== null ? `${daysheld}d` : "-"}
                        </p>
                    </div>
                    <div classname="col-span-2 rounded-lg bg-gray-50 px-2 py-1.5">
                        <p classname="text-[10px] text-gray-400">r : r</p>
                        <p classname={`text-xs font-semibold ${rrcolor}`}>{rr ? `1 : ${rr}` : "-"}</p>
                    </div>
                </div>
            )}

            {/* inputs */}
            {istrading && (
                <div classname="mt-1 flex flex-col gap-1.5">
                    <label classname="flex items-center justify-between text-sm text-gray-600">
                        <span>target ({price !== null ? (target - price).tofixed(2) : "-"})</span>
                        <input type="number" value={target} onchange={(e) => onupdate("target", e.target.value)}
                            classname="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                    <label classname="flex items-center justify-between text-sm text-gray-600">
                        <span>stop loss ({price !== null ? (price - stoploss).tofixed(2) : "-"})</span>
                        <input type="number" value={stoploss} onchange={(e) => onupdate("stoploss", e.target.value)}
                            classname="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                    <label classname="flex items-center justify-between text-sm text-gray-600">
                        <span>entry date</span>
                        <input type="date" value={entrydate || ""} onchange={(e) => onupdate("entrydate", e.target.value)}
                            classname="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                    <label classname="flex items-center justify-between text-sm text-gray-600">
                        <span>buy price</span>
                        <input type="number" value={buyprice || ""} onchange={(e) => onupdate("buyprice", e.target.value)}
                            classname="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0" />
                    </label>
                </div>
            )}

            {/* p&l */}
            {istrading && buyprice > 0 && price !== null && qty > 0 && (() => {
                const pnl = side === "buy" ? (price - buyprice) * qty : (buyprice - price) * qty;
                const pnlpct = side === "buy" ? ((price - buyprice) / buyprice) * 100 : ((buyprice - price) / buyprice) * 100;
                const isprofit = pnl >= 0;
                return (
                    <div classname={`rounded-lg px-3 py-2 ${isprofit ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                        <div classname="flex items-center justify-between">
                            <span classname="text-[10px] text-gray-400">p&l ({daysheld !== null ? `${daysheld}d` : "0d"})</span>
                            <span classname={`text-[10px] font-medium ${isprofit ? "text-green-600" : "text-red-500"}`}>{pnlpct.tofixed(2)}%</span>
                        </div>
                        <p classname={`text-base font-semibold ${isprofit ? "text-green-600" : "text-red-500"}`}>
                            {isprofit ? "+" : ""}{fmtmoney(pnl, market)}
                        </p>
                        <div classname="flex justify-between text-[10px] text-gray-400 mt-0.5">
                            <span>buy {fmtmoney(buyprice, market)}</span>
                            <span>now {fmtmoney(price, market)}</span>
                        </div>
                    </div>
                );
            })()}

            {/* notes */}
            {istrading && shownotes && (
                <textarea value={notes || ""} onchange={(e) => onupdate("notes", e.target.value)}
                    placeholder="trade thesis, setup, key levels..." rows={3}
                    classname="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
        </div>
    );
}

// ── responsive columns ────────────────────────────────────────────────────────

function useresponsivecolumns(desktopcolumns = 4) {
    const [columns, setcolumns] = usestate(desktopcolumns);
    useeffect(() => {
        const compute = () => {
            const w = window.innerwidth;
            if (w < 640) return 1;
            if (w < 1024) return 2;
            return desktopcolumns;
        };
        const onresize = () => setcolumns(compute());
        onresize();
        window.addeventlistener("resize", onresize);
        return () => window.removeeventlistener("resize", onresize);
    }, [desktopcolumns]);
    return columns;
}

// -- compare chart --------------------------------------------------------

function comparechart({ onclose }) {
    const [activegroup, setactivegroup] = usestate("sectoral");
    const [selected, setselected] = usestate([]);       // array of ticker strings
    const [range, setrange] = usestate(ranges[3]);      // default 1y
    const [seriesdata, setseriesdata] = usestate({});   // { ticker: [{date,value}] }
    const [loading, setloading] = usestate({});         // { ticker: bool }
    const [basedata, setbasedata] = usestate([]);       // nifty 50 data
    const [baseloading, setbaseloading] = usestate(true);
    const [tooltip, settooltip] = usestate(null);

    const base_ticker = "^nsei";
    const base_label = "nifty 50";

    // load base (nifty 50) on mount or range change
    useeffect(() => {
        setbaseloading(true);
        gethistory(base_ticker, range.value, range.interval).then(data => {
            setbasedata(normalize(data));
            setbaseloading(false);
        });
        // reload all selected on range change
        selected.foreach(ticker => loadseries(ticker));
    }, [range]);

    const loadseries = async (ticker) => {
        setloading(prev => ({ ...prev, [ticker]: true }));
        const data = await gethistory(ticker, range.value, range.interval);
        setseriesdata(prev => ({ ...prev, [ticker]: normalize(data) }));
        setloading(prev => ({ ...prev, [ticker]: false }));
    };

    const toggleseries = (ticker) => {
        if (selected.includes(ticker)) {
            setselected(prev => prev.filter(t => t !== ticker));
        } else {
            setselected(prev => [...prev, ticker]);
            if (!seriesdata[ticker]) loadseries(ticker);
        }
    };

    // merge all series into one array keyed by date
    const mergeddata = usememo(() => {
        const datemap = {};
        // add base
        basedata.foreach(d => {
            datemap[d.date] = { date: d.date, [base_ticker]: d.value };
        });
        // add selected
        selected.foreach(ticker => {
            (seriesdata[ticker] ?? []).foreach(d => {
                if (!datemap[d.date]) datemap[d.date] = { date: d.date };
                datemap[d.date][ticker] = d.value;
            });
        });
        return object.values(datemap).sort((a, b) => a.date.localecompare(b.date));
    }, [basedata, seriesdata, selected]);

    // get label for ticker
    const getlabel = (ticker) => {
        if (ticker === base_ticker) return base_label;
        for (const group of object.values(nifty_compare_groups)) {
            const found = group.find(i => i.ticker === ticker);
            if (found) return found.label;
        }
        return ticker;
    };

    // all lines to draw
    const alllines = [base_ticker, ...selected];

    // last values for legend
    const lastrow = mergeddata[mergeddata.length - 1] ?? {};

    return (
        <div classname="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div classname="rounded-2xl shadow-2xl flex flex-col bg-white border border-gray-200 w-[96vw] h-[92vh] overflow-hidden">

                {/* header */}
                <div classname="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
                    <div classname="flex items-center gap-3">
                        <span classname="font-bold text-gray-900">📊 nifty 50 — compare chart</span>
                        {selected.length > 0 && (
                            <span classname="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                +{selected.length} indices
                            </span>
                        )}
                    </div>
                    <div classname="flex items-center gap-2">
                        {/* range selector */}
                        <div classname="flex rounded-md overflow-hidden border border-gray-300 text-xs font-medium">
                            {ranges.map(r => (
                                <button
                                    key={r.value}
                                    onclick={() => setrange(r)}
                                    classname={`px-2.5 py-1.5 transition-colors ${range.value === r.value
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
                                onclick={() => setselected([])}
                                classname="text-xs px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                            >
                                clear all
                            </button>
                        )}
                        <button
                            onclick={onclose}
                            classname="w-7 h-7 rounded-md border border-gray-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-lg"
                        >×</button>
                    </div>
                </div>

                <div classname="flex flex-1 overflow-hidden">

                    {/* sidebar */}
                    <div classname="w-52 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">

                        {/* base badge */}
                        <div classname="px-3 py-2 border-b border-gray-200">
                            <p classname="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">base index</p>
                            <div classname="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 border border-blue-200">
                                <span classname="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: line_colors[0] }} />
                                <span classname="text-xs font-semibold text-blue-700">nifty 50</span>
                                {lastrow[base_ticker] !== undefined && (
                                    <span classname={`ml-auto text-[11px] font-bold ${lastrow[base_ticker] >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {lastrow[base_ticker] >= 0 ? "+" : ""}{lastrow[base_ticker]}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* group tabs */}
                        <div classname="flex border-b border-gray-200">
                            {object.keys(nifty_compare_groups).map(g => (
                                <button
                                    key={g}
                                    onclick={() => setactivegroup(g)}
                                    classname={`flex-1 py-1.5 text-[9px] font-semibold transition-colors ${activegroup === g
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    {g === "broad market" ? "broad" : g}
                                </button>
                            ))}
                        </div>

                        {/* index list */}
                        <div classname="flex-1 overflow-y-auto py-1">
                            {nifty_compare_groups[activegroup].map((item, i) => {
                                const isselected = selected.includes(item.ticker);
                                const coloridx = selected.indexof(item.ticker) + 1;
                                const color = isselected ? line_colors[coloridx % line_colors.length] : undefined;
                                const pct = isselected && lastrow[item.ticker] !== undefined
                                    ? lastrow[item.ticker]
                                    : null;

                                return (
                                    <button
                                        key={item.ticker}
                                        onclick={() => toggleseries(item.ticker)}
                                        classname={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${isselected
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        <span classname="w-3 h-3 rounded flex-shrink-0 border flex items-center justify-center text-[9px]"
                                            style={isselected ? { background: color, bordercolor: color, color: "#fff" } : { bordercolor: "#d1d5db" }}>
                                            {isselected ? "✓" : ""}
                                        </span>
                                        <span classname="flex-1 truncate">{item.label}</span>
                                        {loading[item.ticker] && (
                                            <span classname="text-[9px] text-gray-400">...</span>
                                        )}
                                        {pct !== null && !loading[item.ticker] && (
                                            <span classname={`text-[10px] font-bold ${pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                {pct >= 0 ? "+" : ""}{pct}%
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* selected summary */}
                        {selected.length > 0 && (
                            <div classname="border-t border-gray-200 px-3 py-2">
                                <p classname="text-[10px] font-semibold text-gray-400 uppercase mb-1">selected ({selected.length})</p>
                                {selected.map((ticker, i) => (
                                    <div key={ticker} classname="flex items-center gap-1.5 py-0.5">
                                        <span classname="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ background: line_colors[(i + 1) % line_colors.length] }} />
                                        <span classname="text-[11px] text-gray-600 truncate flex-1">{getlabel(ticker)}</span>
                                        <button onclick={() => toggleseries(ticker)}
                                            classname="text-gray-300 hover:text-red-500 text-sm">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* chart area */}
                    <div classname="flex-1 flex flex-col overflow-hidden p-3">

                        {baseloading ? (
                            <div classname="flex-1 flex items-center justify-center text-sm text-gray-400">
                                loading nifty 50 data...
                            </div>
                        ) : (
                            <>
                                {/* legend */}
                                <div classname="flex flex-wrap gap-3 mb-2 px-1">
                                    {alllines.map((ticker, i) => {
                                        const pct = lastrow[ticker];
                                        return (
                                            <div key={ticker} classname="flex items-center gap-1.5">
                                                <span classname="w-5 h-0.5 rounded-full inline-block" style={{ background: line_colors[i % line_colors.length] }} />
                                                <span classname="text-xs text-gray-600">{getlabel(ticker)}</span>
                                                {pct !== undefined && (
                                                    <span classname={`text-xs font-bold ${pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                        ({pct >= 0 ? "+" : ""}{pct}%)
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <span classname="text-[10px] text-gray-400 ml-auto self-center">% change from start — all indices normalized</span>
                                </div>

                                {/* custom svg chart */}
                                <customlinechart
                                    data={mergeddata}
                                    lines={alllines}
                                    colors={line_colors}
                                    getlabel={getlabel}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── custom svg line chart ─────────────────────────────────────────────────────

function customlinechart({ data, lines, colors, getlabel }) {
    const svgref = useref(null);
    const [hoveredx, sethoveredx] = usestate(null);
    const [tooltipdata, settooltipdata] = usestate(null);

    const w = 900, h = 400;
    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartw = w - pad.left - pad.right;
    const charth = h - pad.top - pad.bottom;

    const allvalues = data.flatmap(d => lines.map(l => d[l]).filter(v => v !== undefined && v !== null));
    const minv = math.min(...allvalues, 0);
    const maxv = math.max(...allvalues, 0);
    const rangev = maxv - minv || 1;

    const xscale = (i) => pad.left + (i / math.max(data.length - 1, 1)) * chartw;
    const yscale = (v) => pad.top + charth - ((v - minv) / rangev) * charth;

    // y axis ticks
    const yticks = [];
    const tickcount = 6;
    for (let i = 0; i <= tickcount; i++) {
        const v = minv + (rangev / tickcount) * i;
        yticks.push(parsefloat(v.tofixed(1)));
    }

    // x axis ticks — show ~6 dates
    const xtickidxs = [];
    const step = math.floor(data.length / 5);
    for (let i = 0; i < data.length; i += step) xtickidxs.push(i);
    if (xtickidxs[xtickidxs.length - 1] !== data.length - 1) xtickidxs.push(data.length - 1);

    // build svg path for each line
    const buildpath = (ticker) => {
        let d = "";
        data.foreach((row, i) => {
            const v = row[ticker];
            if (v === undefined || v === null) return;
            const x = xscale(i);
            const y = yscale(v);
            d += d === "" ? `m ${x} ${y}` : ` l ${x} ${y}`;
        });
        return d;
    };

    // mouse move handler
    const handlemousemove = (e) => {
        const svg = svgref.current;
        if (!svg) return;
        const rect = svg.getboundingclientrect();
        const mx = (e.clientx - rect.left) * (w / rect.width);
        const relx = mx - pad.left;
        const idx = math.round((relx / chartw) * (data.length - 1));
        const clamped = math.max(0, math.min(data.length - 1, idx));
        sethoveredx(clamped);
        settooltipdata(data[clamped]);
    };

    const hx = hoveredx !== null ? xscale(hoveredx) : null;

    return (
        <div classname="flex-1 relative" style={{ minheight: 0 }}>
            <svg
                ref={svgref}
                viewbox={`0 0 ${w} ${h}`}
                classname="w-full h-full"
                onmousemove={handlemousemove}
                onmouseleave={() => { sethoveredx(null); settooltipdata(null); }}
            >
                {/* grid lines */}
                {yticks.map(v => (
                    <line key={v}
                        x1={pad.left} y1={yscale(v)}
                        x2={w - pad.right} y2={yscale(v)}
                        stroke="#e5e7eb" strokewidth="0.5" />
                ))}

                {/* zero line */}
                {minv < 0 && maxv > 0 && (
                    <line
                        x1={pad.left} y1={yscale(0)}
                        x2={w - pad.right} y2={yscale(0)}
                        stroke="#9ca3af" strokewidth="1" strokedasharray="4 3" />
                )}

                {/* y axis labels */}
                {yticks.map(v => (
                    <text key={v}
                        x={pad.left - 6} y={yscale(v) + 4}
                        textanchor="end" fontsize="10" fill="#9ca3af">
                        {v >= 0 ? "+" : ""}{v}%
                    </text>
                ))}

                {/* x axis labels */}
                {xtickidxs.map(i => (
                    <text key={i}
                        x={xscale(i)} y={h - 6}
                        textanchor="middle" fontsize="10" fill="#9ca3af">
                        {data[i]?.date?.slice(5)}
                    </text>
                ))}

                {/* lines */}
                {lines.map((ticker, i) => (
                    <path key={ticker}
                        d={buildpath(ticker)}
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokewidth={ticker === "^nsei" ? 2.5 : 1.5}
                        strokelinejoin="round"
                        strokelinecap="round"
                        opacity={hoveredx !== null ? (tooltipdata?.[ticker] !== undefined ? 1 : 0.3) : 1}
                    />
                ))}

                {/* hover crosshair */}
                {hx !== null && (
                    <>
                        <line x1={hx} y1={pad.top} x2={hx} y2={h - pad.bottom}
                            stroke="#6b7280" strokewidth="1" strokedasharray="3 3" />
                        {lines.map((ticker, i) => {
                            const v = tooltipdata?.[ticker];
                            if (v === undefined || v === null) return null;
                            return (
                                <circle key={ticker}
                                    cx={hx} cy={yscale(v)} r="4"
                                    fill={colors[i % colors.length]}
                                    stroke="#fff" strokewidth="1.5" />
                            );
                        })}
                    </>
                )}
            </svg>

            {/* tooltip */}
            {tooltipdata && hoveredx !== null && (
                <div classname="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs min-w-[160px]">
                    <p classname="font-semibold text-gray-700 mb-1.5 border-b border-gray-100 pb-1">
                        {tooltipdata.date}
                    </p>
                    {lines.map((ticker, i) => {
                        const v = tooltipdata[ticker];
                        if (v === undefined || v === null) return null;
                        return (
                            <div key={ticker} classname="flex items-center justify-between gap-3 py-0.5">
                                <div classname="flex items-center gap-1.5">
                                    <span classname="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ background: colors[i % colors.length] }} />
                                    <span classname="text-gray-600 truncate max-w-[90px]">{getlabel(ticker)}</span>
                                </div>
                                <span classname={`font-bold ${v >= 0 ? "text-green-600" : "text-red-500"}`}>
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


// ---- option chain ------------------------------------------------------------

function optionchain({ onclose }) {
    const [symbol, setsymbol] = usestate("nifty");
    const [expiry, setexpiry] = usestate("");
    const [data, setdata] = usestate(null);
    const [loading, setloading] = usestate(false);
    const [error, seterror] = usestate(null);
    const [spotprice, setspotprice] = usestate(null);
    const [filter, setfilter] = usestate(10); // show ±10 strikes from atm
    const [expirytimestamps, setexpirytimestamps] = usestate([]);

    const fetchdata = async (sym, selectedexpiry = "") => {
        setloading(true);
        seterror(null);
        try {
            // find timestamp for selected expiry
            const ts = expirytimestamps.find((t) => {
                const label = new date(t * 1000).tolocaledatestring("en-in", {
                    day: "2-digit", month: "short", year: "numeric"
                });
                return label === selectedexpiry;
            });

            const url = `/api/options?symbol=${sym}${ts ? `&date=${ts}` : ""}`;
            const res = await fetch(url);
            const json = await res.json();

            if (json.error) {
                seterror(json.message ?? "failed to fetch option chain.");
                setloading(false);
                return;
            }

            const records = json?.records;
            setspotprice(records?.underlyingvalue ?? null);
            setexpirytimestamps(records?.expirationtimestamps ?? []);

            const expiries = records?.expirydates ?? [];
            const activeexp = selectedexpiry || expiries[0] || "";
            setexpiry(activeexp);
            setdata(json);
        } catch (e) {
            seterror("network error: " + e.message);
        }
        setloading(false);
    };

    // initial load
    useeffect(() => { fetchdata(symbol); }, [symbol]);

    // filter data for selected expiry
    const rows = usememo(() => {
        if (!data || !expiry) return [];
        const records = data?.records?.data ?? [];
        return records.filter(r => r.expirydate === expiry);
    }, [data, expiry]);

    // find atm strike
    const atm = usememo(() => {
        if (!spotprice || !rows.length) return null;
        return rows.reduce((prev, curr) =>
            math.abs(curr.strikeprice - spotprice) < math.abs(prev.strikeprice - spotprice) ? curr : prev
        ).strikeprice;
    }, [rows, spotprice]);

    // filter rows around atm
    const filteredrows = usememo(() => {
        if (!atm) return rows;
        const strikes = [...new set(rows.map(r => r.strikeprice))].sort((a, b) => a - b);
        const atmidx = strikes.indexof(atm);
        const visible = strikes.slice(math.max(0, atmidx - filter), atmidx + filter + 1);
        return rows.filter(r => visible.includes(r.strikeprice));
    }, [rows, atm, filter]);

    const expiries = data?.records?.expirydates ?? [];

    // max oi for bar scaling
    const maxceoi = math.max(...filteredrows.map(r => r.ce?.openinterest ?? 0), 1);
    const maxpeoi = math.max(...filteredrows.map(r => r.pe?.openinterest ?? 0), 1);

    const fmt = (n) => n == null ? "-" : n >= 1e7 ? (n / 1e7).tofixed(2) + "cr" : n >= 1e5 ? (n / 1e5).tofixed(1) + "l" : n.tolocalestring("en-in");
    const fmtchg = (n) => n == null ? "-" : (n >= 0 ? "+" : "") + n.tofixed(2);

    return (
        <div classname="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div classname="rounded-2xl shadow-2xl flex flex-col bg-white border border-gray-200 w-[98vw] h-[94vh] overflow-hidden">

                {/* header */}
                <div classname="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
                    <div classname="flex items-center gap-3 flex-wrap">
                        <span classname="font-bold text-gray-900">📋 option chain</span>

                        {/* symbol selector */}
                        <div classname="flex rounded-md overflow-hidden border border-gray-300 text-xs font-medium">
                            {option_symbols.map(s => (
                                <button key={s} onclick={() => setsymbol(s)}
                                    classname={`px-2.5 py-1.5 transition-colors ${symbol === s ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* expiry selector */}
                        {expiries.length > 0 && (
                            <select
                                value={expiry}
                                onchange={e => fetchdata(symbol, e.target.value)}
                                classname="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {expiries.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        )}

                        {/* strike filter */}
                        <div classname="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>±</span>
                            <select value={filter} onchange={e => setfilter(number(e.target.value))}
                                classname="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none">
                                {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} strikes</option>)}
                            </select>
                        </div>

                        {/* spot price */}
                        {spotprice && (
                            <span classname="text-sm font-bold text-gray-700">
                                spot: <span classname="text-blue-600">₹{spotprice.tolocalestring("en-in", { minimumfractiondigits: 2 })}</span>
                            </span>
                        )}

                        <button
                            onclick={() => fetchdata(symbol, expiry)}
                            classname="px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            🔄 refresh
                        </button>
                    </div>

                    <button onclick={onclose}
                        classname="w-7 h-7 rounded-md border border-gray-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-lg flex-shrink-0">
                        ×
                    </button>
                </div>

                {/* table */}
                <div classname="flex-1 overflow-auto">
                    {loading && (
                        <div classname="flex items-center justify-center h-full text-sm text-gray-400">
                            loading option chain...
                        </div>
                    )}
                    {error && (
                        <div classname="flex items-center justify-center h-full text-sm text-red-500">
                            {error}
                        </div>
                    )}
                    {!loading && !error && filteredrows.length > 0 && (
                        <table classname="w-full text-xs border-collapse">
                            <thead classname="sticky top-0 z-10">
                                <tr>
                                    {/* ce headers */}
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">oi</th>
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">chg oi</th>
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">volume</th>
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">iv</th>
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">ltp</th>
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">chg</th>
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-right font-semibold border-b border-green-100">bid</th>
                                    <th classname="bg-green-50 text-green-700 px-2 py-2 text-center font-bold border-b border-green-100 text-green-800">calls</th>
                                    {/* strike */}
                                    <th classname="bg-gray-800 text-white px-3 py-2 text-center font-bold border-b border-gray-700 min-w-[80px]">strike</th>
                                    {/* pe headers */}
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-center font-bold border-b border-red-100 text-red-800">puts</th>
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">ask</th>
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">chg</th>
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">ltp</th>
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">iv</th>
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">volume</th>
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">chg oi</th>
                                    <th classname="bg-red-50 text-red-700 px-2 py-2 text-left font-semibold border-b border-red-100">oi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredrows.map((row) => {
                                    const ce = row.ce;
                                    const pe = row.pe;
                                    const strike = row.strikeprice;
                                    const isatm = strike === atm;
                                    const isitm_ce = spotprice && strike < spotprice;
                                    const isitm_pe = spotprice && strike > spotprice;

                                    const ceoipct = ce ? (ce.openinterest / maxceoi) * 100 : 0;
                                    const peoipct = pe ? (pe.openinterest / maxpeoi) * 100 : 0;

                                    return (
                                        <tr key={strike}
                                            classname={`border-b transition-colors ${isatm
                                                ? "bg-yellow-50 border-yellow-200"
                                                : "border-gray-100 hover:bg-gray-50"
                                                }`}>
                                            {/* ce side */}
                                            <td classname={`px-2 py-1.5 text-right relative ${isitm_ce ? "bg-green-50" : ""}`}>
                                                <div classname="absolute inset-y-0 right-0 bg-green-200 opacity-30 rounded-l"
                                                    style={{ width: `${ceoipct}%` }} />
                                                <span classname="relative font-medium text-gray-700">{fmt(ce?.openinterest)}</span>
                                            </td>
                                            <td classname={`px-2 py-1.5 text-right ${isitm_ce ? "bg-green-50" : ""}`}>
                                                <span classname={ce?.changeinopeninterest > 0 ? "text-green-600" : ce?.changeinopeninterest < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmt(ce?.changeinopeninterest)}
                                                </span>
                                            </td>
                                            <td classname={`px-2 py-1.5 text-right text-gray-600 ${isitm_ce ? "bg-green-50" : ""}`}>{fmt(ce?.totaltradedvolume)}</td>
                                            <td classname={`px-2 py-1.5 text-right text-gray-600 ${isitm_ce ? "bg-green-50" : ""}`}>{ce?.impliedvolatility?.tofixed(1) ?? "-"}</td>
                                            <td classname={`px-2 py-1.5 text-right font-semibold ${isitm_ce ? "bg-green-50" : ""}`}>
                                                {ce?.lastprice?.tofixed(2) ?? "-"}
                                            </td>
                                            <td classname={`px-2 py-1.5 text-right ${isitm_ce ? "bg-green-50" : ""}`}>
                                                <span classname={ce?.change > 0 ? "text-green-600" : ce?.change < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmtchg(ce?.change)}
                                                </span>
                                            </td>
                                            <td classname={`px-2 py-1.5 text-right text-gray-500 ${isitm_ce ? "bg-green-50" : ""}`}>{ce?.bidprice?.tofixed(2) ?? "-"}</td>
                                            <td classname={`px-2 py-1.5 ${isitm_ce ? "bg-green-50" : ""}`} /> {/* spacer */}

                                            {/* strike */}
                                            <td classname={`px-3 py-1.5 text-center font-bold text-sm ${isatm
                                                ? "bg-yellow-400 text-yellow-900"
                                                : "bg-gray-800 text-white"
                                                }`}>
                                                {strike.tolocalestring("en-in")}
                                            </td>

                                            {/* pe side */}
                                            <td classname={`px-2 py-1.5 ${isitm_pe ? "bg-red-50" : ""}`} /> {/* spacer */}
                                            <td classname={`px-2 py-1.5 text-left text-gray-500 ${isitm_pe ? "bg-red-50" : ""}`}>{pe?.askprice?.tofixed(2) ?? "-"}</td>
                                            <td classname={`px-2 py-1.5 text-left ${isitm_pe ? "bg-red-50" : ""}`}>
                                                <span classname={pe?.change > 0 ? "text-green-600" : pe?.change < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmtchg(pe?.change)}
                                                </span>
                                            </td>
                                            <td classname={`px-2 py-1.5 text-left font-semibold ${isitm_pe ? "bg-red-50" : ""}`}>
                                                {pe?.lastprice?.tofixed(2) ?? "-"}
                                            </td>
                                            <td classname={`px-2 py-1.5 text-left text-gray-600 ${isitm_pe ? "bg-red-50" : ""}`}>{pe?.impliedvolatility?.tofixed(1) ?? "-"}</td>
                                            <td classname={`px-2 py-1.5 text-left text-gray-600 ${isitm_pe ? "bg-red-50" : ""}`}>{fmt(pe?.totaltradedvolume)}</td>
                                            <td classname={`px-2 py-1.5 text-left ${isitm_pe ? "bg-red-50" : ""}`}>
                                                <span classname={pe?.changeinopeninterest > 0 ? "text-green-600" : pe?.changeinopeninterest < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {fmt(pe?.changeinopeninterest)}
                                                </span>
                                            </td>
                                            <td classname={`px-2 py-1.5 text-left relative ${isitm_pe ? "bg-red-50" : ""}`}>
                                                <div classname="absolute inset-y-0 left-0 bg-red-200 opacity-30 rounded-r"
                                                    style={{ width: `${peoipct}%` }} />
                                                <span classname="relative font-medium text-gray-700">{fmt(pe?.openinterest)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {error && (
                                <div classname="flex flex-col items-center justify-center h-full gap-3">
                                    <p classname="text-sm text-red-500">{error}</p>
                                    <p classname="text-xs text-gray-400 max-w-md text-center">
                                        nse blocks automated requests. this works best during market hours (9:15 am – 3:30 pm ist, mon–fri).
                                        try refreshing or wait a few seconds.
                                    </p>
                                    <button onclick={() => fetchdata(symbol, expiry)}
                                        classname="px-4 py-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600">
                                        🔄 try again
                                    </button>
                                </div>
                            )}

                            {/* footer — pcr and total oi */}
                            {(() => {
                                const totalceoi = filteredrows.reduce((s, r) => s + (r.ce?.openinterest ?? 0), 0);
                                const totalpeoi = filteredrows.reduce((s, r) => s + (r.pe?.openinterest ?? 0), 0);
                                const pcr = totalceoi > 0 ? (totalpeoi / totalceoi).tofixed(2) : "-";
                                return (
                                    <tfoot>
                                        <tr classname="bg-gray-100 font-semibold text-xs border-t border-gray-300">
                                            <td colspan={2} classname="px-3 py-2 text-right text-green-700">
                                                total ce oi: {fmt(totalceoi)}
                                            </td>
                                            <td colspan={5} />
                                            <td classname="px-3 py-2 text-center text-gray-700">
                                                pcr: <span classname={number(pcr) >= 1 ? "text-green-600" : "text-red-500"}>{pcr}</span>
                                            </td>
                                            <td classname="px-3 py-2 text-center bg-gray-800 text-white text-xs">
                                                pcr {pcr}
                                            </td>
                                            <td />
                                            <td colspan={5} />
                                            <td colspan={2} classname="px-3 py-2 text-left text-red-700">
                                                total pe oi: {fmt(totalpeoi)}
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

// ── dashboard ─────────────────────────────────────────────────────────────────

export default function dashboard() {
    const [stocks, setstocks] = usestate([]);
    const [search, setsearch] = usestate("");
    const [selectedmarket, setselectedmarket] = usestate("nse");
    const [loaded, setloaded] = usestate(false);
    const [commodityopen, setcommodityopen] = usestate(false);
    const [indicesopen, setindicesopen] = usestate(false);
    const [visibleclocks, setvisibleclocks] = usestate([]);
    const [allclocks, setallclocks] = usestate(reference_clocks); // tracks full list from db
    const [layout, setlayout] = usestate("masonry");
    const columns = useresponsivecolumns(4);
    const updatetimers = useref({});
    const [showcompare, setshowcompare] = usestate(false);
    const [showoptions, setshowoptions] = usestate(false);

    // ── drag state ────────────────────────────────────────────────────────────
    const dragidx = useref(null);       // index being dragged
    const dragoveridx = useref(null);   // index being hovered over
    const [draggingidx, setdraggingidx] = usestate(null);
    const [droptargetidx, setdroptargetidx] = usestate(null);

    // ── load watchlist ────────────────────────────────────────────────────────
    useeffect(() => {
        fetch("/api/watchlist")
            .then(r => r.json())
            .then(data => { setstocks(array.isarray(data) ? data : []); setloaded(true); })
            .catch(() => setloaded(true));
    }, []);

    // ── load clocks ───────────────────────────────────────────────────────────
    useeffect(() => {
        fetch("/api/clocks")
            .then(r => r.json())
            .then(data => {
                if (array.isarray(data)) {
                    // visible clocks = only those with visible: true
                    setvisibleclocks(data.filter(c => c.visible).map(c => c.label));
                    // allclocks = full list for the selector total count
                    setallclocks(data.map(c => ({
                        ...reference_clocks.find(r => r.label === c.label),
                        label: c.label,
                        visible: c.visible,
                    })).filter(boolean));
                }
            })
            .catch(() => { });
    }, []);

    const toggleclock = async (label) => {
        const isvisible = visibleclocks.includes(label);
        setvisibleclocks(prev => isvisible ? prev.filter(l => l !== label) : [...prev, label]);
        await fetch("/api/clocks", {
            method: "put",
            headers: { "content-type": "application/json" },
            body: json.stringify({ label, visible: !isvisible }),
        });
    };

    // ── add stock ─────────────────────────────────────────────────────────────
    const addstock = async (overridesymbol, overridemarket) => {
        const sym = typeof overridesymbol === "string" ? overridesymbol : search;
        const mkt = overridemarket ?? selectedmarket;
        if (!sym) return;
        const newstock = {
            symbol: overridesymbol ? sym : sym.touppercase(),
            market: mkt, target: 0, stoploss: 0,
            entrydate: "", notes: "", qty: 1, buyprice: 0,
            side: "buy", mode: (mkt === "commodity" || mkt === "index") ? "watch" : "trade",
        };
        const res = await fetch("/api/watchlist", {
            method: "post",
            headers: { "content-type": "application/json" },
            body: json.stringify(newstock),
        });
        const saved = await res.json();
        setstocks(prev => [...prev, saved]);
        setsearch("");
        setcommodityopen(false);
        setindicesopen(false);
    };

    // ── update field ──────────────────────────────────────────────────────────
    const update = (idx, field, value) => {
        setstocks(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: ["target", "stoploss", "qty", "buyprice"].includes(field) ? number(value) : value };
            return copy;
        });
        cleartimeout(updatetimers.current[idx]);
        updatetimers.current[idx] = settimeout(() => {
            setstocks(prev => {
                const stock = prev[idx];
                if (!stock?.id) return prev;
                fetch(`/api/watchlist/${stock.id}`, {
                    method: "put",
                    headers: { "content-type": "application/json" },
                    body: json.stringify(stock),
                }).catch(console.error);
                return prev;
            });
        }, 600);
    };

    // ── remove stock ──────────────────────────────────────────────────────────
    const removestock = async (idx) => {
        const stock = stocks[idx];
        setstocks(prev => prev.filter((_, i) => i !== idx));
        if (stock?.id) await fetch(`/api/watchlist/${stock.id}`, { method: "delete" });
    };

    // ── drag handlers ─────────────────────────────────────────────────────────
    const handledragstart = (e, idx) => {
        dragidx.current = idx;
        setdraggingidx(idx);
        e.datatransfer.effectallowed = "move";
    };

    const handledragover = (e, idx) => {
        e.preventdefault();
        e.datatransfer.dropeffect = "move";
        if (dragoveridx.current !== idx) {
            dragoveridx.current = idx;
            setdroptargetidx(idx);
        }
    };

    const handledrop = (e, idx) => {
        e.preventdefault();
        const from = dragidx.current;
        if (from === null || from === idx) return;
        setstocks(prev => {
            const copy = [...prev];
            const [moved] = copy.splice(from, 1);
            copy.splice(idx, 0, moved);
            return copy;
        });
        dragidx.current = null;
        dragoveridx.current = null;
        setdraggingidx(null);
        setdroptargetidx(null);
    };

    const handledragend = () => {
        dragidx.current = null;
        dragoveridx.current = null;
        setdraggingidx(null);
        setdroptargetidx(null);
    };

    if (!loaded) return (
        <div classname="flex items-center justify-center h-40 text-sm text-gray-400">
            loading watchlist...
        </div>
    );

    return (
        <div classname="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">

            {/* search + market selector — single row, search shrinks dynamically */}
            <div classname="mb-4 flex items-center gap-2 flex-nowrap overflow-x-auto pb-1">

                <select
                    value={selectedmarket}
                    onchange={(e) => setselectedmarket(e.target.value)}
                    classname="flex-shrink-0 rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {object.entries(markets)
                        .filter(([k]) => k !== "commodity" && k !== "index")
                        .map(([key, m]) => (
                            <option key={key} value={key}>{m.label}</option>
                        ))}
                </select>

                <div classname="flex-shrink-0">
                    <marketbadge clock={clockformarket(selectedmarket)} />
                </div>

                <div classname="flex-shrink-0">
                    <clockselector visible={visibleclocks} ontoggle={toggleclock} total={allclocks.length} />
                </div>

                <input
                    value={search}
                    onchange={(e) => setsearch(e.target.value)}
                    placeholder={`search ${markets[selectedmarket].label} e.g. ${selectedmarket === "nse" ? "tcs" : selectedmarket === "tse" ? "7203" : "aapl"}`}
                    onkeydown={(e) => e.key === "enter" && addstock()}
                    classname="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    onclick={() => addstock()}
                    classname="flex-shrink-0 whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    add
                </button>

                {/* commodities dropdown */}
                <div classname="relative flex-shrink-0">
                    <button
                        onclick={() => { setcommodityopen(v => !v); setindicesopen(false); setshowcompare(false); }}
                        classname="whitespace-nowrap rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 flex items-center gap-1"
                    >
                        commodities <span classname="text-[10px]">{commodityopen ? "▲" : "▼"}</span>
                    </button>
                    {commodityopen && (
                        <>
                            <div classname="fixed inset-0 z-10" onclick={() => setcommodityopen(false)} />
                            <div classname="absolute top-full left-0 z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg py-1">
                                {commodity_presets.map((c) => (
                                    <button
                                        key={c.value}
                                        onclick={() => { addstock(c.value, "commodity"); setcommodityopen(false); }}
                                        classname="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* indices dropdown */}
                <div classname="relative flex-shrink-0">
                    <button
                        onclick={() => { setindicesopen(v => !v); setcommodityopen(false); setshowcompare(false); }}
                        classname="whitespace-nowrap rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                    >
                        indices <span classname="text-[10px]">{indicesopen ? "▲" : "▼"}</span>
                    </button>
                    {indicesopen && (
                        <>
                            <div classname="fixed inset-0 z-10" onclick={() => setindicesopen(false)} />
                            <div classname="absolute top-full left-0 z-20 mt-1 w-52 rounded-md border border-gray-200 bg-white shadow-lg py-1 max-h-80 overflow-y-auto">
                                {index_groups.map((group) => (
                                    <div key={group.label}>
                                        <p classname="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                            {group.label}
                                        </p>
                                        {index_presets
                                            .filter(i => group.values.includes(i.value))
                                            .map((idx) => (
                                                <button
                                                    key={idx.value}
                                                    onclick={() => { addstock(idx.value, idx.market); setindicesopen(false); }}
                                                    classname="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
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

                {/* compare button */}
                <button
                    onclick={() => setshowcompare(true)}
                    classname="flex-shrink-0 whitespace-nowrap rounded-md border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 flex items-center gap-1"
                >
                    📊 compare
                </button>

                {/* option chain button */}
                <button
                    onclick={() => setshowoptions(true)}
                    classname="flex-shrink-0 whitespace-nowrap rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 flex items-center gap-1"
                >
                    📋 options
                </button>

            </div>

            {/* compare chart modal */}
            {showcompare && (
                <comparechart
                    onclose={() => setshowcompare(false)}
                    dark={false}
                />
            )}

            {/* option chain modal */}
            {showoptions && (
                <optionchain onclose={() => setshowoptions(false)} />
            )}

            {/* reference clocks */}
            {visibleclocks.length > 0 && (
                <div classname="mb-4 flex flex-wrap gap-2">
                    {reference_clocks.filter(clock => visibleclocks.includes(clock.label)).map((clock) => (
                        <marketbadge key={clock.label} clock={clock} />
                    ))}
                </div>
            )}

            {/* cards with drag and drop */}
            {layout === "wide" ? (
                <div classname="flex flex-wrap gap-4">
                    {stocks.map((s, idx) => (
                        <div
                            key={s.id ?? idx}
                            classname={`w-80 transition-all duration-150 ${droptargetidx === idx && draggingidx !== idx ? "ring-2 ring-blue-400 rounded-xl" : ""}`}
                            draggable
                            ondragstart={(e) => handledragstart(e, idx)}
                            ondragover={(e) => handledragover(e, idx)}
                            ondrop={(e) => handledrop(e, idx)}
                            ondragend={handledragend}
                        >
                            <stockcard
                                {...s}
                                isdragging={draggingidx === idx}
                                onremove={() => removestock(idx)}
                                onupdate={(field, val) => update(idx, field, val)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ columncount: columns, columngap: "1rem" }}>
                    {stocks.map((s, idx) => (
                        <div
                            key={s.id ?? idx}
                            classname={`mb-4 break-inside-avoid transition-all duration-150 ${droptargetidx === idx && draggingidx !== idx ? "ring-2 ring-blue-400 rounded-xl" : ""}`}
                            draggable
                            ondragstart={(e) => handledragstart(e, idx)}
                            ondragover={(e) => handledragover(e, idx)}
                            ondrop={(e) => handledrop(e, idx)}
                            ondragend={handledragend}
                        >
                            <stockcard
                                {...s}
                                isdragging={draggingidx === idx}
                                onremove={() => removestock(idx)}
                                onupdate={(field, val) => update(idx, field, val)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
