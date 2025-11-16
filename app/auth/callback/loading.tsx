'use client'

import { Card } from '@/components/ui/card'

export default function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 p-4">
      <Card className="relative w-full max-w-md p-8 md:p-12 backdrop-blur-sm text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-foreground/60">Verifying your email...</p>
      </Card>
    </div>
  )
}
