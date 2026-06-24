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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()

    const { error } = await supabase
        .from('watchlist')
        .update(toRow(body))
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}
