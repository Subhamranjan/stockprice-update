import pool from "@/lib/db";
import { NextRequest } from "next/server";

const DEFAULT_CLOCKS = [
    "NSE", "BSE", "NASDAQ", "NYSE", "Tokyo", "London",
    "SGX", "ASX", "KRX", "JSE", "Tadawul", "B3", "TSX",
    "FX", "Commodities"
];

export async function GET() {
    try {
        const values = DEFAULT_CLOCKS.map((_, i) => `($${i + 1}, true)`).join(", ");
        await pool.query(
            `INSERT INTO market_clocks (label, visible) VALUES ${values} ON CONFLICT (label) DO NOTHING`,
            DEFAULT_CLOCKS
        );
        const { rows } = await pool.query(
            "SELECT label, visible FROM market_clocks ORDER BY id ASC"
        );
        return Response.json(rows);
    } catch (err: any) {
        console.error("GET /api/clocks:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { label, visible } = await req.json();
        const { rows } = await pool.query(
            `INSERT INTO market_clocks (label, visible)
             VALUES ($1, $2)
             ON CONFLICT (label) DO UPDATE SET visible = EXCLUDED.visible
             RETURNING *`,
            [label, visible]
        );
        return Response.json(rows[0]);
    } catch (err: any) {
        console.error("PUT /api/clocks:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
