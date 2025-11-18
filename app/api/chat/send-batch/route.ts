import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { gunzipSync } from 'zlib'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure a profile row exists for this user (guest or member)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const username = (user.user_metadata as any)?.username || `Guest-${Math.floor(Math.random() * 10000)}`
      const display_name = (user.user_metadata as any)?.display_name || username
      await supabase
        .from('profiles')
        .upsert({ id: user.id, username, display_name })
    }

    let body: any = null
    const enc = request.headers.get('content-encoding')
    if (enc === 'gzip') {
      const buf = Buffer.from(await request.arrayBuffer())
      const json = gunzipSync(buf).toString('utf-8')
      body = JSON.parse(json)
    } else {
      body = await request.json()
    }

    const { room_id, messages } = body || {}
    if (!room_id || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const rows = messages.map((m: any) => ({
      room_id,
      user_id: user.id,
      content: m.content || '',
      media_url: m.media_url || null,
      media_type: m.media_type || null,
    }))

    const { data, error } = await supabase
      .from('messages')
      .insert(rows)
      .select()

    if (error) throw error
    const enriched = (data || []).map((row: any, i: number) => ({ ...row, client_ts: messages[i]?.client_ts, tmp_id: messages[i]?.tmp_id }))
    return NextResponse.json({ data: enriched })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
