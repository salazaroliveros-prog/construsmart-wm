import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ENV, assertSupabaseEnv } from '@/lib/supabase/env'

assertSupabaseEnv('Proxy Supabase')

export async function updateSession(request: NextRequest) {
  // Simplificar middleware para evitar errores 503
  // En lugar de verificar autenticación en el middleware, dejar que AuthGuard lo maneje
  
  // Solo refrescar tokens si están presentes
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  // Refrescar sesión si hay tokens
  try {
    await supabase.auth.getSession()
  } catch (err) {
    // Ignorar errores de sesión - AuthGuard manejará la redirección
  }

  return supabaseResponse
}
