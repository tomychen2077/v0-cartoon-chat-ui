import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()

    const url = new URL(request.url)
    const daysParam = url.searchParams.get('days')
    const beforeParam = url.searchParams.get('before')
    const roomId = url.searchParams.get('room_id')
    const tokenParam = url.searchParams.get('token')
    const expected = process.env.CRON_SECRET
    const isDev = process.env.NODE_ENV === 'development'

    if (!isDev) {
      if (!expected || tokenParam !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    let cutoffISO: string
    if (beforeParam) {
      cutoffISO = new Date(beforeParam).toISOString()
    } else {
      const days = Math.max(1, Number(daysParam || 30))
      cutoffISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    }

    let error: any = null
    if (roomId) {
      const { error: err } = await admin
        .from('messages')
        .delete()
        .eq('room_id', roomId)
        .lt('created_at', cutoffISO)
      error = err
    } else {
      const { error: err } = await admin
        .from('messages')
        .delete()
        .lt('created_at', cutoffISO)
      error = err
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to cleanup messages' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

