@echo off
rem Configura las variables de entorno en Vercel usando los valores del entorno
rem local (o del archivo .env del proyecto). No se hardcodean secretos aqui.
rem Requiere tener antes definidas: NEXT_PUBLIC_SUPABASE_URL,
rem NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
rem NEXT_PUBLIC_SITE_URL y NEXT_PUBLIC_APP_URL.

echo Configurando variables de entorno en Vercel...

if not defined NEXT_PUBLIC_SUPABASE_URL (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_URL no esta definida. Cargala desde tu .env antes de ejecutar.
    exit /b 1
)

echo NEXT_PUBLIC_SUPABASE_URL
echo n | vercel env add NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL%

echo NEXT_PUBLIC_SUPABASE_ANON_KEY
echo n | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY%

echo NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
echo n | vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=%NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY%

echo NEXT_PUBLIC_SITE_URL
echo n | vercel env add NEXT_PUBLIC_SITE_URL=%NEXT_PUBLIC_SITE_URL%

echo NEXT_PUBLIC_APP_URL
echo n | vercel env add NEXT_PUBLIC_APP_URL=%NEXT_PUBLIC_APP_URL%

echo Variables de entorno configuradas exitosamente
pause