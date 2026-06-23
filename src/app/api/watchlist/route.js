import pool from "@/lib/db";

export async function GET() {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM watchlist ORDER BY created_at ASC"
        );
        // map snake_case DB columns → camelCase for the frontend
        const stocks = rows.map(dbToClient);
        return Response.json(stocks);
    } catch (err) {
        console.error("GET /api/watchlist:", err.message);
        return Response.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { rows } = await pool.query(
            `INSERT INTO watchlist
                (symbol, market, target, stop_loss, buy_price, qty, side, mode, entry_date, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING *`,
            [
                body.symbol,
                body.market ?? "NSE",
                body.target ?? 0,
                body.stopLoss ?? 0,
                body.buyPrice ?? 0,
                body.qty ?? 1,
                body.side ?? "buy",
                body.mode ?? "trade",
                body.entryDate || null,
                body.notes ?? "",
            ]
        );
        return Response.json(dbToClient(rows[0]), { status: 201 });
    } catch (err) {
        console.error("POST /api/watchlist:", err.message);
        return Response.json({ error: "Failed to add" }, { status: 500 });
    }
}

function dbToClient(row) {
    return {
        id: row.id,
        symbol: row.symbol,   // ← make sure this line exists
        market: row.market,
        target: Number(row.target),
        stopLoss: Number(row.stop_loss),
        buyPrice: Number(row.buy_price),
        qty: row.qty,
        side: row.side,
        mode: row.mode,
        entryDate: row.entry_date ? row.entry_date.toISOString().split("T")[0] : "",
        notes: row.notes ?? "",
    };
}
