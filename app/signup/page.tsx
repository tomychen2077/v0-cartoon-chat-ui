'use client'

import { redirect } from 'next/navigation'

export default function SignUp() {
  // Redirect to unified auth page
  redirect('/auth?mode=signup')
}
