# Configura las variables de entorno en Vercel usando los valores del entorno
# local (o del archivo .env del proyecto). No se hardcodean secretos aqui.
# Requiere tener antes definidas: NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
# NEXT_PUBLIC_SITE_URL y NEXT_PUBLIC_APP_URL.

# Carga el archivo .env local (solo lectura, no se exponen valores en el repo).
if (Test-Path -LiteralPath ".env") {
    Get-Content -LiteralPath ".env" | ForEach-Object {
        if ($_ -match "^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$required = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL"
)

$missing = $required | Where-Object { -not [Environment]::GetEnvironmentVariable($_) }
if ($missing) {
    Write-Host "AVISO: variables no definidas en el entorno/.env: $($missing -join ', ')" -ForegroundColor Yellow
}

Write-Host "Configurando variables de entorno en Vercel..." -ForegroundColor Green

foreach ($var in $required) {
    Write-Host "Configurando: $var" -ForegroundColor Cyan
    $value = [Environment]::GetEnvironmentVariable($var)
    if (-not $value) {
        Write-Host "  [ERROR] $var esta vacia. Saltando." -ForegroundColor Red
        continue
    }
    $cmd = "vercel env add $var --value=""$value"" --yes"
    Invoke-Expression $cmd
}

Write-Host "Variables de entorno configuradas exitosamente" -ForegroundColor Green