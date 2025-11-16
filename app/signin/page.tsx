'use client'

import { redirect } from 'next/navigation'

export default function SignIn() {
  // Redirect to unified auth page
  redirect('/auth')
}
