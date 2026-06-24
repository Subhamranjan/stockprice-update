// src/app/api/test/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'  // ← @/ and server not client

export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('watchlist')
            .select('count')
            .limit(1)

        if (error) throw error

        return NextResponse.json({
            status: 'ok',
            message: 'Supabase connection successful',
            data,
        })
    } catch (err: any) {
        return NextResponse.json({
            status: 'error',
            message: err.message,
        }, { status: 500 })
    }
}
