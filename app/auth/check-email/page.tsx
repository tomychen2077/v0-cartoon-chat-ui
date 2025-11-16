'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 p-4">
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-32 right-20 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Card */}
      <Card className="relative w-full max-w-md p-8 md:p-12 backdrop-blur-sm">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Check Your Email</h1>
          <p className="text-foreground/60 mb-6">
            We've sent a confirmation link to your email address. Please check your inbox and click the link to verify your account.
          </p>

          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground/70">
              If you don't see the email, check your spam folder or try signing up again.
            </p>
          </div>

          <Link href="/auth">
            <Button variant="outline" className="w-full rounded-full mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>

          <p className="text-xs text-foreground/50">
            Already confirmed? <Link href="/auth" className="text-primary hover:underline font-semibold">Sign in here</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
