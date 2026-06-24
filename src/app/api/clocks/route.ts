import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('clocks')
        .select('*')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function PUT(req: Request) {
    const supabase = await createClient()
    const { label, visible } = await req.json()

    const { error } = await supabase
        .from('clocks')
        .upsert({ label, visible }, { onConflict: 'label' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}
