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
    const isGuest = (user as any)?.is_anonymous || (user as any)?.app_metadata?.provider === 'anonymous'
    if (isGuest) {
      return NextResponse.json(
        { error: 'Guests cannot perform this action' },
        { status: 403 }
      )
    }

    const { friend_request_id } = await request.json()
    if (!friend_request_id) {
      return NextResponse.json(
        { error: 'Friend request ID is required' },
        { status: 400 }
      )
    }

    // Verify the friend request exists and user is the recipient
    const { data: friendRequest, error: fetchError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', friend_request_id)
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Accept the friend request
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friend_request_id)

    if (error) throw error

    // Notify the requester that the request was accepted
    try {
      await supabase
        .from('notifications')
        .insert({
          sender_id: user.id,
          recipient_id: friendRequest.user_id,
          type: 'friend_request_accepted',
          friend_request_id: friend_request_id,
        })
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting friend request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

