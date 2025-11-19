import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = request.nextUrl.searchParams.get('room_id')
    if (!roomId) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 })
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', roomId)
      .single()
    if (!room || room.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: invites, error } = await supabase
      .from('room_invites')
      .select('*')
      .eq('room_id', roomId)
      .order('created_by', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to list invites' }, { status: 500 })
    }

    return NextResponse.json({ invites: invites || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

