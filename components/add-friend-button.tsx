'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddFriendButton({ friendId }: { friendId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAddFriend = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add friend')
      }
    } catch (err) {
      console.error('Error adding friend:', err)
      alert('Failed to add friend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      size="sm" 
      className="bg-primary hover:bg-primary/90 rounded-full" 
      onClick={handleAddFriend}
      disabled={loading}
      loading={loading}
    >
      <UserPlus className="w-4 h-4 mr-2" />
      {loading ? 'Adding...' : 'Add Friend'}
    </Button>
  )
}

