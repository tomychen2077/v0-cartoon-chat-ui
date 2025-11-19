import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'accepted'

    // Get friends where user is either user_id or friend_id
    const { data: friends, error } = await supabase
      .from('friends')
      .select(`
        *,
        user:profiles!user_id(id, username, display_name, avatar_url, bio),
        friend:profiles!friend_id(id, username, display_name, avatar_url, bio)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', status)

    if (error) throw error

    // Transform to include friend profile info
    const friendsList = friends?.map((f: any) => {
      const friendProfile = f.user_id === user.id ? f.friend : f.user
      return {
        id: f.id,
        friend_id: friendProfile?.id || (f.user_id === user.id ? f.friend_id : f.user_id),
        username: friendProfile?.username || 'Unknown',
        display_name: friendProfile?.display_name || friendProfile?.username || 'Unknown',
        avatar_url: friendProfile?.avatar_url,
        bio: friendProfile?.bio,
        status: f.status,
        created_at: f.created_at,
        user_id: f.user_id,
        friend_id_raw: f.friend_id,
      }
    }) || []

    return NextResponse.json({ friends: friendsList })
  } catch (error) {
    console.error('Error getting friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

