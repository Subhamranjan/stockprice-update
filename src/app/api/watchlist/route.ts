import pool from "@/lib/db";
import { NextRequest } from "next/server";

function dbToClient(row: any) {
    return {
        id: row.id,
        symbol: row.symbol,
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

export async function GET() {
    try {
        const { rows } = await pool.query("SELECT * FROM watchlist ORDER BY created_at ASC");
        return Response.json(rows.map(dbToClient));
    } catch (err: any) {
        console.error("GET /api/watchlist:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
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
    } catch (err: any) {
        console.error("POST /api/watchlist:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
