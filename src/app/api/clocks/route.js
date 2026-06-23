import pool from "@/lib/db";

// GET all clocks with visibility
export async function GET() {
    try {
        const { rows } = await pool.query(
            "SELECT label, visible FROM market_clocks ORDER BY id ASC"
        );
        return Response.json(rows);
    } catch (err) {
        console.error("GET /api/clocks:", err.message);
        return Response.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// PUT — toggle visibility of a clock by label
export async function PUT(req) {
    try {
        const { label, visible } = await req.json();
        const { rows } = await pool.query(
            `UPDATE market_clocks SET visible = $1 WHERE label = $2 RETURNING *`,
            [visible, label]
        );
        if (!rows.length) {
            // Insert if not exists
            const inserted = await pool.query(
                `INSERT INTO market_clocks (label, visible) VALUES ($1, $2) RETURNING *`,
                [label, visible]
            );
            return Response.json(inserted.rows[0]);
        }
        return Response.json(rows[0]);
    } catch (err) {
        console.error("PUT /api/clocks:", err.message);
        return Response.json({ error: "Failed to update" }, { status: 500 });
    }
}
