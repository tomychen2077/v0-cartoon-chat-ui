'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    gender: 'other',
    age: '',
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError(null)
  }

  const validateSignUp = (): string | null => {
    if (!formData.username.trim()) return 'Username is required'
    if (formData.username.length < 3 || formData.username.length > 20) {
      return 'Username must be 3-20 characters'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      return 'Username can only contain letters, numbers, and underscores'
    }
    if (formData.password.length < 8) return 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
    if (!formData.agreeToTerms) return 'You must agree to the Terms of Service'
    return null
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.log('[v0] Google OAuth error:', error)
        setError('Failed to sign in with Google. Please try again.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      console.log('[v0] Google OAuth exception:', message)
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const validationError = validateSignUp()
        if (validationError) {
          setError(validationError)
          setLoading(false)
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
              `${window.location.origin}/auth/callback`,
            data: {
              username: formData.username,
              display_name: formData.username,
              gender: formData.gender,
              age: formData.age ? Number(formData.age) : null,
            },
          },
        })

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.')
            setIsSignUp(false)
          } else {
            setError(signUpError.message || 'Sign up failed')
          }
          setLoading(false)
          return
        }

        if (data.user?.identities?.length === 0) {
          setError('This email is already registered. Please sign in instead.')
          setIsSignUp(false)
          setLoading(false)
          return
        }

        if (data.user?.id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: formData.username,
              display_name: formData.username,
              email: formData.email,
              gender: formData.gender || 'other',
              age: formData.age ? Number(formData.age) : null,
            })
          
          if (profileError) {
            console.log('[v0] Profile creation error:', profileError)
          }
        }

        router.push('/auth/check-email')
      } else {
        // Sign in flow
        if (!formData.email || !formData.password) {
          setError('Email and password are required')
          setLoading(false)
          return
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) {
          if (signInError.message.includes('Invalid')) {
            setError('Invalid email or password')
          } else {
            setError(signInError.message || 'Sign in failed')
          }
          setLoading(false)
          return
        }

        if (data.user) {
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            username: '',
            gender: 'other',
            age: '',
            agreeToTerms: false,
          })
          router.push('/')
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      console.log('[v0] Auth error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 p-4">
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-32 right-20 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Auth Card */}
      <Card className="relative w-full max-w-sm p-6 md:p-8 backdrop-blur-sm border-2 border-border/50 rounded-lg">

        {/* Auth Tabs */}
        <div className="flex gap-2 mb-8 bg-muted p-1 rounded-full">
          <button
            onClick={() => {
              setIsSignUp(false)
              setError(null)
              setFormData(prev => ({ ...prev, username: '', confirmPassword: '', agreeToTerms: false }))
            }}
            className={`flex-1 py-2 px-4 rounded-full font-semibold transition-all text-sm ${
              !isSignUp
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true)
              setError(null)
            }}
            className={`flex-1 py-2 px-4 rounded-full font-semibold transition-all text-sm ${
              isSignUp
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {/* Email */}
          <div>
            <label className="text-sm font-semibold block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Username (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="text-sm font-semibold block mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10 rounded-lg"
                />
              </div>
              <p className="text-xs text-foreground/50 mt-1">3-20 characters, letters, numbers & underscores only</p>
            </div>
          )}

          {/* Extra fields (Sign Up only) */}
          {isSignUp && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Age</label>
                <Input
                  type="number"
                  name="age"
                  placeholder="Your age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="text-sm font-semibold block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-10 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isSignUp && <p className="text-xs text-foreground/50 mt-1">Minimum 8 characters</p>}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="text-sm font-semibold block mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-10 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
          )}

          {/* Terms & Conditions (Sign Up only) */}
          {isSignUp && (
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-4 h-4 mt-1 rounded cursor-pointer accent-primary"
              />
              <label className="text-sm text-foreground/70">
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 rounded-full py-2 font-semibold mt-6"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full w-1/2"
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-label="Continue with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="ml-2">{loading ? 'Redirecting...' : 'Continue with Google'}</span>
          </Button>
          <Link href="/guest" aria-label="Continue as Guest" className="w-1/2">
            <Button variant="outline" className="w-full rounded-full">
              Continue as Guest
            </Button>
          </Link>
        </div>

        {/* Signup Link */}
        <div className="text-center">
          <p className="text-sm text-foreground/60">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-semibold"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        

        {/* Back to Home */}
        <div className="mt-6">
          <Link href="/">
            <Button variant="outline" className="w-full rounded-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
      
    </div>
  )
}
