import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const toRow = (s: any) => ({
    symbol: s.symbol,
    market: s.market,
    target: s.target ?? 0,
    stop_loss: s.stopLoss ?? 0,
    entry_date: s.entryDate || null,
    notes: s.notes ?? '',
    qty: s.qty ?? 1,
    buy_price: s.buyPrice ?? 0,
    side: s.side ?? 'buy',
    mode: s.mode ?? 'trade',
})

const toStock = (r: any) => ({
    id: r.id,
    symbol: r.symbol,
    market: r.market,
    target: r.target,
    stopLoss: r.stop_loss,
    entryDate: r.entry_date,
    notes: r.notes,
    qty: r.qty,
    buyPrice: r.buy_price,
    side: r.side,
    mode: r.mode,
})

export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data.map(toStock))
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const body = await req.json()

    const { data, error } = await supabase
        .from('watchlist')
        .insert(toRow(body))
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(toStock(data))
}
