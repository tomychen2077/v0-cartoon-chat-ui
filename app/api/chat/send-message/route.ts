import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { room_id, content, media_url, media_type, client_ts } = await request.json()

    if (!room_id || (!content && !media_url)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id,
        user_id: user.id,
        content: content || '',
        media_url: media_url || null,
        media_type: media_type || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ...data, client_ts })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
