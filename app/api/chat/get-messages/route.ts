import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const roomId = request.nextUrl.searchParams.get('room_id')
    if (!roomId) {
      return NextResponse.json(
        { error: 'room_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
