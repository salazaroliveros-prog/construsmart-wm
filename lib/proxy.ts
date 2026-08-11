import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ENV, assertSupabaseEnv } from '@/lib/supabase/env'

assertSupabaseEnv('Proxy Supabase')

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    SUPABASE_ENV.url,
    SUPABASE_ENV.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Usar getUser() en lugar de getClaims() para mayor robustez
  // getUser() es más estable y menos propenso a errores 503
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (err) {
    console.error('[Proxy] getUser failed:', err)
    // No romper toda la respuesta con un 500; continuar como usuario anónimo.
    // El AuthGuard y rutas protegidas ya manejan la redirección a /login.
  }

  console.log('[Proxy] getUser user=', user?.email || 'null')

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    console.log('[Proxy] redirecting to /login from', request.nextUrl.pathname)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  console.log('[Proxy] allowing', request.nextUrl.pathname)
  return supabaseResponse
}
