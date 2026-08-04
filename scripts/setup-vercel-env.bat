@echo off
echo Configurando variables de entorno en Vercel...

echo NEXT_PUBLIC_SUPABASE_URL
echo n | vercel env add NEXT_PUBLIC_SUPABASE_URL=https://yibjsruoxjlgdnkgylld.supabase.co

echo NEXT_PUBLIC_SUPABASE_ANON_KEY
echo n | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8

echo NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
echo n | vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_i7VPT8T3SSkW3__-ZUlZmw_xiT1Wbri

echo NEXT_PUBLIC_SITE_URL
echo n | vercel env add NEXT_PUBLIC_SITE_URL=https://control-seguimiento-9il1yi5lc-proyectoswm.vercel.app

echo NEXT_PUBLIC_APP_URL
echo n | vercel env add NEXT_PUBLIC_APP_URL=https://control-seguimiento-9il1yi5lc-proyectoswm.vercel.app

echo Variables de entorno configuradas exitosamente
pause