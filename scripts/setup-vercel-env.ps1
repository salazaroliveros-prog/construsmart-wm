# Script para configurar variables de entorno en Vercel de forma no interactiva

Write-Host "Configurando variables de entorno en Vercel..." -ForegroundColor Green

$variables = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://yibjsruoxjlgdnkgylld.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8"
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" = "sb_publishable_i7VPT8T3SSkW3__-ZUlZmw_xiT1Wbri"
    "NEXT_PUBLIC_SITE_URL" = "https://construsmart-wm.vercel.app"
    "NEXT_PUBLIC_APP_URL" = "https://construsmart-wm.vercel.app"
}

foreach ($var in $variables.GetEnumerator()) {
    Write-Host "Configurando: $($var.Key)" -ForegroundColor Cyan
    $cmd = "vercel env add $($var.Key) --value=""$($var.Value)"" --yes"
    Invoke-Expression $cmd
}

Write-Host "Variables de entorno configuradas exitosamente" -ForegroundColor Green