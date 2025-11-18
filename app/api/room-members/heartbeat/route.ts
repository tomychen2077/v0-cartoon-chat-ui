import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { room_id } = await request.json()
    if (!room_id) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    let updateError: any = null

    const { error } = await supabase
      .from('room_members')
      .update({ last_seen: now })
      .eq('room_id', room_id)
      .eq('user_id', user.id)

    updateError = error

    if (updateError) {
      await supabase
        .from('room_members')
        .update({ joined_at: now })
        .eq('room_id', room_id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

