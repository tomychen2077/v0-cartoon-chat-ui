'use client'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Heart, Star, Trophy, Crown, Edit2, LogOut, MessageCircle, UserPlus } from 'lucide-react'
import Link from 'next/link'
import ProfileClient from '@/components/profile-client'

export default async function UserProfile() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth')
  }

  return <ProfileClient initialProfile={profile} userId={user.id} />
}
