import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { room_id, last_read_message_id } = await request.json()

        if (!room_id || !last_read_message_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Upsert read receipt
        const { error } = await supabase
            .from('read_receipts')
            .upsert({
                room_id,
                user_id: user.id,
                last_read_message_id,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'room_id,user_id'
            })

        if (error) {
            console.error('Read receipt error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update read receipt error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
