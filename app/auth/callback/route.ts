import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookiesToSet: Array<{ name: string; value: string; options?: any }> = []
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(newCookies) {
            newCookies.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              cookiesToSet.push({ name, value, options })
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            newCookies.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      let redirectUrl = `${origin}${next}`
      if (!isLocalEnv && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      }
      
      // Create redirect response and apply all cookies
      const redirectResponse = NextResponse.redirect(redirectUrl)
      cookiesToSet.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options)
      })
      
      return redirectResponse
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
}

