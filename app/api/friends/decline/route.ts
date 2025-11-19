import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isGuest = (user as any)?.is_anonymous || (user as any)?.app_metadata?.provider === 'anonymous'
    if (isGuest) {
      return NextResponse.json({ error: 'Guests cannot perform this action' }, { status: 403 })
    }

    const { friend_request_id } = await request.json()
    if (!friend_request_id) {
      return NextResponse.json({ error: 'Friend request ID is required' }, { status: 400 })
    }

    const { data: friendRequest, error: fetchError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', friend_request_id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friendRequest.friend_id !== user.id && friendRequest.user_id !== user.id) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friend_request_id)

    if (error) throw error

    try {
      if (friendRequest.friend_id === user.id) {
        await supabase
          .from('notifications')
          .insert({
            sender_id: user.id,
            recipient_id: friendRequest.user_id,
            type: 'friend_request_declined',
            friend_request_id: friend_request_id,
          })
      } else if (friendRequest.user_id === user.id) {
        await supabase
          .from('notifications')
          .insert({
            sender_id: user.id,
            recipient_id: friendRequest.friend_id,
            type: 'friend_request_canceled',
            friend_request_id: friend_request_id,
          })
      }
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
