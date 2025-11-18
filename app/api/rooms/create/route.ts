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
        { error: 'Please create an account to create rooms' },
        { status: 403 }
      )
    }

    const { name, description, topic, emoji, is_public, is_private, language, max_members } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name,
        description,
        topic,
        emoji,
        is_public: is_public ?? true,
        is_private: is_private ?? false,
        language,
        max_members: max_members || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as room member
    await supabase
      .from('room_members')
      .insert({
        room_id: data.id,
        user_id: user.id,
      })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
