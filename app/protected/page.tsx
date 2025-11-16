import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h1 className="text-3xl font-bold mb-4">Welcome, {profile?.display_name || 'User'}!</h1>
          <p className="text-foreground/60 mb-6">Your account has been created successfully.</p>
          
          <div className="grid gap-4">
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 rounded-full">
                Return to Home
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="rounded-full">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
