import pool from "@/lib/db";

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { rows } = await pool.query(
            `UPDATE watchlist SET
                symbol     = $1,
                market     = $2,
                target     = $3,
                stop_loss  = $4,
                buy_price  = $5,
                qty        = $6,
                side       = $7,
                mode       = $8,
                entry_date = $9,
                notes      = $10,
                updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [
                body.symbol,
                body.market,
                body.target,
                body.stopLoss,
                body.buyPrice,
                body.qty,
                body.side,
                body.mode,
                body.entryDate || null,
                body.notes,
                id,
            ]
        );
        if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json(dbToClient(rows[0]));
    } catch (err) {
        console.error("PUT /api/watchlist/[id]:", err.message);
        return Response.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await pool.query("DELETE FROM watchlist WHERE id = $1", [id]);
        return Response.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/watchlist/[id]:", err.message);
        return Response.json({ error: "Failed to delete" }, { status: 500 });
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
