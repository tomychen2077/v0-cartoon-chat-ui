import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()

    const url = new URL(request.url)
    const minutesParam = url.searchParams.get('minutes')
    const tokenParam = url.searchParams.get('token')
    const expected = process.env.CRON_SECRET
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      if (!expected || tokenParam !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    const minutes = Math.max(1, Number(minutesParam || 2))
    const cutoff = new Date(Date.now() - minutes * 60_000).toISOString()

    let error: any = null
    const { error: err1 } = await admin
      .from('room_members')
      .delete()
      .lt('last_seen', cutoff)
    error = err1

    if (error) {
      await admin
        .from('room_members')
        .delete()
        .lt('joined_at', cutoff)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
