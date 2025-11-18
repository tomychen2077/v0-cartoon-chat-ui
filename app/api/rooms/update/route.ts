import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
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

    const { room_id, name, description, topic, emoji, is_public, is_private, language, max_members } = await request.json()

    if (!room_id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    // Verify user is the room owner
    const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', room_id)
      .single()

    if (fetchError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only room owner can update the room' },
        { status: 403 }
      )
    }

    // Update room
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (topic !== undefined) updateData.topic = topic
    if (emoji !== undefined) updateData.emoji = emoji
    if (is_public !== undefined) updateData.is_public = is_public
    if (is_private !== undefined) updateData.is_private = is_private
    if (language !== undefined) updateData.language = language
    if (max_members !== undefined) updateData.max_members = max_members || null

    const { data: updatedRoom, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', room_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

